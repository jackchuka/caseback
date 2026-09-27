import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode } from 'react';
import { buildSolver } from '../kinematics/solver';
import type { Caliber } from '../model/schema';
import { focusKey } from '../model/validate';
import { appStore, useApp } from '../state/app';
import { effectiveSpeed } from '../tour/engine';
import { PartMesh } from './PartMesh';
import { registry } from './registry';
import { advance } from './simClock';

export const MOVEMENT_ROTATION = -Math.PI / 2;
const XRAY_OPACITY = 0.12;

export function Movement({ caliber, children }: { caliber: Caliber; children?: ReactNode }) {
  const solve = useMemo(() => buildSolver(caliber), [caliber]);
  const pick = useApp((s) => s.pick);
  const t = useRef(0);
  const explode = useRef(0);

  useFrame((state, dt) => {
    const s = appStore().getState();
    const step = caliber.tour[s.stepIndex]!;
    t.current = advance(t.current, dt, effectiveSpeed(s.mode, step, s.freeSpeedExp, s.paused));
    explode.current += ((s.mode === 'free' ? s.explode : 0) - explode.current) * 0.08;
    const transforms = solve({ t: t.current, explode: explode.current });
    const highlight = s.mode === 'tour' ? step.focus : s.mode === 'free' ? s.selected : null;
    const xray = s.mode === 'tour' && step.xray;
    const pulse = 1.2 + Math.sin(state.clock.elapsedTime * 3) * 0.8;

    for (const [id, entry] of registry) {
      const tr = transforms.get(id);
      if (!tr) continue;
      entry.group.rotation.z = tr.angle;
      entry.group.position.z = entry.part.pos.z + tr.dz;
      if (entry.part.shape.kind === 'hairspring') {
        const k = 1 + 0.02 * tr.angle;
        entry.group.scale.set(k, k, 1);
      }
      const lit = highlight !== null && focusKey(entry.part) === highlight;
      const isBridge = entry.part.shape.kind === 'bridge';
      for (const m of entry.materials) {
        m.emissive.setHex(lit ? 0x3a2a10 : 0x000000);
        m.emissiveIntensity = lit ? pulse : 0;
        if (isBridge) {
          m.opacity += ((xray ? XRAY_OPACITY : 1) - m.opacity) * 0.08;
          const transparent = m.opacity < 0.99;
          if (m.transparent !== transparent) {
            m.transparent = transparent;
            m.needsUpdate = true;
          }
          m.depthWrite = m.opacity > 0.5;
        }
      }
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
