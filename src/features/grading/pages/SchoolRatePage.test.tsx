import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import SchoolRatePage from "@/features/grading/pages/SchoolRatePage";
import { INITIAL_AUTOSAVE_STATE } from "@/features/grading/lib/draftAutosaver";

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  initialForm: null as { scores: Record<number, string>; comments: string } | null,
}));

vi.mock("@/lib/api", () => ({ apiFetch: mocks.apiFetch }));
vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, info: vi.fn(), success: mocks.toastSuccess },
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

const game = { id: 500, nombre: "Juego Epsilon", teamId: 500, equipo: "Equipo Epsilon" };

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/colegios-calificar/500", state: { game } }]}>
      <SchoolRatePage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  mocks.initialForm = null;
  cleanup();
  vi.clearAllMocks();
  mocks.apiFetch.mockReset();
});

describe("SchoolRatePage · celular a 360 px (ARK-295)", () => {
  it("la caja «Nota Final» ocupa el ancho disponible y se envuelve, sin la clase inválida w-80px", async () => {
    renderPage();
    await screen.findByText("Criterios de Evaluación");

    const box = screen.getByText("Nota Final").parentElement!.parentElement!;
    expect(box.className).not.toContain("w-80px");
    expect(box.classList).toContain("w-full");
    expect(box.classList).toContain("sm:w-auto");
    expect(box.classList).toContain("flex-wrap");
  });

  it("el botón de envío no tiene un ancho mínimo fijo en celular", async () => {
    renderPage();
    const submit = await screen.findByRole("button", { name: "Enviar Evaluación" });
    expect(submit.classList).toContain("w-full");
    expect(submit.classList).not.toContain("min-w-[170px]");
    expect(submit.classList).toContain("sm:min-w-[170px]");
  });
});

describe("SchoolRatePage · sin llegada registrada en la mesa (BG-71, ARK-286)", () => {
  it("muestra el aviso, no limpia lo escrito y al reintentar envía lo mismo", async () => {
    const MESSAGE = "Registra tu llegada en la mesa de ARKAD para poder calificar.";
    mocks.initialForm = { scores: { 1: "4", 2: "2.5", 3: "5" }, comments: "Gran idea" };
    mocks.apiFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ statusCode: 409, code: "JUROR_NOT_CHECKED_IN", message: MESSAGE }), { status: 409 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ evaluationId: 1 }), { status: 201 }));
    renderPage();
    await screen.findByText("Criterios de Evaluación");

    fireEvent.click(screen.getByRole("button", { name: "Enviar Evaluación" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar Envío" }));

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith(MESSAGE));
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect([1, 2, 3].map((id) => (document.getElementById(`criterion-score-${id}`) as HTMLInputElement).value)).toEqual([
      "4",
      "2.5",
      "5",
    ]);
    expect(screen.getByDisplayValue("Gran idea")).toBeTruthy();

    // La mesa registró la llegada: reintenta con el mismo formulario.
    fireEvent.click(screen.getByRole("button", { name: "Enviar Evaluación" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar Envío" }));
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalled());
    const sent = mocks.apiFetch.mock.calls.map((call) => {
      const body = JSON.parse(call[1].body);
      return { comments: body.comments, scores: body.details.map((d: { score: number }) => d.score) };
    });
    expect(sent[1]).toEqual(sent[0]);
    expect(sent[1]).toEqual({ comments: "Gran idea", scores: [4, 2.5, 5] });
  });
});
