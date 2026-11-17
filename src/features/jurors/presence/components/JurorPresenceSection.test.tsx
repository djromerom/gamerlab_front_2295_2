import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JurorPresenceSection } from "@/features/jurors/presence/components/JurorPresenceSection";
import type { JurorPresenceList } from "@/features/jurors/presence/api/jurorPresence";

const mocks = vi.hoisted(() => ({
  fetchJurorPresence: vi.fn(),
  fetchPresenceSettings: vi.fn(),
  updatePresenceSettings: vi.fn(),
}));

vi.mock("@/features/jurors/presence/api/jurorPresence", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/jurors/presence/api/jurorPresence")>()),
  fetchJurorPresence: (...args: unknown[]) => mocks.fetchJurorPresence(...args),
  fetchPresenceSettings: () => mocks.fetchPresenceSettings(),
  updatePresenceSettings: (...args: unknown[]) => mocks.updatePresenceSettings(...args),
}));

const settings = { promptEveryMinutes: 60, responseWindowMinutes: 15, inactivityMinutes: 45 };
const edition = { id: 5, title: "ARKAD 2026-30" };

const list: JurorPresenceList = {
  edition,
  serverTime: "2026-11-26T15:30:00.000Z",
  evaluationsOpen: true,
  settings,
  totals: { checkedIn: 42, presenceUnconfirmed: 3, possibleLeft: 2, withAnyIndicator: 4 },
  data: [
    {
      jurorId: "j-1",
      name: "Ana Pérez",
      category: "Senior",
      isProfessor: true,
      checkedInAt: "2026-11-26T13:05:12.000Z",
      lastConfirmedAt: "2026-11-26T14:06:00.000Z",
      lastActivityAt: null,
      nextPromptAt: "2026-11-26T15:06:00.000Z",
      indicators: ["PRESENCE_UNCONFIRMED", "POSSIBLE_LEFT"],
    },
  ],
};

