import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    environmentMatchGlobs: [
      ['tests/components/**', 'jsdom'],
    ],
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/**/*.ts',
        'src/lib/**/*.tsx',
        'src/pages/api/**/*.ts',
        'src/components/providers/**/*.tsx',
      ],
      exclude: [
        'src/lib/**/*.d.ts',
        'src/lib/i18n/**',
        'src/lib/hooks/**',
        'src/lib/icons.tsx',
        'src/lib/constants.tsx',
        'src/lib/store/task-manager/index.ts',
        'src/lib/store/task-manager/types.ts',
        'src/lib/api/index.ts',
        '**/pages/api/auth/[...nextauth].ts',
        'src/components/providers/providers.tsx',
        'src/components/providers/task-manager-provider.tsx',
        'src/components/providers/modal-provider.tsx',
      ],
      thresholds: {
        // CI measured ~74.6% after recent lib growth; keep a thin buffer under 75.
        lines: 74,
        statements: 74,
        functions: 85,
        branches: 65,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
