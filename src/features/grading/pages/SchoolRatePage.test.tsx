import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import SchoolRatePage from "@/features/grading/pages/SchoolRatePage";
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

const game = { id: 500, nombre: "Juego Epsilon", teamId: 500, equipo: "Equipo Epsilon" };

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/colegios-calificar/500", state: { game } }]}>
      <SchoolRatePage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
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
