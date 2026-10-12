import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'node',
    maxWorkers: 4,
    testTimeout: 15_000,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/helpers/setup-tests.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/{domain,generators,storage,ui}/**/*.{ts,tsx}',
        'src/catalog/{parse-keys-header,get-controller-board}.ts',
      ],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/domain/types.ts'],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        lines: 88,
        statements: 88,
        functions: 89,
        branches: 81,
        'src/domain/**': { lines: 98, statements: 98, functions: 98, branches: 93 },
        'src/generators/**': { lines: 95, statements: 96, functions: 100, branches: 94 },
        'src/storage/**': { lines: 96, statements: 96, functions: 100, branches: 86 },
        'src/ui/**': { lines: 84, statements: 84, functions: 86, branches: 76 },
      },
    },
  },
});
