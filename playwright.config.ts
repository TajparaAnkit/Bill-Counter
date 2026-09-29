import { defineConfig, devices } from '@playwright/test';

// Two suites, each against its own Vite dev server:
// - ui:    component harness at /#/__ui-test (dev-only route, excluded from production builds)
// - flows: end-to-end user flows in demo mode (`vite --mode demo`: in-memory data, signed in
//          as a demo admin with every feature on). Every page load starts from the same data.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    trace: 'retain-on-failure',
    viewport: { width: 1280, height: 800 },
  },
  webServer: [
    {
      command: 'npx vite --port 5199 --strictPort --open false',
      url: 'http://localhost:5199',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npx vite --mode demo --port 5198 --strictPort --open false',
      url: 'http://localhost:5198/Bill-Counter/',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  projects: [
    { name: 'ui', testMatch: /select\.spec\.ts/, use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5199' } },
    // Full user flows through the dev server: allow more time than the component suite on a busy machine.
    { name: 'flows', testMatch: /flows\.spec\.ts/, timeout: 60_000, use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5198/Bill-Counter/' } },
  ],
});
