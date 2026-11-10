import { runSql } from "./support/db.ts";

// Siembra jurados, equipos y videojuegos e2e-. Si ya hay restos de otra corrida el seed aborta
// (ver seed.sql) y aquí se propaga el error: hay que correr `npm run e2e:cleanup`.
export default async function globalSetup(): Promise<void> {
  const { stdout } = await runSql("seed");
  console.log(`[e2e] ${stdout.trim().split("\n").slice(-2, -1)[0]?.trim() ?? "seed listo"}`);
}
