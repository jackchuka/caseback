import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Runs the full e2e suite, but skips `npm run build` when dist/ is already newer than every
// build input — so repeated local runs don't pay for a rebuild that would produce the same output.
function newestMtimeMs(path) {
  const stat = statSync(path);
  if (!stat.isDirectory()) return stat.mtimeMs;
  let newest = 0;
  for (const entry of readdirSync(path)) newest = Math.max(newest, newestMtimeMs(join(path, entry)));
  return newest;
}

const inputs = ['src', 'data', 'public', 'index.html', 'vite.config.ts', 'package.json'].filter((p) => existsSync(p));
const distEntry = 'dist/index.html';
const distIsFresh = existsSync(distEntry) && inputs.every((p) => statSync(distEntry).mtimeMs >= newestMtimeMs(p));

if (!distIsFresh) {
  const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' });
  if (build.status !== 0) process.exit(build.status ?? 1);
} else {
  console.log('e2e:fast — dist/ is newer than every build input, skipping build');
}

const run = spawnSync('npx', ['playwright', 'test'], { stdio: 'inherit', env: { ...process.env, E2E_SKIP_BUILD: '1' } });
process.exit(run.status ?? 1);
