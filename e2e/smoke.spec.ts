import { expect, test } from "./support/test.ts";
import { JUROR_A, TEAMS_OF_JUROR_A } from "./support/fixtures.ts";
import { detalles, paso } from "./support/report.ts";
import { loginAs, openPending } from "./support/session.ts";

test(
  "el jurado A inicia sesión y ve solo sus 4 equipos asignados",
  detalles({ comprueba: "Un jurado entra con correo y contraseña y en «Pendientes» ve exactamente sus equipos, no los de otro jurado." }),
  async ({ page }) => {
    await paso("1. Inicia sesión y abre «Pendientes por calificar»", async () => {
      await loginAs(page, JUROR_A.email);
      await openPending(page);
    }, page);

    await paso("2. Ve sus 4 juegos asignados", async () => {
      for (const { game } of TEAMS_OF_JUROR_A) {
        await expect(page.getByRole("heading", { level: 3, name: game })).toBeVisible();
      }
    }, page);

    await paso("3. No ve el juego asignado al jurado B", async () => {
      await expect(page.getByRole("heading", { level: 3, name: "e2e-juego-5" })).toHaveCount(0);
    });
  },
);