describe("Presencia de los jurados en el panel (HU-23)", () => {
  beforeEach(() => {
    mocks.fetchJurorPresence.mockReset().mockResolvedValue(list);
    mocks.fetchPresenceSettings.mockReset().mockResolvedValue({ edition, settings });
    mocks.updatePresenceSettings.mockReset().mockResolvedValue({ edition, settings: { ...settings, responseWindowMinutes: 20 } });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("muestra los totales y los indicadores de cada jurado con horas de Colombia", async () => {
    render(<JurorPresenceSection />);

    const row = (await screen.findByText("Ana Pérez")).closest("tr")!;
    expect(screen.getByText("42")).toBeTruthy();
    expect(within(row).getByText("Presencia sin confirmar")).toBeTruthy();
    expect(within(row).getByText("Posible salida")).toBeTruthy();
    expect(within(row).getByText("Senior · Profesor")).toBeTruthy();
    expect(within(row).getByText(/8:05/)).toBeTruthy();
    expect(within(row).getByText("Ninguna")).toBeTruthy();
    // La próxima pregunta (10:06) ya pasó a las 10:30: no se muestra una hora vencida (ARK-261)
    expect(within(row).getByText("Ya se preguntó, sin responder")).toBeTruthy();
  });

  it("muestra la fecha de las llegadas y los «Sigo aquí» de otro día (ARK-261)", async () => {
    mocks.fetchJurorPresence.mockResolvedValue({
      ...list,
      serverTime: "2026-11-16T15:00:00.000Z",
      data: [{
        ...list.data[0],
        checkedInAt: "2026-11-06T13:05:00.000Z",
        lastConfirmedAt: "2026-11-11T05:17:00.000Z",
        nextPromptAt: "2026-11-11T06:17:00.000Z",
      }],
      evaluationsOpen: false,
    });
    render(<JurorPresenceSection />);

    const row = (await screen.findByText("Ana Pérez")).closest("tr")!;
    expect(within(row).getByText(/^06\/11, 8:05/)).toBeTruthy();
    expect(within(row).getByText(/^11\/11, 12:17/)).toBeTruthy();
    expect(within(row).getByText("Sin pregunta pendiente")).toBeTruthy();
  });

  it("por defecto pide los que tienen alguna alerta y filtra por indicador", async () => {
    render(<JurorPresenceSection />);
    await screen.findByText("Ana Pérez");
    expect(mocks.fetchJurorPresence).toHaveBeenCalledWith("ANY");

    fireEvent.click(screen.getByRole("tab", { name: "Posible salida" }));
    await waitFor(() => expect(mocks.fetchJurorPresence).toHaveBeenLastCalledWith("POSSIBLE_LEFT"));

    fireEvent.click(screen.getByRole("tab", { name: "Todos los que llegaron" }));
    await waitFor(() => expect(mocks.fetchJurorPresence).toHaveBeenLastCalledWith(undefined));
  });

  it("avisa cuando ningún jurado tiene alertas", async () => {
    mocks.fetchJurorPresence.mockResolvedValue({ ...list, data: [], totals: { ...list.totals, withAnyIndicator: 0 } });
    render(<JurorPresenceSection />);

    expect(await screen.findByText("Ningún jurado tiene alertas de presencia.")).toBeTruthy();
  });

  it("explica que con las evaluaciones cerradas no se marca a nadie", async () => {
    mocks.fetchJurorPresence.mockResolvedValue({ ...list, evaluationsOpen: false, data: [] });
    render(<JurorPresenceSection />);

    expect(await screen.findByText(/Las evaluaciones están cerradas/)).toBeTruthy();
  });

  it("se actualiza cada 10 segundos y conserva la última lista si una consulta falla", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<JurorPresenceSection />);
    await screen.findByText("Ana Pérez");

    mocks.fetchJurorPresence.mockRejectedValueOnce(new Error("No se pudo cargar la presencia de los jurados."));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    expect(await screen.findByText(/Se mantiene la última información disponible/)).toBeTruthy();
    expect(screen.getByText("Ana Pérez")).toBeTruthy();
    expect(mocks.fetchJurorPresence).toHaveBeenCalledTimes(2);
  });

  it("guarda solo los parámetros que cambiaron", async () => {
    render(<JurorPresenceSection />);
    await screen.findByText("Ana Pérez");

    fireEvent.click(screen.getByRole("button", { name: /Parámetros de presencia/ }));
    const dialog = await screen.findByRole("dialog", { name: "Parámetros de presencia" });
    const input = await within(dialog).findByLabelText(/Tiempo para responder/);
    expect((input as HTMLInputElement).value).toBe("15");

    fireEvent.change(input, { target: { value: "20" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar parámetros" }));

    await waitFor(() => expect(mocks.updatePresenceSettings).toHaveBeenCalledWith({ responseWindowMinutes: 20 }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("no envía parámetros fuera de rango", async () => {
    render(<JurorPresenceSection />);
    await screen.findByText("Ana Pérez");

    fireEvent.click(screen.getByRole("button", { name: /Parámetros de presencia/ }));
    const dialog = await screen.findByRole("dialog", { name: "Parámetros de presencia" });
    fireEvent.change(await within(dialog).findByLabelText(/Preguntar cada/), { target: { value: "5" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar parámetros" }));

    expect(await within(dialog).findByText("Preguntar cada: un número entero entre 10 y 240 minutos.")).toBeTruthy();
    expect(mocks.updatePresenceSettings).not.toHaveBeenCalled();
  });

  it("muestra los mensajes del back si rechaza los parámetros", async () => {
    mocks.updatePresenceSettings.mockRejectedValue(new Error("inactivityMinutes must not be greater than 240"));
    render(<JurorPresenceSection />);
    await screen.findByText("Ana Pérez");

    fireEvent.click(screen.getByRole("button", { name: /Parámetros de presencia/ }));
    const dialog = await screen.findByRole("dialog", { name: "Parámetros de presencia" });
    fireEvent.change(await within(dialog).findByLabelText(/Sin evaluar/), { target: { value: "50" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar parámetros" }));

    expect(await within(dialog).findByText("inactivityMinutes must not be greater than 240")).toBeTruthy();
  });

  it("sin permiso de escritura no ofrece cambiar los parámetros", async () => {
    render(<JurorPresenceSection canConfigure={false} />);
    await screen.findByText("Ana Pérez");

    expect(screen.queryByRole("button", { name: /Parámetros de presencia/ })).toBeNull();
  });
});
