import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FinalGradeRelease } from "@/features/results/api/finalGrade";

const mocks = vi.hoisted(() => ({
  fetchFinalGradeRelease: vi.fn(),
  setFinalGradeRelease: vi.fn(),
  fetchShowRanking: vi.fn(),
}));
vi.mock("@/features/results/api/finalGrade", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/results/api/finalGrade")>()),
  fetchFinalGradeRelease: mocks.fetchFinalGradeRelease,
  setFinalGradeRelease: mocks.setFinalGradeRelease,
}));
vi.mock("@/features/editions/api/eventSettings", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/editions/api/eventSettings")>()),
  fetchShowRanking: mocks.fetchShowRanking,
}));

import FinalGradeReleaseCard from "@/features/editions/components/FinalGradeReleaseCard";
import { FinalGradeApiError } from "@/features/results/api/finalGrade";

const release: FinalGradeRelease = {
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
  summary: { totalTeams: 40, withFinalGrade: 40, inProcess: 0, lessThanMinEvaluations: 0 },
  incompleteTeams: [],
};
const withInProcess: FinalGradeRelease = {
  ...release,
  summary: { ...release.summary, withFinalGrade: 39, inProcess: 1 },
  incompleteTeams: [
    { teamId: 301, teamCode: "N2-ISI-014", teamName: "Pixel", videogameName: "Stella", finalScore: 4.1, juniorEvaluations: 2, seniorEvaluations: 0, inProcess: true, reasons: ["MISSING_PROFESSOR_SCORE"] },
  ],
};

const toggle = () => screen.findByRole("switch", { name: "Notas finales para los estudiantes" });

beforeEach(() => {
  mocks.fetchFinalGradeRelease.mockReset();
  mocks.setFinalGradeRelease.mockReset();
  mocks.fetchShowRanking.mockReset().mockResolvedValue(false);
});
afterEach(cleanup);

describe("FinalGradeReleaseCard (HU-46, ARK-302)", () => {
  it("A1: antes de la hora de cierre queda deshabilitada y dice desde cuándo", async () => {
    mocks.fetchFinalGradeRelease.mockResolvedValue({ ...release, canReleaseNow: false });
    render(<FinalGradeReleaseCard />);
    expect(await screen.findByText("Se puede activar desde las 12:00 del 26/11/2026 (hora de Colombia).")).toBeTruthy();
    expect((await toggle()).hasAttribute("disabled")).toBe(true);
  });

  it("sin equipos en proceso, libera con PATCH {show:true} sin preguntar", async () => {
    mocks.fetchFinalGradeRelease.mockResolvedValue(release);
    mocks.setFinalGradeRelease.mockResolvedValue({ ...release, showFinalGrade: true, releasedAt: "2026-11-26T17:05:00.000Z" });
    render(<FinalGradeReleaseCard />);
    const sw = await toggle();
    await waitFor(() => expect(sw.hasAttribute("disabled")).toBe(false));
    fireEvent.click(sw);
    await waitFor(() => expect(mocks.setFinalGradeRelease).toHaveBeenCalledWith(true));
    expect(await screen.findByText(/^Liberada el 26\/11\/2026/)).toBeTruthy();
    expect(sw.getAttribute("aria-checked")).toBe("true");
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("A2: con equipos en proceso pide confirmación; cancelar no libera", async () => {
    mocks.fetchFinalGradeRelease.mockResolvedValue(withInProcess);
    render(<FinalGradeReleaseCard />);
    const sw = await toggle();
    await waitFor(() => expect(sw.hasAttribute("disabled")).toBe(false));
    fireEvent.click(sw);
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog.textContent).toContain("Hay 1 equipo con la nota en proceso.");
    expect(dialog.textContent).toContain("N2-ISI-014 · Pixel");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(mocks.setFinalGradeRelease).not.toHaveBeenCalled();
    expect(sw.getAttribute("aria-checked")).toBe("false");
  });

  it("A2: al confirmar, libera", async () => {
    mocks.fetchFinalGradeRelease.mockResolvedValue(withInProcess);
    mocks.setFinalGradeRelease.mockResolvedValue({ ...withInProcess, showFinalGrade: true });
    render(<FinalGradeReleaseCard />);
    const sw = await toggle();
    await waitFor(() => expect(sw.hasAttribute("disabled")).toBe(false));
    fireEvent.click(sw);
    fireEvent.click(await screen.findByRole("button", { name: "Liberar de todos modos" }));
    await waitFor(() => expect(mocks.setFinalGradeRelease).toHaveBeenCalledWith(true));
  });

  it("apagarla oculta las notas y vuelve a leer «Ranking público» (el back también lo apaga)", async () => {
    mocks.fetchFinalGradeRelease.mockResolvedValue({ ...withInProcess, showFinalGrade: true, canReleaseNow: false });
    mocks.setFinalGradeRelease.mockResolvedValue({ ...withInProcess, showFinalGrade: false, canReleaseNow: false });
    const onRankingChange = vi.fn();
    render(<FinalGradeReleaseCard onRankingChange={onRankingChange} />);
    expect(await screen.findByText("Ocultar las notas también oculta el ranking público.")).toBeTruthy();
    const sw = await toggle();
    expect(sw.hasAttribute("disabled")).toBe(false);
    fireEvent.click(sw);
    await waitFor(() => expect(mocks.setFinalGradeRelease).toHaveBeenCalledWith(false));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    await waitFor(() => expect(onRankingChange).toHaveBeenCalledWith(false));
    expect(mocks.fetchShowRanking).toHaveBeenCalled();
  });

  it("si el back rechaza la liberación, vuelve a su estado y muestra el mensaje del back", async () => {
    mocks.fetchFinalGradeRelease.mockResolvedValue(release);
    mocks.setFinalGradeRelease.mockRejectedValue(
      new FinalGradeApiError(
        "La nota final se puede liberar a partir de las 12:00 del 26/11/2026 (hora de Colombia).",
        400,
        "FINAL_GRADE_RELEASE_TOO_EARLY",
      ),
    );
    render(<FinalGradeReleaseCard />);
    const sw = await toggle();
    await waitFor(() => expect(sw.hasAttribute("disabled")).toBe(false));
    fireEvent.click(sw);
    expect((await screen.findByRole("alert")).textContent).toBe(
      "La nota final se puede liberar a partir de las 12:00 del 26/11/2026 (hora de Colombia).",
    );
    expect(sw.getAttribute("aria-checked")).toBe("false");
  });

  it("si no carga, lo dice y permite reintentar", async () => {
    mocks.fetchFinalGradeRelease.mockRejectedValueOnce(new Error("No hay una edición activa.")).mockResolvedValue(release);
    render(<FinalGradeReleaseCard />);
    expect((await screen.findByRole("alert")).textContent).toContain("No hay una edición activa.");
    expect((await toggle()).hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(mocks.fetchFinalGradeRelease).toHaveBeenCalledTimes(2);
  });
});
