// Informe legible: cada prueba se cuenta en pasos con nombre (test.step) y cada paso con pantalla deja una
// captura adjunta. En el HTML de Playwright se ve qué comportamiento pasó o falló y cómo se veía la pantalla.
import type { Page, TestDetails } from "@playwright/test";
import { test } from "./test.ts";

/**
 * Ejecuta un paso con nombre. Si se pasa `page`, al terminar (pase o falle) adjunta una captura de la pantalla
 * a ese paso. Sin `page` (verificaciones solo contra la base) el paso queda en el informe sin captura.
 */
export async function paso<T>(nombre: string, fn: () => Promise<T>, page?: Page): Promise<T> {
  return test.step(nombre, async () => {
    try {
      return await fn();
    } finally {
      if (page) await capturar(page, nombre);
    }
  });
}

/**
 * El nombre del adjunto pasa a ser el nombre del archivo dentro de `playwright-report/data/`. Con tildes, «» o ñ,
 * `npx playwright show-report` en Windows no sirve la imagen (sale rota): se deja solo en ASCII.
 */
const nombreArchivo = (nombre: string) =>
  nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 .,:;()/-]/g, "");

/** Captura de la pantalla actual adjunta al paso en curso. Nunca hace fallar la prueba (página cerrada, etc.). */
async function capturar(page: Page, nombre: string): Promise<void> {
  if (page.isClosed()) return;
  try {
    const body = await page.screenshot({ fullPage: true, timeout: 10_000 });
    await test.info().attach(nombreArchivo(nombre), { body, contentType: "image/png" });
  } catch {
    // La captura es evidencia, no una aserción: si no se puede tomar, el paso sigue con su resultado real.
  }
}

/**
 * Metadatos de una prueba para el informe: qué comportamiento comprueba, historias de usuario y ticket.
 * Se ven en el HTML (anotaciones y etiquetas) y en el resumen de la corrida en GitHub.
 */
export function detalles(opts: { comprueba: string; historias?: string[]; defecto?: string }): TestDetails {
  const annotation: { type: string; description: string }[] = [
    { type: "Comprueba", description: opts.comprueba },
    { type: "Ticket", description: "ARK-42" },
  ];
  if (opts.defecto) annotation.push({ type: "Defecto conocido", description: opts.defecto });
  return { tag: (opts.historias ?? []).map((h) => `@${h}`), annotation };
}
