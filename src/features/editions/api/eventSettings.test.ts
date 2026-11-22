import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.fn();
vi.mock("@/lib/api", () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }));

import { EventSettingError, RANKING_REQUIRES_FINAL_GRADE, fetchShowRanking, updateEventSetting } from "@/features/editions/api/eventSettings";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => apiFetch.mockReset());

describe("updateEventSetting", () => {
  it("envía el campo con el valor", async () => {
    apiFetch.mockResolvedValue(json({ showRanking: false }));
    await updateEventSetting("/settings/show-ranking", "show", false);
    const [url, init] = apiFetch.mock.calls[0];
    expect(url).toBe("http://api.test/settings/show-ranking");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ show: false });
  });

  it("BG-67: publicar sin la nota final liberada trae el mensaje y el código del back", async () => {
    apiFetch.mockResolvedValue(
      json({ statusCode: 400, code: RANKING_REQUIRES_FINAL_GRADE, message: "Primero libera la nota final; el ranking se publica después." }, 400),
    );
    const error = await updateEventSetting("/settings/show-ranking", "show", true).catch((e) => e);
    expect(error).toBeInstanceOf(EventSettingError);
    expect(error).toMatchObject({ status: 400, code: RANKING_REQUIRES_FINAL_GRADE, message: "Primero libera la nota final; el ranking se publica después." });
  });

  it("sin mensaje del back usa uno genérico con el código HTTP", async () => {
    apiFetch.mockResolvedValue(new Response("<html>", { status: 502 }));
    await expect(updateEventSetting("/settings/show-evaluations", "show", true)).rejects.toThrow("error 502");
  });
});

describe("fetchShowRanking", () => {
  it("lee showRanking del objeto o del booleano", async () => {
    apiFetch.mockResolvedValueOnce(json({ showRanking: true }));
    await expect(fetchShowRanking()).resolves.toBe(true);
    expect(apiFetch.mock.calls[0][0]).toBe("http://api.test/settings/show-ranking");
    apiFetch.mockResolvedValueOnce(json(false));
    await expect(fetchShowRanking()).resolves.toBe(false);
  });

  it("si falla, lanza EventSettingError con el código HTTP", async () => {
    apiFetch.mockResolvedValueOnce(json({}, 500));
    await expect(fetchShowRanking()).rejects.toMatchObject({ status: 500 });
  });
});

describe("verification-codes (HU-50, ARK-311)", () => {
  it("GET normaliza la respuesta y sin el campo asume encendido", async () => {
    const { fetchVerificationCodesSetting } = await import("@/features/editions/api/eventSettings");
    apiFetch.mockResolvedValueOnce(json({}));
    await expect(fetchVerificationCodesSetting()).resolves.toEqual({
      verificationCodesEnabled: true,
      changedAt: null,
      changedBy: null,
    });
    expect(apiFetch.mock.calls[0][0]).toBe("http://api.test/settings/verification-codes");
  });

  it("PATCH envía {enabled} y devuelve quién y cuándo", async () => {
    const { updateVerificationCodesSetting } = await import("@/features/editions/api/eventSettings");
    const body = {
      verificationCodesEnabled: false,
      changedAt: "2026-11-21T20:10:00.000Z",
      changedBy: { id: "a1", name: "Allison Ruiz" },
    };
    apiFetch.mockResolvedValueOnce(json(body));
    await expect(updateVerificationCodesSetting(false)).resolves.toEqual(body);
    const [url, init] = apiFetch.mock.calls[0];
    expect(url).toBe("http://api.test/settings/verification-codes");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ enabled: false });
  });

  it("PATCH rechazado lanza EventSettingError con el código del back", async () => {
    const { updateVerificationCodesSetting } = await import("@/features/editions/api/eventSettings");
    apiFetch.mockResolvedValueOnce(
      json({ code: "EVENT_CONFIGURATION_NOT_FOUND", message: "La edición activa no tiene configuración" }, 404),
    );
    await expect(updateVerificationCodesSetting(false)).rejects.toMatchObject({
      status: 404,
      code: "EVENT_CONFIGURATION_NOT_FOUND",
      message: "La edición activa no tiene configuración",
    });
  });
});
