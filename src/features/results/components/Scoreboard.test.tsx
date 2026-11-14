import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchStudentFinalGrade: vi.fn(),
}));

vi.mock("@/features/results/api/finalGrade", () => ({
  fetchStudentFinalGrade: mocks.fetchStudentFinalGrade,
  FinalGradeApiError: class extends Error {
    constructor(message: string, readonly status: number) {
      super(message);
    }
  },
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1" }, userRole: "Estudiante" }),
}));
vi.mock("@/components/grupo 5/TeamCode.tsx", () => ({ default: () => null }));

import Scoreboard from "@/features/results/components/Scoreboard";

describe("Nota final del estudiante (ARK-81)", () => {
  beforeEach(() => {
    mocks.fetchStudentFinalGrade.mockReset();
  });

  afterEach(cleanup);

  it("muestra solo la nota disponible con dos decimales y su etiqueta", async () => {
    mocks.fetchStudentFinalGrade.mockResolvedValue({
      editionId: 5,
      team: { id: 301, teamName: "Pixel", teamCode: "N2-ISI-014" },
      released: true,
      status: "AVAILABLE",
      finalGrade: 3.5,
    });
    render(<Scoreboard />);

    await waitFor(() => expect(screen.getByText("3.50")).toBeTruthy());
    expect(screen.getByTestId("grade-label").textContent).toBe("Bueno");
    expect(screen.queryByText("Excelente")).toBeNull();
    expect(screen.queryByText(/Resultados de Evaluación/)).toBeNull();
  });

  it("no muestra una nota antes de liberarla", async () => {
    mocks.fetchStudentFinalGrade.mockResolvedValue({
      editionId: 5,
      team: { id: 301, teamName: "Pixel", teamCode: "N2-ISI-014" },
      released: false,
      status: "NOT_RELEASED",
      finalGrade: null,
    });
    render(<Scoreboard />);

    expect(await screen.findByText("La nota final se publica al terminar la feria")).toBeTruthy();
    expect(screen.queryByTestId("grade-label")).toBeNull();
  });

  it("muestra Nota en proceso sin nota parcial ni etiqueta", async () => {
    mocks.fetchStudentFinalGrade.mockResolvedValue({
      editionId: 5,
      team: { id: 301, teamName: "Pixel", teamCode: "N2-ISI-014" },
      released: true,
      status: "IN_PROCESS",
      finalGrade: null,
    });
    render(<Scoreboard />);

    expect(await screen.findByText("Nota en proceso")).toBeTruthy();
    expect(screen.queryByTestId("grade-label")).toBeNull();
  });

  it("equipo rechazado: lo dice y no muestra nota (BG-43)", async () => {
    mocks.fetchStudentFinalGrade.mockResolvedValue({
      editionId: 5,
      team: { id: 301, teamName: "Pixel", teamCode: "N2-ISI-014" },
      released: true,
      status: "REJECTED",
      finalGrade: null,
    });
    render(<Scoreboard />);

    expect(
      await screen.findByText("La inscripción de tu equipo fue rechazada, por eso no tiene nota final"),
    ).toBeTruthy();
    expect(screen.queryByText("Nota en proceso")).toBeNull();
    expect(screen.queryByTestId("grade-label")).toBeNull();
  });

  it("equipo presentador externo: dice que no se califica, no Nota en proceso (ARK-209)", async () => {
    mocks.fetchStudentFinalGrade.mockResolvedValue({
      editionId: 5,
      team: { id: 400, teamName: "Los Pixeles", teamCode: "N2-ABC-201" },
      released: true,
      status: "NOT_GRADABLE",
      finalGrade: null,
    });
    render(<Scoreboard />);

    expect(
      await screen.findByText("Tu equipo participa como presentador externo: no recibe calificación"),
    ).toBeTruthy();
    expect(screen.queryByText("Nota en proceso")).toBeNull();
    expect(screen.queryByTestId("grade-label")).toBeNull();
  });
});
