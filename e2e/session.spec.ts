import type { BrowserContext, Page } from "@playwright/test";
import { getRefreshDelayMs } from "../src/lib/session.ts";
import { query, serverNowMs } from "./support/db.ts";
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
  submitLoginForm,
  verifyTeam,
  waitForDraftSave,
} from "./support/session.ts";
import { expect, test } from "./support/test.ts";

const { game, code } = TEAMS_OF_JUROR_A[3];

const isRefreshOk = (r: { url(): string; request(): { method(): string }; ok(): boolean }) =>
  r.url().endsWith("/auth/refresh") && r.request().method() === "POST" && r.ok();

const draftScores = async () =>
  Number(
    (await query(
      `SELECT coalesce(jsonb_array_length(puntajes), 0) FROM borrador_evaluacion
       WHERE id_jurado = '${JUROR_A.id}' AND activo`,
    ))[0]?.[0] ?? 0,
  );
const evaluations = async () =>
  Number((await query(`SELECT count(*) FROM evaluacion WHERE id_jurado = '${JUROR_A.id}'`))[0][0]);

/** Entra a calificar el juego 4 y deja un borrador con 2 puntajes ya guardado en el servidor. */
async function startDraft(page: Page): Promise<void> {
  await openPending(page);
  await openGame(page, game);
  await verifyTeam(page, code);
  const saved = waitForDraftSave(page);
  await scoreInputs(page).nth(0).fill("2");
  await scoreInputs(page).nth(1).fill("2");
  await saved;
  await expect.poll(draftScores).toBe(2);
}

test(
  "la sesión se renueva sola durante una evaluación (HU-05)",
  detalles({
    comprueba:
      "Renovación automática de la sesión: mientras el jurado califica, la app llama sola a /auth/refresh antes de que venza el token, y el jurado sigue y envía sin volver a iniciar sesión.",
    historias: ["HU-05"],
  }),
  async ({ page }) => {
    // Reloj de la página controlable: el temporizador de renovación (10 min con token de 15) no se espera.
    await page.clock.install();
    let accessTokenExpiresIn = 0;

    await paso("1. Inicia sesión y empieza a calificar (borrador con 2 puntajes)", async () => {
      const firstRefresh = page.waitForResponse(isRefreshOk);
      await loginAs(page, JUROR_A.email);
      ({ accessTokenExpiresIn } = await (await firstRefresh).json());
      await startDraft(page);
    }, page);

    await paso("2. Pasa el tiempo hasta que toca renovar: la app llama sola a /auth/refresh", async () => {
      const renewed = page.waitForResponse(isRefreshOk);
      await page.clock.fastForward(getRefreshDelayMs(accessTokenExpiresIn) + 1000);
      await renewed;
    });

    await paso("3. Sigue en la misma pantalla con lo escrito y envía sin volver a iniciar sesión", async () => {
      await expect(page).toHaveURL(/\/pendientes-calificar\/\d+/);
      await expect(scoreInputs(page).nth(0)).toHaveValue("2");
      await fillScores(page, 4);
      await submitEvaluation(page);
      await expect(page).toHaveURL(/\/pendientes-calificar$/);
      expect(await evaluations()).toBe(1);
    }, page);
  },
);

const LOST_TYPING = "escrito justo antes de perder la sesión";

/**
 * Pierde la sesión (cookies fuera) escribiendo justo después de un guardado y vuelve a entrar.
 * `clockOffsetMs` fija la hora de la página respecto a la del servidor: así el resultado no depende del
 * desfase real entre la máquina de quien corre las pruebas y Arkad-test.
 */
async function loseSessionAndReturn(page: Page, context: BrowserContext, clockOffsetMs: number): Promise<void> {
  await page.clock.install({ time: new Date((await serverNowMs()) + clockOffsetMs) });

  await paso("1. Inicia sesión y empieza a calificar (borrador con 2 puntajes en el servidor)", async () => {
    await loginAs(page, JUROR_A.email);
    await startDraft(page);
  }, page);

  await paso("2. Pierde la sesión mientras escribe: la app lleva a /login y avisa que lo escrito quedó guardado", async () => {
    // La sesión desaparece: el siguiente guardado recibe 401 y el refresh real también.
    await context.clearCookies();
    await scoreInputs(page).nth(2).fill("2");
    await page.getByPlaceholder(COMMENTS_PLACEHOLDER).fill(LOST_TYPING);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("alert").filter({ hasText: "Tu sesión expiró" })).toBeVisible();
  }, page);

  await paso("3. En la base sigue lo guardado antes de perder la sesión (2 puntajes, ninguna evaluación)", async () => {
    expect(await draftScores()).toBe(2);
    expect(await evaluations()).toBe(0);
  });

  await paso("4. Vuelve a entrar sin recargar: regresa a la calificación donde iba", async () => {
    await submitLoginForm(page, JUROR_A.email);
    await expect(page).toHaveURL(/\/pendientes-calificar\/\d+/);
    await expect(scoreInputs(page).first()).toBeVisible();
  }, page);
}

