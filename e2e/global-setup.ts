import { writeFileSync } from "node:fs";
import { runSql } from "./support/db.ts";

const UP_TIMEOUT_MS = 180_000;

// Arkad-test se redespliega solo cuando alguien mergea a dev / dev-deploy y durante unos segundos
// responde 502. Se espera a que front y API estén arriba antes de sembrar, en vez de fallar a medias.
async function waitUntilUp(url: string): Promise<void> {
  const deadline = Date.now() + UP_TIMEOUT_MS;
  let last = "sin respuesta";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (response.ok) return;
      last = `HTTP ${response.status}`;
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 3_000));
  }
  throw new Error(`${url} no respondió OK en ${UP_TIMEOUT_MS / 1000} s (${last}). ¿Despliegue en curso?`);
}

// Siembra jurados, equipos y videojuegos e2e-. Si ya hay restos de otra corrida el seed aborta
// (ver seed.sql) y aquí se propaga el error: hay que correr `npm run e2e:cleanup`.
export default async function globalSetup(): Promise<void> {
  const base = process.env.E2E_BASE_URL;
  const api = process.env.E2E_API_URL;
  if (!base || !api) throw new Error("Faltan E2E_BASE_URL y E2E_API_URL (ver e2e/.env.e2e.example)");
  await Promise.all([waitUntilUp(`${base}/login`), waitUntilUp(`${api}/`)]);

  const { stdout } = await runSql("seed");
  // En el CI (e2e.yml): marca que esta corrida sembró, para que el paso final de limpieza solo borre
  // lo propio y nunca los datos de otra corrida en curso (la de alguien en su máquina, por ejemplo).
  if (process.env.E2E_SEED_MARKER) writeFileSync(process.env.E2E_SEED_MARKER, new Date().toISOString());
  console.log(`[e2e] ${stdout.trim().split("\n").slice(-2, -1)[0]?.trim() ?? "seed listo"}`);
}
