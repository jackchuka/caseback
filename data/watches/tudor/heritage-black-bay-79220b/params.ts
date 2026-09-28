// Every dimension of the 79220B in mm. Source tags: spec = published figure; photo:<shot> = measured on the compare
// page; est = estimated, to be calibrated against the photos.
export const T = {
  caseRadius: 20.5, // spec: 41 mm
  totalThickness: 13, // spec: caseback to crystal apex
  caseHeight: 8.2, // est: case middle, front face to caseback seat
  lugToLug: 50, // est: reviews quote ~50 mm; photo:front
  lugGap: 22, // spec: lug width
  lugWidth: 2.6, // est: photo:front
  lugTipRound: 0.6, // est
  lugFillet: 2.2, // est: concave blend lug → case, photo:front
  lugDrop: 1.4, // est: lug tip dip toward the wrist, photo:three-quarter
  lugDropRun: 5, // est: length over which the lug dips
  bevel: 0.9, // est: polished top-edge bevel, photo:crown-low
  backChamfer: 0.3, // est
  edge: 0.25, // softening of every crease
  bore: 16.2, // est: inner radius of the case middle (movement seat)
  holeRadius: 0.55, // est: spring-bar hole
  holeInset: 1.7, // est: hole centre from lug tip

  bezelOuter: 20.5, // spec: same as the case
  bezelInner: 16.3, // est: inner lip, photo:front
  insertOuter: 19.95, // est: photo:front
  insertInner: 16.75, // est: photo:front
  bezelHeight: 1.7, // est: photo:crown-low
  knurlCount: 120, // est: photo:crown-low
  knurlDepth: 0.12, // est
  pipRadius: 0.55, // est: lume pip on the 12 o'clock triangle

  crystalRadius: 16.25, // est: just inside the bezel lip
  crystalWall: 0.6, // est: box wall above the bezel top, photo:crown-low
  crystalDome: 1.4, // est: photo:crown-low

  dialRadius: 15.2, // est: photo:front
  indexRing: 0.8, // est: index centres as a fraction of the dial radius, photo:front
  dotRadius: 0.085, // est: dot radius / dial radius
  barWidth: 0.1, barLength: 0.27, // est: / dial radius
  triangle: 0.14, // est: / dial radius
  surround: 0.16, // est: polished rim around each index

  hour: 0.62, minute: 0.9, seconds: 0.94, secondsTail: 0.26, // est: / dial radius, photo:front
  snowflake: 1.55, // est: half-diagonal of the hour hand's lume plate
  secondsPlate: 0.5, // est: half-side of the seconds hand's square plate

  crownDiameter: 8, // est: big crown, photo:front
  crownLength: 4, // est
  tubeDiameter: 4.2, // est: photo:three-quarter
  tubeLength: 1.1, // est

  bracelet: { endWidth: 18, pitch: 6.5, centerRatio: 0.42, thickness: 2.6, links: 6, gap: 0.15, wristRadius: 26, centerRaise: 0.15 }, // est: photo:front
  lume: '#f2eee2', // matches the movement lume the hands must use
  insertBlue: '#1b2a4a', // est: midnight blue, photo:front
} as const;
