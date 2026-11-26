import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Team } from "@/types/team";

// Likes sin iniciar sesión: el visitante sin cuenta da like y el back lo guarda con su cookie anónima.
const fetchMock = vi.fn();
vi.mock("@/hooks/useFetch", () => ({ useFetch: () => fetchMock }));
let currentUser: { likeKey?: string } | null = null;
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: currentUser }) }));
vi.mock("@/contexts/SocketContext", () => ({ useSocket: () => ({ socket: null }) }));
vi.mock("@/hooks/useTouchOnly", () => ({ useTouchOnly: () => false }));
const toastInfo = vi.fn();
vi.mock("sonner", () => ({
  toast: { info: (...args: unknown[]) => toastInfo(...args), error: vi.fn() },
  Toaster: () => null,
}));

import { GameDetailModal } from "@/features/games/components/GameDetailModal";

const team: Team = {
  id: 5,
  videogameId: 87,
  gameName: "Ruta 66",
  teamName: "Byte Club",
  teamCode: "N1-05",
  status: "CONFIRMADO",
  likes: 3,
};

const json = (status: number, body: unknown) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

function renderModal(props: Partial<Parameters<typeof GameDetailModal>[0]> = {}) {
  return render(
    <MemoryRouter>
      <GameDetailModal team={team} onClose={() => {}} onRefresh={() => {}} {...props} />
    </MemoryRouter>,
  );
}

const callsTo = (path: string) =>
  fetchMock.mock.calls.filter(([url]) => String(url).endsWith(path));

beforeEach(() => {
  currentUser = null;
  fetchMock.mockReset();
  toastInfo.mockReset();
  fetchMock.mockImplementation(async (url: string) =>
    String(url).endsWith("/my-like") ? json(200, { liked: false }) : json(201, { liked: true, likeCount: 4 }),
  );
});
afterEach(cleanup);

describe("GameDetailModal · likes sin iniciar sesión", () => {
  it("sin sesión consulta el like del navegador y deja dar like", async () => {
    renderModal();
    await waitFor(() => expect(callsTo("/videogames/87/my-like")).toHaveLength(1));

    fireEvent.click(screen.getByRole("button", { name: "Dar like" }));
    await waitFor(() => expect(screen.getByText("4")).toBeTruthy());

    const [[, init]] = callsTo("/videogames/87/toggle-like");
    expect(init).toMatchObject({ method: "POST", credentials: "include" });
    expect(init.headers).not.toHaveProperty("X-Arkad-Session");
    expect(screen.getByRole("button", { name: "Quitar like" }).getAttribute("aria-pressed")).toBe("true");
    expect(toastInfo).not.toHaveBeenCalledWith("¡Inicia sesión para dar like!", expect.anything());
  });

  it("con sesión avisa al back que espera una sesión válida", async () => {
    currentUser = { likeKey: "k" };
    renderModal();
    await waitFor(() => expect(callsTo("/my-like")).toHaveLength(1));
    expect(callsTo("/my-like")[0][1].headers).toMatchObject({ "X-Arkad-Session": "1" });

    fireEvent.click(screen.getByRole("button", { name: "Dar like" }));
    await waitFor(() => expect(callsTo("/toggle-like")).toHaveLength(1));
    expect(callsTo("/toggle-like")[0][1].headers).toMatchObject({ "X-Arkad-Session": "1" });
  });

  it("si el back limita los likes (429) lo explica y no cambia el corazón", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      String(url).endsWith("/my-like") ? json(200, { liked: false }) : json(429, { message: "ThrottlerException" }),
    );
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Dar like" }));
    await waitFor(() => expect(toastInfo).toHaveBeenCalled());
    expect(toastInfo.mock.calls[0][0]).toMatch(/muchos likes seguidos/);
    expect(screen.getByRole("button", { name: "Dar like" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("en ediciones pasadas el like es solo lectura: no llama al back con el id del histórico", async () => {
    renderModal({ gameKind: "historical", liveCount: 9 });
    const button = screen.getByRole("button", { name: "Dar like" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    await new Promise((r) => setTimeout(r, 0));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("9")).toBeTruthy();
  });
});
