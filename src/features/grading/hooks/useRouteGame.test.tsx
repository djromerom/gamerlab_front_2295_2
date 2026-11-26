import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRouteGame } from "@/features/grading/hooks/useRouteGame";

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock("@/lib/api", () => ({ apiFetch: mocks.apiFetch }));

function Probe() {
  const { game, notFound } = useRouteGame();
  if (notFound) return <p>no encontrado</p>;
  if (!game) return <p>cargando</p>;
  return (
    <p>
      {game.id} · {game.nombre} · {game.equipo} · {game.teamId} · {game.teamCode}
    </p>
  );
}

function renderAt(entry: string | { pathname: string; state: unknown }) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/pendientes-calificar/:id" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  );
}

const pending = (over: Record<string, unknown> = {}) => ({
  videogameId: 655,
  videogameName: "Videojueguito pro",
  logoUrl: "https://example.invalid/logo.png",
  teamName: "grupito",
  teamId: 654,
  teamCode: "N2-MFB-202",
  members: [{ fullName: "holis holis" }],
  nrc: "90003",
  subject: "MF Nivel 2",
  description: null,
  isEvaluated: false,
  ...over,
});

const respond = (data: unknown[]) =>
  mocks.apiFetch.mockResolvedValue(new Response(JSON.stringify({ data }), { status: 200 }));

afterEach(() => {
  cleanup();
  mocks.apiFetch.mockReset();
});

describe("useRouteGame (vuelta del tour 360 o recarga)", () => {
  it("si viene de la tarjeta usa el state y no consulta al back", () => {
    renderAt({
      pathname: "/pendientes-calificar/655",
      state: { game: { id: 655, nombre: "Desde la tarjeta", equipo: "grupito" } },
    });
    expect(screen.getByText(/Desde la tarjeta/)).toBeTruthy();
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });

  it("sin state busca el juego del :id entre los pendientes del jurado", async () => {
    respond([pending({ videogameId: 668, videogameName: "Otro" }), pending()]);
    renderAt("/pendientes-calificar/655");

    expect(
      await screen.findByText("655 · Videojueguito pro · grupito · 654 · N2-MFB-202"),
    ).toBeTruthy();
    expect(mocks.apiFetch.mock.calls[0][0]).toContain("/pending-games?page=1&limit=100");
  });

  it("si el juego no es un pendiente del jurado avisa que no se encontró", async () => {
    respond([pending({ videogameId: 668 })]);
    renderAt("/pendientes-calificar/655");
    expect(await screen.findByText("no encontrado")).toBeTruthy();
  });

  it("un juego ya calificado cuenta como no encontrado", async () => {
    respond([pending({ isEvaluated: true })]);
    renderAt("/pendientes-calificar/655");
    expect(await screen.findByText("no encontrado")).toBeTruthy();
  });

  it("un id que no es número no consulta al back", async () => {
    renderAt("/pendientes-calificar/abc");
    expect(await screen.findByText("no encontrado")).toBeTruthy();
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });

  it("si el back falla no se queda cargando", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.apiFetch.mockResolvedValue(new Response("{}", { status: 500 }));
    renderAt("/pendientes-calificar/655");
    expect(await screen.findByText("no encontrado")).toBeTruthy();
  });
});
