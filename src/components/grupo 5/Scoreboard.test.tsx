import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ apiFetch }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1" }, userRole: "Estudiante" }),
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

function backend(scoreRes: () => Response) {
  apiFetch.mockImplementation(async (url: string) => {
    if (url.endsWith("/teams")) return json(200, [{ id: 7, userId: "u1" }]);
    if (url.includes("/teams/final-score/team/")) return scoreRes();
    if (url.endsWith("/students")) return json(200, { data: [] });
    return json(404, {});
  });
}

describe("Scoreboard con ranking oculto", () => {
  beforeEach(() => {
    apiFetch.mockReset();
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
});
