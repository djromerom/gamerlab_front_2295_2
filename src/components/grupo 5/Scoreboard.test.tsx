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
vi.mock("@/components/grupo 5/JudgesGrades", () => ({ default: () => null }));

import Scoreboard from "@/components/grupo 5/Scoreboard";

const AVISO = "Disponible cuando se publique el ranking";
const EN_PROCESO = "Nota en proceso";
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

  it("500: no se convierte en aviso ni muestra 0", async () => {
    backend(() => json(500, {}));
    render(<Scoreboard />);
    await waitFor(() => expect(screen.getByText(EN_PROCESO)).toBeTruthy());
    expect(screen.queryByText(AVISO)).toBeNull();
    expect(screen.queryByText("0.00")).toBeNull();
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

describe("Scoreboard: el estudiante ve solo la nota final (HU-30)", () => {
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

  it("muestra la nota final con 2 decimales", async () => {
    backend(() => json(200, [{ teamId: 7, finalScore: 4.8 }]));
    render(<Scoreboard />);
    await waitFor(() => expect(screen.getByText("4.80")).toBeTruthy());
    expect(screen.queryByText(AVISO)).toBeNull();
    expect(screen.queryByText(EN_PROCESO)).toBeNull();
  });

  it("BG-32: una nota de 3.5 muestra «Bueno» y no «Excelente»", async () => {
    backend(() => json(200, [{ teamId: 7, finalScore: 3.5 }]));
    render(<Scoreboard />);
    await waitFor(() => expect(screen.getByText("3.50")).toBeTruthy());
    expect(screen.getByTestId("grade-label").textContent).toBe("Bueno");
    expect(screen.queryByText("Excelente")).toBeNull();
  });

  it("BG-32: sin nota no muestra etiqueta", async () => {
    backend(() => json(200, [{ teamId: 7, finalScore: null }]));
    render(<Scoreboard />);
    await waitFor(() => expect(screen.getByText(EN_PROCESO)).toBeTruthy());
    expect(screen.queryByTestId("grade-label")).toBeNull();
  });

  it("no muestra el desglose aunque el back viejo todavía lo envíe", async () => {
    backend(() => json(200, [{ finalScore: 3.54, avgJunior: 3.2, avgSenior: 4.05 }]));
    const { container } = render(<Scoreboard />);
    await waitFor(() => expect(screen.getByText("3.54")).toBeTruthy());
    expect(screen.queryByText("Junior")).toBeNull();
    expect(screen.queryByText("Senior")).toBeNull();
    expect(container.textContent).not.toMatch(/3\.20|4\.05/);
  });

  it("no escribe la respuesta en la consola", async () => {
    const log = vi.spyOn(console, "log");
    backend(() => json(200, [{ finalScore: 3.54, avgJunior: 3.2, avgSenior: 4.05 }]));
    render(<Scoreboard />);
    await waitFor(() => expect(screen.getByText("3.54")).toBeTruthy());
    expect(log).not.toHaveBeenCalled();
  });

  it("no pide las evaluaciones individuales", async () => {
    backend(() => json(200, [{ finalScore: 4.8 }]));
    render(<Scoreboard />);
    await waitFor(() => expect(screen.getByText("4.80")).toBeTruthy());
    const urls = apiFetch.mock.calls.map(([url]) => String(url));
    expect(urls.some((url) => /\/students(\?|$)/.test(url))).toBe(false);
  });

  it("finalScore null: muestra «Nota en proceso», no 0", async () => {
    backend(() => json(200, [{ teamId: 7, finalScore: null }]));
    const { container } = render(<Scoreboard />);
    await waitFor(() => expect(screen.getByText(EN_PROCESO)).toBeTruthy());
    expect(screen.queryByText(AVISO)).toBeNull();
    expect(container.textContent).not.toMatch(/0\.00|NaN|undefined/);
  });

  it("sin filas para el equipo: muestra «Nota en proceso»", async () => {
    backend(() => json(200, []));
    render(<Scoreboard />);
    await waitFor(() => expect(screen.getByText(EN_PROCESO)).toBeTruthy());
  });
});
