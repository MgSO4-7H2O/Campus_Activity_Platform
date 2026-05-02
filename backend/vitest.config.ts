import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    fileParallelism: false,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/', 'src/**/__tests__/**', '**/*.d.ts', '**/*.config.*'],
    },
  },
})

