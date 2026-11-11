import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchJurorSurveySummary: vi.fn(),
  downloadJurorSurveyExport: vi.fn(),
  fetchEditions: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/fetchs/jurorSurvey", () => ({
  fetchJurorSurveySummary: mocks.fetchJurorSurveySummary,
  downloadJurorSurveyExport: mocks.downloadJurorSurveyExport,
}));
vi.mock("@/fetchs/editions", () => ({ fetchEditions: mocks.fetchEditions }));
vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("@/layouts/LayoutAplication", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import JurorSurveyResultsPage from "@/pages/admin/JurorSurveyResultsPage";
import { SURVEY_QUESTIONS } from "@/lib/jurorSurvey";

const empty = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };

const summary = {
  edition: { id: 3, title: "Feria Gamer 2025 - S2", year: 2025, semester: 30 },
  totals: { responses: 1, jurorsFinished: 2, editionJurors: 4 },
  fields: SURVEY_QUESTIONS.map(({ key, label }) =>
    key === "loginEase"
      ? { key, label, average: 4.5, distribution: { ...empty, "4": 1, "5": 1 } }
      : { key, label, average: null, distribution: empty },
  ),
  comments: [
    {
      jurorName: "Juror Junior",
      email: "jurorjunior@uninorte.edu.co",
      role: "Jurado",
      comments: "La sesión se cerró una vez; el resto bien.",
      createdAt: "2026-11-08T05:08:20.542Z",
    },
  ],
};

describe("Resultados de la encuesta del jurado (ARK-184)", () => {
  beforeEach(() => {
    mocks.fetchJurorSurveySummary.mockReset().mockResolvedValue(summary);
    mocks.downloadJurorSurveyExport.mockReset().mockResolvedValue("encuesta_jurados_2025-30_2026-11-08.xlsx");
    mocks.fetchEditions.mockReset().mockResolvedValue([
      { id: 2, title: "Feria Gamer 2025 - S1", year: 2025, semester: 10 },
      { id: 3, title: "Feria Gamer 2025 - S2", year: 2025, semester: 30 },
    ]);
    mocks.toast.success.mockReset();
    mocks.toast.error.mockReset();
  });
  afterEach(cleanup);

  it("muestra «respondieron X de Y» y los totales de la edición activa", async () => {
    render(<JurorSurveyResultsPage />);

    expect(await screen.findByText("Respondieron 1 de 2")).toBeTruthy();
    expect(screen.getByText("2 de 4")).toBeTruthy();
    expect(screen.getByText("50%")).toBeTruthy();
    expect(mocks.fetchJurorSurveySummary).toHaveBeenCalledWith(null);
  });

  it("muestra el promedio y la distribución de cada pregunta", async () => {
    render(<JurorSurveyResultsPage />);

    await screen.findByText("Respondieron 1 de 2");
    expect(screen.getByText("4,5")).toBeTruthy();
    const login = screen.getByRole("list", {
      name: "Distribución: Facilidad para iniciar sesión y entrar a la plataforma",
    });
    expect(within(login).getAllByText("1 (50%)")).toHaveLength(2);
    expect(screen.getAllByText("Sin respuestas")).toHaveLength(5);
  });

  it("muestra los comentarios con el jurado", async () => {
    render(<JurorSurveyResultsPage />);

    expect(await screen.findByText("La sesión se cerró una vez; el resto bien.")).toBeTruthy();
    expect(screen.getByText("Juror Junior")).toBeTruthy();
    expect(screen.getByText("jurorjunior@uninorte.edu.co")).toBeTruthy();
  });

  it("al cambiar de edición pide su resumen y exporta esa edición", async () => {
    render(<JurorSurveyResultsPage />);
    await screen.findByText("Respondieron 1 de 2");
    await screen.findByRole("option", { name: /Feria Gamer 2025 - S1/ });

    fireEvent.change(screen.getByLabelText("Edición"), { target: { value: "2" } });
    await waitFor(() => expect(mocks.fetchJurorSurveySummary).toHaveBeenLastCalledWith(2));

    fireEvent.click(await screen.findByRole("button", { name: "Exportar a Excel" }));
    await waitFor(() => expect(mocks.downloadJurorSurveyExport).toHaveBeenCalledWith(2));
    expect(mocks.toast.success).toHaveBeenCalledWith("Descargado encuesta_jurados_2025-30_2026-11-08.xlsx");
  });

  it("sin edición elegida exporta la edición del resumen", async () => {
    render(<JurorSurveyResultsPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Exportar a Excel" }));
    await waitFor(() => expect(mocks.downloadJurorSurveyExport).toHaveBeenCalledWith(3));
  });

  it("muestra el error del back si el resumen falla", async () => {
    mocks.fetchJurorSurveySummary.mockRejectedValue(new Error("No hay una edición activa"));
    render(<JurorSurveyResultsPage />);

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      expect.stringContaining("No hay una edición activa"),
    );
    expect((screen.getByRole("button", { name: "Exportar a Excel" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("avisa si todavía nadie ha respondido", async () => {
    mocks.fetchJurorSurveySummary.mockResolvedValue({
      ...summary,
      totals: { responses: 0, jurorsFinished: 0, editionJurors: 4 },
      comments: [],
    });
    render(<JurorSurveyResultsPage />);

    expect(await screen.findByText("Todavía nadie ha respondido la encuesta en esta edición.")).toBeTruthy();
    expect(screen.getByText("Aún no hay comentarios.")).toBeTruthy();
  });
});
