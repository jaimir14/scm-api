import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: '.',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'text-summary', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/server.ts',        // Entry point — just calls main()
        'src/database/prisma.ts', // Prisma client singleton — needs real DB
        'src/types/**',          // Type declarations only
        'src/**/index.ts',       // Re-export barrels
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
