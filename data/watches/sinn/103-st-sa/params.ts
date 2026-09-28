// Every dimension of the 103 St Sa in mm. Source tags: spec = published figure; photo:<shot> = measured on the
// reference photo (front: Sinn's catalogue shot at 0.0734 mm/px, the scale that makes the bezel 41 mm; side: Sinn's
// crown-side shot at 0.0657 mm/px, the same bezel); est = estimated, hidden or too fine to measure. Heights hang off
// the movement's stem axis, which the crown centre must sit on.
export const P = {
  bezelRadius: 20.5, // spec: 41 mm (Sinn, Worn & Wound) — the coin-edged bezel is the widest part of the case
  totalThickness: 17, // spec: 17 mm (aBlogtoWatch)
  crystalTopToStem: 8.9, // photo:side: the dome's apex 9.3 mm above the crown centre, less the 0.6 mm the camera's tilt adds
  bezelTopToStem: 6.3, // photo:side: the bezel's top edge nearest the camera
  caseFrontToStem: 3.75, // photo:side: the case middle's front face, under the bezel
  caseBackFromStem: 4.0, // photo:side: the case middle's back face, where the caseback's ring meets it
  casebackThickness: 3.8, // photo:side: the display back's ring stands 3.8 mm; its glass bulges the rest of the 17 mm

  caseRadius: 20.0, // est: the drum under the 41 mm bezel, which overhangs it a little
  lugToLug: 47, // spec: 47 mm (Worn & Wound); photo:front 46.8
  lugGap: 20, // spec: lug width
  // photo:front: the lug's outer edge runs straight from (15.05, 14.07) at the bezel to (13.15, 21.7), where the tip is
  // cut back on a long diagonal to the inner edge at the lug-to-lug length
  lugOuter: { root: [15.05, 14.07], end: [13.15, 21.7] },
  lugBevel: 0.9, // photo:front: the dark polished chamfer along the lug's outer top edge
  lugTopAtRoot: 3.2, // photo:side: the lug top leaves the case 3.2 mm in front of the crown centre…
  lugTopAtTip: 1.9, // photo:side: …and falls to 1.9 mm behind it at the tip face
  lugUnder: 4.7, // photo:side: the lug's underside at the tip, 4.7 mm behind the crown centre
  holeInset: 1.4, // est
  edge: 0.2, // est
  backChamfer: 0.4, // est
  bore: 16.0, // est: movement seat inside the case middle

  // Crown guards at 3 o'clock: two pads either side of the crown (photo:front), out to 21.35 mm for 2.6 < |y| < 4.7,
  // falling back into the drum by |y| = 5.8.
  guard: { outer: 21.35, notch: 2.6, flat: 4.7, foot: 5.8, blend: 0.6 },

  bezelOuter: 20.5, // photo:front
  bezelHeight: 2.55, // photo:side: case front to bezel top
  insertInner: 16.45, // photo:front: black insert band
  insertOuter: 19.65, // photo:front
  knurlCount: 120, // photo:side: the coin edge, about one tooth per mm of rim
  knurlDepth: 0.18, // photo:front
  innerRing: 15.6, // photo:front: the bright polished lip between insert and crystal
  bezelLipDrop: 0.6, // est: the lip slopes down from the insert to the crystal's seat

  crystalRadius: 15.55, // photo:front
  dialRadius: 15.5, // photo:front: dial edge under the lip

  // Dial, from the front photo.
  numeral: { radius: 11.4, height: 2.45 }, // photo:front: 1 2 4 5 7 8 10 11
  marker: { radius: 14.0, length: 1.2, width: 0.9 }, // photo:front: lume blocks at every hour
  minuteTick: { outer: 15.0, inner: 14.1, width: 0.22 }, // photo:front
  // photo:front: the sub-dials sit on the movement's small seconds and counter arbors, 8.2 mm out at 9, 12 and 6
  subdials: [{ id: 'seconds-hand', x: -8.2, y: 0 }, { id: 'minute-counter-hand', x: 0, y: -8.2 }, { id: 'hour-counter-hand', x: 0, y: 8.2 }],
  subdial: { outer: 4.2, tickLength: 0.6, numeral: 2.75, numeralHeight: 0.95 }, // photo:front
  // photo:front: the white frame around the day and date openings at 3 o'clock
  window: { day: [5.0, 8.6], date: [9.1, 12.2], halfHeight: 0.95, frame: 0.22 },

  // Hands, from the front photo; lengths from the pivot.
  hands: {
    hour: { blade: [1.9, 7.3], tip: 10.3, width: 1.25 }, // photo:front: a lume blade and a thin tip on to the numerals
    minute: { blade: [1.9, 10.6], tip: 14.4, width: 1.1 }, // photo:front
    chrono: { length: 13.8, tail: 3.6, width: 0.3, arrow: 1.4 }, // photo:front: thin white with an arrowhead near its tip
    sub: { length: 3.6, tail: 0.9, width: 0.22 }, // photo:front: the three sub-dial hands
    hub: 1.0, // photo:front
    thickness: 0.12, // est
  },

  crownDiameter: 5.8, // photo:front: 5.7 across the flutes (Worn & Wound: 6 mm)
  crownLength: 3.58, // photo:front: 20.4 to 24.0 mm from the centre, then its domed end to 24.45
  crownDome: 0.45, // photo:front
  tubeDiameter: 3.0, // est

  // Pushers at 2 and 4: a fluted collar centred 21.5 mm out and a smooth, rounded button ending at 24.2 (photo:front;
  // its heights on photo:side).
  pusher: { seat: 19.9, collarDiameter: 4.2, collarLength: 2.6, buttonDiameter: 2.6, buttonLength: 1.15, tubeDiameter: 2.2, travel: 0.6 },

  strap: { startWidth: 20, endWidth: 18, thickness: 3.2, endThickness: 2.6, straight: 6, wristRadius: 24, arc: 1.25, pad: 0.85, stitchInset: 1.2 }, // photo:front; est for thickness and wrist
  lume: '#e9e6d6', // photo:front: cream lume on markers and hands
  print: '#f1f1ee', // photo:front: the white print
} as const;
