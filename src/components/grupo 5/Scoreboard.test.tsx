import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ apiFetch }));
const auth = vi.hoisted(() => ({ id: "u1" }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: auth.id }, userRole: "Estudiante" }),
}));
vi.mock("@/fetchs/grupo 1/GlobalStateContext", () => ({
  useGlobalState: () => ({ canViewScores: true }),
}));
vi.mock("@/components/grupo 5/TeamCode.tsx", () => ({ default: () => null }));
vi.mock("@/components/grupo 5/Review", () => ({ default: () => null }));
vi.mock("@/components/grupo 5/JudgesGrades", () => ({ default: () => null }));

import Scoreboard from "@/components/grupo 5/Scoreboard";

const AVISO = "Disponible cuando se publique el ranking";
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// El back marca el equipo propio con `isMine` (ids opacos); aquí se simula por usuario actual
// para poder probar el cambio de equipo al cambiar de sesión.
vi.mock("@/lib/opaqueKeys", () => ({
  findMyTeam: (teams: { id: number }[]) =>
    teams.find((t) => t.id === (auth.id === "u1" ? 7 : 8)) ?? null,
}));
const teamsList = [{ id: 7, isMine: true }, { id: 8, isMine: false }];

function backend(scoreRes: () => Response) {
  apiFetch.mockImplementation(async (url: string) => {
    if (url.endsWith("/teams")) return json(200, teamsList);
    if (url.includes("/teams/final-score/team/")) return scoreRes();
    if (url.endsWith("/students")) return json(200, { data: [] });
    return json(404, {});
  });
}

describe("Scoreboard con ranking oculto", () => {
  beforeEach(() => {
    apiFetch.mockReset();
    auth.id = "u1";
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("403: muestra el aviso y no 0", async () => {
    backend(() => json(403, { message: "Forbidden" }));
    const { container } = render(<Scoreboard />);
    await waitFor(() => expect(screen.getByText(AVISO)).toBeTruthy());
    expect(screen.queryByText("0")).toBeNull();
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });

  it("200 sin las tres claves: muestra el aviso", async () => {
    backend(() => json(200, [{ teamId: 7 }]));
    render(<Scoreboard />);
    await waitFor(() => expect(screen.getByText(AVISO)).toBeTruthy());
  });

  it("con números: igual que hoy", async () => {
    backend(() => json(200, [{ finalScore: 4.2, avgJunior: 4, avgSenior: 4.5 }]));
    render(<Scoreboard />);
    await waitFor(() => expect(screen.getByText("4.2")).toBeTruthy());
    expect(screen.queryByText(AVISO)).toBeNull();
    expect(screen.getByText(/\(4\.50\)/)).toBeTruthy();
  });

  it("500: no se convierte en aviso (se trata como hoy)", async () => {
    backend(() => json(500, {}));
    render(<Scoreboard />);
    await waitFor(() => expect(screen.getByText("Retroalimentación del VideoJuego")).toBeTruthy());
    expect(screen.queryByText(AVISO)).toBeNull();
  });

  it("403 y luego fallo de red al cambiar de equipo: no deja el aviso viejo", async () => {
    let calls = 0;
    backend(() => {
      calls++;
      if (calls === 1) return json(403, {});
      throw new TypeError("Failed to fetch");
    });
    const { rerender } = render(<Scoreboard />);
    await waitFor(() => expect(screen.getByText(AVISO)).toBeTruthy());
    auth.id = "u2";
    rerender(<Scoreboard />);
    await waitFor(() => expect(calls).toBe(2));
    await waitFor(() => expect(screen.queryByText(AVISO)).toBeNull());
  });
});
