import { defineConfig } from 'vitest/config'

// Main-process unit tests run in plain Node — todoStore.ts only touches sql.js,
// node:fs, and shared types, so no Electron mock or jsdom is needed here.
// Renderer/component tests will get their own environment later.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
})
