import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JurorPresenceProvider } from "@/features/jurors/presence/contexts/JurorPresenceContext";
import { JurorPresencePrompt } from "@/features/jurors/presence/components/JurorPresencePrompt";
import { JurorPresenceNotice } from "@/components/JurorPresenceNotice";
import { JurorPresenceError, type MyPresence } from "@/features/jurors/presence/api/jurorPresence";

const mocks = vi.hoisted(() => ({
  role: "Jurado" as string | null,
  fetchMyPresence: vi.fn(),
  confirmMyPresence: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ userRole: mocks.role }),
}));

vi.mock("@/features/jurors/presence/api/jurorPresence", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/jurors/presence/api/jurorPresence")>()),
  fetchMyPresence: () => mocks.fetchMyPresence(),
  confirmMyPresence: () => mocks.confirmMyPresence(),
}));

const base: MyPresence = {
  edition: { id: 5, title: "ARKAD 2026-30" },
  serverTime: "2026-11-26T14:20:00.000Z",
  evaluationsOpen: true,
  settings: { promptEveryMinutes: 60, responseWindowMinutes: 15, inactivityMinutes: 45 },
  checkedIn: true,
  checkedInAt: "2026-11-26T13:05:12.000Z",
  lastConfirmedAt: null,
  nextPromptAt: "2026-11-26T14:05:12.000Z",
  promptDue: true,
};

const confirmed: MyPresence = {
  ...base,
  lastConfirmedAt: base.serverTime,
  nextPromptAt: "2026-11-26T15:20:00.000Z",
  promptDue: false,
};

const renderPrompt = () => render(
  <JurorPresenceProvider>
    <JurorPresenceNotice />
    <JurorPresencePrompt />
  </JurorPresenceProvider>,
);

describe("Ventana «¿Sigues en la feria?» (HU-23)", () => {
  beforeEach(() => {
    mocks.role = "Jurado";
    mocks.fetchMyPresence.mockReset().mockResolvedValue(base);
    mocks.confirmMyPresence.mockReset().mockResolvedValue(confirmed);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("aparece cuando el back dice que toca preguntar y se cierra con «Sigo aquí»", async () => {
    renderPrompt();

    const dialog = await screen.findByRole("alertdialog", { name: "¿Sigues en la feria?" });
    expect(within(dialog).getByText(/cada hora te preguntaremos si sigues aquí/)).toBeTruthy();
    expect(within(dialog).getByText(/Si no respondes en 15 minutos/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Sigo aquí" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(mocks.confirmMyPresence).toHaveBeenCalledTimes(1);
    // La ayuda muestra la próxima pregunta en hora de Colombia
    expect(screen.getByText(/Próxima pregunta hacia las 10:20/)).toBeTruthy();
  });

  it("no aparece si todavía no toca", async () => {
    mocks.fetchMyPresence.mockResolvedValue(confirmed);
    renderPrompt();

    await waitFor(() => expect(mocks.fetchMyPresence).toHaveBeenCalled());
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("no consulta nada para roles sin pantallas de jurado", async () => {
    mocks.role = "Estudiante";
    renderPrompt();

    await act(async () => {});
    expect(mocks.fetchMyPresence).not.toHaveBeenCalled();
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("el profesor también recibe la pregunta", async () => {
    mocks.role = "Profesor";
    renderPrompt();

    expect(await screen.findByRole("alertdialog", { name: "¿Sigues en la feria?" })).toBeTruthy();
  });

  it("sin llegada registrada no muestra la ayuda", async () => {
    mocks.fetchMyPresence.mockResolvedValue({ ...base, checkedIn: false, checkedInAt: null, nextPromptAt: null, promptDue: false });
    renderPrompt();

    await waitFor(() => expect(mocks.fetchMyPresence).toHaveBeenCalled());
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("sin conexión deja la ventana en pantalla y reintenta al volver la conexión", async () => {
    mocks.confirmMyPresence
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(confirmed);
    renderPrompt();

    fireEvent.click(await screen.findByRole("button", { name: "Sigo aquí" }));

    expect(await screen.findByText(/la enviaremos apenas vuelva la conexión/)).toBeTruthy();
    expect(screen.getByRole("alertdialog")).toBeTruthy();

    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });

    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(mocks.confirmMyPresence).toHaveBeenCalledTimes(2);
  });

  it("con un 5xx también reintenta solo cada cierto tiempo", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mocks.confirmMyPresence
      .mockRejectedValueOnce(new JurorPresenceError("Error del servidor", 503))
      .mockResolvedValueOnce(confirmed);
    renderPrompt();

    fireEvent.click(await screen.findByRole("button", { name: "Sigo aquí" }));
    await screen.findByText(/la enviaremos apenas vuelva la conexión/);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(mocks.confirmMyPresence).toHaveBeenCalledTimes(2);
  });

  it("si no tiene llegada registrada (409) muestra el mensaje del back", async () => {
    mocks.confirmMyPresence.mockRejectedValue(new JurorPresenceError(
      "Tu llegada a la feria todavía no está registrada. Pasa por la mesa de escarapelas.",
      409,
      "JUROR_NOT_CHECKED_IN",
    ));
    renderPrompt();

    fireEvent.click(await screen.findByRole("button", { name: "Sigo aquí" }));

    expect((await screen.findByRole("alert")).textContent).toMatch(/Pasa por la mesa de escarapelas/);
    fireEvent.click(screen.getByRole("button", { name: "Entendido" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it("vuelve a consultar justo cuando llega la próxima pregunta", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mocks.fetchMyPresence
      .mockResolvedValueOnce({ ...confirmed, serverTime: "2026-11-26T15:19:30.000Z" })
      .mockResolvedValue({ ...base, serverTime: "2026-11-26T15:20:01.000Z", nextPromptAt: "2026-11-26T15:20:00.000Z" });
    renderPrompt();

    await waitFor(() => expect(mocks.fetchMyPresence).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alertdialog")).toBeNull();

    // Faltan 30 s según el servidor: consulta a los 31 s, no al minuto
    await act(async () => {
      await vi.advanceTimersByTimeAsync(31_000);
    });

    expect(await screen.findByRole("alertdialog", { name: "¿Sigues en la feria?" })).toBeTruthy();
    expect(mocks.fetchMyPresence).toHaveBeenCalledTimes(2);
  });

  it("si una consulta falla, conserva el estado y sigue consultando", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mocks.fetchMyPresence
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValue(base);
    renderPrompt();

    await waitFor(() => expect(mocks.fetchMyPresence).toHaveBeenCalledTimes(1));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(await screen.findByRole("alertdialog", { name: "¿Sigues en la feria?" })).toBeTruthy();
  });
});
