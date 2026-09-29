import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { lathe } from '../../../../src/scene/exterior/kit/lathe';
import { softFinish } from '../../../../src/scene/exterior/kit/polish';
import { clamp01, extrudeProfile, lugRun, polygonSdf, smax, smin, type P2 } from '../../../../src/scene/exterior/kit/sdf';
import { polishedMesh } from '../../../../src/scene/exterior/kit/surfaceNets';
import { P } from './params';

// The case middle's front face (the bezel seat), the step where its sloped flank meets the upright band, and its back
// face (the caseback seat).
export const caseFront = (m: MovementFrame) => m.dialZ - P.caseFrontToDial;
export const caseStepZ = (m: MovementFrame) => m.dialZ - P.stepToDial;
export const caseBack = (m: MovementFrame) => m.dialZ + P.caseBackToDial;
// The crystal apex sits the published thickness in front of the caseback's outer face; the rim, a dome height behind
// it, stands just proud of the bezel.
export const casebackOuter = (m: MovementFrame) => caseBack(m) + P.caseback.thickness;
export const crystalApex = (m: MovementFrame) => casebackOuter(m) - P.totalThickness;
export const bezelTop = (m: MovementFrame) => crystalApex(m) + P.domeHeight + P.bezelProud;

// Outer edge of the lug at height y (|y| from lugLeave to the tip): it leaves the drum on its tangent and converges
// on the tip, so the lugs read as long horns.
export function lugOuter(y: number) {
  const tip = P.lugToLug / 2;
  const x0 = Math.sqrt(P.caseRadius ** 2 - P.lugLeave ** 2);
  const t = clamp01((tip - y) / (tip - P.lugLeave));
  return P.lugTip + (x0 - P.lugTip) * t ** P.lugPower;
}

// Where the lug's plan starts, buried in the drum (any |y| well inside it will do).
const LUG_ROOT = 6;

// The lug's plan in the first quadrant: its inner edge on the lug gap, its outer edge on lugOuter, its tip curving in
// through the measured points, its root buried in the drum so the union has no seam.
function lugPolygon(): P2[] {
  const lw = P.lugGap / 2, tip = P.lugToLug / 2;
  const pts: P2[] = [[lw, LUG_ROOT], [Math.sqrt(P.caseRadius ** 2 - LUG_ROOT ** 2) - 0.6, LUG_ROOT]];
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const y = P.lugLeave + ((P.lugTipFrom - P.lugLeave) * i) / n;
    pts.push([lugOuter(y), y]);
  }
  pts.push(...P.lugTipOutline.map(([x, y]): P2 => [x, y]), [lw, tip]);
  return pts;
}

