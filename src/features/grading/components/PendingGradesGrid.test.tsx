import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PendingGradesGrid } from "@/features/grading/components/PendingGradesGrid";

type GridGame = Parameters<typeof PendingGradesGrid>[0]["games"][number];

const juego = (over: Partial<GridGame> = {}): GridGame => ({
  id: 24,
  nombre: "Stella",
  equipo: "Los Astros",
  materia: "Algoritmos",
  nrc: "1234",
  participantes: ["Ana Pérez"],
  descripcion: "Un juego espacial",
  isEvaluated: false,
  ...over,
});

const calificado = juego({
  isEvaluated: true,
  totalScore: 4.552,
  comments: "Buen trabajo",
  criteria: [
    { criterionId: 1, name: "Jugabilidad", score: 4.5 },
    { criterionId: 2, name: "Arte", score: 3 },
  ],
});

function renderGrid(props: Partial<Parameters<typeof PendingGradesGrid>[0]>) {
  return render(
    <MemoryRouter>
      <PendingGradesGrid games={[]} {...props} />
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe("PendingGradesGrid: casilla de calificación en lote", () => {
  it("no sale en Calificados (sin selección y con el juego ya calificado)", () => {
    renderGrid({ games: [calificado], showTotalScore: true, showComments: true });
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("no sale en un juego calificado aunque la página maneje selección", () => {
    renderGrid({
      games: [calificado],
      selectedGameIds: new Set(),
      onToggleSelection: vi.fn(),
    });
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("sale en Pendientes y avisa el juego elegido", () => {
    const onToggleSelection = vi.fn();
    renderGrid({ games: [juego()], selectedGameIds: new Set(), onToggleSelection });
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Seleccionar Stella para calificación en lote" }),
    );
    expect(onToggleSelection).toHaveBeenCalledWith(24);
  });
});

describe("PendingGradesGrid: detalle de un juego calificado", () => {
  it("muestra la nota con 2 decimales, los criterios y los comentarios", () => {
    renderGrid({ games: [calificado], showTotalScore: true, showComments: true });
    fireEvent.click(screen.getByRole("button", { name: "Información" }));

    const dialogo = screen.getByRole("dialog");
    expect(within(dialogo).getByText("4.55")).toBeTruthy();
    const criterios = within(dialogo).getByRole("list", { name: "Puntaje por criterio" });
    expect(within(criterios).getByText("Jugabilidad")).toBeTruthy();
    expect(within(criterios).getByText("4.50")).toBeTruthy();
    expect(within(criterios).getByText("Arte")).toBeTruthy();
    expect(within(criterios).getByText("3.00")).toBeTruthy();
    expect(within(dialogo).getByText("Buen trabajo")).toBeTruthy();
  });

  it("muestra la nota aunque el back aún no envíe los criterios", () => {
    renderGrid({
      games: [{ ...calificado, criteria: undefined }],
      showTotalScore: true,
    });
    fireEvent.click(screen.getByRole("button", { name: "Información" }));

    const dialogo = screen.getByRole("dialog");
    expect(within(dialogo).getByText("4.55")).toBeTruthy();
    expect(within(dialogo).queryByRole("list", { name: "Puntaje por criterio" })).toBeNull();
  });

  it("no muestra nota en el detalle de un juego pendiente", () => {
    renderGrid({ games: [juego()], selectedGameIds: new Set(), onToggleSelection: vi.fn() });
    fireEvent.click(screen.getByRole("button", { name: "Información" }));
    expect(within(screen.getByRole("dialog")).queryByText("Nota:")).toBeNull();
  });
});

describe("Tarjeta «Calificados» del jurado (ARK-255)", () => {
  it("muestra el puntaje con 2 decimales y el código completo", () => {
    renderGrid({
      games: [
        juego({ isEvaluated: true, totalScore: 4.552, teamCode: "N1-AYP-119" }),
        juego({ id: 2, nombre: "Ocean", isEvaluated: true, totalScore: 3, teamCode: "N2-ABC-201" }),
      ],
      showTotalScore: true,
    });

    expect(screen.getByText("4.55")).toBeTruthy();
    expect(screen.getByText("3.00")).toBeTruthy();
    expect(screen.queryByText("4.552")).toBeNull();
    expect(screen.getByText("N1-AYP-119")).toBeTruthy();
    expect(screen.getByText("N2-ABC-201")).toBeTruthy();
  });
});

describe("PendingGradesGrid: buscador a 360 px (ARK-295)", () => {
  it("el campo encoge para dejar visible el botón Buscar", () => {
    renderGrid({ games: [juego()] });
    const input = screen.getByPlaceholderText("Buscar");
    const field = input.parentElement!;
    expect(field.classList).toContain("min-w-0");
    expect(field.classList).toContain("flex-1");
    expect(input.className).not.toMatch(/(^|\s)w-80(\s|$)/);
    expect(screen.getByRole("button", { name: "Buscar" }).classList).toContain("shrink-0");
  });
});
