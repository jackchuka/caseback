import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Runs the full e2e suite, but skips `npm run build` when dist/ is already newer than every
// file under src/ and data/ — so repeated local runs don't pay for a rebuild that would produce
// the same output.
function newestMtimeMs(dir) {
  let newest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    const t = entry.isDirectory() ? newestMtimeMs(path) : statSync(path).mtimeMs;
    if (t > newest) newest = t;
  }
  return newest;
}

const distEntry = 'dist/index.html';
const distIsFresh = existsSync(distEntry) && ['src', 'data'].every((dir) => statSync(distEntry).mtimeMs >= newestMtimeMs(dir));

if (!distIsFresh) {
  const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' });
  if (build.status !== 0) process.exit(build.status ?? 1);
} else {
  console.log('e2e:fast — dist/ is newer than src/ and data/, skipping build');
}

const run = spawnSync('npx', ['playwright', 'test'], { stdio: 'inherit', env: { ...process.env, E2E_SKIP_BUILD: '1' } });
process.exit(run.status ?? 1);
