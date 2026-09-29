import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import type * as THREE from 'three';
import type { Caliber } from '../model/schema';
import type { Watch } from '../model/watch';
import { Exterior } from '../scene/Exterior';
import { buildExterior } from '../scene/exterior/contract';
import { useDiscMaterials } from '../scene/exterior/discMaterials';
import { movementFrame } from '../scene/exterior/frame';
import { MaterialsProvider } from '../scene/materials';
import { Movement } from '../scene/Movement';
import { Studio } from '../scene/Studio';
import { cameraOffset, defaultCamera, parseTime, type Shot, type ShotCamera, type View } from './shots';

export type Mode = 'overlay' | 'side' | 'diff' | 'model';
const DEFAULT_SIZE = 1200;
const DEFAULT_TIME = '10:08:37';

declare global {
  interface Window {
    __compare?: { watches?: string[]; shots?: string[] };
  }
}

export function Rig({ cam, width, height }: { cam: ShotCamera; width: number; height: number }) {
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera;
  useLayoutEffect(() => {
    const [x, y] = cameraOffset(cam, width, height);
    camera.position.set(x, y, -200);
    camera.up.set(0, -1, 0);
    camera.lookAt(x, y, 0);
    camera.zoom = 1 / cam.mmPerPx;
    camera.updateProjectionMatrix();
  }, [camera, cam, width, height]);
  return null;
}

export function CompareIndex({ ids }: { ids: string[] }) {
  useEffect(() => { window.__compare = { watches: ids }; }, [ids]);
  return (
    <main className="compare-index">
      <h1>Compare with reference photos</h1>
      <ul>
        {ids.map((id) => {
          const href = `${import.meta.env.BASE_URL}dev/compare/${id}`;
          return (
            <li key={id}>
              <a href={href}>{id}</a>
              <span className="views">
                {(['front', 'side', 'three-quarter'] as const).map((v) => <a key={v} href={`${href}?view=${v}&mode=model`}>{v}</a>)}
              </span>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

export function Compare({ caliber, watch, shots, shotId, view, mode: initialMode }: { caliber: Caliber; watch: Watch; shots: Shot[]; shotId: string | null; view: View; mode: Mode }) {
  const shot = shots.find((s) => s.id === shotId) ?? null;
  const [img, setImg] = useState<{ url: string; width: number; height: number } | null | 'missing'>(null);
  const [cam, setCam] = useState<ShotCamera>(() => shot?.camera ?? defaultCamera(view, DEFAULT_SIZE));
  const [mode, setMode] = useState<Mode>(shot ? initialMode : 'model');
  const [opacity, setOpacity] = useState(0.5);
  const frame = useMemo(() => movementFrame(caliber), [caliber]);
  const build = useMemo(() => buildExterior(watch.exterior, { movement: frame, quality: 'high' }), [watch, frame]);
  const hands = useMemo(() => ({ 'hour-hand': build.parts.hands.hour, 'minute-hand': build.parts.hands.minute, ...build.parts.hands.extra }), [build]);
  const discs = useDiscMaterials(build.materials);
  const time = parseTime(shot?.time ?? DEFAULT_TIME);

  useEffect(() => { window.__compare = { shots: shots.map((s) => s.id) }; }, [shots]);
  useEffect(() => {
    if (!shot) return;
    const url = `${import.meta.env.BASE_URL}reference/${watch.id}/${shot.file}`;
    const i = new Image();
    i.onload = () => setImg({ url, width: i.naturalWidth, height: i.naturalHeight });
    i.onerror = () => setImg('missing');
    i.src = url;
  }, [shot, watch.id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const px = e.shiftKey ? 10 : 1;
      setCam((c) => {
        switch (e.key) {
          case 'ArrowLeft': return { ...c, center: [c.center[0] - px, c.center[1]] };
          case 'ArrowRight': return { ...c, center: [c.center[0] + px, c.center[1]] };
          case 'ArrowUp': return { ...c, center: [c.center[0], c.center[1] - px] };
          case 'ArrowDown': return { ...c, center: [c.center[0], c.center[1] + px] };
          case '+': return { ...c, mmPerPx: c.mmPerPx / 1.01 };
          case '-': return { ...c, mmPerPx: c.mmPerPx * 1.01 };
          case '[': return { ...c, rotation: [c.rotation[0], c.rotation[1] - 0.01, c.rotation[2]] };
          case ']': return { ...c, rotation: [c.rotation[0], c.rotation[1] + 0.01, c.rotation[2]] };
          default: return c;
        }
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const photo = img && img !== 'missing' ? img : null;
  const width = photo?.width ?? DEFAULT_SIZE;
  const height = photo?.height ?? DEFAULT_SIZE;
  const stage = (
    <div className="compare-canvas" style={{ width, height, position: 'relative' }}>
      <Canvas orthographic dpr={1} gl={{ antialias: true, preserveDrawingBuffer: true }} style={{ width, height }}>
        <Rig cam={cam} width={width} height={height} />
        <MaterialsProvider>
          <Studio faceUp />
          <group rotation={cam.rotation}>
            {/* Undo the movement's own turn so the watch frame is the movement's local frame. */}
            <group rotation-x={Math.PI / 2}>
              <Movement caliber={caliber} handLayers={build.parts.hands.hour.length ? hands : undefined} discMaterials={discs} timeOverride={time}>
                <Exterior caliber={caliber} watch={watch} build={build} frame={frame} watchFront />
              </Movement>
            </group>
          </group>
        </MaterialsProvider>
      </Canvas>
      {photo && (mode === 'overlay' || mode === 'diff') && (
        <img src={photo.url} alt="" style={{ position: 'absolute', inset: 0, width, height, pointerEvents: 'none', opacity: mode === 'diff' ? 1 : opacity, mixBlendMode: mode === 'diff' ? 'difference' : 'normal' }} />
      )}
    </div>
  );
  return (
    <div className="compare">
      <div className="compare-bar">
        <strong>{watch.id}</strong> {shot ? `· ${shot.id}` : `· ${view}`}
        {(['overlay', 'side', 'diff', 'model'] as const).map((m) => <button key={m} onClick={() => setMode(m)} disabled={m === mode}>{m}</button>)}
        <input type="range" min={0} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
        <button onClick={() => void navigator.clipboard.writeText(JSON.stringify(cam))}>copy camera</button>
        {img === 'missing' && shot && <span className="compare-missing">reference/{watch.id}/{shot.file} is missing</span>}
      </div>
      <div className="compare-stage" style={{ display: 'flex', gap: 8 }}>
        {stage}
        {photo && mode === 'side' && <img src={photo.url} alt="" style={{ width, height }} />}
      </div>
    </div>
  );
}
