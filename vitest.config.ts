import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
    // Console output for humans + a JUnit XML for Codecov Test Analytics.
    reporters: ['default', 'junit'],
    outputFile: { junit: './test-report.junit.xml' },
    coverage: {
      provider: 'v8',
      // The pure solving logic is what the suite covers; scope the report to it
      // so the percentage reflects the code under test, not UI/config glue.
      include: ['lib/logic/**/*.ts'],
      exclude: ['lib/logic/**/*.test.ts'],
      reporter: ['text', 'lcov', 'json-summary'],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
});
