import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

const apiFetch = vi.fn();
vi.mock("@/lib/api", () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }));
vi.mock("@/layouts/LayoutApplication", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/api/evaluationProgress", () => ({
  useEvaluationProgress: () => ({ progress: null, error: null, reload: vi.fn() }),
  progressPercentage: () => 0,
}));
vi.mock("@/hooks/useWorkingEdition", () => ({ useWorkingEdition: () => null }));

import { JurorAssignmentPage } from "./JurorAssignmentPage";

const json = (body: unknown) =>
  ({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify(body)), json: () => Promise.resolve(body) }) as unknown as Response;

const equipos = [
  { id: 1, videojuego: "(Dis)connected", nombre: "Alternative Studios", lider: { nombre: "Luisa Fernanda Mercado Royert" }, jurados: [] },
  { id: 2, videojuego: "Alcalde Digital", nombre: "Altrius", lider: { nombre: "Sebastián Blanco" }, jurados: [] },
  { id: 3, videojuego: "Bosque Eterno", nombre: "Los Druidas", lider: { nombre: "María José Núñez" }, jurados: [] },
];

const search = () => screen.getByRole("searchbox", { name: "Buscar equipo por videojuego, equipo o líder" });
const type = (text: string) => fireEvent.change(search(), { target: { value: text } });
// Videojuegos con tarjeta a la vista (la página tiene otros títulos h3, como «Jurados Oficiales»)
const games = () => equipos.map((e) => e.videojuego).filter((g) => screen.queryByRole("heading", { level: 3, name: g }));
const counter = () => screen.getByRole("heading", { level: 2, name: /^Equipos \(/ }).textContent;

describe("JurorAssignmentPage · búsqueda de equipos", () => {
  beforeEach(() => {
    apiFetch.mockImplementation((url: string) => {
      if (url.includes("/juror/evaluation-tracking")) return Promise.resolve(json(equipos));
      if (url.includes("/juror?")) return Promise.resolve(json({ data: [], metadata: { totalPages: 1 } }));
      return Promise.resolve(json(null));
    });
  });
  afterEach(() => {
    cleanup();
    apiFetch.mockReset();
  });

  const renderPage = async () => {
    render(
      <MemoryRouter>
        <JurorAssignmentPage />
      </MemoryRouter>,
    );
    await screen.findByText("Bosque Eterno");
  };

  it("filtra las tarjetas por videojuego, equipo o líder, sin tildes, y el contador lo refleja", async () => {
    await renderPage();
    expect(games()).toEqual(["(Dis)connected", "Alcalde Digital", "Bosque Eterno"]);
    expect(counter()).toBe("Equipos (3/3)");

    type("altrius");
    expect(games()).toEqual(["Alcalde Digital"]);
    expect(counter()).toBe("Equipos (1/3)");

    type("nunez");
    expect(games()).toEqual(["Bosque Eterno"]);

    type("");
    expect(games()).toHaveLength(3);
  });

  it("sin coincidencias lo dice, distinto del aviso del filtro", async () => {
    await renderPage();
    type("zzz");
    expect(games()).toEqual([]);
    expect(screen.getByText("Ningún equipo coincide con «zzz».")).toBeTruthy();
    expect(screen.queryByText("No hay equipos para este filtro.")).toBeNull();
    expect(counter()).toBe("Equipos (0/3)");
  });

  it("se combina con el filtro: busca dentro de los equipos que deja el filtro", async () => {
    await renderPage();
    type("bosque");
    // «Con jurados asignados»: ningún equipo tiene jurados, así que manda el aviso del filtro
    fireEvent.click(screen.getAllByRole("button", { name: "Todos los equipos" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Con jurados asignados" }));
    expect(screen.getByText("No hay equipos para este filtro.")).toBeTruthy();
    expect(search()).toHaveProperty("value", "bosque");
  });
});
