// ARK-42: ejecuta SQL en la BD de Arkad-test por SSH (`docker exec -i arkad_db psql`).
// La BD no publica puerto, por eso todo pasa por el servidor. Solo se permite la base `arkad_db`.
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SQL_DIR = join(here, "..", "sql");
const ENV_FILE = join(here, "..", ".env.e2e");

export type SqlFile = "seed" | "reset" | "cleanup" | "verify-cleanup";

/** Lee e2e/.env.e2e (KEY=VALUE por línea) sin pisar variables que ya estén definidas. */
export function loadEnv(): void {
  if (!existsSync(ENV_FILE)) return;
  for (const raw of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function required(name: string): string {
  loadEnv();
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable ${name} (ver e2e/.env.e2e.example)`);
  return value;
}

function remoteCommand(tuplesOnly: boolean): string {
  const container = process.env.E2E_DB_CONTAINER ?? "arkad_db";
  const user = process.env.E2E_DB_USER ?? "arkad_user";
  const database = process.env.E2E_DB_NAME ?? "arkad_db";
  if (database !== "arkad_db") {
    // Producción es arkad_db_prod: jamás se escribe ahí desde las pruebas.
    throw new Error(`E2E_DB_NAME=${database}: solo se permite arkad_db (Arkad-test)`);
  }
  const format = tuplesOnly ? "-A -t -F '|'" : "";
  return `docker exec -i ${container} psql -U ${user} -d ${database} -X -q -v ON_ERROR_STOP=1 ${format} -f -`;
}

interface PsqlResult {
  stdout: string;
  /** psql imprime los NOTICE (por ejemplo, filas borradas por tabla) por stderr. */
  notices: string;
}

function runPsql(sql: string, tuplesOnly = false): Promise<PsqlResult> {
  const target = required("E2E_SSH_TARGET");
  // Llave privada opcional (equivale a `ssh -i <llave>`); si no, ssh usa su configuración normal.
  const key = process.env.E2E_SSH_KEY;
  const keyArgs = key ? ["-i", key, "-o", "IdentitiesOnly=yes"] : [];
  return new Promise((resolve, reject) => {
    const child = spawn(
      "ssh",
      ["-o", "BatchMode=yes", "-o", "ConnectTimeout=15", ...keyArgs, target, remoteCommand(tuplesOnly)],
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    let stdout = "";
    let notices = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (notices += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, notices });
      else reject(new Error(`psql/ssh terminó con código ${code}\n${notices || stdout}`));
    });
    child.stdin.end(sql);
  });
}

/** Ejecuta e2e/sql/<file>.sql. El seed recibe el hash bcrypt como variable psql `pwhash`. */
export async function runSql(file: SqlFile): Promise<PsqlResult> {
  // En Windows git puede dejar los .sql con CRLF; psql los recibe siempre con LF.
  let sql = readFileSync(join(SQL_DIR, `${file}.sql`), "utf8").replace(/\r\n/g, "\n");
  if (file === "seed") {
    const hash = required("E2E_JUROR_PASSWORD_HASH").replace(/'/g, "''");
    sql = `\\set pwhash '${hash}'\n${sql}`;
  }
  return runPsql(sql);
}

/** Consulta de solo lectura: devuelve las filas como arreglos de texto. */
export async function query(sql: string): Promise<string[][]> {
  const { stdout } = await runPsql(`BEGIN READ ONLY;\n${sql};\nROLLBACK;`, true);
  return stdout
    .split(/\r?\n/)
    .filter((line) => line.length > 0 && line !== "BEGIN" && line !== "ROLLBACK")
    .map((line) => line.split("|"));
}

/** Sentencia de escritura sobre datos e2e- (por ejemplo, quitarle un grupo al jurado en una prueba). */
export async function execute(sql: string): Promise<void> {
  await runPsql(`BEGIN;\n${sql};\nCOMMIT;`);
}
