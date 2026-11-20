import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RatePage from "@/features/grading/pages/RatePage";
import { INITIAL_AUTOSAVE_STATE } from "@/features/grading/lib/draftAutosaver";

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  toastError: vi.fn(),
  initialForm: null as { scores: Record<number, string>; comments: string } | null,
}));

vi.mock("@/lib/api", () => ({ apiFetch: mocks.apiFetch }));
vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, info: vi.fn(), success: vi.fn() },
}));
vi.mock("@/layouts/LayoutApplication", () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/features/grading/components/TeamVerification", () => ({
  TeamVerificationGate: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/hooks/useCriteria", () => {
  const criteria = [
    { id: 1, name: "Jugabilidad", weight: 0.5, description: "" },
    { id: 2, name: "Arte", weight: 0.3, description: "" },
    { id: 3, name: "Sonido", weight: 0.2, description: "" },
  ];
  return { useCriteria: () => ({ criteria, isLoading: false, error: null }) };
});
vi.mock("@/features/grading/hooks/useDraftAutosave", () => {
  const drafts = {
    start: vi.fn(),
    schedule: vi.fn(),
    stop: vi.fn(),
    resolveConflict: vi.fn(),
    stateOf: () => INITIAL_AUTOSAVE_STATE,
  };
  return {
    loadInitialDraft: () =>
      Promise.resolve({ form: mocks.initialForm, version: 0, needsSync: false, source: mocks.initialForm ? "server" : "none", remote: null }),
    useDraftAutosave: () => drafts,
  };
});

const game = { id: 77, nombre: "Juego Gamma", teamId: 5, equipo: "QA-Samuel Equipo 1" };

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/calificar", state: { game } }]}>
      <RatePage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mocks.initialForm = null;
  mocks.apiFetch.mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 201 }));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RatePage · criterios vacíos (ARK-249)", () => {
  it("con un criterio sin llenar no abre la confirmación, no envía y marca cuál falta", async () => {
    mocks.initialForm = { scores: { 1: "4", 2: "", 3: "3" }, comments: "" };
    renderPage();
    await screen.findByText("Criterios de Evaluación");

    expect(screen.getAllByText("—")).toHaveLength(1); // el vacío no se muestra como 0.00
    fireEvent.click(screen.getByRole("button", { name: "Enviar Evaluación" }));

    expect(mocks.toastError).toHaveBeenCalledWith("Califica todos los criterios antes de enviar. Falta: «Arte».");
    expect(screen.queryByText("¿Está seguro?")).toBeNull();
    expect(mocks.apiFetch).not.toHaveBeenCalled();

    expect(document.activeElement).toBe(document.getElementById("criterion-score-2"));
    expect(document.getElementById("criterion-score-2")?.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById("criterion-score-1")?.getAttribute("aria-invalid")).toBeNull();
    expect(screen.getByText("Falta calificar este criterio. Si la nota es 0, escribe 0.")).toBeTruthy();

    // Al escribir la nota desaparece la marca.
    fireEvent.change(document.getElementById("criterion-score-2")!, { target: { value: "2" } });
    expect(document.getElementById("criterion-score-2")?.getAttribute("aria-invalid")).toBeNull();
    expect(screen.queryByText("Falta calificar este criterio. Si la nota es 0, escribe 0.")).toBeNull();
  });

  it("un 0 escrito a mano sí se envía como 0", async () => {
    mocks.initialForm = { scores: { 1: "4", 2: "0", 3: "3.5" }, comments: "Bien" };
    renderPage();
    await screen.findByText("Criterios de Evaluación");

    fireEvent.click(screen.getByRole("button", { name: "Enviar Evaluación" }));
    expect(mocks.toastError).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar Envío" }));

    await waitFor(() => expect(mocks.apiFetch).toHaveBeenCalledTimes(1));
    const body = JSON.parse(mocks.apiFetch.mock.calls[0][1].body);
    expect(body.details.map(({ criterionId, score }: { criterionId: number; score: number }) => ({ criterionId, score }))).toEqual([
      { criterionId: 1, score: 4 },
      { criterionId: 2, score: 0 },
      { criterionId: 3, score: 3.5 },
    ]);
  });

  it("muestra legible el 400 del back por un puntaje nulo", async () => {
    mocks.initialForm = { scores: { 1: "4", 2: "1", 3: "3" }, comments: "" };
    mocks.apiFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          message: ["details.0.Cada puntaje debe ser un número entre 0 y 5: no puede ser nulo, vacío ni texto. Un 0 debe enviarse de forma explícita."],
          error: "Bad Request",
          statusCode: 400,
        }),
        { status: 400 },
      ),
    );
    renderPage();
    await screen.findByText("Criterios de Evaluación");

    fireEvent.click(screen.getByRole("button", { name: "Enviar Evaluación" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar Envío" }));

    const message =
      "Cada puntaje debe ser un número entre 0 y 5: no puede ser nulo, vacío ni texto. Un 0 debe enviarse de forma explícita.";
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith(message));
  });
});
