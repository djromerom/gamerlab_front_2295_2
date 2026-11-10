import { expect, test } from "./support/test.ts";
import { execute, query } from "./support/db.ts";
import { JUROR_A, TEAMS_OF_JUROR_A } from "./support/fixtures.ts";
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

test("un borrador autoguardado sobrevive a una sesión nueva y se reanuda", async ({ page, browser }) => {
  // 1. Empieza a calificar: comentario y solo 3 de los criterios; el autoguardado lo manda al servidor.
  await loginAs(page, JUROR_A.email);
  await openPending(page);
  await openGame(page, game);
  await verifyTeam(page, code);

  const saved = waitForDraftSave(page);
  await page.getByPlaceholder(COMMENTS_PLACEHOLDER).fill("borrador e2e");
  for (let i = 0; i < 3; i++) await scoreInputs(page).nth(i).fill("3");
  await saved;
  await expect(page.getByRole("status").filter({ hasText: "Borrador guardado" })).toBeVisible();

  // En la base: 1 borrador activo con 3 puntajes, y NO cuenta como evaluación recibida.
  await expect
    .poll(async () => Number((await query(
      `SELECT jsonb_array_length(puntajes) FROM borrador_evaluacion WHERE id_jurado = '${JUROR_A.id}' AND activo`,
    ))[0]?.[0]))
    .toBe(3);
  expect(await evaluations()).toBe(0);

  // 2. «Sale»: otra sesión en un contexto nuevo (sin cookies ni localStorage, como otro dispositivo).
  await page.context().close();
  const other = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    locale: "es-CO",
  });
  const page2 = await other.newPage();
  await loginAs(page2, JUROR_A.email);
  await page2.goto("/pendientes-calificar");

  // 3. Ve su borrador en «Mis borradores» y lo continúa: lo escrito está intacto y no pide el código otra vez.
  await expect(page2.getByText("Mis borradores (1)")).toBeVisible();
  const row = page2.getByRole("listitem").filter({ hasText: team });
  await row.getByRole("button", { name: "Continuar" }).click();
  await expect(page2).toHaveURL(/\/pendientes-calificar\/\d+/);
  await expect(scoreInputs(page2).first()).toBeVisible();
  for (let i = 0; i < 3; i++) await expect(scoreInputs(page2).nth(i)).toHaveValue("3");
  await expect(scoreInputs(page2).nth(3)).toHaveValue("");
  await expect(page2.getByPlaceholder(COMMENTS_PLACEHOLDER)).toHaveValue("borrador e2e");

  // 4. Lo completa y lo envía: queda 1 evaluación y el borrador deja de estar activo.
  await fillScores(page2, 4);
  await submitEvaluation(page2);
  await expect(page2).toHaveURL(/\/pendientes-calificar$/);
  await expect.poll(activeDrafts).toBe(0);
  expect(await evaluations()).toBe(1);
  await expect(page2.getByText(/Mis borradores/)).toHaveCount(0);
  await other.close();
});

test("si le quitan el grupo al jurado, el borrador se puede descartar (A1)", async ({ page }) => {
  await loginAs(page, JUROR_A.email);
  await openPending(page);
  await openGame(page, game);
  await verifyTeam(page, code);

  const saved = waitForDraftSave(page);
  await scoreInputs(page).first().fill("2");
  await saved;
  expect(await activeDrafts()).toBe(1);

  // Un administrador reasigna el grupo: ya no es del jurado A.
  await execute(
    `DELETE FROM "_JurorTeamAssignment" WHERE "A" = (SELECT id_equipo FROM equipos WHERE nombre_equipo = '${team}')`,
  );

  await page.goto("/pendientes-calificar");
  const row = page.getByRole("listitem").filter({ hasText: team });
  await expect(row.getByRole("button", { name: "Continuar" })).toHaveCount(0);
  await row.getByRole("button", { name: "Descartar borrador" }).click();

  await expect(page.getByText(/descartado/)).toBeVisible();
  await expect(page.getByText(/Mis borradores/)).toHaveCount(0);
  expect(await activeDrafts()).toBe(0);
  expect(await evaluations()).toBe(0);
});
