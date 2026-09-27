import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { extrudeCentered } from '../geometry/gear';
import type { Caliber } from '../model/schema';
import type { Watch } from '../model/watch';
import { appStore } from '../state/app';
import { useMaterials } from './materials';
import { crownEuler, crownState } from './crown';
import { caseRadii } from './caseGeometry';
import { openingPose } from './opening';
import { engraving } from './textures';

const CASE_COLORS = { steel: [0xc8cbd0, 0.3], titanium: [0xa9acb0, 0.45], gold: [0xe6c27a, 0.25] } as const;

export function Exterior({ caliber, watch }: { caliber: Caliber; watch?: Watch }) {
  const r = caliber.specs.diameterMm / 2;
  const ext = watch?.exterior;
  const { inner, outer, height, bottom } = caseRadii(caliber.specs.diameterMm, ext);
  const top = bottom + height;
  const materials = useMaterials();
  const caseMat = useMemo(() => {
    const [color, roughness] = CASE_COLORS[ext?.case.material ?? 'steel'];
    return new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness, clearcoat: 0.15, clearcoatRoughness: 0.3 });
  }, [ext]);
  const glassMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 1, thickness: 0.6, ior: 1.77, transparent: true }), []);
  const bezel = useMemo(() => {
    if (ext?.bezel.kind !== 'dive') return null;
    const o = outer;
    const prof = [[o - 3.0, bottom], [o - 0.3, bottom], [o - 0.2, bottom - 0.5], [o - 0.5, bottom - 1.0], [o - 3.0, bottom - 1.0], [o - 3.0, bottom]].map(([x, y]) => new THREE.Vector2(x, y));
    const ring = new THREE.LatheGeometry(prof, 160).rotateX(Math.PI / 2);
    const mat = new THREE.MeshPhysicalMaterial({ color: ext.bezel.color ?? '#222222', metalness: 0.2, roughness: 0.3, clearcoat: 1 });
    const tickMat = new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.5 });
    const ticks = Array.from({ length: 60 }, (_, i) => {
      const a = (i / 60) * Math.PI * 2;
      const len = i % 5 === 0 ? 0.9 : 0.45;
      return new THREE.BoxGeometry(0.14, len, 0.06).rotateZ(-a).translate(Math.sin(a) * (o - 1.2), -Math.cos(a) * (o - 1.2), bottom - 1.02);
    });
    return { ring, mat, tickMat, ticks };
  }, [ext, outer, bottom]);
  const backMat = useMemo(() => {
    const tex = engraving({ ring: `CASEBACK · AUTOMATIC · STAINLESS STEEL · ${caliber.specs.jewels} JEWELS · `, center: `CAL. ${caliber.name.replace(/^ETA /, '')}` });
    return new THREE.MeshPhysicalMaterial({ color: 0xd0d3d7, metalness: 1, roughness: 0.3, bumpMap: tex, bumpScale: 1.2, roughnessMap: tex, transparent: true });
  }, [caliber]);
  const rotorMat = useMemo(() => materials.gilt.clone(), [materials]);
  const ring = useMemo(() => {
    const prof = [[inner, bottom], [outer - 1.1, bottom], [outer - 0.2, bottom + 1.2], [outer, bottom + 4.3], [outer - 0.5, top - 0.4], [outer - 1.0, top], [inner, top]].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(prof, 160).rotateX(Math.PI / 2);
  }, [inner, outer, bottom, top]);
  const rotorGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.absarc(0, 0, r - 0.3, 0, Math.PI, false);
    s.absarc(0, 0, 1.2, Math.PI, 0, true);
    return extrudeCentered(s, 0.45, 0.06);
  }, [r]);

  const lug = ext ? { x: ext.case.lugWidthMm / 2 + 1.4, y: outer + 3.0 } : { x: r * 0.52, y: r + 4.2 };
  const crownSize = ext ? { radius: ext.crown.diameterMm / 2, length: ext.crown.lengthMm } : { radius: 1.25, length: 2.0 };
  const crownX = ext ? outer + crownSize.length / 2 - 0.2 : r + 4.3;
  const back = useRef<THREE.Group>(null);
  const rotor = useRef<THREE.Group>(null);
  const openT = useRef(0);
  const crown = useRef<THREE.Mesh>(null);

  useFrame((state, dt) => {
    const s = appStore().getState();
    if (s.mode === 'opening') openT.current += Math.min(dt, 0.05);
    const closed = s.mode === 'intro';
    const pose = openingPose(closed ? 0 : s.mode === 'opening' ? openT.current : 99);
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
    if (s.mode === 'opening' && pose.done) {
      openT.current = 0;
      s.finishOpening();
    }
  });

  return (
    <group>
      <mesh geometry={ring} material={caseMat} castShadow receiveShadow />
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sy) => (
          <RoundedBox key={`${sx}${sy}`} args={[2.8, 7.5, 3.2]} radius={1.1} smoothness={6} position={[sx * lug.x, sy * lug.y, 0.5]} rotation-z={sx * sy * -0.12} material={caseMat} castShadow />
        )),
      )}
      <mesh ref={crown} position={[crownX, 0, -1.5]} rotation={[0, 0, Math.PI / 2, 'ZYX']} material={caseMat}>
        <cylinderGeometry args={[crownSize.radius, crownSize.radius, crownSize.length, 48]} />
      </mesh>
      {bezel && (
        <group>
          <mesh geometry={bezel.ring} material={bezel.mat} castShadow />
          {bezel.ticks.map((g, i) => (
            <mesh key={i} geometry={g} material={bezel.tickMat} />
          ))}
        </group>
      )}
      <group ref={back}>
        {ext?.caseback === 'display' ? (
          <>
            <mesh rotation-x={Math.PI / 2} material={caseMat} castShadow>
              <cylinderGeometry args={[outer - 1.1, outer - 0.8, 1.0, 160, 1, true]} />
            </mesh>
            <mesh rotation-x={Math.PI / 2} material={glassMat}>
              <cylinderGeometry args={[outer - 1.15, outer - 1.15, 0.6, 160]} />
            </mesh>
          </>
        ) : (
          <mesh rotation-x={Math.PI / 2} material={[caseMat, backMat, caseMat]} castShadow>
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
