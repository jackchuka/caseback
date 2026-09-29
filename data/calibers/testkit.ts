import { getCaliber } from './index';
import { buildSolver, type KinematicsInput } from '../../src/kinematics/solver';

export const TAU = Math.PI * 2;

export function caliberKit(id: string) {
  const c = getCaliber(id)!;
  const solve = buildSolver(c);
  const part = (id: string) => c.parts.find((p) => p.id === id)!;
  const angle = (id: string, t: number, extra: Partial<KinematicsInput> = {}) => solve({ t, explode: 0, ...extra }).get(id)!.angle;
  const turns = (id: string, seconds: number) => Math.abs(angle(id, seconds) - angle(id, 0)) / TAU;
  return { c, solve, part, angle, turns };
}
