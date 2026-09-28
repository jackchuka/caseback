import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { extrudeProfile, polygonSdf, smax } from '../../../../src/scene/exterior/kit/sdf';
import { surfaceNets } from '../../../../src/scene/exterior/kit/surfaceNets';
import { V } from './params';
import { planFields } from './plan';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const caseFront = () => V.caseFront;
export const caseBack = () => V.caseBack;
// The sapphire's front face, just under tier 0.
export const crystalFront = () => V.caseFront + V.crystalProud;
// Where the dial rests on the movement seat.
export const ledgeZ = (m: MovementFrame) => m.dialZ + V.ledge;

// The crown housing's cross-section at x along the stem: an ellipse of half-width w and half-height h centred at zc.
// The collar is round the stem; the nose narrows and dives from it to rest on the crystal at its point.
export function housingSection(m: MovementFrame, x: number) {
  const H = V.housing;
  const [x1] = H.collar;
  const t = x >= x1 ? 0 : Math.min(1, (x1 - x) / (x1 - H.tip));
  const zc = lerp(m.stemZ, crystalFront(), t);
  return { w: lerp(H.halfWidth, H.tipHalfWidth, t), top: lerp(H.top, H.tipTop, t), zc };
}

// The Ventura XXL's case middle: three stepped tiers traced from the front photo (the main front round the dial and
// two steps down each wing toward 9 o'clock), a dial opening down to a ledge, a round movement seat through to the
// back, and the crown housing whose pointed nose marks 3 o'clock over the dial, pierced by a triangular window.
// `counter`, when given, counts the evaluations that get past the cheap early exits.
export function caseShape(m: MovementFrame, counter?: { full: number }) {
  const { tiers, dial } = planFields();
  const back = caseBack();
  const fronts = [0, 1, 2].map((k) => caseFront() + k * V.tierDrop);
  const ledge = ledgeZ(m);
  const clip = crystalFront() - 0.02;
  const H = V.housing;
  const win = polygonSdf([[H.window.from, 0], [H.window.to, -H.window.halfHeight], [H.window.to, H.window.halfHeight]]);
  const opts = { chamfer: V.chamfer, backChamfer: V.backChamfer, edge: V.edge };

  const housing = (x: number, y: number, z: number, open: number) => {
    const s = housingSection(m, x);
    const h = s.zc - s.top;
    // A squarish section (a superellipse): broad flanks either side of the window, as on the photos' flat facets.
    const e = (Math.abs(y / s.w) ** 3 + Math.abs((z - s.zc) / h) ** 3) ** (1 / 3);
    let d = Math.max((e - 1) * Math.min(s.w, h), H.tip - x, x - H.collar[1]);
    d = Math.max(d, -win(x, y));
    // Inside the dial opening nothing reaches behind the crystal's face: the nose rests on the sapphire.
    return smax(d, Math.min(-open, z - clip), 0.15);
  };

  let cx = NaN, cy = NaN, cPlan = [0, 0, 0], cMin = 0, cOpen = 0, cBore = 0, cRoll = 0;
  const column = (x: number, y: number) => {
    if (x === cx && y === cy) return;
    cx = x; cy = y;
    cOpen = dial(x, y);
    // Tier 0 always keeps a band round the dial opening, even where the traced wing grooves converge on the 9 o'clock
    // tip, so no sliver of the main front thinner than the mesh grid is left there.
    cPlan = tiers.map((f, k) => (k === 0 ? Math.min(f(x, y), cOpen - V.rim) : f(x, y)));
    cMin = Math.min(...cPlan);
    cBore = Math.hypot(x, y) - V.seat;
    cRoll = roll(cOpen, cPlan[0]!);
  };
  // Tier 0's face is not flat: it rolls back from the dial edge toward its outer edge, so the housing stands proud.
  const roll = (open: number, plan: number) => (open <= 0 ? 0 : V.crown0 * Math.min(1, open / Math.max(1e-6, open - plan)) ** 2);
  const nearHousing = (x: number, y: number) => x > H.tip - 0.5 && x < H.collar[1] + 0.5 && Math.abs(y) < H.halfWidth + 0.5;
  const sdf = (x: number, y: number, z: number) => {
    column(x, y);
    const near = nearHousing(x, y);
    const far = near ? Math.min(cMin, 0) : cMin;
    if (far > 1) return far;
    // Cheap bounds: in front of the case, behind it, or in the empty seat or dial opening, by more than a millimetre.
    if (!near) {
      if (fronts[0]! - z > 1) return fronts[0]! - z;
      if (cBore < -1) return -cBore;
      if (cOpen < -1 && ledge - z > 1) return Math.min(-cOpen, ledge - z);
    }
    if (z - back > 1) return z - back;
    if (counter) counter.full++;
    let middle = Infinity;
    for (let k = 0; k < 3; k++) middle = Math.min(middle, extrudeProfile(cPlan[k]!, fronts[k]! + (k === 0 ? cRoll : 0) - z, z - back, opts));
    const hole = Math.min(Math.max(cOpen, z - ledge), cBore);
    const shell = smax(middle, -hole, V.edge);
    return near ? Math.min(shell, housing(x, y, z, cOpen)) : shell;
  };
  const bounds = { x: [-22, H.collar[1] + 0.4] as [number, number], y: 23.3, z: [H.top - 0.4, back + 0.4] as [number, number] };
  return { sdf, fronts, back, bounds, roll };
}

export function venturaCase(m: MovementFrame, step: number): ExteriorLayer[] {
  const s = caseShape(m);
  const b = s.bounds;
  const g = surfaceNets(s.sdf, [b.x[0], -b.y, b.z[0]], [b.x[1], b.y, b.z[1]], step);
  return [{ geometry: g, material: 'case' }];
}
