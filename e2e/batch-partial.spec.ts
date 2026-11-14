import { expect, test } from "./support/test.ts";
import { query } from "./support/db.ts";
import { JUROR_A, TEAMS_OF_JUROR_A } from "./support/fixtures.ts";
import { detalles, paso } from "./support/report.ts";
import {
  fillScores,
  gameCard,
  loginAs,
  openGame,
  openPending,
  submitEvaluation,
  verifyTeam,
} from "./support/session.ts";

const [first, second, third, fourth] = TEAMS_OF_JUROR_A;

const evaluationsOf = async (game: string) =>
  Number(
    (await query(
      `SELECT count(*) FROM evaluacion e JOIN videojuegos v ON v.id_videojuego = e.id_videojuego
       WHERE e.id_jurado = '${JUROR_A.id}' AND v.nombre = '${game}'`,
    ))[0][0],
  );

test(
  "Guardar todas guarda las válidas y reporta la que falla",
  detalles({
    comprueba:
      "Calificación en lote con un fallo parcial: el servidor guarda las evaluaciones válidas, la pantalla separa guardadas de no guardadas, la fallida sigue pendiente y se puede reintentar sin duplicar nada.",
  }),
  async ({ page }) => {
    await paso("1. Selecciona 3 juegos y abre la calificación en lote", async () => {
      await loginAs(page, JUROR_A.email);
      await openPending(page);
      for (const { game } of [first, second, third]) {
        await gameCard(page, game).getByRole("checkbox").check();
      }
      await page.getByRole("button", { name: "Calificar seleccionados (3)" }).click();
      await expect(page).toHaveURL(/\/calificar-lote/);
    }, page);

    await paso("2. Verifica cada grupo y pone puntajes en cada pestaña", async () => {
      for (const { game, code } of [first, second, third]) {
        await page.getByRole("button", { name: game }).click();
        await verifyTeam(page, code);
        await fillScores(page, 4);
      }
    }, page);

    let idempotencyKey: string | undefined;
    await paso(`3. Guarda todas con un puntaje fuera de rango en ${second.game} (forzado en la petición)`, async () => {
      const [[secondId]] = await query(`SELECT id_videojuego FROM videojuegos WHERE nombre = '${second.game}'`);
      await page.route("**/evaluation/batch", async (route) => {
        const request = route.request();
        idempotencyKey = request.headers()["idempotency-key"];
        const body = JSON.parse(request.postData() ?? "{}");
        const row = body.evaluations.find((e: { videogameId: number }) => e.videogameId === Number(secondId));
        row.details[0].score = 99;
        await route.continue({ postData: JSON.stringify(body) });
      });
      await page.getByRole("button", { name: /^Guardar todas/ }).click();
    });

    await paso("4. El resultado separa 2 guardadas de 1 no guardada y el lote lleva Idempotency-Key", async () => {
      await expect(page.getByText("Resultado de la calificación")).toBeVisible();
      await expect(page.getByText("2 de 3 evaluaciones guardadas")).toBeVisible();
      await expect(page.getByRole("heading", { level: 3, name: /Guardadas \(2\)/ })).toBeVisible();
      await expect(page.getByRole("heading", { level: 3, name: /No guardadas \(1\)/ })).toBeVisible();
      await expect(page.getByText(second.game, { exact: true })).toBeVisible();
      expect(idempotencyKey, "el lote debe llevar Idempotency-Key").toBeTruthy();
    }, page);

    await paso(`5. En la base: se guardaron ${first.game} y ${third.game}; ${second.game} no`, async () => {
      expect(await evaluationsOf(first.game)).toBe(1);
      expect(await evaluationsOf(third.game)).toBe(1);
      expect(await evaluationsOf(second.game)).toBe(0);
    });

    await paso("6. En pendientes siguen el fallido y el que nunca se tocó; los guardados no", async () => {
      await page.getByRole("button", { name: "Volver a pendientes" }).click();
      await expect(page).toHaveURL(/\/pendientes-calificar$/);
      await expect(page.getByRole("heading", { level: 3, name: second.game })).toBeVisible();
      await expect(page.getByRole("heading", { level: 3, name: fourth.game })).toBeVisible();
      await expect(page.getByRole("heading", { level: 3, name: first.game })).toHaveCount(0);
      await expect(page.getByRole("heading", { level: 3, name: third.game })).toHaveCount(0);
    }, page);

    await paso("7. Reintenta el fallido por la pantalla individual (sin pedir de nuevo el código)", async () => {
      await page.unroute("**/evaluation/batch");
      await openGame(page, second.game);
      await fillScores(page, 4);
      await submitEvaluation(page);
      await expect(page).toHaveURL(/\/pendientes-calificar$/);
      expect(await evaluationsOf(second.game)).toBe(1);
    }, page);

    await paso("8. En la base: 3 evaluaciones en total, nada duplicado", async () => {
      const [[total]] = await query(`SELECT count(*) FROM evaluacion WHERE id_jurado = '${JUROR_A.id}'`);
      expect(Number(total)).toBe(3);
    });
  },
);
