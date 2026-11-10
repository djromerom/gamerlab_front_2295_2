// `test` de las pruebas e2e: antes de cada prueba deja a los jurados como recién sembrados (reset.sql),
// para que ninguna dependa de lo que hizo la anterior.
import { test as base } from "@playwright/test";
import { runSql } from "./db.ts";

export const test = base.extend<{ cleanState: void }>({
  cleanState: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await runSql("reset");
      await use();
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
