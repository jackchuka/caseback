// Every dimension of the H70455553 in mm. Source tags: spec = published figure; photo:<shot> = measured on the
// reference photo or the compare page; est = estimated, to be calibrated against the photos.
export const H = {
  caseRadius: 19, // spec: 38 mm (Hamilton)
  totalThickness: 11, // spec: 11 mm (Hamilton); Gnomon 10.8, HiConsumption 11.5
  caseFrontOffset: 2.1, // est: case front (bezel seat) this far in front of the movement front; keeps the crown on the flank
  caseHeight: 8.3, // est: case middle, front face to caseback seat; the rest of the 11 mm is bezel, crystal and back
  lugToLug: 46.6, // photo:front: tips at 22.3 / 23.2 mm on a slightly tilted photo; Hamilton quotes 47, reviews 45.5–47
  lugGap: 20, // spec: lug width
  lugTip: 12.3, // photo:front: outer edge of the lug at its tip, from the centre line
  lugLeave: 9.5, // photo:front: where the lug's outer edge leaves the drum, from the centre line
  lugPower: 1.6, // photo:front: the outer edge converges on the tip as ((tip − y) / run)^p
  lugTipRound: 0.5, // photo:front
  lugFillet: 0.5, // est: inner corner where the gap meets the drum, under the strap
  lugDrop: 1.3, // photo:gnomon-6: lug tip dip toward the wrist
  lugCurve: 1.6, // est
  lugHeel: 0.8, // photo:gnomon-5: the underside lifts toward the tip
  lugHeelRun: 4, // est
  bevel: 0.45, // photo:gnomon-6: narrow polished bevel between the brushed top and the brushed flank
  backChamfer: 0.4, // est
  edge: 0.2, // est
  bore: 15, // photo:front: the movement seat, flush with the bezel's inner lip
  holeRadius: 0.5, // est: spring-bar hole
  holeInset: 1.4, // est
  holeDepth: 1.3, // est

  bezelOuter: 18.1, // photo:front: outer edge of the polished bezel; the brushed case top shows outside it
  bezelInner: 15, // photo:front: inner edge of the dark lip chamfer
  bezelChamfer: 15.6, // photo:front: where the lip chamfer meets the wide slope
  bezelHeight: 0.9, // est: inner lip above the case front
  bezelDrop: 0.65, // photo:gnomon-4: the slope falls most of the bezel height toward the case edge

  crystalRadius: 14.95, // photo:front: just inside the bezel lip
  crystalProud: 0.1, // est
  crystalDome: 0.3, // photo:gnomon-4: shallow; HiConsumption calls it "double-curved" but gives no rise
  crystalThickness: 1.2, // est

  dialRadius: 14.3, // est: runs under the flange; visible to 14.1
  flangeInner: 14.1, // photo:front
  lumeDotAt: 13.8, lumeDot: 0.2, // photo:front: dot centre radius and radius
  trackInner: 12.3, hourInner: 8.5, // photo:front: dial zone boundaries
  tickOuter: 13.95, longTickFrom: 12.45, shortTickFrom: 13.35, // photo:front, gnomon-2: minute ticks run across the track, fifths on its outer half
  hourNumeralAt: 10.4, hourNumeral: 2.4, // photo:front: numeral centre radius and height
  dayNumeralAt: 7.3, dayNumeral: 0.95, // photo:front: 13–24 numerals
  minuteNumeralAt: 12.75, minuteNumeral: 0.75, // photo:front: 5–60 numerals inside the ticks
  dateFrame: 0.6, // photo:front: polished frame around the date window (outer 3.6 × 3.0 mm)
  dateFrameHeight: 0.15, // est: low enough to clear the hour hand sweeping over it at 3 o'clock

  hour: 9.4, hourLume: [1.9, 7.5], hourWidth: 1.25, // photo:front
  minute: 13.4, minuteLume: [2.0, 10.8], minuteWidth: 1.0, // photo:front
  needle: 0.22, // photo:front: width of the steel tip past the lume
  seconds: 12.9, secondsTail: 3.4, secondsShaft: 0.22, arrow: [1.0, 0.7], // photo:front: arrow length, width
  handFrame: 0.16, // photo:front: steel rim around the lume
  hourShaft: 0.3, minuteShaft: 0.26, // photo:front: half-widths where the lume starts
  hubs: { hour: 0.95, minute: 0.8, seconds: 0.5 }, // photo:front: hour cap 0.95; the others sit under it, est
  handThickness: 0.14, // est

  crownDiameter: 6.6, // spec: 6.6 mm (HiConsumption); 6.8 on the front photo
  crownLength: 3.8, // photo:front: the crown ends 4.1 mm past the case; the knurl starts right at the case
  neckLength: 0.3, // photo:front: hidden behind the crown
  neckDiameter: 3.6, // est

  casebackThickness: 1.4, // est: metal ring, from the case back to its outer face
  casebackRadius: 17.2, // photo:gnomon-8
  casebackWindow: 13.6, // photo:gnomon-8: glass aperture; the whole rotor shows
  casebackNotch: { count: 6, width: 1.4, depth: 0.6 }, // photo:gnomon-8
  casebackGlass: 0.8, // est

  strap: { tuck: 1.2, straight: 1.5, width: 19.6, endWidth: 18, thickness: 3.2, endThickness: 2.2, length: 40, wristRadius: 26, stitchInset: 1.4, stitchFromEnd: 5 }, // spec: 20 → 18 mm; photo:front: stitching crosses 2.4 mm past the lug tips; est: tuck (strap end past the spring bar), straight (run before the wrist bend), wristRadius
  strapColor: '#5b2d1d', // photo:front
  stitchColor: '#d9ccb0', // photo:front
  liningColor: '#e6dcc8', // photo:gnomon-5
  lume: '#f2eee2', // matches the movement lume the hands must use
} as const;
