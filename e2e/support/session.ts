import { expect, type Page } from "@playwright/test";
import { jurorPassword } from "./fixtures.ts";

/** Inicia sesión con correo y contraseña (el login de Microsoft queda fuera de las pruebas). */
export async function loginAs(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(jurorPassword());
  await page.locator('button[type="submit"]').click();
  // Tras iniciar sesión, LoginPage redirige a /inicio (o a la ruta protegida de la que venía).
  await expect(page).not.toHaveURL(/\/login/);
}

/** Abre la lista de pendientes por calificar y espera a que carguen las tarjetas del jurado. */
export async function openPending(page: Page): Promise<void> {
  await page.goto("/pendientes-calificar");
  await expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible();
}
