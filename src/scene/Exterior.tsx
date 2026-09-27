import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { extrudeCentered } from '../geometry/gear';
import type { Caliber } from '../model/schema';
import { appStore } from '../state/app';
import { useMaterials } from './materials';
import { crownState } from './crown';
import { openingPose } from './opening';
import { engraving } from './textures';

export function Exterior({ caliber }: { caliber: Caliber }) {
  const r = caliber.specs.diameterMm / 2;
  const materials = useMaterials();
  const caseMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: 0xc8cbd0, metalness: 1, roughness: 0.3, clearcoat: 0.15, clearcoatRoughness: 0.3 }), []);
  const backMat = useMemo(() => {
    const tex = engraving({ ring: `CASEBACK · AUTOMATIC · STAINLESS STEEL · ${caliber.specs.jewels} JEWELS · `, center: `CAL. ${caliber.name.replace(/^ETA /, '')}` });
    return new THREE.MeshPhysicalMaterial({ color: 0xd0d3d7, metalness: 1, roughness: 0.3, bumpMap: tex, bumpScale: 1.2, roughnessMap: tex, transparent: true });
  }, [caliber]);
  const rotorMat = useMemo(() => materials.gilt.clone(), [materials]);
  const ring = useMemo(() => {
    const prof = [[r + 0.35, -2.8], [r + 2.4, -2.8], [r + 3.3, -1.6], [r + 3.5, 1.5], [r + 3.0, 4.6], [r + 2.5, 5.0], [r + 0.35, 5.0]].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(prof, 160).rotateX(Math.PI / 2);
  }, [r]);
  const rotorGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.absarc(0, 0, r - 0.3, 0, Math.PI, false);
    s.absarc(0, 0, 1.2, Math.PI, 0, true);
    return extrudeCentered(s, 0.45, 0.06);
  }, [r]);

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
      back.current.position.z = 5.6 + pose.casebackLift;
      backMat.opacity = pose.casebackOpacity;
    }
    if (rotor.current) {
      rotor.current.visible = pose.rotorSlide < 29;
      rotor.current.position.set(pose.rotorSlide, 0, 4.45 + pose.rotorLift);
      rotor.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.7) * 1.4 + Math.sin(state.clock.elapsedTime * 0.23) * 0.8;
    }
    if (crown.current) {
      crown.current.position.x = r + 4.3 + s.crownPos * 0.7;
      crown.current.rotation.x = crownState.rot;
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
          <RoundedBox key={`${sx}${sy}`} args={[2.8, 7.5, 3.2]} radius={1.1} smoothness={6} position={[sx * r * 0.52, sy * (r + 4.2), 0.5]} rotation-z={sx * sy * -0.12} material={caseMat} castShadow />
        )),
      )}
      <mesh ref={crown} position={[r + 4.3, 0, -1.5]} rotation={[0, 0, Math.PI / 2, 'ZXY']} material={caseMat}>
        <cylinderGeometry args={[1.25, 1.25, 2.0, 48]} />
      </mesh>
      <group ref={back}>
        <mesh rotation-x={Math.PI / 2} material={[caseMat, backMat, caseMat]} castShadow>
          <cylinderGeometry args={[r + 2.4, r + 2.7, 1.0, 160]} />
        </mesh>
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
