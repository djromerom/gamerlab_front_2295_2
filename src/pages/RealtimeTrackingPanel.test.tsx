import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RealtimeTrackingPanel } from "@/pages/RealtimeTrackingPanel";

const mocks = vi.hoisted(() => ({
  fetchAbsenceAlert: vi.fn(),
  fetchAbsencePanel: vi.fn(),
  fetchFairSchedule: vi.fn(),
  updateFairSchedule: vi.fn(),
  fetchEvaluationTracking: vi.fn(),
  fetchAbsentJurorHistory: vi.fn(),
  recordAbsentJurorResponse: vi.fn(),
  role: "Administrador",
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ userRole: mocks.role }),
}));

vi.mock("@/fetchs/absenceAlert", () => ({
  fetchAbsenceAlert: mocks.fetchAbsenceAlert,
  fetchAbsencePanel: mocks.fetchAbsencePanel,
  fetchFairSchedule: mocks.fetchFairSchedule,
  updateFairSchedule: mocks.updateFairSchedule,
}));

vi.mock("@/fetchs/evaluationTracking", () => ({
  fetchEvaluationTracking: mocks.fetchEvaluationTracking,
}));
vi.mock("@/fetchs/absentJurorResponses", () => ({
  fetchAbsentJurorHistory: mocks.fetchAbsentJurorHistory,
  recordAbsentJurorResponse: mocks.recordAbsentJurorResponse,
  AbsentJurorResponseError: class extends Error {
    constructor(message: string, readonly status: number) {
      super(message);
    }
  },
}));

vi.mock("@/components/grupo 9/app-sidebar", () => ({
  AppSidebar: () => <nav>Menú lateral</nav>,
}));

// La sección de presencia (HU-23) tiene sus propias pruebas y su propia consulta
vi.mock("@/components/juror-presence/JurorPresenceSection", () => ({
  JurorPresenceSection: ({ canConfigure }: { canConfigure?: boolean }) => (
    <section>Presencia de los jurados{canConfigure ? " · configurable" : ""}</section>
  ),
}));

const alert = {
  edition: { id: 5, title: "ARKAD 2026", status: "ACTIVE", writable: true },
  schedule: { fairDate: "2026-11-26", startTime: "08:00", alertTime: "10:00", controlTime: "11:00", closeTime: "12:00" },
  phase: "ALERT",
  alertActive: true,
  generatedAt: "2026-11-26T15:02:10.000Z",
  totals: { present: 42, missing: 71, total: 113 },
  missingJurors: [
    { jurorId: "j1", name: "Luis Gómez", category: "Junior", isProfessor: false, type: "OFFICIAL", state: "NO_CHECK_IN", checkedInAt: null },
  ],
  groups: [
    { teamId: 41, teamCode: "N2-AYP-07", teamName: "Pixel Pioneers", videogame: "Space Run", level: "N2", assignedJurors: 4, presentJurors: 3, evaluationsCounted: 1, missingEvaluations: 2 },
  ],
};

const panel = {
  edition: alert.edition,
  phase: "ALERT",
  generatedAt: alert.generatedAt,
  totals: alert.totals,
  data: [{
    ...alert.groups[0],
    jurors: [
      { jurorId: "j1", name: "Luis Gómez", category: "Junior", isProfessor: false, type: "OFFICIAL", state: "NO_CHECK_IN", checkedInAt: null, hasEvaluated: false },
      { jurorId: "j2", name: "Ana Ruiz", category: "Senior", isProfessor: false, type: "BACKUP", state: "PRESENT", checkedInAt: alert.generatedAt, hasEvaluated: true },
    ],
  }],
};

const tracking = {
  editionId: 5,
  date: "2026-11-26",
  generatedAt: alert.generatedAt,
  hours: [8, 9, 10, 11, 12],
  groups: [{
    teamId: 41,
    teamCode: "N2-AYP-07",
    teamName: "Pixel Pioneers",
    videogame: "Space Run",
    level: "N2",
    assignedJurors: 4,
    presentJurors: 3,
    evaluationsReceived: 1,
    evaluationsCounted: 1,
    byHour: [
      { hour: 8, received: 0, counted: 0 },
      { hour: 9, received: 0, counted: 0 },
      { hour: 10, received: 1, counted: 1 },
      { hour: 11, received: 1, counted: 1 },
      { hour: 12, received: 1, counted: 1 },
    ],
    belowMinimumAt11: true,
  }],
};

const renderPanel = () => render(
  <MemoryRouter>
    <RealtimeTrackingPanel />
  </MemoryRouter>,
);

