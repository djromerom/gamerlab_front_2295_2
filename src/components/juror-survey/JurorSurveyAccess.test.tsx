import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchJurorSurveyStatus: vi.fn(),
  submitJurorSurvey: vi.fn(),
}));

vi.mock("@/features/jurors/survey/api/jurorSurvey", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/jurors/survey/api/jurorSurvey")>()),
  fetchJurorSurveyStatus: mocks.fetchJurorSurveyStatus,
  submitJurorSurvey: mocks.submitJurorSurvey,
}));

import { JurorSurveyAccess } from "@/components/juror-survey/JurorSurveyAccess";
import { JUROR_SURVEY_CHECK_STATE } from "@/lib/jurorSurvey";

const status = (over: Record<string, unknown> = {}) => ({
  editionId: 3,
  available: true,
  reason: null,
  answered: false,
  answeredAt: null,
  assigned: 2,
  evaluated: 2,
  ...over,
});

let lastState: unknown;
function StateSpy() {
  lastState = useLocation().state;
  return null;
}

function renderAccess(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/pendientes-calificar", state }]}>
      <Routes>
        <Route
          path="/pendientes-calificar"
          element={
            <>
              <JurorSurveyAccess />
              <StateSpy />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Acceso a la encuesta en el panel del jurado (ARK-184)", () => {
  beforeEach(() => {
    mocks.fetchJurorSurveyStatus.mockReset();
    mocks.submitJurorSurvey.mockReset();
    lastState = undefined;
  });
  afterEach(cleanup);

  it("no muestra nada si aún tiene evaluaciones pendientes", async () => {
    mocks.fetchJurorSurveyStatus.mockResolvedValue(
      status({ available: false, reason: "PENDING_EVALUATIONS", evaluated: 1 }),
    );
    renderAccess();

    await waitFor(() => expect(mocks.fetchJurorSurveyStatus).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "Responder encuesta" })).toBeNull();
  });

  it("no estorba si la consulta del estado falla", async () => {
    mocks.fetchJurorSurveyStatus.mockRejectedValue(new Error("red"));
    renderAccess();

    await waitFor(() => expect(mocks.fetchJurorSurveyStatus).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "Responder encuesta" })).toBeNull();
  });

  it("muestra «Responder encuesta» sin abrirla sola si no viene de un envío", async () => {
    mocks.fetchJurorSurveyStatus.mockResolvedValue(status());
    renderAccess();

    expect(await screen.findByRole("button", { name: "Responder encuesta" })).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Responder encuesta" }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
  });

  it("tras el último envío abre la encuesta sola y limpia el aviso de navegación", async () => {
    mocks.fetchJurorSurveyStatus.mockResolvedValue(status());
    renderAccess(JUROR_SURVEY_CHECK_STATE);

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Encuesta de experiencia del jurado")).toBeTruthy();
    await waitFor(() => expect(lastState).toBeNull());
  });

  it("si la omite, el acceso sigue disponible", async () => {
    mocks.fetchJurorSurveyStatus.mockResolvedValue(status());
    renderAccess(JUROR_SURVEY_CHECK_STATE);

    fireEvent.click(await screen.findByRole("button", { name: "Omitir" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("button", { name: "Responder encuesta" })).toBeTruthy();
  });

  it("el envío en lote vuelve a consultar y abre la encuesta", async () => {
    mocks.fetchJurorSurveyStatus
      .mockResolvedValueOnce(status({ available: false, reason: "PENDING_EVALUATIONS", evaluated: 0 }))
      .mockResolvedValue(status());
    function BatchHarness() {
      const [signal, setSignal] = useState(0);
      return (
        <>
          <button onClick={() => setSignal((n) => n + 1)}>Simular envío</button>
          <JurorSurveyAccess checkSignal={signal} />
        </>
      );
    }
    render(
      <MemoryRouter>
        <BatchHarness />
      </MemoryRouter>,
    );
    await waitFor(() => expect(mocks.fetchJurorSurveyStatus).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Simular envío" }));

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(mocks.fetchJurorSurveyStatus).toHaveBeenCalledTimes(2);
  });

  it("al responder desaparece el acceso", async () => {
    mocks.fetchJurorSurveyStatus.mockResolvedValue(status());
    mocks.submitJurorSurvey.mockResolvedValue({ outcome: "saved", message: "¡Gracias por contarnos tu experiencia!" });
    renderAccess();

    fireEvent.click(await screen.findByRole("button", { name: "Responder encuesta" }));
    for (const group of await screen.findAllByRole("group")) {
      fireEvent.click(group.querySelector('input[value="5"]') as HTMLInputElement);
    }
    fireEvent.click(screen.getByRole("button", { name: "Enviar encuesta" }));

    expect(await screen.findByText("¡Gracias por contarnos tu experiencia!")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Responder encuesta" })).toBeNull());
  });
});
