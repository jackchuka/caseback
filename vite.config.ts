import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Only builds that set CF_BEACON_TOKEN (the Pages deploy) report to Cloudflare Web Analytics; dev, e2e and forks do not.
function cloudflareAnalytics(token: string | undefined): Plugin {
  return {
    name: 'cloudflare-analytics',
    apply: 'build',
    transformIndexHtml: () =>
      token
        ? [{ tag: 'script', attrs: { type: 'module', src: 'https://static.cloudflareinsights.com/beacon.min.js', 'data-cf-beacon': JSON.stringify({ token }) }, injectTo: 'body' }]
        : [],
  };
}

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), cloudflareAnalytics(process.env.CF_BEACON_TOKEN)],
  // ES workers can code-split, so the exterior worker loads only the requested watch's builder.
  worker: { format: 'es' },
  test: {
    include: ['src/**/*.test.ts', 'data/**/*.test.ts'],
    environment: 'node',
  },
});
