import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { tsconfigPaths: true },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'node',
    maxWorkers: 4,
    testTimeout: 15_000,
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/helpers/setup-tests.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/{domain,generators,storage}/**/*.ts',
        'src/catalog/bindings/parse-keys-header.ts',
        'src/catalog/controllers/get-controller-board.ts',
      ],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/index.ts', 'src/domain/types.ts'],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        lines: 75,
        statements: 75,
        functions: 70,
        branches: 65,
      },
    },
  },
});
