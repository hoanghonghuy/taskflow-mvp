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
        '**/pages/api/auth/[...nextauth].ts',
        'src/components/providers/providers.tsx',
        'src/components/providers/task-manager-provider.tsx',
        'src/components/providers/modal-provider.tsx',
      ],
      thresholds: {
        lines: 72,
        statements: 72,
        functions: 70,
        branches: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
