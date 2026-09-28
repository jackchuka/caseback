import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { extrudeCentered } from '../geometry/gear';
import type { Caliber } from '../model/schema';
import type { Watch } from '../model/watch';
import { appStore, useApp } from '../state/app';
import { useMaterials } from './materials';
import { crownEuler, crownState } from './crown';
import { casingRing, stemExtension } from './caseGeometry';
import { openingPose } from './opening';
import { type Layer, type LayerMaterial, type MovementMaterial } from '../geometry/parts';
import { movementFrame } from './exterior/frame';
import { bezel as bezelLayers } from './exterior/legacy/bezel';
import { crown as crownLayers } from './exterior/legacy/crown';
import { crystal as crystalLayers } from './exterior/legacy/crystal';
import { dialLayers, dialRadius } from './exterior/legacy/dial';
import { watchHands } from './exterior/legacy/hands';
import { caseBody } from './exterior/legacy/caseBody';
import { caseRadii } from './exterior/legacy/radii';
import { withPolish } from './exterior/kit/polish';
import { paintDial, paintInsert, paintStrap } from './exterior/legacy/paint';
import { strap as strapLayers } from './exterior/legacy/strap';
import { exteriorVisibility } from './exterior/visibility';
import { registry } from './registry';
import { engraving } from './textures';

const CASE_COLORS = { steel: [0xc8cbd0, 0.3], titanium: [0xa9acb0, 0.45], gold: [0xe6c27a, 0.25] } as const;

