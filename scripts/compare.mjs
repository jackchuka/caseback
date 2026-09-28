import { spawnSync } from 'node:child_process';

// npm run compare -- [watch-id] [shot-id]
const [watch = '', shot = ''] = process.argv.slice(2);
const r = spawnSync('npx', ['playwright', 'test', '-c', 'playwright.compare.config.ts'], { stdio: 'inherit', env: { ...process.env, WATCH: watch, SHOT: shot } });
process.exit(r.status ?? 1);
