import type { Layer, MovementMaterial } from '../geometry/parts';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { CHRONO_REST, trackChrono } from '../kinematics/chronograph';
import { buildSolver, settleQuick } from '../kinematics/solver';
import type { Caliber } from '../model/schema';
import { arborKey, focusKey } from '../model/validate';
import { CROWN_WIND_RATIO, hoursPerBarrelTurn, initialReserveH, stepReserve, throttle, wristSwing } from '../kinematics/winding';
import { crownState } from './crown';
import { appStore, useApp } from '../state/app';
import { effectiveSpeed } from '../tour/engine';
import { MOVEMENT_ROTATION } from './focus';
import { PartMesh } from './PartMesh';
import { registry, type RegistryEntry } from './registry';
import { advance, dayOfMonthIndex, dayOfWeekIndex, localSeconds, MAX_FRAME } from './simClock';

const XRAY_OPACITY = 0.12;
const ignoreRaycast = () => {};
const ROTOR_XRAY_OPACITY = 0.08;

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

// A watch replaces the geometry of the movement's hour and minute hands (keyed by part id) with its own, sized to
// its dial; the parts keep their arbors, so the kinematics still drive them.
export function Movement({ caliber, handLayers, discMaterials, timeOverride, children }: { caliber: Caliber; handLayers?: Record<string, Layer[]>; discMaterials?: Partial<Record<MovementMaterial, THREE.MeshPhysicalMaterial>>; timeOverride?: number; children?: ReactNode }) {
  const parts = caliber.parts;
  const solve = useMemo(() => buildSolver(caliber), [caliber]);
  const pick = useApp((s) => s.pick);
  const t = useRef(localSeconds(new Date()));
  const dateBase = useMemo(() => dayOfMonthIndex(new Date()), []);
  const dayBase = useMemo(() => dayOfWeekIndex(new Date()), []);
  const chrono = useRef(CHRONO_REST);
  const explode = useRef(0);
  const wound = useRef(0);
  const prevInput = useRef(0);
  const swingT = useRef(0);
  const reserve = useRef(initialReserveH(caliber));
  const hoursPerTurn = useMemo(() => hoursPerBarrelTurn(caliber), [caliber]);
  const prevRatchetTurns = useRef(0);
  const publish = useMemo(() => throttle(250), []);
  const winderInput = useMemo(() => {
    const w = solve.info.winder;
    return w ? caliber.parts.find((p) => arborKey(p) === w.inputKey)!.id : null;
  }, [caliber, solve]);
  // A part on each arbor the chronograph takes its motion from.
  const chronoInputs = useMemo(() => {
    const info = solve.info.chrono;
    const on = (key: string | null) => (key ? caliber.parts.find((p) => arborKey(p) === key)!.id : null);
    return info ? { pinion: on(info.pinionKey)!, driver: on(info.driverKey) } : null;
  }, [caliber, solve]);

  useFrame((state, dt) => {
    const s = appStore().getState();
    const step = caliber.tour[s.stepIndex]!;
    const speed = effectiveSpeed(s.mode, step, s.freeSpeedExp, s.paused, s.crownPos);
    if (s.turning) {
      const d = Math.min(dt, MAX_FRAME) * 7;
      crownState.rot += d;
      if (s.crownPos === 0) {
        crownState.wind += d;
        crownState.woundTurns += (d / (Math.PI * 2)) * CROWN_WIND_RATIO;
      } else if (s.crownPos === 1) crownState.quick += d;
      else crownState.set += d;
    } else crownState.quick = settleQuick(crownState.quick, Math.min(dt, MAX_FRAME));
    t.current = timeOverride ?? advance(t.current, dt, speed);
    if (!s.paused) swingT.current += Math.min(dt, MAX_FRAME);
    explode.current += ((s.mode === 'free' ? s.explode : 0) - explode.current) * 0.08;
    const rotorState = s.mode === 'tour' ? step.rotor : 'hide';
    const rotor = rotorState === 'hide' ? 0 : wristSwing(swingT.current);
    const transforms = solve({
      t: t.current,
      explode: explode.current,
      dateBase,
      dayBase,
      chrono: chrono.current,
      rotor,
      wound: wound.current,
      crownPos: s.crownPos,
      crownRot: crownState.rot,
      windRot: crownState.wind,
      quickRot: crownState.quick,
      setRot: crownState.set,
    });
    if (chronoInputs && solve.info.chrono) {
      const angleOf = (id: string | null) => (id ? transforms.get(id)!.angle : 0);
      chrono.current = trackChrono(
        chrono.current,
        { mode: s.chrono, presses: s.pushes['start-stop'] },
        solve.info.chrono.ratios,
        { pinion: angleOf(chronoInputs.pinion), driver: angleOf(chronoInputs.driver) },
        Math.min(dt, MAX_FRAME),
      );
    }
    if (winderInput && solve.info.winder) {
      const input = transforms.get(winderInput)!.angle;
      wound.current += solve.info.winder.advance(prevInput.current, input);
      prevInput.current = input;
    }
    // Fast-forward demos drain at no more than real time so the reserve stays readable across chapters.
    const ratchetTurns = Math.abs(wound.current * solve.info.ratchetFactor) / (Math.PI * 2) + crownState.woundTurns;
    reserve.current = stepReserve(caliber, hoursPerTurn, reserve.current, ratchetTurns - prevRatchetTurns.current, Math.min(dt, MAX_FRAME) * Math.min(speed, 1));
    prevRatchetTurns.current = ratchetTurns;
    if (publish(performance.now())) s.setReserve(reserve.current);
    const highlight = s.mode === 'tour' ? step.focus : s.mode === 'free' ? s.selected : null;
    const xray = s.mode === 'tour' && step.xray;
    const pulse = 1.2 + Math.sin(state.clock.elapsedTime * 3) * 0.8;

    for (const [id, entry] of registry) {
      const tr = transforms.get(id);
      if (!tr) continue;
      if (entry.part.axis === 'x') {
        // Spin about the part's own axis, then turn that axis to the stem's direction.
        entry.group.rotation.set(tr.angle, 0, entry.part.yaw ?? 0, 'ZYX');
        entry.group.position.x = entry.part.pos.x + tr.dx;
        entry.group.position.y = entry.part.pos.y + tr.dy;
      } else {
        entry.group.rotation.z = (entry.part.rest ?? 0) + tr.angle;
        entry.group.position.x = entry.part.pos.x + tr.dx;
        entry.group.position.y = entry.part.pos.y + tr.dy;
      }
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
      {parts.map((p) => (
        <PartMesh key={p.id} part={p} onPick={pick} layersOverride={handLayers?.[p.id]} materialsOverride={discMaterials} />
      ))}
      {children}
    </group>
  );
}
