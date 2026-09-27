import type { Caliber, Part, Shape } from './schema';

export function focusKey(part: Part): string {
  return part.arbor ?? part.id;
}

export function toothCount(shape: Shape): number | null {
  switch (shape.kind) {
    case 'wheel':
    case 'barrel':
    case 'ratchet':
    case 'escape-wheel':
      return shape.teeth;
    case 'pinion':
      return shape.leaves;
    default:
      return null;
  }
}

export function validateCaliber(c: Caliber): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const p of c.parts) {
    if (ids.has(p.id)) errors.push(`duplicate part id: ${p.id}`);
    ids.add(p.id);
  }
  const byId = new Map(c.parts.map((p) => [p.id, p]));
  const keys = new Set(c.parts.map(focusKey));
  const sources = new Set(c.sources.map((s) => s.id));
  const ref = (where: string, id: string) => {
    if (!byId.has(id)) errors.push(`${where}: unknown part ${id}`);
  };

  for (const cp of c.couplings) {
    if (cp.type === 'mesh') {
      ref('mesh', cp.a);
      ref('mesh', cp.b);
      for (const id of [cp.a, cp.b]) {
        const p = byId.get(id);
        if (p && toothCount(p.shape) === null) errors.push(`mesh: ${id} has no teeth`);
      }
    } else {
      ref('escapement', cp.balance);
      ref('escapement', cp.fork);
      ref('escapement', cp.escapeWheel);
    }
  }
  if (c.couplings.filter((x) => x.type === 'escapement').length !== 1) {
    errors.push('exactly one escapement coupling required');
  }

  const chapters = new Set(c.chapters.map((ch) => ch.id));
  for (const s of c.tour) {
    if (!chapters.has(s.chapter)) errors.push(`tour ${s.id}: unknown chapter ${s.chapter}`);
    if (s.focus !== null && !keys.has(s.focus)) errors.push(`tour ${s.id}: unknown focus ${s.focus}`);
  }
  for (const ch of c.chapters) {
    for (const node of ch.flow) if (!keys.has(node)) errors.push(`chapter ${ch.id}: unknown flow node ${node}`);
  }
  for (const p of c.parts) {
    for (const s of p.provenance.sourceIds) if (!sources.has(s)) errors.push(`part ${p.id}: unknown source ${s}`);
  }
  for (const s of c.specs.sourceIds) if (!sources.has(s)) errors.push(`specs: unknown source ${s}`);
  return errors;
}
