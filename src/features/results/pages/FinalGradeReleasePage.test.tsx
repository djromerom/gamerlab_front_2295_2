import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchFinalGradeRelease: vi.fn(),
  setFinalGradeRelease: vi.fn(),
}));

vi.mock("@/features/results/api/finalGrade", () => ({
  fetchFinalGradeRelease: mocks.fetchFinalGradeRelease,
  setFinalGradeRelease: mocks.setFinalGradeRelease,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/layouts/LayoutApplication", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import FinalGradeReleasePage from "@/features/results/pages/FinalGradeReleasePage";

const release = {
  editionId: 5,
  editionTitle: "Feria Gamer 2026-2",
  showFinalGrade: false,
  releasedAt: null,
  fairDate: "2026-11-26",
  releaseTime: "12:00",
  timeZone: "America/Bogota",
  scheduleConfigured: true,
  releaseAllowedFrom: "2026-11-26T17:00:00.000Z",
  canReleaseNow: true,
  summary: { totalTeams: 40, withFinalGrade: 37, inProcess: 1, lessThanMinEvaluations: 1 },
  incompleteTeams: [{
    teamId: 301,
    teamCode: "N2-ISI-014",
    teamName: "Pixel",
    videogameName: "Stella",
    finalScore: 4.1,
    juniorEvaluations: 2,
    seniorEvaluations: 0,
    inProcess: true,
    reasons: ["MISSING_PROFESSOR_SCORE", "LESS_THAN_MIN_EVALUATIONS"],
  }],
};

describe("Publicación de notas finales (ARK-81)", () => {
  beforeEach(() => {
    mocks.fetchFinalGradeRelease.mockReset().mockResolvedValue(release);
    mocks.setFinalGradeRelease.mockReset().mockResolvedValue({ ...release, showFinalGrade: true });
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("muestra el resumen de equipos incompletos", async () => {
    render(<FinalGradeReleasePage />);
    expect(await screen.findByText(/N2-ISI-014/)).toBeTruthy();
    expect(screen.getByText("Sin nota de los profesores")).toBeTruthy();
    expect(screen.getByText("Menos de 3 evaluaciones de jurados")).toBeTruthy();
  });

  it("confirma y libera notas con equipos en proceso", async () => {
    render(<FinalGradeReleasePage />);
    fireEvent.click(await screen.findByRole("button", { name: "Liberar notas" }));
    await waitFor(() => expect(mocks.setFinalGradeRelease).toHaveBeenCalledWith(true));
    expect(window.confirm).toHaveBeenCalledWith('1 equipos verán "Nota en proceso". ¿Liberar las notas igualmente?');
  });

  it("oculta las notas sin confirmar equipos incompletos", async () => {
    mocks.fetchFinalGradeRelease.mockResolvedValue({ ...release, showFinalGrade: true });
    render(<FinalGradeReleasePage />);
    fireEvent.click(await screen.findByRole("button", { name: "Ocultar notas" }));
    await waitFor(() => expect(mocks.setFinalGradeRelease).toHaveBeenCalledWith(false));
  });
});
