import { defineConfig, devices } from '@playwright/test';

// Dev server: the compare page only exists in development builds. COMPARE_PORT lets parallel checkouts coexist.
const port = Number(process.env.COMPARE_PORT ?? 5174);
export default defineConfig({
  testDir: 'compare',
  timeout: 300_000,
  workers: 1,
  use: { baseURL: `http://localhost:${port}/` },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 2600, height: 1400 } } }],
  webServer: { command: `npx vite --port ${port} --strictPort`, url: `http://localhost:${port}/`, reuseExistingServer: true, timeout: 120_000 },
});
