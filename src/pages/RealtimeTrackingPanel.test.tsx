import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RealtimeTrackingPanel } from "@/pages/RealtimeTrackingPanel";

const apiFetch = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({ apiFetch }));

// El sidebar real depende de la sesión: aquí solo importa la página
vi.mock("@/components/grupo 9/app-sidebar", () => ({
  AppSidebar: () => <nav>Menú lateral</nav>,
}));

const tracking = {
  editionId: 5,
  date: "2026-11-04",
  generatedAt: "2026-11-04T14:00:00.000Z",
  hours: [8, 9, 10, 11, 12],
  groups: [
    {
      teamId: 1,
      teamCode: "N2-01",
      teamName: "Equipo Uno",
      videogame: "Juego Uno",
      level: "N2",
      assignedJurors: 3,
      presentJurors: 2,
      evaluationsReceived: 4,
      evaluationsCounted: 3,
      byHour: [{ hour: 9, received: 4, counted: 3 }],
      belowMinimumAt11: false,
    },
  ],
};

const renderPanel = async () => {
  render(
    <MemoryRouter>
      <RealtimeTrackingPanel />
    </MemoryRouter>,
  );
  await screen.findByText("Equipo Uno");
};

const openHelp = (label: string) =>
  fireEvent.click(screen.getByRole("button", { name: `Qué significa ${label}` }));

describe("Ayuda del panel de seguimiento (ARK-143)", () => {
  beforeEach(() => {
    apiFetch.mockReset();
    apiFetch.mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(tracking), { status: 200 })),
    );
    // jsdom no implementa matchMedia y SidebarProvider lo usa para detectar móvil
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    // Radix mide el popover con ResizeObserver, que jsdom tampoco trae
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("explica al inicio para qué sirve y que se actualiza solo", async () => {
    await renderPanel();

    expect(screen.getByText(/para detectar a tiempo los que van atrasados/)).toBeTruthy();
    expect(screen.getByText(/Se actualiza solo cada 10 segundos/)).toBeTruthy();
  });

  it("explica cómo ordenar por menos evaluaciones y cómo filtrar por nivel", async () => {
    await renderPanel();

    expect(screen.getByText(/los grupos con menos evaluaciones salen primero/)).toBeTruthy();
    expect(screen.getByText(/elige\s+un nivel para ver solo sus grupos/)).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Ordenar grupos" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Filtrar por nivel" })).toBeTruthy();
  });

  it.each([
    ["Grupo", /con su código y su videojuego/],
    ["Nivel", /tomado de su código/],
    ["Asignados", /Jurados asignados al grupo, incluidos los suplentes/],
    ["Presentes", /ya registraron su llegada/],
    ["Recibidas", /Evaluaciones enviadas para el grupo/],
    ["Cuentan", /se tienen en cuenta en el seguimiento/],
  ])("la columna %s tiene su ayuda", async (label, help) => {
    await renderPanel();

    openHelp(label);

    expect(await screen.findByText(help)).toBeTruthy();
  });

  it.each(tracking.hours)("la columna de las %s:00 explica lo que tenía el grupo a esa hora", async (hour) => {
    await renderPanel();

    openHelp(`${hour}:00`);

    expect(await screen.findByText(new RegExp(`tenía el grupo a las ${hour}:00`))).toBeTruthy();
    expect(screen.getByText(/El primer número son las que cuentan y el segundo, las recibidas/)).toBeTruthy();
  });

  it("usa el término suplente y nunca remanente", async () => {
    await renderPanel();

    openHelp("Asignados");
    await screen.findByText(/suplentes/);

    expect(document.body.textContent).not.toMatch(/remanente/i);
  });

  it("refresca cada 10 segundos sin cerrar la ayuda abierta", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await renderPanel();
    openHelp("Cuentan");
    await screen.findByText(/se tienen en cuenta en el seguimiento/);
    const callsBefore = apiFetch.mock.calls.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    await waitFor(() => expect(apiFetch.mock.calls.length).toBe(callsBefore + 1));
    expect(screen.getByText(/se tienen en cuenta en el seguimiento/)).toBeTruthy();
  });

  it("al filtrar por nivel pide ese nivel al backend", async () => {
    await renderPanel();

    fireEvent.change(screen.getByRole("combobox", { name: "Filtrar por nivel" }), {
      target: { value: "N2" },
    });

    await waitFor(() => expect(String(apiFetch.mock.lastCall?.[0])).toContain("level=N2"));
  });
});
