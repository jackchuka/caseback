import type { P2 } from '../../../../src/scene/exterior/kit/sdf';

// Every dimension of the H24655331 in mm. Source tags: spec = published figure; photo:<shot> = measured on the
// reference photo or the compare page; est = estimated, to be calibrated against the photos.

// The front photo's scale and the pixel under the hands' pivot. 45.5 mm (spec, Abt/Monica: "45.5 mm x 46 mm") spans
// the outline's 1198 px from 12 to 6; the crown's end then lands 46.2 mm from the 9 o'clock tip, Hamilton's other
// 46 mm figure.
export const PHOTO = { mmPerPx: 45.5 / 1198, pivot: [999, 956] as P2 };

// The outlines below are traced on monica-front.jpg in pixels, upper half only, from the 9 o'clock axis round to the
// 3 o'clock axis: the case is mirror-symmetric about the 3–9 line through the pivot to within 5 px (checked column by
// column against the lower half). The right flank is set 2 px in from the upper half's edge so that both halves of
// the photo's slightly skewed flank sit within 4 px of the mirrored outline. Tier 0 is the case's main front round
// the dial; tiers 1 and 2 are the two steps of each wing, whose grooves converge on the 9 o'clock tip and run out
// into the top edge.
export const TRACE = {
  tier2: [[446, 956], [446, 890], [470, 858], [500, 824], [540, 736], [580, 644], [620, 599], [660, 561], [700, 526], [740, 495], [780, 465], [820, 438], [860, 415], [900, 406], [940, 408], [965, 412], [965, 956]],
  tier1: [[478, 956], [500, 895], [520, 843], [540, 791], [580, 686], [620, 654], [660, 623], [700, 592], [740, 563], [780, 535], [820, 509], [860, 483], [900, 459], [940, 437], [965, 414], [980, 410], [1020, 400], [1060, 389], [1100, 380], [1140, 372], [1180, 366], [1220, 361], [1240, 359], [1256, 368], [1266, 388], [1266, 956]],
  tier0: [[505, 956], [520, 916], [540, 862], [580, 755], [620, 722], [660, 690], [700, 661], [740, 632], [780, 606], [820, 581], [860, 558], [900, 536], [940, 516], [980, 497], [1020, 479], [1060, 462], [1100, 445], [1140, 429], [1180, 414], [1220, 401], [1266, 388], [1300, 402], [1340, 410], [1380, 422], [1400, 440], [1411, 482], [1435, 534], [1457, 584], [1478, 632], [1497, 681], [1516, 729], [1534, 777], [1552, 826], [1554, 956]],
  // The case's inner edge round the dial; under the crown housing (from 850 px down) it is extrapolated on the edge's
  // slope to its hidden vertex on the 3 o'clock axis.
  dial: [[497, 956], [502, 915], [520, 880], [553, 855], [585, 828], [620, 795], [660, 762], [700, 731], [740, 704], [780, 678], [820, 653], [860, 630], [900, 609], [940, 589], [980, 571], [1020, 554], [1060, 538], [1100, 523], [1140, 508], [1180, 495], [1220, 484], [1260, 476], [1284, 473], [1300, 482], [1310, 519], [1332, 563], [1347, 609], [1361, 653], [1374, 694], [1387, 733], [1400, 772], [1413, 810], [1426, 848], [1440, 890], [1452, 930], [1456, 956]],
} satisfies Record<string, P2[]>;

