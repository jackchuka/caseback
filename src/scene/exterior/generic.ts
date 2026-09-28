import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { ExteriorBuilder } from './contract';
import { caseback } from './kit/caseback';
import { lathe } from './kit/lathe';

// The plain case a caliber page shows when no watch is chosen: a turned ring, four lugs and a crown.
export const genericCase: ExteriorBuilder = ({ movement: m }) => {
  const r = m.diameterMm / 2;
  const inner = r + 0.35, outer = r + 3.5, height = 7.8;
  const bottom = m.frontZ, top = bottom + height;
  const ring = lathe([[inner, bottom], [outer - 1.1, bottom], [outer - 0.2, bottom + 1.2], [outer, bottom + 4.3], [outer - 0.5, top - 0.4], [outer - 1.0, top], [inner, top]], 160);
  const lugs = [-1, 1].flatMap((sx) =>
    [-1, 1].map((sy) => ({ geometry: new RoundedBoxGeometry(2.8, 7.5, 3.2, 6, 1.1).rotateZ(sx * sy * -0.12).translate(sx * r * 0.52, sy * (r + 4.2), 0.5), material: 'case' })),
  );
  const metal = () => new THREE.MeshPhysicalMaterial({ color: 0xc8cbd0, metalness: 1, roughness: 0.3, clearcoat: 0.15, clearcoatRoughness: 0.3 });
  return {
    parts: {
      case: [{ geometry: ring, material: 'case' }, ...lugs],
      bezel: [],
      dial: [],
      crystal: [],
      strap: [],
      caseback: caseback(outer, false, top + 0.6),
      crown: [{ geometry: new THREE.CylinderGeometry(1.25, 1.25, 2.0, 48), material: 'case' }],
      hands: { hour: [], minute: [], seconds: [] },
    },
    materials: { case: metal, 'caseback-metal': metal },
    anchors: { seatRadius: inner, crownX: r + 4.3 },
  };
};
