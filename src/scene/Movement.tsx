import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { buildSolver } from '../kinematics/solver';
import type { Caliber } from '../model/schema';
import { arborKey, focusKey } from '../model/validate';
import { accumulateWinding, stepReserve, throttle, wristSwing } from '../kinematics/winding';
import { appStore, useApp } from '../state/app';
import { effectiveSpeed } from '../tour/engine';
import { MOVEMENT_ROTATION_VALUE } from './focus';
import { PartMesh } from './PartMesh';
import { registry, type RegistryEntry } from './registry';
import { advance, dayOfMonthIndex, localSeconds } from './simClock';

export const MOVEMENT_ROTATION = MOVEMENT_ROTATION_VALUE;
const XRAY_OPACITY = 0.12;
const ignoreRaycast = () => {};
const ROTOR_XRAY_OPACITY = 0.08;
const INITIAL_RESERVE = 0.45;

// Fades a part's own materials and stops it catching clicks once it is mostly see-through.
function fadeTo(entry: RegistryEntry, target: number) {
  for (const m of entry.materials) {
    m.opacity += (target - m.opacity) * 0.08;
    const transparent = m.opacity < 0.99;
    if (m.transparent !== transparent) {
      m.transparent = transparent;
      m.needsUpdate = true;
    }
    m.depthWrite = m.opacity > 0.5;
  }
  const see = (entry.materials[0]?.opacity ?? 1) > 0.5;
  for (const child of entry.group.children) (child as THREE.Mesh).raycast = see ? THREE.Mesh.prototype.raycast : ignoreRaycast;
}

export function Movement({ caliber, children }: { caliber: Caliber; children?: ReactNode }) {
  const solve = useMemo(() => buildSolver(caliber), [caliber]);
  const pick = useApp((s) => s.pick);
  const t = useRef(localSeconds(new Date()));
  const dateBase = useMemo(() => dayOfMonthIndex(new Date()), []);
  const explode = useRef(0);
  const wound = useRef(0);
  const prevInput = useRef(0);
  const swingT = useRef(0);
  const reserve = useRef(INITIAL_RESERVE * caliber.specs.powerReserveH);
  const prevRatchetTurns = useRef(0);
  const publish = useMemo(() => throttle(250), []);
  const oneWayInput = useMemo(() => {
    const ow = solve.info.oneWay;
    return ow ? caliber.parts.find((p) => arborKey(p) === ow.inputKey)!.id : null;
  }, [caliber, solve]);

  useFrame((state, dt) => {
    const s = appStore().getState();
    const step = caliber.tour[s.stepIndex]!;
    const speed = effectiveSpeed(s.mode, step, s.freeSpeedExp, s.paused);
    t.current = advance(t.current, dt, speed);
    if (!s.paused) swingT.current += Math.min(dt, 0.05);
    explode.current += ((s.mode === 'free' ? s.explode : 0) - explode.current) * 0.08;
    const rotorState = s.mode === 'tour' ? step.rotor : 'hide';
    const rotor = rotorState === 'hide' ? 0 : wristSwing(swingT.current);
    const transforms = solve({ t: t.current, explode: explode.current, dateBase, rotor, wound: wound.current });
    if (oneWayInput && solve.info.oneWay) {
      const input = transforms.get(oneWayInput)!.angle;
      wound.current = accumulateWinding(wound.current, prevInput.current, input, solve.info.oneWay.ratio);
      prevInput.current = input;
    }
    // Fast-forward demos drain at no more than real time so the reserve stays readable across chapters.
    const ratchetTurns = Math.abs(wound.current * solve.info.ratchetFactor) / (Math.PI * 2);
    reserve.current = stepReserve(caliber, reserve.current, ratchetTurns - prevRatchetTurns.current, Math.min(dt, 0.05) * Math.min(speed, 1));
    prevRatchetTurns.current = ratchetTurns;
    if (publish(performance.now())) s.setReserve(reserve.current);
    const highlight = s.mode === 'tour' ? step.focus : s.mode === 'free' ? s.selected : null;
    const xray = s.mode === 'tour' && step.xray;
    const pulse = 1.2 + Math.sin(state.clock.elapsedTime * 3) * 0.8;

    for (const [id, entry] of registry) {
      const tr = transforms.get(id);
      if (!tr) continue;
      entry.group.rotation.z = (entry.part.rest ?? 0) + tr.angle;
      entry.group.position.z = entry.part.pos.z + tr.dz;
      if (entry.part.shape.kind === 'hairspring') {
        const k = 1 + 0.02 * tr.angle;
        entry.group.scale.set(k, k, 1);
      }
      const lit = highlight !== null && focusKey(entry.part) === highlight;
      const isRotor = arborKey(entry.part) === 'rotor' || entry.part.shape.kind === 'rotor';
      const automatic = entry.part.mechanism === 'automatic';
      entry.group.visible = isRotor ? rotorState !== 'hide' : automatic ? s.mode === 'free' || rotorState !== 'hide' : true;
      for (const m of entry.materials) {
        m.emissive.setHex(lit ? 0x3a2a10 : 0x000000);
        m.emissiveIntensity = lit ? pulse : 0;
      }
      if (entry.part.shape.kind === 'bridge') fadeTo(entry, xray ? XRAY_OPACITY : 1);
      if (isRotor) fadeTo(entry, rotorState === 'xray' ? ROTOR_XRAY_OPACITY : 1);
      // three.js raycasts ignore `visible`, so hidden parts must opt out explicitly.
      if (!entry.group.visible) for (const child of entry.group.children) (child as THREE.Mesh).raycast = ignoreRaycast;
      else if (!isRotor && entry.part.shape.kind !== 'bridge') for (const child of entry.group.children) (child as THREE.Mesh).raycast = THREE.Mesh.prototype.raycast;
    }
  });

  return (
    <group rotation={[MOVEMENT_ROTATION, 0, 0]}>
      {caliber.parts.map((p) => (
        <PartMesh key={p.id} part={p} onPick={pick} />
      ))}
      {children}
    </group>
  );
}
