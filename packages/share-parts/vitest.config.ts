import { defineConfig } from 'vitest/config'

// 既定は node。画面を作る試験だけ、ファイルの先頭の「@vitest-environment jsdom」で切り替える。
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.{ts,tsx}'],
  },
})
