import { defineConfig, devices } from '@playwright/test';

// Dev server: the compare page only exists in development builds.
export default defineConfig({
  testDir: 'compare',
  timeout: 300_000,
  workers: 1,
  use: { baseURL: 'http://localhost:5174/' },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 2600, height: 1400 } } }],
  webServer: { command: 'npx vite --port 5174 --strictPort', url: 'http://localhost:5174/', reuseExistingServer: true, timeout: 120_000 },
});
