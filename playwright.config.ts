import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.E2E_PORT ?? '4173';
const WORKERS = process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : 2;
const preview = `npx vite preview --port ${PORT} --strictPort`;

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  workers: WORKERS,
  fullyParallel: true,
  use: { baseURL: `http://localhost:${PORT}/`, viewport: { width: 1440, height: 900 } },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 900 } } }],
  webServer: {
    // e2e:fast sets E2E_SKIP_BUILD once it has decided dist/ is already up to date.
    command: process.env.E2E_SKIP_BUILD ? preview : `npm run build && ${preview}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
