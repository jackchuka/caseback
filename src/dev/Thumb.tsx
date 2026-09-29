import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Caliber } from '../model/schema';
import type { Watch } from '../model/watch';
import { Exterior } from '../scene/Exterior';
import { buildExterior } from '../scene/exterior/contract';
import { useDiscMaterials } from '../scene/exterior/discMaterials';
import { movementFrame } from '../scene/exterior/frame';
import { MaterialsProvider } from '../scene/materials';
import { Movement } from '../scene/Movement';
import { Studio } from '../scene/Studio';
import { Rig } from './Compare';
import { parseTime, VIEW_ROTATIONS, type ShotCamera } from './shots';

declare global {
  interface Window {
    __thumb?: { ready: boolean };
  }
}

const TIME = parseTime('10:08:37');

// Transparent, so one render sits on either theme's background.
function ClearBackground() {
  const scene = useThree((s) => s.scene);
  useEffect(() => { scene.background = null; });
  return null;
}

// Environment maps and shadows settle over the first frames; the script waits for this flag.
function Ready() {
  const frames = useRef(0);
  useFrame(() => {
    if (++frames.current === 30) window.__thumb = { ready: true };
  });
  return null;
}

function Stage({ width, height, cam, children }: { width: number; height: number; cam?: ShotCamera; children: React.ReactNode }) {
  return (
    <Canvas className="thumb-canvas" orthographic={!!cam} dpr={1} camera={cam ? undefined : { fov: FOV, position: [0, 0, 1] }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} style={{ width, height }}>
      {cam && <Rig cam={cam} width={width} height={height} />}
      <MaterialsProvider>
        <Studio />
        <ClearBackground />
        {cam ? <group rotation={cam.rotation}>{children}</group> : children}
      </MaterialsProvider>
      <Ready />
    </Canvas>
  );
}

// Three-quarter front, as a product photo would show it.
export function WatchThumb({ caliber, watch, size }: { caliber: Caliber; watch: Watch; size: number }) {
  const frame = useMemo(() => movementFrame(caliber), [caliber]);
  const build = useMemo(() => buildExterior(watch.exterior, { movement: frame, quality: 'high' }), [watch, frame]);
  const hands = useMemo(() => ({ 'hour-hand': build.parts.hands.hour, 'minute-hand': build.parts.hands.minute, ...build.parts.hands.extra }), [build]);
  const discs = useDiscMaterials(build.materials);
  const cam: ShotCamera = { mmPerPx: 58 / size, center: [size / 2, size / 2], rotation: VIEW_ROTATIONS['three-quarter'] };
  return (
    <Stage width={size} height={size} cam={cam}>
      <group rotation-x={Math.PI / 2}>
        <Movement caliber={caliber} handLayers={build.parts.hands.hour.length ? hands : undefined} discMaterials={discs} timeOverride={TIME}>
          <Exterior caliber={caliber} watch={watch} build={build} frame={frame} watchFront />
        </Movement>
      </group>
    </Stage>
  );
}

// The bare movement from the bridge side, seen from the tour's opening direction so the studio lights fall
// on it as they do in the app.
export function CaliberThumb({ caliber, width, height }: { caliber: Caliber; width: number; height: number }) {
  return (
    <Stage width={width} height={height}>
      <FrameMovement diameter={caliber.specs.diameterMm} />
      <Movement caliber={caliber} timeOverride={TIME} />
    </Stage>
  );
}

const FOV = 26;
const TOUR_DIRECTION = new THREE.Vector3(-24, 52, 62).normalize();

function FrameMovement({ diameter }: { diameter: number }) {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    // The movement's width fills most of the 16:10 frame; its tilted disc stays clear of the edges.
    const dist = (diameter * 0.95) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    // The plate sits below the centre arbor's origin; aim at the disc's middle, not the origin.
    const target = new THREE.Vector3(0, -2, 0);
    camera.position.copy(TOUR_DIRECTION).multiplyScalar(dist).add(target);
    camera.lookAt(target);
  }, [camera, diameter]);
  return null;
}
