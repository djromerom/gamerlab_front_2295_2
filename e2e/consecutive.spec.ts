import { expect, test } from "./support/test.ts";
import { query } from "./support/db.ts";
import { JUROR_A, TEAMS_OF_JUROR_A } from "./support/fixtures.ts";
import { detalles, paso } from "./support/report.ts";
import {
  COMMENTS_PLACEHOLDER,
  fillScores,
  gameCard,
  loginAs,
  openGame,
  openPending,
  submitEvaluation,
  verifyTeam,
} from "./support/session.ts";

test(
  "el jurado evalúa 3 equipos seguidos y cada uno queda registrado",
  detalles({
    comprueba:
      "Evaluación consecutiva: código de verificación, puntajes y envío de 3 equipos seguidos; cada envío sale de pendientes, aparece en «Calificados» y queda en la base con un detalle por criterio.",
  }),
  async ({ page }) => {
    const toEvaluate = TEAMS_OF_JUROR_A.slice(0, 3);
    const pending = TEAMS_OF_JUROR_A[3];

    await paso("1. Inicia sesión", () => loginAs(page, JUROR_A.email), page);

    for (const [i, { game, code }] of toEvaluate.entries()) {
      await paso(`${i + 2}. Evalúa ${game}: verifica el código, califica y envía`, async () => {
        await openPending(page);
        await openGame(page, game);
        await verifyTeam(page, code);
        await fillScores(page, 4);
        await page.getByPlaceholder(COMMENTS_PLACEHOLDER).fill(`e2e ${game}`);
        await submitEvaluation(page);

        // La pantalla vuelve sola a la lista de pendientes, donde el juego enviado ya no aparece.
        await expect(page).toHaveURL(/\/pendientes-calificar$/);
        await expect(page.getByRole("heading", { level: 3, name: game })).toHaveCount(0);
      }, page);
    }

    await paso("5. El cuarto equipo, que no se tocó, sigue pendiente", async () => {
      await expect(gameCard(page, pending.game).getByRole("button", { name: "Calificar" })).toBeEnabled();
    }, page);

    await paso("6. Los 3 evaluados figuran en «Calificados» y el pendiente no", async () => {
      await page.goto("/calificados");
      for (const { game } of toEvaluate) {
        await expect(page.getByRole("heading", { level: 3, name: game })).toBeVisible();
      }
      await expect(page.getByRole("heading", { level: 3, name: pending.game })).toHaveCount(0);
    }, page);

    await paso("7. En la base: 3 evaluaciones, cada una con un detalle por criterio activo", async () => {
      const [[criteria]] = await query("SELECT count(*) FROM criterios WHERE activo");
      const [[evaluations]] = await query(
        `SELECT count(*) FROM evaluacion WHERE id_jurado = '${JUROR_A.id}'`,
      );
      const [[details]] = await query(
        `SELECT count(*) FROM detalle_evaluacion d JOIN evaluacion e ON e.id_evaluacion = d.id_evaluacion
         WHERE e.id_jurado = '${JUROR_A.id}'`,
      );
      expect(Number(evaluations)).toBe(3);
      expect(Number(details)).toBe(3 * Number(criteria));
    });
  },
);
