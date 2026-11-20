import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StudentGradeTableView from "./StudentGradeTableView";
import type { GradeTeam } from "@/features/results/types/studentGradeTable";

afterEach(cleanup);

const team: GradeTeam = {
  teamCode: "N1-AYP-06",
  nrc: "3501",
  teamName: "Team Rocket Wow",
  integrantes: ["Ana"],
  videogame: "Juego",
  calificacionFeria: 3.54,
  calificacionDocente: 3.5,
  videogameId: 1,
  editionId: 8,
  editionLabel: "2026 - 2",
  canEdit: false,
  source: "current",
};

const renderView = (teams: GradeTeam[], pagination: { currentPage?: number; totalPages?: number; totalItems?: number; itemsPerPage?: number } = {}) =>
  render(
    <StudentGradeTableView
      teams={teams}
      filteredTeams={teams}
      initialLoading={false}
      isLoading={false}
      noStudents={false}
      isEditingGrades={false}
      editedGrades={{}}
      setEditedGrades={vi.fn()}
      gradeResults={{}}
      savingGrade={false}
      gradeInputRefs={{ current: new Map() }}
      currentPage={pagination.currentPage ?? 1}
      totalPages={pagination.totalPages ?? 1}
      totalItems={pagination.totalItems ?? teams.length}
      itemsPerPage={pagination.itemsPerPage ?? 25}
      handlePreviousPage={vi.fn()}
      handleNextPage={vi.fn()}
    />,
  );

describe("StudentGradeTableView: notas con 2 decimales (BG-30)", () => {
  it("Calificación Feria y Calificación Docente salen con 2 decimales", () => {
    renderView([team]);
    expect(screen.getByText("3.54")).toBeTruthy();
    expect(screen.getByText("3.50")).toBeTruthy();
    expect(screen.queryByText("3.5")).toBeNull();
  });

  it("una nota entera sale como 4.00", () => {
    renderView([{ ...team, calificacionFeria: 4, calificacionDocente: null }]);
    expect(screen.getByText("4.00")).toBeTruthy();
  });

  it("una nota final pendiente se muestra como Nota en proceso", () => {
    renderView([{ ...team, calificacionFeria: null, calificacionDocente: null }]);
    expect(screen.getByText("Nota en proceso")).toBeTruthy();
  });

  it("un equipo rechazado se muestra como Rechazado, no como Nota en proceso (BG-43)", () => {
    renderView([{ ...team, calificacionFeria: null, rejected: true }]);
    expect(screen.getByText("Rechazado")).toBeTruthy();
    expect(screen.queryByText("Nota en proceso")).toBeNull();
  });
});

describe("StudentGradeTableView: motivo de la nota de la feria (ARK-203)", () => {
  // ARK-273: la casilla «Externo» ya no cambia la nota; no hay motivo de «equipo externo»
  const EXTERNAL = /Equipo externo/;
  const SCHOOL = /Colegio: la nota de la feria se calcula solo con las notas de profesores y jurados senior/;

  it("un colegio explica que solo cuentan profesores y jurados senior", () => {
    renderView([{ ...team, teamCode: "N0-COL-01", fairGradeRule: "SCHOOL", calificacionFeria: null }]);
    expect(screen.getByText(SCHOOL)).toBeTruthy();
    expect(screen.queryByText(EXTERNAL)).toBeNull();
  });

  it("un equipo con la regla general o sin regla no muestra motivo", () => {
    renderView([
      { ...team, fairGradeRule: "STANDARD", calificacionFeria: null },
      { ...team, teamCode: "N1-AYP-07", videogameId: 2 },
    ]);
    expect(screen.queryByText(EXTERNAL)).toBeNull();
    expect(screen.queryByText(SCHOOL)).toBeNull();
  });
});

describe("StudentGradeTableView: pie, paginación y columnas (BG-63)", () => {
  const page = (count: number) =>
    Array.from({ length: count }, (_, index) => ({ ...team, teamCode: `N1-AYP-${index}`, videogameId: index }));

  it("el pie muestra el total real del back, no solo los equipos de la página", () => {
    renderView(page(25), { totalItems: 216, totalPages: 9 });
    expect(screen.getByText("Mostrando 1-25 de 216 equipo(s)")).toBeTruthy();
    expect(screen.getByText("Página 1 de 9")).toBeTruthy();
    expect(screen.queryByText(/de 25 equipo/)).toBeNull();
  });

  it("en la última página cuenta desde el primer equipo de esa página", () => {
    renderView(page(16), { currentPage: 9, totalItems: 216, totalPages: 9 });
    expect(screen.getByText("Mostrando 201-216 de 216 equipo(s)")).toBeTruthy();
  });

  it("los botones de página tienen nombre accesible", () => {
    renderView(page(25), { currentPage: 2, totalItems: 216, totalPages: 9 });
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Página siguiente" })).toBeTruthy();
  });

  it("las columnas de nota van justo después del equipo para verse a 1280 px", () => {
    renderView([team]);
    const headers = screen.getAllByRole("columnheader").map((header) => header.textContent);
    expect(headers).toEqual(["Código del equipo", "Equipo", "Calificación Feria", "Calificación Docente", "Feria", "NRC", "Videojuego", "Integrantes"]);
    const cells = screen.getAllByRole("cell").map((cell) => cell.textContent);
    expect(cells.slice(0, 5)).toEqual(["N1-AYP-06", "Team Rocket Wow", "3.54", expect.stringContaining("3.50"), "2026 - 2"]);
  });
});
