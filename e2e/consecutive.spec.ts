import { expect, test } from "./support/test.ts";
import { query } from "./support/db.ts";
import { JUROR_A, TEAMS_OF_JUROR_A } from "./support/fixtures.ts";
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

test("el jurado evalúa 3 equipos seguidos y cada uno queda registrado", async ({ page }) => {
  const toEvaluate = TEAMS_OF_JUROR_A.slice(0, 3);
  const pending = TEAMS_OF_JUROR_A[3];

  await loginAs(page, JUROR_A.email);

  for (const { game, code } of toEvaluate) {
    await openPending(page);
    await openGame(page, game);
    await verifyTeam(page, code);
    await fillScores(page, 4);
    await page.getByPlaceholder(COMMENTS_PLACEHOLDER).fill(`e2e ${game}`);
    await submitEvaluation(page);

    // La pantalla vuelve sola a la lista de pendientes, donde el juego enviado ya no aparece.
    await expect(page).toHaveURL(/\/pendientes-calificar$/);
    await expect(page.getByRole("heading", { level: 3, name: game })).toHaveCount(0);
  }

  // El cuarto equipo no se tocó: sigue pendiente.
  await expect(gameCard(page, pending.game).getByRole("button", { name: "Calificar" })).toBeEnabled();

  // Los 3 evaluados figuran en «Calificados» y el pendiente no.
  await page.goto("/calificados");
  for (const { game } of toEvaluate) {
    await expect(page.getByRole("heading", { level: 3, name: game })).toBeVisible();
  }
  await expect(page.getByRole("heading", { level: 3, name: pending.game })).toHaveCount(0);

  // En la base: 3 evaluaciones del jurado A, cada una con un detalle por criterio activo.
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
