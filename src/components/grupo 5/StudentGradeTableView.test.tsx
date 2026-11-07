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
});
