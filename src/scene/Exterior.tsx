import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { extrudeCentered } from '../geometry/gear';
import type { Caliber } from '../model/schema';
import type { Watch } from '../model/watch';
import { casebackEngraving } from './exterior/engraving';
import { appStore } from '../state/app';
import { casingRing, casingSpan, stemExtension } from './caseGeometry';
import { crownEuler, crownState } from './crown';
import type { ExteriorBuild, ExteriorLayer, MovementFrame } from './exterior/contract';
import { instantiate, materialKeys, resolveMaterial, SHARED_EXTERIOR_MATERIALS } from './exterior/materials';
import { glass } from './exterior/kit/glass';
import { exteriorVisibility } from './exterior/visibility';
import { useMaterials } from './materials';
import { openingPose } from './opening';
import { registry } from './registry';
import { MAX_FRAME } from './simClock';
import { engraving } from './textures';

type PickMaterial = (l: ExteriorLayer) => THREE.Material | THREE.Material[];

function Layers({ layers, pick, name, shadows = false }: { layers: ExteriorLayer[]; pick: PickMaterial; name?: string; shadows?: boolean }) {
  return layers.map((l, i) => <mesh key={i} name={l.name ?? name} geometry={l.geometry} material={pick(l)} castShadow={shadows} receiveShadow={shadows} />);
}

// Lifts the dial or crystal off toward the viewer as it fades, like taking it off the movement.
function liftOff(g: THREE.Group | null, f: number) {
  if (!g) return;
  g.visible = f > 0.02;
  g.position.z = -3 * (1 - f);
}

// Half of the cover rotor's 0.45 mm extrusion: it sits flush with the movement's rotor.
const ROTOR_HALF = 0.225;
// How far the watch's seconds hand travels when exploded: beyond the minute hand (−7.2), as it sits in front of it.
const SECONDS_EXPLODE_DZ = -8.2;

