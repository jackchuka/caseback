import { useState } from 'react';
import manifest from './thumbs.json';

type Entry = { w: number; h: number; v: string };
const thumbs: Record<string, Entry> = manifest;
const base = import.meta.env.BASE_URL;

// `thumb` is `watches/<brand>/<model>` or `calibers/<id>`, as `npm run thumbs` writes them.
export function CatalogImage({ thumb, sizes, fallback, priority = false }: { thumb: string; sizes: string; fallback: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  const entry = thumbs[thumb];
  if (!entry || failed)
    return (
      <div className="thumb-fallback" aria-hidden="true">
        {fallback}
      </div>
    );
  const src = (w: number) => `${base}thumbs/${thumb}${w === entry.w ? '' : `-${w}`}.webp?v=${entry.v}`;
  return (
    <img
      src={src(entry.w)}
      srcSet={`${src(entry.w / 2)} ${entry.w / 2}w, ${src(entry.w)} ${entry.w}w`}
      sizes={sizes}
      width={entry.w}
      height={entry.h}
      alt=""
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