export function Exterior({ caliber, watch }: { caliber: Caliber; watch?: Watch }) {
  const r = caliber.specs.diameterMm / 2;
  const ext = watch?.exterior;
  const frame = useMemo(() => movementFrame(caliber), [caliber]);
  const { inner, outer, height, bottom } = caseRadii(frame, ext);
  const top = bottom + height;
  const materials = useMaterials();
  const quality = useApp((s) => s.quality);
  const caseMat = useMemo(() => {
    const [color, roughness] = CASE_COLORS[ext?.case.material ?? 'steel'];
    return new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness, clearcoat: 0.15, clearcoatRoughness: 0.3 });
  }, [ext]);
  const glassMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 1, thickness: 0.6, ior: 1.77, transparent: true }), []);
  // Per-watch materials built from the exterior data; movement materials come from the shared set.
  const watchParts = useMemo(() => {
    if (!ext) return null;
    const r = { inner, outer, height, bottom };
    const metal = ext.case.material === 'steel' ? 0xe2e4e8 : CASE_COLORS[ext.case.material][0];
    const mats: Record<Exclude<LayerMaterial, MovementMaterial>, THREE.MeshPhysicalMaterial> & { lume: THREE.MeshPhysicalMaterial } = {
      // Stainless cases read as black in the dark studio at the movement's reflection strength; product photos light them harder.
      case: withPolish(new THREE.MeshPhysicalMaterial({ color: metal, metalness: 1, roughness: 0.36, envMapIntensity: 1.4 }), 0.08),
      polished: new THREE.MeshPhysicalMaterial({ color: metal, metalness: 1, roughness: 0.08, envMapIntensity: 1.4 }),
      crystal: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 1, thickness: 0.8, ior: 1.77, transparent: true }),
      // Opaque on purpose: three.js renders only opaque objects into the transmission buffer, so a transparent dial
      // would vanish behind the (transmissive) crystal. It is removed by lifting and hiding instead of fading.
      dial: new THREE.MeshPhysicalMaterial({ map: paintDial(ext), roughness: ext.dial.finish === 'matte' ? 0.8 : 0.35, clearcoat: ext.dial.finish === 'gloss' ? 1 : 0 }),
      insert: new THREE.MeshPhysicalMaterial({ map: paintInsert(ext), roughness: 0.5, metalness: 0.1 }),
      strap:
        ext.strap.kind === 'bracelet'
          ? new THREE.MeshPhysicalMaterial({ color: ext.strap.color, metalness: 1, roughness: 0.3, envMapIntensity: 2.2 })
          : new THREE.MeshPhysicalMaterial({ map: paintStrap(ext), metalness: 0, roughness: 0.7, sheen: 0.4 }),
      tube: new THREE.MeshPhysicalMaterial({ color: ext.crown.tubeColor ?? '#888888', metalness: 0.6, roughness: 0.3 }),
      // Dial lume fades with the dial, so it must not share the hands' material.
      lume: new THREE.MeshPhysicalMaterial({ color: ext.dial.lume ?? '#f2eee2', roughness: 0.5, metalness: 0 }),
    };
    const pick = (l: Layer) => (l.material in mats ? mats[l.material as keyof typeof mats] : materials[l.material as MovementMaterial]);
    return {
      mats,
      pick,
      body: caseBody(ext, r, quality === 'high' ? 0.2 : 0.3),
      bezel: bezelLayers(ext, r),
      crown: crownLayers(ext, r),
      crystal: crystalLayers(ext, r),
      dial: dialLayers(ext, r, frame),
      strap: strapLayers(ext, r),
      seconds: ext.hands.seconds ? watchHands(ext, dialRadius(r)).seconds : [],
    };
  }, [ext, inner, outer, height, bottom, materials, quality, frame]);
  const backMat = useMemo(() => {
    const tex = engraving({ ring: `CASEBACK · AUTOMATIC · STAINLESS STEEL · ${caliber.specs.jewels} JEWELS · `, center: `CAL. ${caliber.name.replace(/^ETA /, '')}` });
    return new THREE.MeshPhysicalMaterial({ color: 0xd0d3d7, metalness: 1, roughness: 0.3, bumpMap: tex, bumpScale: 1.2, roughnessMap: tex, transparent: true });
  }, [caliber]);
  const rotorMat = useMemo(() => materials.gilt.clone(), [materials]);
  const ring = useMemo(() => {
    if (ext) return null;
    const pts = [[inner, bottom], [outer - 1.1, bottom], [outer - 0.2, bottom + 1.2], [outer, bottom + 4.3], [outer - 0.5, top - 0.4], [outer - 1.0, top], [inner, top]];
    const prof = pts.map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(prof, 160).rotateX(Math.PI / 2);
  }, [inner, outer, bottom, top, height, ext]);
  const rotorGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.absarc(0, 0, r - 0.3, 0, Math.PI, false);
    s.absarc(0, 0, 1.2, Math.PI, 0, true);
    return extrudeCentered(s, 0.45, 0.06);
  }, [r]);

  const lug = ext ? { x: ext.case.lugWidthMm / 2 + 1.4, y: outer + 3.0 } : { x: r * 0.52, y: r + 4.2 };
  const crownSize = ext ? { radius: ext.crown.diameterMm / 2, length: ext.crown.lengthMm } : { radius: 1.25, length: 2.0 };
  const crownX = ext ? outer + crownSize.length / 2 - 0.2 : r + 4.3;
  const casing = casingRing(r, inner);
  // Seen from both the caseback and the dial side, so it needs both faces.
  const casingMat = useMemo(() => Object.assign(materials.plate.clone(), { side: THREE.DoubleSide }), [materials]);
  const stemPart = caliber.parts.find((p) => p.shape.kind === 'stem');
  const stemEnd = stemPart && stemPart.shape.kind === 'stem' ? stemPart.pos.x + stemPart.shape.length / 2 : null;
  const stemExt = stemEnd === null ? null : stemExtension(stemEnd, crownX, crownSize.length);
  const stemRadius = stemPart && stemPart.shape.kind === 'stem' ? stemPart.shape.radius : 0.26;
  const stemTube = useRef<THREE.Group>(null);
  const back = useRef<THREE.Group>(null);
  const rotor = useRef<THREE.Group>(null);
  const openT = useRef(0);
  const crown = useRef<THREE.Object3D>(null);
  const dialGroup = useRef<THREE.Group>(null);
  const crystalGroup = useRef<THREE.Group>(null);
  const strapGroup = useRef<THREE.Group>(null);
  const secondsGroup = useRef<THREE.Group>(null);
  const dialFade = useRef(1);
  const flipFirst = ext ? 1.2 : 0;

  useFrame((state, dt) => {
    const s = appStore().getState();
    if (s.mode === 'opening') openT.current += Math.min(dt, 0.05);
    const closed = s.mode === 'intro';
    const pose = openingPose(closed ? 0 : s.mode === 'opening' ? openT.current : 99, flipFirst);
    if (back.current) {
      back.current.visible = pose.casebackOpacity > 0.01;
      back.current.rotation.z = pose.casebackAngle;
      back.current.position.z = top + 0.6 + pose.casebackLift;
      backMat.opacity = pose.casebackOpacity;
      glassMat.opacity = pose.casebackOpacity;
    }
    if (rotor.current) {
      rotor.current.visible = pose.rotorSlide < 29;
      rotor.current.position.set(pose.rotorSlide, 0, 4.45 + pose.rotorLift);
      rotor.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.7) * 1.4 + Math.sin(state.clock.elapsedTime * 0.23) * 0.8;
    }
    if (crown.current) {
      crown.current.position.x = crownX + s.crownPos * 0.7;
      crown.current.rotation.copy(crownEuler(crownState.rot));
    }
    if (stemTube.current) {
      stemTube.current.position.x = s.crownPos * 0.7;
      stemTube.current.rotation.x = crownState.rot;
    }
    if (watchParts) {
      const step = caliber.tour[s.stepIndex];
      const vis = exteriorVisibility(s.mode, s.mode === 'free' ? s.freeSide : (step?.side ?? null), s.explode);
      dialFade.current += ((vis.dial ? 1 : 0) - dialFade.current) * 0.12;
      const f = dialFade.current;
      for (const g of [dialGroup.current, crystalGroup.current]) {
        if (!g) continue;
        g.visible = f > 0.02;
        // Lift the dial and crystal off toward the viewer as they fade, like taking them off the movement.
        g.position.z = -3 * (1 - f);
      }
      watchParts.mats.crystal.opacity = f;
      if (strapGroup.current) strapGroup.current.visible = vis.strap;
      const fourth = registry.get('fourth-wheel');
      if (secondsGroup.current && fourth) secondsGroup.current.rotation.z = fourth.group.rotation.z;
    }
    if (s.mode === 'opening' && pose.done) {
      openT.current = 0;
      s.finishOpening();
    }
  });

  return (
    <group>
      {ring && <mesh geometry={ring} material={caseMat} castShadow receiveShadow />}
      {watchParts
        ? watchParts.body.map((l, i) => <mesh key={`body${i}`} name="case" geometry={l.geometry} material={watchParts.pick(l)} castShadow receiveShadow />)
        : [-1, 1].flatMap((sx) =>
        [-1, 1].map((sy) => (
          <RoundedBox key={`${sx}${sy}`} args={[2.8, 7.5, 3.2]} radius={1.1} smoothness={6} position={[sx * lug.x, sy * lug.y, 0.5]} rotation-z={sx * sy * -0.12} material={caseMat} castShadow />
        )),
      )}
      {watchParts ? (
        <group ref={crown} position={[crownX, 0, -1.5]} rotation={[0, 0, Math.PI / 2, 'ZYX']}>
          {watchParts.crown.map((l, i) => (
            <mesh key={i} geometry={l.geometry} material={watchParts.pick(l)} castShadow />
          ))}
        </group>
      ) : (
        <mesh ref={crown} position={[crownX, 0, -1.5]} rotation={[0, 0, Math.PI / 2, 'ZYX']} material={caseMat}>
          <cylinderGeometry args={[crownSize.radius, crownSize.radius, crownSize.length, 48]} />
        </mesh>
      )}
      {casing && (
        <mesh rotation-x={Math.PI / 2} material={casingMat} receiveShadow>
          <cylinderGeometry args={[casing.rOut, casing.rOut, 4.4, 160, 1, true]} />
        </mesh>
      )}
      {casing && (
        <mesh position-z={-1.15} material={casingMat} receiveShadow>
          <ringGeometry args={[casing.rIn, casing.rOut, 160]} />
        </mesh>
      )}
      {stemExt && stemExt.to > stemExt.from && (
        <group ref={stemTube}>
          <mesh position={[(stemExt.from + stemExt.to) / 2, 0, -1.5]} rotation-z={Math.PI / 2} material={materials.steel}>
            <cylinderGeometry args={[stemRadius, stemRadius, stemExt.to - stemExt.from, 24]} />
          </mesh>
        </group>
      )}
      {watchParts && (
        <>
          {watchParts.bezel.map((l, i) => (
            <mesh key={`bz${i}`} geometry={l.geometry} material={watchParts.pick(l)} />
          ))}
          <group ref={dialGroup} name="dial">
            {watchParts.dial.map((l, i) => (
              <mesh key={i} name="dial" geometry={l.geometry} material={watchParts.pick(l)} />
            ))}
          </group>
          <group ref={crystalGroup} name="crystal">
            {watchParts.crystal.map((l, i) => (
              <mesh key={i} name="crystal" geometry={l.geometry} material={watchParts.mats.crystal} />
            ))}
          </group>
          <group ref={strapGroup} name="strap">
            {watchParts.strap.map((l, i) => (
              <mesh key={i} geometry={l.geometry} material={watchParts.pick(l)} castShadow receiveShadow />
            ))}
          </group>
          <group ref={secondsGroup} name="seconds-hand" position-z={-3.5}>
            {watchParts.seconds.map((l, i) => (
              <mesh key={i} geometry={l.geometry} material={watchParts.pick(l)} />
            ))}
          </group>
        </>
      )}
      <group ref={back}>
        {ext?.caseback === 'display' ? (
          <>
            <mesh rotation-x={Math.PI / 2} material={caseMat} castShadow>
              <cylinderGeometry args={[outer - 1.1, outer - 0.8, 1.0, 160, 1, true]} />
            </mesh>
            <mesh name="caseback-glass" rotation-x={Math.PI / 2} material={glassMat}>
              <cylinderGeometry args={[outer - 1.15, outer - 1.15, 0.6, 160]} />
            </mesh>
          </>
        ) : (
          <mesh name="caseback-solid" rotation-x={Math.PI / 2} material={[caseMat, backMat, caseMat]} castShadow>
            <cylinderGeometry args={[outer - 1.1, outer - 0.8, 1.0, 160]} />
          </mesh>
        )}
      </group>
      <group ref={rotor}>
        <mesh geometry={rotorGeo} material={rotorMat} castShadow />
        <mesh rotation-x={Math.PI / 2} material={materials.steel}>
          <cylinderGeometry args={[0.9, 0.9, 0.6, 48]} />
        </mesh>
      </group>
    </group>
  );
}
