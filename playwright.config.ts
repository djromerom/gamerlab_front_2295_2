// ARK-42 (TA-06): pruebas funcionales del flujo de evaluación contra Arkad-test.
// Variables en e2e/.env.e2e (ver e2e/.env.e2e.example). Una sola corrida a la vez: comparten BD.
import { defineConfig } from "@playwright/test";
import { loadEnv } from "./e2e/support/db.ts";

loadEnv();

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  // Los casos comparten los mismos jurados y equipos sembrados: se ejecutan de uno en uno.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: process.env.E2E_BASE_URL,
    locale: "es-CO",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
