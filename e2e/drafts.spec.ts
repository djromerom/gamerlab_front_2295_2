import { expect, test } from "./support/test.ts";
import { execute, query } from "./support/db.ts";
import { JUROR_A, TEAMS_OF_JUROR_A } from "./support/fixtures.ts";
import { detalles, paso } from "./support/report.ts";
import {
  COMMENTS_PLACEHOLDER,
  fillScores,
  loginAs,
  openGame,
  openPending,
  scoreInputs,
  submitEvaluation,
  verifyTeam,
  waitForDraftSave,
} from "./support/session.ts";

const { game, code, team } = TEAMS_OF_JUROR_A[3];

const activeDrafts = async () =>
  Number(
    (await query(`SELECT count(*) FROM borrador_evaluacion WHERE id_jurado = '${JUROR_A.id}' AND activo`))[0][0],
  );
const evaluations = async () =>
  Number((await query(`SELECT count(*) FROM evaluacion WHERE id_jurado = '${JUROR_A.id}'`))[0][0]);

test(
  "un borrador autoguardado sobrevive a una sesión nueva y se reanuda",
  detalles({
    comprueba:
      "Autoguardado del borrador en el servidor: lo escrito a medias se recupera desde otra sesión (otro dispositivo), sin pedir el código otra vez, y al enviarlo el borrador deja de estar activo.",
    historias: ["HU-18"],
  }),
  async ({ page, browser }) => {
    await paso("1. Empieza a calificar: comentario y 3 criterios; el autoguardado lo manda al servidor", async () => {
      await loginAs(page, JUROR_A.email);
      await openPending(page);
      await openGame(page, game);
      await verifyTeam(page, code);

      const saved = waitForDraftSave(page);
      await page.getByPlaceholder(COMMENTS_PLACEHOLDER).fill("borrador e2e");
      for (let i = 0; i < 3; i++) await scoreInputs(page).nth(i).fill("3");
      await saved;
      await expect(page.getByRole("status").filter({ hasText: "Borrador guardado" })).toBeVisible();
    }, page);

    await paso("2. En la base: 1 borrador activo con 3 puntajes, que NO cuenta como evaluación", async () => {
      await expect
        .poll(async () => Number((await query(
          `SELECT jsonb_array_length(puntajes) FROM borrador_evaluacion WHERE id_jurado = '${JUROR_A.id}' AND activo`,
        ))[0]?.[0]))
        .toBe(3);
      expect(await evaluations()).toBe(0);
    });

    // «Sale»: otra sesión en un contexto nuevo (sin cookies ni localStorage, como otro dispositivo).
    await page.context().close();
    const other = await browser.newContext({
      baseURL: test.info().project.use.baseURL,
      locale: "es-CO",
    });
    const page2 = await other.newPage();

    await paso("3. Entra desde otro dispositivo (sesión nueva, sin datos locales)", async () => {
      await loginAs(page2, JUROR_A.email);
      await page2.goto("/pendientes-calificar");
      await expect(page2.getByText("Mis borradores (1)")).toBeVisible();
    }, page2);

    await paso("4. Continúa el borrador: lo escrito está intacto y no pide el código otra vez", async () => {
      const row = page2.getByRole("listitem").filter({ hasText: team });
      await row.getByRole("button", { name: "Continuar" }).click();
      await expect(page2).toHaveURL(/\/pendientes-calificar\/\d+/);
      await expect(scoreInputs(page2).first()).toBeVisible();
      for (let i = 0; i < 3; i++) await expect(scoreInputs(page2).nth(i)).toHaveValue("3");
      await expect(scoreInputs(page2).nth(3)).toHaveValue("");
      await expect(page2.getByPlaceholder(COMMENTS_PLACEHOLDER)).toHaveValue("borrador e2e");
    }, page2);

    await paso("5. Lo completa y lo envía: 1 evaluación y el borrador deja de estar activo", async () => {
      await fillScores(page2, 4);
      await submitEvaluation(page2);
      await expect(page2).toHaveURL(/\/pendientes-calificar$/);
      await expect.poll(activeDrafts).toBe(0);
      expect(await evaluations()).toBe(1);
      await expect(page2.getByText(/Mis borradores/)).toHaveCount(0);
    }, page2);
    await other.close();
  },
);

test(
  "si le quitan el grupo al jurado, el borrador se puede descartar (A1)",
  detalles({
    comprueba:
      "Flujo alterno A1: si un administrador reasigna el grupo, el jurado ya no puede continuar su borrador pero sí descartarlo, y no queda ninguna evaluación.",
    historias: ["HU-18"],
  }),
  async ({ page }) => {
    await paso("1. Empieza a calificar y el autoguardado deja un borrador", async () => {
      await loginAs(page, JUROR_A.email);
      await openPending(page);
      await openGame(page, game);
      await verifyTeam(page, code);

      const saved = waitForDraftSave(page);
      await scoreInputs(page).first().fill("2");
      await saved;
      expect(await activeDrafts()).toBe(1);
    }, page);

    await paso("2. Un administrador reasigna el grupo: ya no es del jurado A", () =>
      execute(
        `DELETE FROM "_JurorTeamAssignment" WHERE "A" = (SELECT id_equipo FROM equipos WHERE nombre_equipo = '${team}')`,
      ),
    );

    await paso("3. En «Mis borradores» ya no puede continuarlo, pero sí descartarlo", async () => {
      await page.goto("/pendientes-calificar");
      const row = page.getByRole("listitem").filter({ hasText: team });
      await expect(row.getByRole("button", { name: "Continuar" })).toHaveCount(0);
      await row.getByRole("button", { name: "Descartar borrador" }).click();
      await expect(page.getByText(/descartado/)).toBeVisible();
      await expect(page.getByText(/Mis borradores/)).toHaveCount(0);
    }, page);

    await paso("4. En la base: sin borradores activos ni evaluaciones", async () => {
      expect(await activeDrafts()).toBe(0);
      expect(await evaluations()).toBe(0);
    });
  },
);
