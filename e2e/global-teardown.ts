import { runSql } from "./support/db.ts";

// Playwright lo ejecuta al terminar la suite aunque hayan fallado pruebas. Si el cleanup falla,
// el error queda visible y hay que correr `npm run e2e:cleanup` a mano antes de la siguiente corrida.
export default async function globalTeardown(): Promise<void> {
  const { notices } = await runSql("cleanup");
  const deleted = notices
    .split("\n")
    .filter((line) => /NOTICE:\s+(usuarios|equipos|videojuegos|evaluacion|borrador_evaluacion):/.test(line))
    .map((line) => line.replace(/^.*NOTICE:\s+/, "").trim());
  console.log(`[e2e] cleanup: ${deleted.join(", ")}`);
}
