import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { chromium } from '@playwright/test';

// npm run thumbs -- [id ...]
// Renders every watch (three-quarter front) and every caliber (bare movement) from the dev scene into
// public/thumbs/{watches,calibers}/<id>.webp (960 w) and <id>-480.webp, plus src/ui/thumbs.json, which the
// catalog reads for sizes and cache-busting versions. Re-run after any lighting, material or model change.
const port = Number(process.env.THUMBS_PORT ?? 5175);
const only = process.argv.slice(2);
const MAX_BYTES = 60 * 1024;
const WIDTHS = [960, 480];

const server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => {
  server.stdout.on('data', (d) => d.toString().includes('Local:') && resolve());
  server.on('exit', (code) => reject(new Error(`vite exited with ${code}`)));
});

const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
page.on('pageerror', (e) => console.error(e.message));
const base = `http://localhost:${port}/dev/thumb`;
try {
  await page.goto(base);
  await page.waitForFunction(() => window.__thumbs);
  const ids = await page.evaluate(() => window.__thumbs);
  const jobs = [...ids.watches.map((id) => ['watches', id]), ...ids.calibers.map((id) => ['calibers', id])].filter(([, id]) => only.length === 0 || only.includes(id));
  const manifest = {};
  for (const [kind, id] of jobs) {
    await page.goto(`${base}/${kind}/${id}`);
    await page.waitForFunction(() => window.__thumb?.ready, null, { timeout: 60_000 });
    // Downscale the 2× render in the page and let Chrome encode WebP (with alpha); lower the quality until it fits.
    const files = await page.evaluate(
      async ({ widths, maxBytes }) => {
        const src = document.querySelector('.thumb-canvas canvas');
        const out = [];
        for (const w of widths) {
          const h = Math.round((src.height / src.width) * w);
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          const g = c.getContext('2d');
          g.imageSmoothingQuality = 'high';
          g.drawImage(src, 0, 0, w, h);
          let q = 0.86;
          let url = c.toDataURL('image/webp', q);
          while (url.length * 0.75 > maxBytes * (w / widths[0]) ** 1.3 && q > 0.4) url = c.toDataURL('image/webp', (q -= 0.06));
          out.push({ w, h, q: Math.round(q * 100), data: url.slice(url.indexOf(',') + 1) });
        }
        return out;
      },
      { widths: WIDTHS, maxBytes: MAX_BYTES },
    );
    const hash = createHash('sha1');
    for (const f of files) {
      const buf = Buffer.from(f.data, 'base64');
      hash.update(buf);
      const path = `public/thumbs/${kind}/${id}${f.w === WIDTHS[0] ? '' : `-${f.w}`}.webp`;
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, buf);
      console.log(`${path}  ${f.w}×${f.h}  q${f.q}  ${(buf.length / 1024).toFixed(1)} kB`);
    }
    manifest[`${kind}/${id}`] = { w: files[0].w, h: files[0].h, v: hash.digest('hex').slice(0, 8) };
  }
  const path = 'src/ui/thumbs.json';
  const prev = only.length ? JSON.parse(await import('node:fs').then((fs) => fs.readFileSync(path, 'utf8'))) : {};
  const merged = { ...prev, ...manifest };
  writeFileSync(path, `${JSON.stringify(Object.fromEntries(Object.entries(merged).sort()), null, 2)}\n`);
} finally {
  await browser.close();
  server.kill();
}