describe("Panel de alertas HU-12 (ARK-180)", () => {
  beforeEach(() => {
    mocks.role = "Administrador";
    mocks.fetchAbsenceAlert.mockReset().mockResolvedValue(alert);
    mocks.fetchAbsencePanel.mockReset().mockResolvedValue(panel);
    mocks.fetchFairSchedule.mockReset().mockResolvedValue({ edition: alert.edition, configured: true, schedule: alert.schedule });
    mocks.updateFairSchedule.mockReset().mockResolvedValue({ edition: alert.edition, configured: true, schedule: alert.schedule });
    mocks.fetchEvaluationTracking.mockReset().mockResolvedValue(tracking);
    mocks.fetchAbsentJurorHistory.mockReset().mockResolvedValue({
      edition: { id: 5, title: "ARKAD 2026" },
      juror: { id: "j1", name: "Luis Gómez", category: "Junior" },
      data: [],
    });
    mocks.recordAbsentJurorResponse.mockReset().mockImplementation(async (payload) => ({
      id: 12,
      jurorId: payload.jurorId,
      result: payload.result,
      estimatedArrivalAt: payload.estimatedArrivalAt ?? null,
      recordedAt: "2026-11-26T15:02:41.000Z",
      recordedBy: { id: "admin-1", name: "Admin Arkad" },
    }));
    mocks.fetchEvaluationTracking.mockReset().mockResolvedValue(tracking);
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("muestra el contador, la lista de faltantes y los grupos necesitados", async () => {
    renderPanel();

    expect(await screen.findByText("Alerta informativa de inasistencia")).toBeTruthy();
    expect(screen.getAllByText("71").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Luis Gómez/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Faltan 2/).length).toBeGreaterThan(0);
  });

  it("el profesor ve el panel sin controles de configuración", async () => {
    mocks.role = "Profesor";
    renderPanel();

    await screen.findByText("Alerta informativa de inasistencia");
    expect(screen.queryByRole("button", { name: /Configurar cronograma/ })).toBeNull();
    expect(mocks.fetchFairSchedule).not.toHaveBeenCalled();
  });

  it("el administrador ve la presencia de los jurados (HU-23)", async () => {
    renderPanel();

    await screen.findByText("Alerta informativa de inasistencia");
    expect(screen.getByText("Presencia de los jurados · configurable")).toBeTruthy();
  });

  it("el profesor no ve la presencia de los jurados: el back solo se la da al administrador", async () => {
    mocks.role = "Profesor";
    renderPanel();

    await screen.findByText("Alerta informativa de inasistencia");
    expect(screen.queryByText(/Presencia de los jurados/)).toBeNull();
  });

  it("mantiene la alerta activa cuando todos llegaron pero faltan evaluaciones", async () => {
    mocks.fetchAbsenceAlert.mockResolvedValue({
      ...alert,
      totals: { present: 113, missing: 0, total: 113 },
      missingJurors: [],
    });
    renderPanel();

    expect(await screen.findByText("Alerta informativa de inasistencia")).toBeTruthy();
    expect(screen.getByText("No hay jurados pendientes.")).toBeTruthy();
    expect(screen.getAllByText(/Faltan 2/).length).toBeGreaterThan(0);
  });

  it("el administrador registra una respuesta y conserva el historial del jurado", async () => {
    renderPanel();
    await screen.findByText("Alerta informativa de inasistencia");

    fireEvent.click(screen.getByRole("button", { name: "Registrar respuesta" }));
    const responseDialog = await screen.findByRole("dialog", { name: "Registrar respuesta de Luis Gómez" });

    fireEvent.change(within(responseDialog).getByLabelText(/Hora estimada/), { target: { value: "2026-11-26T10:30" } });
    fireEvent.click(within(responseDialog).getByRole("button", { name: "Registrar respuesta" }));

    await screen.findByText("Respuesta registrada.");
    expect(mocks.recordAbsentJurorResponse).toHaveBeenCalledWith({
      jurorId: "j1",
      result: "ON_THE_WAY",
      estimatedArrivalAt: "2026-11-26T10:30:00-05:00",
    });
    expect(screen.getAllByText("Viene en camino").length).toBeGreaterThan(0);
  });

  it("filtra el panel por estado y pide el filtro al backend", async () => {
    renderPanel();
    await screen.findByText("Pixel Pioneers");

    fireEvent.change(screen.getByLabelText("Filtrar por asistencia"), { target: { value: "ABSENT" } });
    await waitFor(() => expect(mocks.fetchAbsencePanel).toHaveBeenCalledWith("ABSENT"));
  });

  it("actualiza la alerta cada 10 segundos", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderPanel();
    await screen.findByText("Alerta informativa de inasistencia");
    const callsBefore = mocks.fetchAbsenceAlert.mock.calls.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    await waitFor(() => expect(mocks.fetchAbsenceAlert.mock.calls.length).toBeGreaterThan(callsBefore));
  });

  it("permite al administrador abrir el cronograma", async () => {
    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: /Configurar cronograma/ }));

    expect(await screen.findByRole("dialog", { name: "Configurar cronograma" })).toBeTruthy();
    expect(screen.getByDisplayValue("2026-11-26")).toBeTruthy();
  });

  it("mantiene la última lista si una actualización falla", async () => {
    renderPanel();
    await screen.findByText("Pixel Pioneers");
    mocks.fetchAbsenceAlert.mockRejectedValueOnce(new Error("No se pudo actualizar"));

    fireEvent.click(screen.getByRole("button", { name: /Actualizar/ }));

    expect(await screen.findByText(/No se pudo actualizar/)).toBeTruthy();
    expect(screen.getByText("Pixel Pioneers")).toBeTruthy();
  });
});