// The Light-catcher case middle: a drum whose brushed flank slopes out from under the bezel to a polished step at
// 41 mm, an upright brushed band below it, and long lugs that grow out of the band, fall toward the wrist and roll
// their tops outward, with a polished chamfer along their top edges. Inside, a polished flange slopes from the module's
// seat up to the case front. `counter`, when given, counts the evaluations that get past the cheap early exits.
export function caseShape(m: MovementFrame, counter?: { full: number }) {
  const R = P.caseRadius;
  const lw = P.lugGap / 2;
  const tip = P.lugToLug / 2;
  const F = caseFront(m), S = caseStepZ(m), back = caseBack(m);
  // The flank's radius grows k mm per mm toward the back, from the bezel's outer edge at the case front to R at the step.
  const k = (R - P.bezelOuter) / (S - F);
  const kn = Math.hypot(1, k);
  // The bevel between flank and band, along their bisector.
  const nb = Math.hypot(1 + 1 / kn, k / kn);
  // The flange widens from the bore at its foot to flangeTop at the case front.
  const foot = m.dialZ - P.flangeFoot;
  const kf = (P.flangeTop - P.bore) / (foot - F);
  const kfn = Math.hypot(1, kf);
  // The plan's distance: exact polygon distance only round the tip; along the flanks the edges' own distances, which
  // cost a fraction of it (the lug is sampled millions of times).
  const tipPoly = polygonSdf(lugPolygon());
  const x0 = Math.sqrt(R ** 2 - P.lugLeave ** 2);
  const lug = (ax: number, ay: number) => {
    if (ay > P.lugTipFrom - 1) return tipPoly(ax, ay);
    let outer: number;
    if (ay <= P.lugLeave) outer = ax - x0;
    else {
      const slope = (lugOuter(ay + 0.01) - lugOuter(ay - 0.01)) / 0.02;
      outer = (ax - lugOuter(ay)) / Math.hypot(1, slope);
    }
    return Math.max(lw - ax, outer, LUG_ROOT - ay);
  };
  const run = lugRun(R, tip);
  const lugFront = (x: number, y: number) => {
    const t = run(x, y);
    return S + P.lugDrop * t ** P.lugCurve + Math.tan(P.lugTwist * t) * Math.max(0, Math.abs(x) - lw);
  };
  const lugUnder = (y: number) => back - P.lugHeel * clamp01((Math.abs(y) - tip + P.lugHeelRun) / P.lugHeelRun) ** 2;
  const holeY = tip - P.holeInset;
  const hole = { y: holeY, z: (lugFront(lw + 1, holeY) + lugUnder(holeY)) / 2 };
  const lugOpts = { chamfer: P.lugChamfer, backChamfer: P.backChamfer, edge: P.edge };

  // Per-column values: surface nets samples z fastest, so each (x, y) serves a whole run of samples.
  let cx = NaN, cy = NaN;
  const col = { r: 0, nearLug: false, plan: 0, front: 0, under: 0 };
  const column = (x: number, y: number) => {
    if (x !== cx || y !== cy) {
      cx = x; cy = y;
      const ax = Math.abs(x), ay = Math.abs(y);
      col.r = Math.hypot(x, y);
      col.nearLug = ay > P.lugLeave - 7 && ax > lw - 1.5 && ax < R + 0.5;
      if (col.nearLug) {
        col.plan = lug(ax, ay);
        col.front = lugFront(x, y);
        col.under = lugUnder(y);
      }
    }
    return col;
  };
  // The drum's terms: flank, band, the step's bevel, front, back and the back chamfer.
  const drumTerms = (r: number, z: number) => {
    const flank = (r - P.bezelOuter - (z - F) * k) / kn;
    const band = r - R;
    return { flank, band, step: (flank + band + P.stepBevel) / nb, vf: F - z, vb: z - back, backBevel: (band + z - back + P.backChamfer) / Math.SQRT2 };
  };
  const drum = (r: number, z: number) => {
    const t = drumTerms(r, z);
    return smax(smax(smax(smax(smax(t.flank, t.band, P.edge), t.step, P.edge), t.vf, P.edge), t.vb, P.edge), t.backBevel, P.edge);
  };
  // Positive inside the opening: the module's seat and the flange sloping out from it.
  const bore = (r: number, z: number) => Math.max(P.bore - r, (P.bore + (foot - z) * kf - r) / kfn);
  const drill = (x: number, y: number, z: number) =>
    Math.min(P.holeRadius - Math.hypot(Math.abs(y) - hole.y, z - hole.z), lw + P.holeDepth - Math.abs(x));

  const sdf = (x: number, y: number, z: number) => {
    const c = column(x, y);
    if (P.bore - c.r > 1.5) return P.bore - c.r - 1;
    if (F - z > 1) return F - z;
    if (z - back > 1) return z - back;
    if (c.r - R > 1 && (!c.nearLug || c.plan > 1)) return c.nearLug ? Math.min(c.r - R, c.plan) : c.r - R;
    // Outside the drum only the lug is solid; its top falls steeply, so the vertical distance overstates the true one.
    if (c.r > R + 0.5) {
      if (c.front - z > 1.5) return (c.front - z) / 2;
      if (z - c.under > 1.5) return (z - c.under) / 2;
    }
    if (counter) counter.full++;
    let d = drum(c.r, z);
    if (c.nearLug && c.plan < 1.5) d = smin(d, extrudeProfile(c.plan, c.front - z, z - c.under, lugOpts), P.lugFillet);
    d = smax(d, bore(c.r, z), P.edge);
    return Math.abs(Math.abs(y) - hole.y) > P.holeRadius + 1 ? d : Math.max(d, drill(x, y, z));
  };
  // 0 brushed … 1 polished: the step's bevel, the flange and the lugs' top chamfers are polished.
  const polish = (x: number, y: number, z: number) => {
    const c = column(x, y);
    const t = drumTerms(c.r, z);
    const opening: Array<[number, number]> = [[0, P.bore - c.r], [1, (P.bore + (foot - z) * kf - c.r) / kfn]];
    const drumFinish = softFinish([[0, t.flank], [0, t.band], [1, t.step], [0, t.vf], [0, t.vb], [0, t.backBevel], ...opening]);
    if (!c.nearLug || c.plan > 1.5) return drumFinish;
    const vf = c.front - z, vb = z - c.under;
    const lugFinish = softFinish([[0, c.plan], [0, vf], [0, vb], [1, (c.plan + vf + P.lugChamfer) / Math.SQRT2], [0, (c.plan + vb + P.backChamfer) / Math.SQRT2], [0, drill(x, y, z)]]);
    const w = clamp01(0.5 + (drum(c.r, z) - extrudeProfile(c.plan, vf, vb, lugOpts)) / (2 * P.lugFillet));
    return drumFinish + (lugFinish - drumFinish) * w;
  };
  return { sdf, polish, lugFront, lugUnder, hole, bounds: { x: R + 0.5, y: tip + 0.5, z: [F - 0.5, back + 0.5] as [number, number] } };
}

// The thin polished bezel ring on the case front, its top rounded, holding the crystal.
export function belCantoBezel(m: MovementFrame): ExteriorLayer[] {
  const F = caseFront(m), top = bezelTop(m);
  const i = P.bezelInner, o = P.bezelOuter;
  const ring = lathe([[i, F], [i, top + 0.15], [i + 0.12, top + 0.02], [i + 0.3, top], [o - 0.3, top], [o - 0.1, top + 0.08], [o, top + 0.25], [o, F], [i, F]], 240);
  return [{ geometry: ring, material: 'polished' }];
}

export function belCantoCase(m: MovementFrame, step: number): ExteriorLayer[] {
  const s = caseShape(m);
  const b = s.bounds;
  return [{ geometry: polishedMesh(s.sdf, s.polish, [-b.x, -b.y, b.z[0]], [b.x, b.y, b.z[1]], step), material: 'case' }, ...belCantoBezel(m)];
}
