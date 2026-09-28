// Every dimension of the 556 I in mm. Source tags: spec = published figure; photo:<shot> = measured on the reference
// photo or the compare page; est = estimated, hidden or too fine to measure.
export const S = {
  caseRadius: 19.25, // spec: 38.5 mm
  totalThickness: 11, // spec: bezel top to caseback
  bezelTopOffset: 3.1, // est: bezel top this far in front of the movement front, so the flat crystal clears the hands and the back the rotor within the 11 mm
  bezelHeight: 1.2, // photo:crown: the bezel's outer wall stands a little over a millimetre above the case
  casebackThickness: 1.5, // est: the display back's ring stands this far behind the case middle
  casebackGlass: 1.0, // est
  casebackRecess: 0.1, // est
  casebackPocketClearance: 0.5, // est: the pocket's radius over the movement's
  lugToLug: 45.7, // spec: 45.7 mm (Worn & Wound)
  lugGap: 20, // spec: lug width
  // photo:front: the lug's outer edge is a concave arc, fitted to seven points from the tip to y = 13.5 (residual under
  // 0.04 mm); it leaves the drum about y = 9.5, below which the outline is the drum's.
  lugArc: { x: 39.79, y: 26.32, r: 28.35 },
  lugFrom: 9.5,
  lugBlend: 0.5, // photo:front: softens the step where the arc meets the drum without bulging past it
  lugTipRound: 0.4, // photo:front
  lugDrop: 1.5, // photo:three-quarter: the lug top falls toward the wrist from the bezel edge
  lugCurve: 1.5, // est
  lugHeel: 1.0, // est
  lugHeelRun: 3.5, // est
  bevel: 0.35, // photo:front: the thin bright line along the lug edges
  backChamfer: 0.4, // est
  edge: 0.25, // est: softening of every crease
  bore: 14.5, // est: movement seat, inside the case middle
  holeRadius: 0.5, // est: drilled spring-bar hole, through the lug
  holeInset: 1.4, // est: hole centre from lug tip

  guard: { outer: 20.9, notch: 3.3, flat: 4.2, foot: 6.6, blend: 0.8 }, // photo:front: pads out to 20.9 mm for 3.3 < |y| < 4.2, their ends sloping back into the drum by |y| = 6.6

  bezelOuter: 19.25, // photo:front: flush with the drum at 9 o'clock
  bezelFlat: 17.8, // photo:front: inner edge of the flat brushed top
  bezelLip: 16.4, // photo:front: foot of the inner chamfer, by the crystal
  bezelEdge: 0.2, // photo:front: the dark line of the rounded outer edge
  crystalRadius: 16.1, // photo:front: bright ring at 15.9–16.3 mm
  crystalDrop: 1.0, // photo:crown: the flat crystal sits well below the bezel top, at the foot of a steep chamfer

  dialRadius: 15.2, // photo:front: dial visible inside the flange
  indexOuter: 15.0, // photo:front: bars and ticks all end here
  hourBar: { width: 0.95, inner: 11.2 }, // photo:front
  minuteTick: { width: 0.4, inner: 13.8 }, // photo:front
  threeBarInner: 12.3, // photo:front: the 3 o'clock bar stops short of the date window

  // Hands, from the front shot and the dial macro. Lengths from the pivot.
  hands: {
    hour: 8.1, hourBase: 3.3, hourWidth: 1.7, hourPoint: 1.6, // photo:front
    minute: 12.9, minuteBase: 4.5, minuteWidth: 1.4, minutePoint: 2.0, // photo:front
    stem: 0.8, // photo:macro: the black rod between hub and lume
    seconds: 13.9, secondsWidth: 0.3, secondsWhiteFrom: 1.2, tail: 2.6, tailWidth: 0.5, // photo:front
    hub: 1.0, thickness: 0.12, // photo:front: black cap; est
  },

  crownDiameter: 6, // spec: 6 x 5.5 mm
  crownLength: 3.7, // photo:front: 4.5 mm from the notch floor at 19.55 mm to the dome's apex at 24.06 mm, less the dome
  crownDome: 0.8, // photo:front: the end rounds back 0.96 mm by 2 mm off the axis
  tubeDiameter: 3.4, // est: hidden between the guards
  tubeLength: 0.3, // photo:front

  // photo:life2 (the bracelet lying flat, 0.096 mm/px from the case) — H-link: rails the full pitch, a crossbar
  // `bar` long at the far end of each H, and a flush centre link filling the opening; pitch 10.3 (centre link to
  // centre link), centre link 51% of the width and 7.5 long. The studio front shot foreshortens the bracelet as it
  // curves away, so it can't give the pitch. est — thickness, gap, wristRadius, chamfer, crown, links (until it turns
  // under the watch).
  bracelet: { endWidth: 18, pitch: 10.3, centerRatio: 0.51, bar: 2.4, thickness: 3.0, links: 4, gap: 0.2, wristRadius: 24, centerRaise: 0, chamfer: 0.25, crown: 0.05 },
  lume: '#f2eee2', // matches the movement lume the hands use
} as const;
