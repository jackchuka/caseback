import type { i18n } from 'i18next';
import { getWatch } from '../../data/watches';
import type { Caliber } from '../model/schema';
import type { Quality } from '../state/store';
import { buildExterior } from '../scene/exterior/contract';
import { buildExteriorGeometry } from '../scene/exterior/buildAsync';
import { movementFrame } from '../scene/exterior/frame';
import { genericCase } from '../scene/exterior/generic';
import { App } from './App';
import { webglError } from './webgl';

// Everything three.js-bound lives behind this module so the catalog pages never download it.
export function startViewer(caliber: Caliber, watchId: string | null, quality: Quality) {
  const watch = watchId ? getWatch(watchId) : undefined;
  // Started before i18n and React so the worker meshes the watch while the rest of the page boots.
  const ctx = { movement: movementFrame(caliber), quality };
  const exterior = watch
    ? buildExteriorGeometry(watch.id, ctx).then((g) => ({ ...g, materials: watch.exterior.materials() }))
    : buildExterior(genericCase, ctx);
  return (i18n: i18n) => <App caliber={caliber} i18n={i18n} webglError={webglError()} watch={watch} exterior={exterior} />;
}
