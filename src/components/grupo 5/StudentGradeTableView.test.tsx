import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StudentGradeTableView from "./StudentGradeTableView";
import type { GradeTeam } from "./student-grade-table-types";

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
  editionLabel: "2026-30",
  canEdit: false,
  source: "current",
};

const renderView = (teams: GradeTeam[]) =>
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
      currentPage={1}
      totalPages={1}
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
  const EXTERNAL = /Equipo externo: la nota de la feria solo cuenta los jurados junior/;
  const SCHOOL = /Colegio: la nota de la feria se calcula solo con las notas de profesores y jurados senior/;

  it("un equipo externo con la nota de la feria pendiente explica que solo cuentan los jurados junior", () => {
    renderView([{ ...team, fairGradeRule: "EXTERNAL", calificacionFeria: null, calificacionDocente: 4.2 }]);
    expect(screen.getByText("Nota en proceso")).toBeTruthy();
    expect(screen.getByText(EXTERNAL)).toBeTruthy();
    expect(screen.getByText("4.20")).toBeTruthy();
  });

  it("un equipo externo con nota también muestra el motivo junto a la nota", () => {
    renderView([{ ...team, fairGradeRule: "EXTERNAL" }]);
    expect(screen.getByText("3.54")).toBeTruthy();
    expect(screen.getByText(EXTERNAL)).toBeTruthy();
  });

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
