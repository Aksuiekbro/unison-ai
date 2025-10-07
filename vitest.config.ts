import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const rootDir = path.dirname(fileURLToPath(new URL('./', import.meta.url)))

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@supabase/auth-helpers-nextjs': path.resolve(rootDir, 'tests/mocks/auth-helpers-nextjs.ts'),
      'next/headers': path.resolve(rootDir, 'tests/mocks/next-headers.ts'),
      'server-only': path.resolve(rootDir, 'tests/mocks/server-only.ts'),
    }
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.{test,spec}.ts']
  }
})