export const V = {
  height: 45.5, // spec: 12 to 6
  width: 46, // spec: 9 o'clock tip to the crown's end (Hamilton "46 x 46 mm")
  totalThickness: 11.25, // spec: Hamilton
  caseFront: -5.3, // est: tier 0's front face; the crystal sits just under it, 11.25 mm in front of the back's outer face
  tierDrop: 1.0, // est: each wing step falls this far toward the back (monica-side, timescape-wrist)
  crown0: 0.55, // photo:front, timescape-wrist: tier 0's face rolls this far back from the dial edge to its outer edge
  caseBack: 4.4, // est: the case middle's back face, the display back's seat
  chamfer: 0.35, // photo:front: the polished bevel round tier 0's outer edge and each step
  backChamfer: 0.5, // photo:monica-back
  edge: 0.2, // est
  rim: 1.0, // est: the least width of the main front round the dial (at the 9 o'clock tip)
  barrel: 0.35, // photo:monica-side: the flanks draw in this far toward the front and back faces
  seat: 13.0, // est: the round movement seat behind the dial, 0.2 mm clear of the 25.6 mm movement
  ledge: 0.15, // est: the dial rests on the seat this far behind its face

  crystalProud: 0.05, // est: the sapphire sits this far under tier 0's front
  crystalThickness: 1.5, // est: flat sapphire, cut to the dial opening

  // The crown housing: a collar round the stem, and a nose tapering from it over the dial to a point at 3 o'clock.
  housing: {
    tip: 8.6, // photo:front: the nose's point, from the pivot
    collar: [16.4, 21.5] as P2, // photo:front: the collar's inner step and its outer face
    halfWidth: 4.2, tipHalfWidth: 0.8, // photo:front: at the collar and the nose's point
    // photo:timescape-wrist: the collar stands ~1.7 mm proud of the case front; the nose dips toward its point.
    top: -7.0, tipTop: -5.9,
    blend: 0.8, // photo:timescape-wrist: the fillet where the housing grows out of the flank
    // The triangular window in the nose: its point and its base, from the pivot, and the base's half-height.
    window: { from: 10.9, to: 14.6, halfHeight: 1.3 }, // photo:front
  },

  crownDiameter: 7.3, // photo:front: at the housing; the outer end tapers
  crownEndDiameter: 5.0, // photo:front
  crownLength: 3.6, // photo:front: from the housing's face to the crown's end
  crownFlutes: 16, // photo:front, monica-side

  dialPanels: {
    // The inner triangle of grille (mesh) under which the movement shows, and the three black arms from the pivot to
    // its corners that split it into three panels. Corners from the pivot, in mm.
    corners: [[-11.4, 0], [7.4, -13.0], [7.4, 13.0]] as P2[], // photo:front
    arm: { hub: 1.2, corner: 0.5 }, // photo:front: the arms' half-width at the pivot and at the corners
    hub: 1.6, // photo:front: the black disc round the pivot the arms meet in
    mesh: 0.72, // photo:front: pitch of the diamond grille
  },
  // spec: the H24655331's H-10 is a "three-hand movement" with no date (Hamilton,
  // https://www.hamiltonwatch.com/en-int/h24655331-ventura-xxl-auto.html), and photo:front shows only dark movement
  // behind the grille, no date figures. est: a band a little wider than the 2824-2's date ring (r 9.3–12.3), between
  // the grille (dialZ + 0.08) and the ring's face (dialZ + 0.22).
  dateShade: { inner: 9.1, outer: 12.5, depth: 0.15 },
  track: { inset: 0.35, length: 2.5, width: 0.28, fiveWidth: 0.38 }, // photo:front: ticks from the dial edge inward
  red: { from: 0.8, to: 15.5, gap: [3.8, 6.2] as P2 }, // photo:front: minutes the red hatch spans, and the gap at the 1 o'clock lance
  lance: { length: 6.2, width: 1.25 }, // photo:front: the applied lances at the triangle's corners
  lanceOuter: { nine: 17.4, corner: 18.4 }, // photo:front: the lances' outer points, from the pivot

  hour: 8.2, hourWidth: 1.5, hourTail: 1.6, // photo:front
  minute: 13.6, minuteWidth: 1.2, minuteTail: 2.0, // photo:front
  seconds: 11.1, secondsTail: 2.8, secondsRed: 3.7, secondsShaft: 0.22, // photo:front: the last 3.7 mm is red
  hubs: { hour: 0.9, minute: 0.75, seconds: 0.45 }, // photo:front
  handThickness: 0.16, // est

  caseback: {
    inset: 1.5, // photo:monica-back: the plate is the main tier's outline, stepped in from the wings
    thickness: 1.6, // spec: 11.25 overall less the case front to the seat
    window: 3.0, // photo:monica-back: frame width round the window
    crownSide: 14.5, // photo:monica-back: the frame is widest on the crown side, where the back's engraving sits
    notch: { x: 10.5, y: 1.0 }, // photo:monica-back: below this line the window's crown-side edge steps in to x
    glass: 1.2, recess: 0.2, // est
    screws: 3, screwRadius: 0.75, // photo:monica-back: one in each corner of the plate
  },

  strap: { width: 20.4, endWidth: 17.5, thickness: 3.6, endThickness: 2.6, length: 42, offsetX: -1.8, start: 12, straight: 10.6, wristRadius: 25 }, // photo:front: 530 px at the case, 16.3 mm 33 mm on; centred 1.8 mm toward 9; est: start, thickness, wristRadius
} as const;

// A traced pixel outline in watch millimetres (12 o'clock toward −Y), closed by its mirror image across the 3–9 line.
export function mirrored(trace: readonly P2[]): P2[] {
  const [px, py] = PHOTO.pivot;
  const top = trace.map(([x, y]): P2 => [(x - px) * PHOTO.mmPerPx, (y - py) * PHOTO.mmPerPx]);
  const onAxis = (p: P2) => Math.abs(p[1]) < 1e-9;
  const bottom = [...top].reverse().filter((p) => !onAxis(p)).map(([x, y]): P2 => [x, -y]);
  return [...top, ...bottom];
}
