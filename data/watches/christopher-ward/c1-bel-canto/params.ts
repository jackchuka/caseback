// Every dimension of the C1 Bel Canto in mm. Source tags: spec = published figure (Christopher Ward's specification
// table and handbook, aBlogtoWatch); photo:<shot> = measured on the reference photo (front: 0.02941 mm/px, the scale
// that makes the case 41 mm); est = estimated, hidden or too fine to measure. Heights hang off the movement's dial
// plate (m.dialZ); the dial faces −Z.
export const P = {
  caseRadius: 20.5, // spec: 41 mm; photo:front: the step between the sloped flank and the case band is the widest line
  lugToLug: 48, // spec: 48 mm
  lugGap: 22, // spec: 22 mm lugs (aBlogtoWatch)
  totalThickness: 13, // spec: 13 mm, crystal apex to caseback

  caseFrontToDial: 2.9, // est: the case middle's front face (the bezel seat) in front of the dial plate
  stepToDial: 0.7, // est: the polished step where the sloped flank meets the upright case band (oblique shots)
  caseBackToDial: 5.8, // est: the case middle's back face, where the caseback seats
  stepBevel: 0.25, // est: the polished line along the step
  backChamfer: 0.4, // est
  edge: 0.15, // est
  // photo:front: past the gong's outer wire the blue plate ends at 17.45; a step rises from there to 18.05 (the
  // dial's), and a steeper polished wall from 18.05 to 18.55 (the case's) meets the bezel.
  bore: 18.05, // photo:front: where the case's flange takes over from the dial's step; clears the 35 mm module
  flangeTop: 18.55, // photo:front: the polished flange's outer edge, just under the case front
  flangeFoot: 0.6, // est: the dial's step rises this far in front of the plate, where the case's flange starts

  // The dial is the FS01's module plate (photo:front): blue sunray, with the strike parts standing on its face and
  // openings only where the mechanism below must show. Its print: the wave (chiming) and the flat line (silent) by the
  // red indicator.
  dialRadius: 17.45, // photo:front: the blue plate's edge, 0.34 mm outside the gong's outer wire
  dialThickness: 0.25, // est
  centreHole: 0.6, // est: round the minute arbor
  // photo:front: the keyhole below the centre, a rounded trapezoid from just under the centre wheel (1.95 mm, 2.1
  // across) to 7.8 mm (3.9 across); est: the window onto the snail it must hold, radius r round (x, y).
  keyhole: { x: 0, y: 3.6, r: 1.2, top: 1.95, topHalf: 1.05, bottom: 7.8, bottomHalf: 1.95, corner: 0.45 },
  dialColor: '#1b5286', // photo:front: the plate's mid blue between its sunray's light (0d6ba1) and dark (0a2645)
  printColor: '#6aa6c8', // photo:front: the pale blue of the wave and line
  // photo:front: the wave, a zigzag of 4 turns 0.7 either side of its axis; the line, a curve through three points;
  // both 0.15 wide. The arrow points 8° short of each mark's middle, the wave's below and the line's above.
  marks: { wave: { from: [10.75, 4.6], to: [11.15, 6.95], amp: 0.7, turns: 4 }, line: [[11.1, 7.25], [10.9, 8.8], [10.05, 10.15]], width: 0.15 },
  ringColor: '#d4d7da', // photo:front: the ring's brushed silver

  // photo:front: the floating chapter ring, fitted as a circle round the sub-dial's arbor: 8.45 mm out, open inside
  // 5.85; est: its height, floated between the sub-dial bridge and the hour hand.
  ring: { outer: 8.45, inner: 5.85, bevel: 0.15, back: -1.37, thickness: 0.17 },
  // photo:front: baton indexes 0.85 mm wide from 5.9 to 8.2 mm, doubled at 12 (bars 0.8 wide, 0.28 apart);
  // est: raised 0.08 over the ring, a lume strip 0.3 wide in each.
  index: { from: 5.9, to: 8.2, width: 0.85, pairWidth: 0.8, pairGap: 0.28, height: 0.08, lume: 0.3 },
  ticks: { from: 6.35, to: 6.8, width: 0.07 }, // photo:front: the minute track's dashes

  // photo:front: skeleton batons, hour to 5.6 mm and 0.8 wide, minute to 7.9 mm and 0.65 wide; est: frame, tail, hub.
  hands: { hour: 5.6, minute: 7.9, hourWidth: 0.8, minuteWidth: 0.65, shaft: 0.35, lumeFrom: 1.3, frame: 0.12, tail: 0.9, thickness: 0.12, hub: 0.55 },

  // photo:front: the lug's outer edge leaves the drum at |y| = 12 and converges on 13.5 mm at the tip as
  // ((tip − y) / run)^1.78, until |y| = 22.3; from there the tip curves in through the measured (x, |y|) points to
  // the lug's inner edge at the lug-to-lug length.
  lugLeave: 12, // photo:front
  lugTip: 13.5, // photo:front
  lugPower: 1.78, // photo:front
  lugTipFrom: 22.3, // photo:front
  lugTipOutline: [[12.98, 22.65], [11.88, 23.24]], // photo:front
  lugFillet: 0.4, // est: where the lugs grow out of the case band
  lugDrop: 3.4, // est: the lug top falls this far from the step to the tip (oblique shots: long, downturned)
  lugCurve: 1.5, // est
  lugTwist: 0.35, // est: rad the lug top rolls outward-down by the tip
  lugChamfer: 0.55, // est: the polished chamfer along the lug's top edges
  lugHeel: 0.6, // est: the underside lifts toward the tip
  lugHeelRun: 4, // est
  holeRadius: 0.5, // est: spring-bar hole
  holeInset: 2.0, // est: the tip is cut back, so the hole sits further in than usual
  holeDepth: 1.05, // est

  bezelOuter: 19.3, // photo:front: the polished ring's outer edge; the brushed flank shows outside it
  bezelInner: 18.6, // photo:front
  bezelProud: 0.2, // est: the crystal's rim stands this far in front of the bezel top

  crystalRadius: 18.5, // photo:front: just inside the bezel ring
  domeHeight: 1.6, // est: domed sapphire, height not published

  crown: { angle: -25.3, diameter: 6.5, length: 2.6, neck: 0.2, flutes: 20 }, // photo:front: axis 25.3° above 3 o'clock (its outline centred on the overlay), 6.5 across, ending 23.3 mm out; photo:front, caseback: 20 block flutes; est: neck
  // photo:front: 25° below 3 o'clock (the caliber's pusher position), a block 6.9 mm across ending 22.35 mm out, its
  // polished faceted tip starting at 21.55 and narrowing to a 5.1 mm end face; est: height, how deep it sits in the
  // case band, travel.
  pusher: { width: 6.9, height: 2.6, inner: 19.8, tipFrom: 21.55, end: 22.35, endWidth: 5.1, endHeight: 1.6, travel: 0.5 },
  // photo:caseback-viola: a raised plate with a bevelled edge on a flange held by four screws at 1:30, 4:30, 7:30 and
  // 10:30 (angles from 3 o'clock toward 6); est: sizes.
  caseback: { thickness: 2.0, flange: 19.6, flangeThickness: 0.7, bevelFrom: 17.9, plate: 16.9, pocket: 13.4, screwAt: 18.75, screwRadius: 0.75, screws: [-135, -45, 45, 135] },

  strap: { tuck: 1.2, straight: 1.5, width: 21.6, endWidth: 20, thickness: 3.4, endThickness: 2.4, length: 42, wristRadius: 27, stitchInset: 1.4, stitchFromEnd: 5 }, // spec: 22 mm lugs; est: taper, thickness, wrist
  strapColor: '#243044', // photo:oblique-left: navy leather
  stitchColor: '#2f567c', // photo:oblique-left
  liningColor: '#1d2129', // est
} as const;
