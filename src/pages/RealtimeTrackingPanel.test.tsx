import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RealtimeTrackingPanel } from "@/pages/RealtimeTrackingPanel";

const mocks = vi.hoisted(() => ({
  fetchAbsenceAlert: vi.fn(),
  fetchAbsencePanel: vi.fn(),
  fetchFairSchedule: vi.fn(),
  updateFairSchedule: vi.fn(),
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

vi.mock("@/components/grupo 9/app-sidebar", () => ({
  AppSidebar: () => <nav>Menú lateral</nav>,
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
