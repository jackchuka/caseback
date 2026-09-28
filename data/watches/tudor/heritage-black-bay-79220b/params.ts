// Every dimension of the 79220B in mm. Source tags: spec = published figure; photo:<shot> = measured on the compare
// page; est = estimated, to be calibrated against the photos.
export const T = {
  caseRadius: 20.5, // spec: 41 mm
  // spec: caseback to crystal apex. The model is deliberately thicker, ~14.5 mm: the movement model is deeper than a
  // real 2824 (rotor back at z 4.75), and with the crown centre at its measured depth, mid-flank as the photos show,
  // the extra depth has to go behind the crown, into a thick screw-down back that keeps the rotor inside.
  totalThickness: 13,
  caseFrontOffset: 3.1, // photo:crown-low: puts the crown centre 4.4 mm behind the case front
  caseHeight: 8.55, // photo:crown-low: case middle, front face to caseback seat; the crown spans most of it
  casebackThickness: 2.24, // deviation (see totalThickness): reaches back past the rotor
  casebackPlate: 0.08, // est: hidden; the pocket in front of it clears the rotor by 0.06 mm
  casebackPocketClearance: 0.5, // est: hidden; the pocket's radius over the movement's
  lugToLug: 50, // spec: 50 mm (aBlogtoWatch, Millenary)
  lugGap: 22, // spec: lug width
  lugWidth: 2.9, // photo:front: lug top at the tip, gap edge to outer edge (bobs-126699.jpg agrees)
  lugTipRound: 0.6, // photo:front: small rounding of the lug-tip corners
  lugFillet: 0.6, // photo:front: only the inner corner where the gap meets the drum, under the end link
  lugDrop: 1.8, // photo:crown-low: lug tip dip toward the wrist
  lugCurve: 1.6, // photo:crown-low: the dip starts at the bezel edge and steepens toward the tip
  lugHeel: 1.2, // photo:crown-low: the underside rounds up at the tip
  lugHeelRun: 4, // photo:crown-low
  bevel: 0.9, // photo:front: the polished band along the case edge is ~5 px wide
  backChamfer: 0.3, // est
  edge: 0.25, // est: softening of every crease; ~1.5 px in the front shot, too fine to measure, set to catch a highlight
  bore: 16.2, // est: inner radius of the case middle (movement seat)
  holeRadius: 0.55, // est: spring-bar hole
  holeInset: 1.7, // est: hole centre from lug tip
  holeDepth: 1.5, // est: blind hole, drilled from the inner face only

  bezelOuter: 20.5, // spec: same as the case
  bezelInner: 15.3, // photo:front: inner edge of the polished lip
  insertOuter: 19.95, // photo:front
  insertInner: 16.15, // photo:front
  insertDrop: 1.0, // photo:three-quarter: ~15° cone (insert band 27 px on the near side, 15 px on the far side)
  bezelHeight: 2.1, // photo:crown-low: at the inner edge; the coin-edge wall is lower by the insert's drop
  knurlCount: 230, // photo:front: 0.56 mm pitch on bobs-126699.jpg's 6 o'clock edge
  knurlDepth: 0.12, // est
  pipRadius: 0.67, // photo:front: lume pip on the 12 o'clock triangle
  pipAt: 18.6, // photo:front: pip centre from the watch centre, in the triangle's wide end

  crystalRadius: 15.25, // photo:front: just inside the bezel lip
  crystalWall: 0.4, // est: box wall above the bezel top, trimmed to keep the thickness with the taller bezel
  crystalDome: 1.2, // est: dome above the wall

  dialRadius: 15.2, // photo:front: dial edge inside the rehaut
  indexRing: 0.81, // photo:front: outer edge of every index's lume / dial radius
  dotRadius: 0.071, // photo:front: dot radius / dial radius
  barWidth: 0.092, barLength: 0.27, // photo:front: / dial radius
  triangle: { width: 0.18, height: 0.29 }, // photo:front: a long isosceles triangle, / dial radius
  surround: 0.16, // photo:front: polished rim around each index

  // Hands, measured on the front shot and on bobs-126699.jpg (same pose, 3× the resolution).
  hour: 0.625, minute: 0.92, seconds: 0.96, secondsTail: 0.3, // photo:front: / dial radius
  snowflake: 2.3, // photo:front: half-width of the hour hand's diamond plate (lume 3.7 mm across + frame)
  secondsPlate: 0.95, // photo:front: half-diagonal of the seconds hand's diamond plate
  hands: {
    snowflakeAt: 0.435, // photo:front: diamond centre / dial radius
    snowflakeLength: 1.95, // photo:front: half-diagonal of the diamond along the hand
    hourShaft: 0.73, hourTip: 0.72, // photo:front: half-widths; the lume runs up the shaft and into the tip
    minuteWidth: 1.45, // photo:front: a straight sword, lume 0.8 mm wide
    secondsShaft: 0.34, counterweight: 0.3, // photo:front
    secondsPlateAt: 0.62, // photo:front: / dial radius
    lumeFrom: 1.8, // photo:front: lume starts this far from the pivot
    frame: 0.3, // photo:front: steel rim around the lume
    ridge: 0.24, // est: frame height, rounded to a ridge; the photos show the bright outline, not the section
  },

  crownDiameter: 8, // photo:front: 8.1 mm across the flutes
  crownLength: 2.8, // photo:front: the crown ends 23.4 mm from the centre
  tubeDiameter: 4.2, // est: hidden behind the crown in every shot
  tubeLength: 0.5, // photo:front: a short dark neck between case and crown

  // photo:front — centerRatio: centre-piece width / total link width at mid-height, on the first link past the end
  // link. pitch: gap to gap, 146 px mean over five link gaps near the case on bobs-126699.jpg (flat and square on,
  // 0.058 mm/px from the bezel); the front shot's own link gaps are too blurred and uneven to read. endWidth: the
  // last visible row of the front shot is 109–118 px (18.5–20 mm) across. links: the front shot's bracelet runs
  // until it turns away under the watch, a quarter turn of the wrist curve, which 5 links reach.
  // est — chamfer, crown: the photo shows a bevel highlight along each edge and a brighter, domed centre piece, but
  // not their depth (sub-pixel); thickness, gap, wristRadius, centerRaise.
  bracelet: { endWidth: 19, pitch: 8.5, centerRatio: 0.55, thickness: 2.6, links: 5, gap: 0.15, wristRadius: 26, centerRaise: 0.15, chamfer: 0.3, crown: 0.12 },
  lume: '#f2eee2', // matches the movement lume the hands must use
  insertBlue: '#1b2a4a', // photo:front: matches only the hue of the insert's shaded areas (RGB 12, 18, 32), not their darkness
} as const;
