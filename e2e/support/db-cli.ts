// CLI mínimo: node --experimental-strip-types e2e/support/db-cli.ts <seed|cleanup|verify>
import { runSql, type SqlFile } from "./db.ts";

const commands: Record<string, SqlFile> = {
  seed: "seed",
  cleanup: "cleanup",
  verify: "verify-cleanup",
};

const file = commands[process.argv[2] ?? ""];
if (!file) {
  console.error("Uso: db-cli.ts <seed|cleanup|verify>");
  process.exit(2);
}

try {
  const { stdout, notices } = await runSql(file);
  if (notices.trim()) console.log(notices.trim());
  if (stdout.trim()) console.log(stdout.trim());
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
