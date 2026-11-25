import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Team } from "@/types/team";

// La ventana del detalle no se abre en estas pruebas
vi.mock("./GameDetailModal", () => ({ GameDetailModal: () => null }));

import { TeamCard } from "./TeamCard";

const team: Team = {
  id: 1,
  videogameId: 10,
  gameName: "Mision Cibersegura-Operacion Final",
  teamName: "The Stronger Link Collective",
  teamCode: "N3-EDD-323",
  status: "CONFIRMADO",
};

const renderCard = (overrides: Partial<Team> = {}) => render(<TeamCard team={{ ...team, ...overrides }} onRefresh={() => {}} liveLikeCount={3} />);
const card = () => screen.getByRole("heading", { level: 4 }).closest('[data-slot="card"]')!;
const content = () => card().querySelector('[data-slot="card-content"]')!;

afterEach(cleanup);

describe("TeamCard · tarjeta de la galería de videojuegos", () => {
  it("crece si el contenido no cabe, en vez de encoger el título hasta esconderlo", () => {
    renderCard();
    const classes = card().className.split(" ");
    expect(classes).toEqual(expect.arrayContaining(["h-full", "min-h-[180px]"]));
    // antes: sm:h-[180px] fijo; con el nombre del equipo en tres líneas, en tableta el título no se veía
    expect(classes).not.toContain("sm:h-[180px]");
    expect(screen.getByRole("heading", { level: 4 }).className.split(" ")).toContain("break-words");
  });

  it("con dos insignias (presentador externo) el texto empieza debajo de ellas", () => {
    renderCard({ notGradable: true, isExternal: true });
    expect(screen.getByText("Presentador externo")).toBeTruthy();
    expect(content().className.split(" ")).toContain("sm:pt-11");
  });

  it("con una sola insignia conserva el relleno de siempre", () => {
    renderCard();
    const classes = content().className.split(" ");
    expect(classes).toContain("sm:pt-6");
    expect(classes).not.toContain("sm:pt-11");
  });
});
