import type { WatchMeta } from '../../../../src/model/watch';
const watch: WatchMeta = {
  id: 'sinn/103-st-sa',
  brand: 'Sinn',
  model: '103 St Sa',
  reference: '103.061',
  caliberId: 'valjoux-7750',
  caliberNotes: 'The 103 St Sa ran on the ETA/Valjoux 7750 for decades; recent pieces use Sellita\'s SW 500, built to the same design.',
  movement: { name: 'ETA Valjoux 7750', number: '7750', jewels: 25, vph: 28800, powerReserveH: 48, sourceIds: ['wornandwound-103', 'ablogtowatch-103'] },
  sources: [
    { id: 'define-103', title: 'Sinn 103 St Sa — Define Watches (product photos)', url: 'https://definewatches.com.au/shop/sinn/instrument-chronographs/103-st-sa/' },
    { id: 'wornandwound-103', title: 'Sinn 103 St Flieger Chronograph review — Worn & Wound', url: 'https://wornandwound.com/review/sinn-103-st-flieger-chronograph-review/' },
    { id: 'ablogtowatch-103', title: 'Sinn 103 St Sa E hands-on — aBlogtoWatch', url: 'http://www.ablogtowatch.com/sinn-103-st-sa-e-watch/' },
    { id: 'sg-103', title: 'Sinn 103 St Sa — SG Watches (side and back photos)', url: 'https://sg-watches.de/en/artikel/sinn-103-st-sa-ref-103-061-2/' },
  ],
};
export default watch;
