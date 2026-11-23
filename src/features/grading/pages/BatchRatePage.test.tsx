import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import BatchRatePage from "@/features/grading/pages/BatchRatePage";
import { INITIAL_AUTOSAVE_STATE } from "@/features/grading/lib/draftAutosaver";

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  stop: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ apiFetch: mocks.apiFetch }));
vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, info: vi.fn(), success: mocks.toastSuccess },
}));
vi.mock("@/layouts/LayoutApplication", () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ userRole: "Jurado" }) }));
vi.mock("@/components/JurorSurveyAccess", () => ({ JurorSurveyAccess: () => null }));
vi.mock("@/features/teams/hooks/useTeamVerification", () => ({
  useTeamVerification: () => ({
    isLoading: false,
    isVerified: () => true,
    markVerified: vi.fn(),
    getLockedUntil: () => null,
    isLockEstimated: () => false,
    markLocked: vi.fn(),
  }),
}));
vi.mock("@/hooks/useCriteria", () => {
  const criteria = [
    { id: 1, name: "Jugabilidad", weight: 0.5, description: "" },
    { id: 2, name: "Arte", weight: 0.5, description: "" },
  ];
  return { useCriteria: () => ({ criteria, isLoading: false, error: null }) };
});
vi.mock("@/features/grading/hooks/useDraftAutosave", () => {
  const drafts = {
    start: vi.fn(),
    schedule: vi.fn(),
    stop: mocks.stop,
    resolveConflict: vi.fn(),
    stateOf: () => INITIAL_AUTOSAVE_STATE,
  };
  const forms: Record<number, { scores: Record<number, string>; comments: string }> = {
    10: { scores: { 1: "4", 2: "3" }, comments: "Juego uno" },
    11: { scores: { 1: "5", 2: "2.5" }, comments: "Juego dos" },
  };
  return {
    loadInitialDrafts: (ids: number[]) =>
      Promise.resolve(
        new Map(ids.map((id) => [id, { form: forms[id], version: 1, needsSync: false, source: "server", remote: null }])),
      ),
    useDraftAutosave: () => drafts,
  };
});

const game = (id: number, nombre: string) => ({
  id,
  nombre,
  equipo: `Equipo ${id}`,
  teamId: id,
  materia: "Programación",
  nrc: "1234",
  participantes: [],
  descripcion: "",
});
const games = [game(10, "Juego Uno"), game(11, "Juego Dos")];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/calificar-lote", state: { games, from: "jurado" } }]}>
      <BatchRatePage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.apiFetch.mockReset();
});

describe("BatchRatePage · sin llegada registrada en la mesa (BG-71, ARK-286)", () => {
  const MESSAGE = "Registra tu llegada en la mesa de ARKAD para poder calificar.";

  it("el 409 de todo el lote muestra el aviso, no limpia ningún juego y al reintentar envía lo mismo", async () => {
    mocks.apiFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ statusCode: 409, code: "JUROR_NOT_CHECKED_IN", message: MESSAGE }), { status: 409 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: {
              successful: [
                { videogameId: 10, evaluationId: 1 },
                { videogameId: 11, evaluationId: 2 },
              ],
              failed: [],
            },
          }),
          { status: 201 },
        ),
      );
    renderPage();
    const submit = await screen.findByRole("button", { name: "Guardar todas (2)" });

    fireEvent.click(submit);
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith(MESSAGE));

    // No se muestra el resultado ni se cierra ningún borrador; lo escrito sigue en cada pestaña.
    expect(screen.queryByText("Resultado de la calificación")).toBeNull();
    expect(mocks.stop).not.toHaveBeenCalled();
    const values = () => screen.getAllByPlaceholderText("0-5").map((input) => (input as HTMLInputElement).value);
    expect(values()).toEqual(["4", "3"]);
    expect(screen.getByDisplayValue("Juego uno")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Juego Dos" }));
    expect(values()).toEqual(["5", "2.5"]);
    expect(screen.getByDisplayValue("Juego dos")).toBeTruthy();

    // La mesa registró la llegada: reintenta con el mismo lote.
    fireEvent.click(screen.getByRole("button", { name: "Guardar todas (2)" }));
    expect(await screen.findByText("Resultado de la calificación")).toBeTruthy();

    const [first, second] = mocks.apiFetch.mock.calls.map((call) => call[1]);
    expect(second.headers["Idempotency-Key"]).toBe(first.headers["Idempotency-Key"]);
    expect(second.body).toBe(first.body);
    expect(mocks.stop).toHaveBeenCalledTimes(2);
  });

  it("un 403 sigue mostrando el motivo del back, no el aviso de llegada", async () => {
    mocks.apiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ statusCode: 403, message: "La edición no está activa." }), { status: 403 }),
    );
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Guardar todas (2)" }));

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("La edición no está activa."));
    expect(mocks.toastError).not.toHaveBeenCalledWith(MESSAGE);
  });
});
