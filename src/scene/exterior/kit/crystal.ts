import type { ExteriorLayer } from '../contract';
import { crease, lathe } from './lathe';

// A sapphire of radius r: a spherical dome `dome` high whose edge meets a straight wall at `rim`, the wall running
// back to `foot`. With no dome it is a flat disc with a wall. Front is −Z.
export function crystal(o: { radius: number; rim: number; dome: number; foot: number; material?: string }): ExteriorLayer[] {
  const { radius: r, rim, dome: h } = o;
  let top: Array<[number, number]>;
  if (h > 0) {
    const R = (r * r + h * h) / (2 * h);
    const theta = Math.asin(r / R);
    top = Array.from({ length: 33 }, (_, i): [number, number] => {
      const a = (i / 32) * theta;
      return [R * Math.sin(a), rim - h + R * (1 - Math.cos(a))];
    });
  } else top = [[0, rim], ...crease([r, rim])];
  // A flat face must shade flat: the crease keeps the rim's wall from bending its normals into a dome.
  return [{ geometry: lathe([...top, [r, o.foot]]), material: o.material ?? 'crystal' }];
}
