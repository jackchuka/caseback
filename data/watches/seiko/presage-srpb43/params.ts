// Every dimension of the SRPB43 in mm. Source tags: spec = published figure; photo:<shot> = measured on the compare
// page or the reference photo; est = estimated. Heights are measured on the side photo (seikousa-2.png at 0.0395
// mm/px, the scale that gives the case its published 40.5 mm) and hang off the movement's stem axis, which the crown
// centre must sit on; the caseback takes whatever the published 11.8 mm leaves.
export const P = {
  caseRadius: 20.25, // spec: 40.5 mm (Seiko USA, aBlogtoWatch)
  totalThickness: 11.8, // spec: crystal apex to caseback (aBlogtoWatch, Long Island Watch)
  lugToLug: 47.5, // spec: aBlogtoWatch
  lugGap: 20, // spec: lug width
  crystalTopToStem: 6.5, // photo:side: crown centre 165 px below the crystal's silhouette top at 0.0395 mm/px
  caseFrontBelowTop: 4.92, // photo:side: the case middle's front face (under the bezel) 40 px above the crown centre
  caseHeight: 4.35, // photo:side: case middle, front face to caseback seat (110 px)
  lugWidth: 2.7, // photo:three-quarter: lug top at the tip, gap edge to outer edge
  lugTipRound: 0.5, // photo:front
  lugFillet: 0.5, // est
  lugDrop: 4.5, // photo:side: the lug top falls 115 px from the case front to the tip, the Presage's downturned lug
  lugCurve: 1.2, // photo:side: fitted to the top edge at 46 %, 70 % and 94 % of the lug's run
  lugBelow: 2.4, // photo:side: the lug's underside runs 60 px on below the case middle, level with the caseback at the tip
  lugBelowCurve: 0.8, // photo:side: fitted like lugCurve
  bevel: 0.7, // photo:front: the polished chamfer along the case and lug top edge
  backChamfer: 0.3, // est
  edge: 0.2, // est
  bore: 17.6, // est: the case middle's inner radius, just clear of the dial
  holeInset: 1.3, // est: hole centre from lug tip

  bezelOuter: 19.8, // photo:side: 981 px across its lower band
  bezelInner: 18.4, // photo:front: the box crystal's wall sits on it
  bezelHeight: 2.55, // photo:side: 65 px from the case front to the bezel top, under the crystal wall
  bezelRound: 0.9, // photo:side: the bezel's outer shoulder is a broad radius, not an edge

  crystalRadius: 18.3, // photo:front: the dark ring of the box wall
  crystalDome: 0.35, // est: the top reads flat in the side photo; a slight dome for the reflection
  crystalShoulder: 1.1, // photo:side: radius of the box's top edge

  dialRadius: 17.4, // photo:front: the dial edge inside the crystal wall
  trackOuter: 0.985, trackInner: 0.935, // photo:front: printed minute track band / dial radius
  index: { outer: 0.9, length: 0.27, width: 1.45, height: 0.28 }, // photo:front: faceted daggers; outer end / dial radius, length / dial radius
  index3: 0.12, // photo:three-quarter: the 3 o'clock dagger is cut short outside the date window (length / dial radius)
  windowFrame: 0.3, // photo:three-quarter: polished frame around the date window

  // Hands, / dial radius unless noted.
  hour: 0.6, minute: 0.93, seconds: 0.97, secondsTail: 0.24, // photo:front
  hourWidth: 1.5, minuteWidth: 1.2, // photo:front: widest point, mm
  handRidge: 0.2, // est: height of the dauphine's centre ridge above its edges
  lozenge: { at: 0.16, along: 1.0, across: 0.55 }, // photo:three-quarter: the seconds hand's blue lozenge counterweight

  crownDiameter: 5.6, // photo:side: over the scallops
  crownLength: 3.0, // photo:three-quarter
  crownFlutes: 18, // photo:side: coarse scallops
  tubeDiameter: 2.6, // est
  tubeLength: 0.8, // photo:three-quarter

  casebackThickness: 2.53, // spec − photo: the rest of the 11.8 mm behind the case middle (photo: 60 px)
  glassThickness: 0.45, // est

  strap: { startWidth: 20, endWidth: 18, thickness: 3.0, endThickness: 2.3, straight: 5, wristRadius: 24, arc: 1.3, pad: 0.9, stitchInset: 1.1 }, // photo:front/side; est for thickness and wrist
  dialColor: '#c4d6e9', // photo:front: pale icy blue
} as const;
