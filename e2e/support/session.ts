import { expect, type Locator, type Page, type Response } from "@playwright/test";
import { jurorPassword } from "./fixtures.ts";

/** Inicia sesión con correo y contraseña (el login de Microsoft queda fuera de las pruebas). */
export async function loginAs(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await submitLoginForm(page, email);
}

/** Llena y envía el formulario de /login que ya está en pantalla (sin recargar, para conservar la ruta de origen). */
export async function submitLoginForm(page: Page, email: string): Promise<void> {
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(jurorPassword());
  await page.locator('button[type="submit"]').click();
  // Tras iniciar sesión, LoginPage redirige a /inicio (o a la ruta protegida de la que venía).
  await expect(page).not.toHaveURL(/\/login/);
}

/** Tarjeta de un videojuego en la lista (la más interna que contiene su título y un botón). */
export function gameCard(page: Page, game: string): Locator {
  return page
    .locator("div")
    .filter({ has: page.getByRole("heading", { level: 3, name: game }) })
    .filter({ has: page.getByRole("button") })
    .last();
}

/** Desde la lista de pendientes, abre la pantalla de calificar (o continuar el borrador) de un juego. */
export async function openGame(page: Page, game: string): Promise<void> {
  await gameCard(page, game)
    .getByRole("button", { name: /^(Calificar|Continuar)/ })
    .click();
  await expect(page).toHaveURL(/\/pendientes-calificar\/\d+/);
}

/** HU-19: digita el código del grupo y espera a que el formulario de criterios se habilite. */
export async function verifyTeam(page: Page, code: string): Promise<void> {
  await page.getByLabel("Código de verificación").fill(code);
  await page.getByRole("button", { name: "Verificar", exact: true }).click();
  await expect(scoreInputs(page).first()).toBeVisible();
}

/** Casillas de puntaje de los criterios (placeholder «0 - N» en la pantalla individual, «0-5» en la de lote). */
export function scoreInputs(page: Page): Locator {
  return page.getByPlaceholder(/^0\s?-\s?\d+/);
}

/** Pone el mismo puntaje en todos los criterios visibles. */
export async function fillScores(page: Page, score: number): Promise<void> {
  const inputs = scoreInputs(page);
  const count = await inputs.count();
  for (let i = 0; i < count; i++) await inputs.nth(i).fill(String(score));
}

export const COMMENTS_PLACEHOLDER = "Escribe tus comentarios sobre el juego...";

/** Envía la evaluación: botón, confirmación y espera a la respuesta del servidor. */
export async function submitEvaluation(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Enviar Evaluación" }).click();
  const saved = page.waitForResponse(
    (r) => r.request().method() === "POST" && r.url().includes("/evaluation/") && r.ok(),
  );
  await page.getByRole("button", { name: "Confirmar Envío" }).click();
  await saved;
}

/** Abre la lista de pendientes por calificar y espera a que carguen las tarjetas del jurado. */
export async function openPending(page: Page): Promise<void> {
  await page.goto("/pendientes-calificar");
  await expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible();
}

/** Respuesta OK del autoguardado del borrador (PUT /evaluation/drafts/:id). Crearla ANTES de editar. */
export function waitForDraftSave(page: Page): Promise<Response> {
  return page.waitForResponse(
    (r) => r.request().method() === "PUT" && /\/evaluation\/drafts\/\d+/.test(r.url()) && r.ok(),
  );
}
