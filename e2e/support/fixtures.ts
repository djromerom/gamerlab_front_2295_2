// Datos que siembra e2e/sql/seed.sql. Si se cambian allá, cambiarlos aquí.
export const JUROR_A = { email: "e2e-jurado-a@prueba.invalid", id: "e2e-jurado-a" } as const;
export const JUROR_B = { email: "e2e-jurado-b@prueba.invalid", id: "e2e-jurado-b" } as const;

/** Contraseña en claro de los jurados e2e-; el seed guarda su hash (E2E_JUROR_PASSWORD_HASH). */
export function jurorPassword(): string {
  const password = process.env.E2E_JUROR_PASSWORD;
  if (!password) throw new Error("Falta E2E_JUROR_PASSWORD (ver e2e/.env.e2e.example)");
  return password;
}

/** Equipos 1-4 asignados al jurado A; el 5 al jurado B. El código es el de verificación (HU-19). */
export const TEAMS = [
  { n: 1, team: "e2e-equipo-1", game: "e2e-juego-1", code: "E2EAAA" },
  { n: 2, team: "e2e-equipo-2", game: "e2e-juego-2", code: "E2EBBB" },
  { n: 3, team: "e2e-equipo-3", game: "e2e-juego-3", code: "E2ECCC" },
  { n: 4, team: "e2e-equipo-4", game: "e2e-juego-4", code: "E2EDDD" },
  { n: 5, team: "e2e-equipo-5", game: "e2e-juego-5", code: "E2EEEE" },
] as const;

export const TEAMS_OF_JUROR_A = TEAMS.slice(0, 4);
