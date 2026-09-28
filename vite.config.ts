import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  // ES workers can code-split, so the exterior worker loads only the requested watch's builder.
  worker: { format: 'es' },
  test: {
    include: ['src/**/*.test.ts', 'data/**/*.test.ts'],
    environment: 'node',
  },
});
