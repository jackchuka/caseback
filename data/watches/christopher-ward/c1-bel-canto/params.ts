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
  bore: 16.4, // est: the seat for the 32 mm module (outerRadius 16), with clearance
  flangeTop: 17.4, // photo:front: the polished flange slopes out from the bore to here, just under the case front
  flangeFoot: 0.3, // est: the flange starts this far in front of the dial plate

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