export function Exterior({ caliber, watch, build, frame, watchFront }: { caliber: Caliber; watch?: Watch; build: ExteriorBuild; frame: MovementFrame; watchFront: boolean }) {
  const r = frame.diameterMm / 2;
  const movementMaterials = useMaterials();
  const own = useMemo(() => instantiate(build), [build]);
  const shared = useMemo((): Record<(typeof SHARED_EXTERIOR_MATERIALS)[number], THREE.Material> => {
    const { number, jewels } = casebackEngraving(caliber, watch);
    const tex = engraving({ ring: `CASEBACK · AUTOMATIC · STAINLESS STEEL · ${jewels} JEWELS · `, center: `CAL. ${number}` });
    return {
      'caseback-engraving': new THREE.MeshPhysicalMaterial({ color: 0xd0d3d7, metalness: 1, roughness: 0.3, bumpMap: tex, bumpScale: 1.2, roughnessMap: tex, transparent: true }),
      'caseback-glass': glass(0.6),
    };
  }, [caliber, watch]);
  const pick = useMemo<PickMaterial>(() => {
    const fallback = { ...movementMaterials, ...shared };
    const one = (k: string) => resolveMaterial(k, own, fallback);
    return (l) => (Array.isArray(l.material) ? l.material.map(one) : one(l.material));
  }, [own, shared, movementMaterials]);
  const crystalMats = useMemo(() => materialKeys(build.parts.crystal).map((k) => resolveMaterial(k, own, shared)), [build, own, shared]);
  const rotorMat = useMemo(() => movementMaterials.gilt.clone(), [movementMaterials]);
  const rotorGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.absarc(0, 0, r - 0.3, 0, Math.PI, false);
    s.absarc(0, 0, 1.2, Math.PI, 0, true);
    return extrudeCentered(s, 0.45, 0.06);
  }, [r]);
  const { crownX } = build.anchors;
  const keyless = caliber.couplings.find((cp) => cp.type === 'keyless');
  const pull = keyless?.type === 'keyless' ? keyless.pull : 0;
  const casing = casingRing(r, build.anchors.seatRadius);
  const span = casingSpan(frame, build.anchors.caseBackZ);
  // Seen from both the caseback and the dial side, so it needs both faces.
  const casingMat = useMemo(() => Object.assign(movementMaterials.plate.clone(), { side: THREE.DoubleSide }), [movementMaterials]);
  // The stem runs on into the crown's centre, where the crown hides its end.
  const stemExt = frame.stemEnd === null ? null : stemExtension(frame.stemEnd, crownX, 0);
  const stemTube = useRef<THREE.Group>(null);
  const back = useRef<THREE.Group>(null);
  const rotor = useRef<THREE.Group>(null);
  const openT = useRef(0);
  const crown = useRef<THREE.Group>(null);
  const dialGroup = useRef<THREE.Group>(null);
  const crystalGroup = useRef<THREE.Group>(null);
  const strapGroup = useRef<THREE.Group>(null);
  const secondsGroup = useRef<THREE.Group>(null);
  const dialFade = useRef(1);
  // Each pusher's group, with the press count it last answered and how far in it is (1 = fully pressed).
  const pusherGroups = useRef<Array<THREE.Group | null>>([]);
  const pusherState = useRef<Array<{ seen: number; depth: number }>>([]);
  const pushers = useMemo(
    () =>
      (build.parts.pushers ?? []).flatMap((p) => {
        const at = frame.pushers.find((f) => f.action === p.action);
        return at ? [{ ...p, angle: at.angle, z: at.z }] : [];
      }),
    [build, frame],
  );
  const flipFirst = watchFront ? 1.2 : 0;

  useFrame((state, dt) => {
    const s = appStore().getState();
    if (s.mode === 'opening') openT.current += Math.min(dt, MAX_FRAME);
    const pose = openingPose(s.mode === 'intro' ? 0 : s.mode === 'opening' ? openT.current : 99, flipFirst);
    if (back.current) {
      back.current.visible = pose.casebackOpacity > 0.01;
      back.current.rotation.z = build.anchors.casebackTurns ? pose.casebackAngle : 0;
      back.current.position.z = pose.casebackLift;
    }
    shared['caseback-engraving'].opacity = pose.casebackOpacity;
    shared['caseback-glass'].opacity = pose.casebackOpacity;
    if (rotor.current) {
      rotor.current.visible = pose.rotorSlide < 29;
      rotor.current.position.set(pose.rotorSlide, 0, frame.rotorBackZ - ROTOR_HALF + pose.rotorLift);
      rotor.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.7) * 1.4 + Math.sin(state.clock.elapsedTime * 0.23) * 0.8;
    }
    if (crown.current) {
      crown.current.position.x = crownX + s.crownPos * pull;
      crownEuler(crownState.rot, crown.current.rotation);
    }
    if (stemTube.current) {
      stemTube.current.position.x = s.crownPos * pull;
      stemTube.current.rotation.x = crownState.rot;
    }
    const step = caliber.tour[s.stepIndex];
    const vis = exteriorVisibility(s.mode, s.mode === 'free' ? s.freeSide : (step?.side ?? null), s.explode);
    dialFade.current += ((vis.dial ? 1 : 0) - dialFade.current) * 0.12;
    const f = dialFade.current;
    liftOff(dialGroup.current, f);
    liftOff(crystalGroup.current, f);
    for (const m of crystalMats) m.opacity = f;
    if (strapGroup.current) strapGroup.current.visible = vis.strap;
    const fourth = registry.get('fourth-wheel');
    if (secondsGroup.current && fourth) secondsGroup.current.rotation.z = fourth.group.rotation.z;
    // The seconds hand isn't a movement part, so it follows the minute hand's explode progress, one step further out.
    const minute = registry.get('minute-hand');
    if (secondsGroup.current && minute) {
      const progress = (minute.group.position.z - minute.part.pos.z) / minute.part.explode.dz;
      secondsGroup.current.position.z = frame.secondsZ + SECONDS_EXPLODE_DZ * progress;
    }
    for (let i = 0; i < pushers.length; i++) {
      const p = pushers[i]!;
      const g = pusherGroups.current[i];
      const st = (pusherState.current[i] ??= { seen: s.pushes[p.action], depth: 0 });
      if (s.pushes[p.action] !== st.seen) {
        st.seen = s.pushes[p.action];
        st.depth = 1;
      } else st.depth = Math.max(0, st.depth - Math.min(dt, MAX_FRAME) * 6);
      if (!g) continue;
      const r = p.radius - p.travel * st.depth;
      g.position.set(Math.cos(p.angle) * r, Math.sin(p.angle) * r, p.z);
    }
    if (s.mode === 'opening' && pose.done) {
      openT.current = 0;
      s.setMode('tour');
    }
  });

  const p = build.parts;
  return (
    <group>
      <Layers layers={p.case} pick={pick} name="case" shadows />
      <group ref={crown} position={[crownX, 0, frame.stemZ]} rotation={[0, 0, Math.PI / 2, 'ZYX']}>
        {p.crown.map((l, i) => <mesh key={i} geometry={l.geometry} material={pick(l)} castShadow />)}
      </group>
      {casing && (
        <mesh rotation-x={Math.PI / 2} position-z={(span.from + span.to) / 2} material={casingMat} receiveShadow>
          <cylinderGeometry args={[casing.rOut, casing.rOut, span.to - span.from, 160, 1, true]} />
        </mesh>
      )}
      {casing && (
        <mesh position-z={span.from} material={casingMat} receiveShadow>
          <ringGeometry args={[casing.rIn, casing.rOut, 160]} />
        </mesh>
      )}
      {stemExt && stemExt.to > stemExt.from && (
        <group ref={stemTube}>
          <mesh position={[(stemExt.from + stemExt.to) / 2, 0, frame.stemZ]} rotation-z={Math.PI / 2} material={movementMaterials.steel}>
            <cylinderGeometry args={[frame.stemRadius, frame.stemRadius, stemExt.to - stemExt.from, 24]} />
          </mesh>
        </group>
      )}
      {pushers.map((ps, i) => (
        <group
          key={ps.action}
          ref={(g) => {
            pusherGroups.current[i] = g;
          }}
          name={`pusher-${ps.action}`}
          position={[Math.cos(ps.angle) * ps.radius, Math.sin(ps.angle) * ps.radius, ps.z]}
          rotation={[0, 0, ps.angle + Math.PI / 2]}
        >
          {ps.layers.map((l, j) => <mesh key={j} geometry={l.geometry} material={pick(l)} castShadow />)}
        </group>
      ))}
      <Layers layers={p.bezel} pick={pick} />
      <group ref={dialGroup} name="dial">
        <Layers layers={p.dial} pick={pick} name="dial" />
      </group>
      <group ref={crystalGroup} name="crystal">
        <Layers layers={p.crystal} pick={pick} name="crystal" />
      </group>
      <group ref={strapGroup} name="strap">
        <Layers layers={p.strap} pick={pick} shadows />
      </group>
      <group ref={secondsGroup} name="seconds-hand">
        {p.hands.seconds.map((l, i) => <mesh key={i} geometry={l.geometry} material={resolveMaterial(l.material, {}, movementMaterials)} />)}
      </group>
      <group ref={back}>
        {p.caseback.map((l, i) => <mesh key={i} name={l.name} geometry={l.geometry} material={pick(l)} castShadow={l.castShadow ?? true} />)}
      </group>
      <group ref={rotor}>
        <mesh geometry={rotorGeo} material={rotorMat} castShadow />
        <mesh rotation-x={Math.PI / 2} material={movementMaterials.steel}>
          <cylinderGeometry args={[0.9, 0.9, 0.6, 48]} />
        </mesh>
      </group>
    </group>
  );
}
