import type { WatchMeta } from '../../../../src/model/watch';
const watch: WatchMeta = {
  id: 'seiko/presage-srpb43',
  brand: 'Seiko',
  model: 'Presage Cocktail Time',
  reference: 'SRPB43',
  caliberId: 'seiko-nh35a',
  caliberNotes: 'Seiko fits its own 4R35, the in-house version of the NH35A sold to other brands (23 jewels against the NH35A\'s 24).',
  movement: { name: 'Seiko 4R35', number: '4R35', jewels: 23, vph: 21600, powerReserveH: 41, sourceIds: ['seiko-usa-srpb43', 'ablogtowatch-srpb43'] },
  sources: [
    { id: 'seiko-usa-srpb43', title: 'Presage Cocktail Time SRPB43 — Seiko USA', url: 'https://seikousa.com/products/srpb43' },
    { id: 'ablogtowatch-srpb43', title: 'Seiko Presage Automatic SRPB43 watch review — aBlogtoWatch', url: 'https://www.ablogtowatch.com/seiko-presage-automatic-srpb43-watch-review/' },
    { id: 'longisland-srpb43', title: 'Seiko Presage "Cocktail Time" SRPB43 — Long Island Watch', url: 'https://longislandwatch.com/seiko-srpb43-presage-watch-srpb43/' },
    { id: 'calibercorner-nh35', title: 'Seiko (SII) Caliber NH35A — Caliber Corner (4R35 as Seiko\'s branded NH35A)', url: 'https://calibercorner.com/seiko-caliber-nh35a/' },
  ],
};
export default watch;
