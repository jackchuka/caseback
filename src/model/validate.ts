import type { Caliber, Part, Shape } from './schema';

export function arborKey(part: Part): string {
  return part.arbor ?? part.id;
}

export function focusKey(part: Part): string {
  return part.focus ?? part.arbor ?? part.id;
}

export function toothCount(shape: Shape): number | null {
  switch (shape.kind) {
    case 'wheel':
    case 'barrel':
    case 'ratchet':
    case 'escape-wheel':
    case 'date-driver':
    case 'date-ring':
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
    } else if (cp.type === 'slip') {
      ref('slip', cp.a);
      ref('slip', cp.b);
    } else if (cp.type === 'keyless') {
      for (const id of [cp.stem, cp.slidingPinion, cp.windingPinion, cp.settingWheel]) ref('keyless', id);
    } else if (cp.type === 'one-way') {
      ref('one-way', cp.input);
      ref('one-way', cp.output);
      for (const id of [cp.input, cp.output]) {
        const p = byId.get(id);
        if (p && toothCount(p.shape) === null) errors.push(`one-way: ${id} has no teeth`);
      }
    } else if (cp.type === 'intermittent') {
      ref('intermittent', cp.driver);
      ref('intermittent', cp.driven);
      const d = byId.get(cp.driven);
      if (d && toothCount(d.shape) === null) errors.push(`intermittent: ${cp.driven} has no teeth`);
    } else if (cp.type === 'pawl') {
      const kinds: Array<[string, string]> = [[cp.eccentric, 'eccentric'], [cp.lever, 'pawl-lever']];
      for (const [id, kind] of kinds) {
        ref('pawl', id);
        const p = byId.get(id);
        if (p && p.shape.kind !== kind) errors.push(`pawl: ${id} is not a ${kind}`);
      }
      ref('pawl', cp.wheel);
      const w = byId.get(cp.wheel);
      if (w && w.shape.kind !== 'wheel') errors.push(`pawl: ${cp.wheel} is not a wheel`);
      const e = byId.get(cp.eccentric);
      const l = byId.get(cp.lever);
      if (e?.shape.kind === 'eccentric' && l?.shape.kind === 'pawl-lever' && w?.shape.kind === 'wheel') {
        // The lever's hub rides the eccentric's centre at rest, and its claws meet the wheel's pitch circle.
        const off = 1e-6;
        const pin = { x: e.pos.x + e.shape.throw * Math.cos(e.rest ?? 0), y: e.pos.y + e.shape.throw * Math.sin(e.rest ?? 0) };
        if (Math.hypot(l.pos.x - pin.x, l.pos.y - pin.y) > off) errors.push(`pawl: ${cp.lever} does not sit on ${cp.eccentric}'s pin at rest`);
        const tip = { x: l.pos.x + l.shape.length * Math.cos(l.rest ?? 0), y: l.pos.y + l.shape.length * Math.sin(l.rest ?? 0) };
        if (Math.hypot(tip.x - w.pos.x, tip.y - w.pos.y) > off) errors.push(`pawl: ${cp.lever} does not reach ${cp.wheel}'s centre`);
        if (Math.abs(l.shape.reach - (w.shape.teeth * w.shape.module) / 2) > off) errors.push(`pawl: ${cp.lever}'s claws are not on ${cp.wheel}'s pitch circle`);
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
  if (c.couplings.filter((x) => x.type === 'one-way' || x.type === 'pawl').length > 1) {
    errors.push('at most one winding rectifier (one-way or pawl) allowed');
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
