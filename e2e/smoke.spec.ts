import { expect, test } from "@playwright/test";
import { JUROR_A, TEAMS_OF_JUROR_A } from "./support/fixtures.ts";
import { loginAs, openPending } from "./support/session.ts";

test("el jurado A inicia sesión y ve solo sus 4 equipos asignados", async ({ page }) => {
  await loginAs(page, JUROR_A.email);
  await openPending(page);

  for (const { game } of TEAMS_OF_JUROR_A) {
    await expect(page.getByRole("heading", { level: 3, name: game })).toBeVisible();
  }
  // El equipo 5 es del jurado B: no debe aparecer.
  await expect(page.getByRole("heading", { level: 3, name: "e2e-juego-5" })).toHaveCount(0);
});
