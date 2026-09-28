// Wide cases hold the movement in a casing ring; without it you would see through the gap to the case wall.
export function casingRing(movementRadius: number, inner: number): { rIn: number; rOut: number } | null {
  return inner - movementRadius > 0.5 ? { rIn: movementRadius + 0.05, rOut: inner } : null;
}

export function stemExtension(stemEnd: number, crownX: number, crownLength: number): { from: number; to: number } {
  return { from: stemEnd, to: Math.max(stemEnd, crownX - crownLength / 2) };
}

// The casing ring fills the gap between a small movement and the case wall over the movement's whole depth.
export function casingSpan(f: { plateFrontZ: number; rotorBackZ: number }) {
  return { from: f.plateFrontZ, to: f.rotorBackZ };
}
