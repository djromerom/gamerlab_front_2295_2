import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  JurorPresenceError,
  MY_PRESENCE_POLL_MS,
  changedSettings,
  confirmMyPresence,
  describeInterval,
  fetchJurorPresence,
  fetchMyPresence,
  formatBogotaTime,
  isRetryableConfirmError,
  msUntilNextPrompt,
  nextCheckDelay,
  presenceHelp,
  updatePresenceSettings,
  validatePresenceSettings,
  type MyPresence,
} from "@/fetchs/jurorPresence";

const apiFetch = vi.fn();
vi.mock("@/lib/api", () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }));

const settings = { promptEveryMinutes: 60, responseWindowMinutes: 15, inactivityMinutes: 45 };

const presence: MyPresence = {
  edition: { id: 5, title: "ARKAD 2026-30" },
  serverTime: "2026-11-26T14:20:00.000Z",
  evaluationsOpen: true,
  settings,
  checkedIn: true,
  checkedInAt: "2026-11-26T13:05:12.000Z",
  lastConfirmedAt: null,
  nextPromptAt: "2026-11-26T14:25:00.000Z",
  promptDue: false,
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("fetchs de presencia del jurado (HU-23)", () => {
  beforeEach(() => apiFetch.mockReset());

  it("consulta y confirma la presencia del jurado en sus rutas", async () => {
    apiFetch.mockResolvedValueOnce(json(200, presence)).mockResolvedValueOnce(json(201, { ...presence, promptDue: false }));

    await fetchMyPresence();
    await confirmMyPresence();

    expect(apiFetch).toHaveBeenNthCalledWith(1, "http://api.test/juror-presence/me");
    expect(apiFetch).toHaveBeenNthCalledWith(2, "http://api.test/juror-presence/me/confirm", { method: "POST" });
  });

  it("manda el filtro de indicador solo cuando hay uno", async () => {
    apiFetch.mockImplementation(async () => json(200, { data: [] }));

    await fetchJurorPresence();
    await fetchJurorPresence("POSSIBLE_LEFT");

    expect(apiFetch).toHaveBeenNthCalledWith(1, "http://api.test/juror-presence");
    expect(apiFetch).toHaveBeenNthCalledWith(2, "http://api.test/juror-presence?indicator=POSSIBLE_LEFT");
  });

  it("el 409 trae el mensaje y el código del back", async () => {
    apiFetch.mockResolvedValue(json(409, {
      statusCode: 409,
      code: "JUROR_NOT_CHECKED_IN",
      message: "Tu llegada a la feria todavía no está registrada. Pasa por la mesa de escarapelas.",
    }));

    const error = await confirmMyPresence().catch((err) => err);

    expect(error).toBeInstanceOf(JurorPresenceError);
    expect(error.status).toBe(409);
    expect(error.code).toBe("JUROR_NOT_CHECKED_IN");
    expect(error.message).toMatch(/Pasa por la mesa de escarapelas/);
  });

  it("traduce el 404 sin edición activa", async () => {
    apiFetch.mockResolvedValue(json(404, { code: "NO_ACTIVE_EDITION", message: "No active edition" }));

    await expect(fetchMyPresence()).rejects.toThrow("No hay una feria activa.");
  });

  it("envía solo los parámetros que cambian y junta los mensajes del 400", async () => {
    apiFetch.mockResolvedValue(json(400, { message: ["promptEveryMinutes must not be less than 10"] }));

    await expect(updatePresenceSettings({ promptEveryMinutes: 5 })).rejects.toThrow("promptEveryMinutes must not be less than 10");
    expect(apiFetch).toHaveBeenCalledWith("http://api.test/juror-presence/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptEveryMinutes: 5 }),
    });
  });
});

describe("reglas de la ventana «¿Sigues en la feria?»", () => {
  afterEach(() => vi.useRealTimers());

  it("reintenta sin conexión o con 5xx, pero no con un 4xx", () => {
    expect(isRetryableConfirmError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isRetryableConfirmError(new JurorPresenceError("Error", 503))).toBe(true);
    expect(isRetryableConfirmError(new JurorPresenceError("Sin llegada", 409, "JUROR_NOT_CHECKED_IN"))).toBe(false);
    expect(isRetryableConfirmError(new JurorPresenceError("Sin permiso", 403))).toBe(false);
  });

  it("calcula la cuenta regresiva con la hora del servidor, no la del celular", () => {
    // El reloj del celular va 2 horas adelantado: no debe importar
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-26T16:20:00.000Z"));

    expect(msUntilNextPrompt(presence)).toBe(5 * 60_000);
    expect(msUntilNextPrompt({ ...presence, nextPromptAt: null })).toBeNull();
  });

  it("vuelve a consultar cada minuto, o justo después de la próxima pregunta si llega antes", () => {
    expect(nextCheckDelay(presence)).toBe(MY_PRESENCE_POLL_MS);
    expect(nextCheckDelay({ ...presence, nextPromptAt: "2026-11-26T14:20:20.000Z" })).toBe(21_000);
    expect(nextCheckDelay({ ...presence, promptDue: true })).toBe(MY_PRESENCE_POLL_MS);
    expect(nextCheckDelay(null)).toBe(MY_PRESENCE_POLL_MS);
  });

  it("describe el intervalo de la edición en la ayuda", () => {
    expect(describeInterval(60)).toBe("cada hora");
    expect(describeInterval(120)).toBe("cada 2 horas");
    expect(describeInterval(30)).toBe("cada 30 minutos");
    expect(presenceHelp(settings)).toBe(
      "Mantén la plataforma abierta durante la feria: cada hora te preguntaremos si sigues aquí.",
    );
  });

  it("muestra las horas en hora de Colombia", () => {
    expect(formatBogotaTime("2026-11-26T14:05:00.000Z")).toMatch(/9:05/);
    expect(formatBogotaTime(null)).toBe("—");
  });
});

describe("parámetros de presencia", () => {
  it("valida los rangos del back", () => {
    expect(validatePresenceSettings(settings)).toEqual([]);
    expect(validatePresenceSettings({ promptEveryMinutes: 5, responseWindowMinutes: 121, inactivityMinutes: 45.5 })).toEqual([
      "Preguntar cada: un número entero entre 10 y 240 minutos.",
      "Tiempo para responder: un número entero entre 1 y 120 minutos.",
      "Sin evaluar para «Posible salida»: un número entero entre 10 y 240 minutos.",
    ]);
  });

  it("solo devuelve los campos que cambiaron", () => {
    expect(changedSettings(settings, { ...settings, responseWindowMinutes: 20 })).toEqual({ responseWindowMinutes: 20 });
    expect(changedSettings(settings, settings)).toEqual({});
  });
});