test(
  "si se pierde la sesión, la app avisa y lo escrito se recupera al volver a entrar (HU-05, HU-06)",
  detalles({
    comprueba:
      "Pérdida de sesión a mitad de una calificación: la app avisa, y al volver a entrar recupera también lo escrito después del último guardado en el servidor (respaldo local).",
    historias: ["HU-05", "HU-06"],
  }),
  async ({ page, context }) => {
    // Reloj de la página 1 min por delante del servidor: el respaldo local siempre es el más nuevo.
    await loseSessionAndReturn(page, context, 60_000);

    await paso("5. Lo escrito antes de perder la sesión está en pantalla (3 puntajes y el comentario)", async () => {
      for (const i of [0, 1, 2]) await expect(scoreInputs(page).nth(i)).toHaveValue("2");
      await expect(page.getByPlaceholder(COMMENTS_PLACEHOLDER)).toHaveValue(LOST_TYPING);
    }, page);

    await paso("6. Completa y envía: queda 1 evaluación", async () => {
      await fillScores(page, 4);
      await submitEvaluation(page);
      expect(await evaluations()).toBe(1);
    }, page);
  },
);

// DEFECTO CONOCIDO (hallado con ARK-42, sin corregir): al reabrir el formulario, pickInitialDraft
// (src/lib/evaluationDrafts.ts) elige el respaldo local solo si `local.savedAt > server.updatedAt`, o sea
// compara el reloj del navegador con el del servidor. Con el navegador atrasado respecto al servidor, lo
// último escrito antes de perder la sesión (dentro del desfase) se descarta, aunque la pantalla de login
// diga «Lo que estabas escribiendo quedó guardado». Verificado: con la página +60 s pasa; con -30 s falla.
// Al corregirlo, cambiar test.fixme por test para que quede como prueba de regresión.
test.fixme(
  "con el reloj del navegador atrasado, lo último escrito antes de perder la sesión se recupera",
  detalles({
    comprueba:
      "Igual que la anterior, pero con el reloj del navegador 30 s por detrás del servidor (habitual en equipos de usuarios).",
    historias: ["HU-05", "HU-06"],
    defecto:
      "pickInitialDraft (src/lib/evaluationDrafts.ts) compara el reloj del navegador con el del servidor: con el navegador atrasado se descarta lo último escrito antes de perder la sesión. Sin corregir; cuando se corrija, cambiar test.fixme por test.",
  }),
  async ({ page, context }) => {
    // Reloj de la página 30 s por detrás del servidor, algo habitual en equipos de usuarios.
    await loseSessionAndReturn(page, context, -30_000);

    await paso("5. Lo escrito antes de perder la sesión está en pantalla (3 puntajes y el comentario)", async () => {
      for (const i of [0, 1, 2]) await expect(scoreInputs(page).nth(i)).toHaveValue("2");
      await expect(page.getByPlaceholder(COMMENTS_PLACEHOLDER)).toHaveValue(LOST_TYPING);
    }, page);
  },
);

test(
  "sin red el borrador queda en el dispositivo y se sincroniza al volver (HU-06)",
  detalles({
    comprueba:
      "Autoguardado sin conexión: si se cae la red, la app lo avisa y guarda en el dispositivo; al volver la red sincroniza sola con el servidor.",
    historias: ["HU-06"],
  }),
  async ({ page, context }) => {
    await paso("1. Inicia sesión y empieza a calificar (borrador con 2 puntajes en el servidor)", async () => {
      await loginAs(page, JUROR_A.email);
      await startDraft(page);
    }, page);

    await paso("2. Se corta la red y sigue escribiendo: aparece «Sin conexión» y el servidor no recibe nada", async () => {
      await context.setOffline(true);
      await scoreInputs(page).nth(2).fill("5");
      await expect(page.getByRole("status").filter({ hasText: "Sin conexión" })).toBeVisible();
      expect(await draftScores()).toBe(2);
    }, page);

    await paso("3. Vuelve la red: se sincroniza sola y el servidor tiene los 3 puntajes", async () => {
      const synced = waitForDraftSave(page);
      await context.setOffline(false);
      await synced;
      await expect(page.getByRole("status").filter({ hasText: "Borrador guardado" })).toBeVisible();
      await expect.poll(draftScores).toBe(3);
    }, page);
  },
);
