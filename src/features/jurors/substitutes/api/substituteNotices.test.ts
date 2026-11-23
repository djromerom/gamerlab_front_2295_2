import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SubstituteNoticeError,
  fetchMySubstituteNotices,
  fetchUnreadSubstituteNotices,
  isRetryableNoticeError,
  markSubstituteNoticeRead,
  resendSubstituteNoticeEmail,
} from "@/features/jurors/substitutes/api/substituteNotices";

const apiFetch = vi.fn();

vi.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

const API = "http://api.test";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("Cliente de avisos a suplentes (HU-22, ARK-84)", () => {
  afterEach(() => apiFetch.mockReset());

  it("pide los avisos propios sin leer por defecto o todos con status=all", async () => {
    apiFetch.mockImplementation(async () =>
      json(200, { edition: { id: 3, title: "Feria" }, serverTime: "x", unreadCount: 0, data: [] }),
    );

    await fetchMySubstituteNotices();
    await fetchMySubstituteNotices("all");

    expect(apiFetch.mock.calls[0][0]).toBe(`${API}/substitute-notices/me?status=unread`);
    expect(apiFetch.mock.calls[1][0]).toBe(`${API}/substitute-notices/me?status=all`);
  });

  it("marca como leído con PATCH /substitute-notices/:id/read", async () => {
    apiFetch.mockResolvedValue(json(200, { id: 7, readAt: "2026-11-14T15:00:00.000Z" }));

    await expect(markSubstituteNoticeRead(7)).resolves.toMatchObject({ id: 7 });
    expect(apiFetch.mock.calls[0][0]).toBe(`${API}/substitute-notices/7/read`);
    expect(apiFetch.mock.calls[0][1].method).toBe("PATCH");
  });

  it("el panel pide /substitute-notices/unread", async () => {
    apiFetch.mockResolvedValue(json(200, { totals: { unread: 0, jurors: 0 }, data: [] }));

    await fetchUnreadSubstituteNotices();
    expect(apiFetch.mock.calls[0][0]).toBe(`${API}/substitute-notices/unread`);
  });

  it("conserva el código SUBSTITUTE_NOTICE_NOT_FOUND y el mensaje del back", async () => {
    apiFetch.mockResolvedValue(
      json(404, { code: "SUBSTITUTE_NOTICE_NOT_FOUND", message: "El aviso no existe o no es tuyo." }),
    );

    const error = await markSubstituteNoticeRead(7).catch((e) => e);
    expect(error).toBeInstanceOf(SubstituteNoticeError);
    expect(error).toMatchObject({ status: 404, code: "SUBSTITUTE_NOTICE_NOT_FOUND" });
    expect(error.message).toBe("El aviso no existe o no es tuyo.");
  });

  it("sin feria activa y sin permiso explica el motivo", async () => {
    apiFetch.mockResolvedValueOnce(json(404, { code: "NO_ACTIVE_EDITION", message: "No active edition" }));
    apiFetch.mockResolvedValueOnce(new Response("", { status: 403 }));

    await expect(fetchMySubstituteNotices()).rejects.toThrow("No hay una feria activa.");
    await expect(fetchUnreadSubstituteNotices()).rejects.toThrow(/No tienes permiso/);
  });

  it("solo se reintenta sin conexión o con 5xx", () => {
    expect(isRetryableNoticeError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isRetryableNoticeError(new SubstituteNoticeError("x", 503))).toBe(true);
    expect(isRetryableNoticeError(new SubstituteNoticeError("x", 400))).toBe(false);
  });
});

describe("Reenviar el correo de un aviso (BG-74, ARK-289)", () => {
  afterEach(() => apiFetch.mockReset());

  it("hace POST /substitute-notices/:id/resend sin body y devuelve el estado en cola", async () => {
    apiFetch.mockResolvedValue(json(202, { noticeId: 12, emailStatus: "PENDING" }));

    await expect(resendSubstituteNoticeEmail(12)).resolves.toEqual({ noticeId: 12, emailStatus: "PENDING" });
    expect(apiFetch.mock.calls[0][0]).toBe(`${API}/substitute-notices/12/resend`);
    expect(apiFetch.mock.calls[0][1]).toEqual({ method: "POST" });
  });

  it("conserva el code del 409 cuando el aviso ya no está en FAILED", async () => {
    apiFetch.mockResolvedValue(
      json(409, { statusCode: 409, code: "SUBSTITUTE_NOTICE_EMAIL_NOT_FAILED", message: "Ya no falló.", emailStatus: "SENT" }),
    );

    const error = await resendSubstituteNoticeEmail(12).catch((e) => e);
    expect(error).toBeInstanceOf(SubstituteNoticeError);
    expect(error).toMatchObject({ status: 409, code: "SUBSTITUTE_NOTICE_EMAIL_NOT_FAILED" });
  });

  it("con 403 dice que no tiene permiso para reenviar", async () => {
    apiFetch.mockResolvedValue(json(403, { message: "Forbidden" }));

    const error = await resendSubstituteNoticeEmail(12).catch((e) => e);
    expect(error.message).toBe("No tienes permiso para reenviar el correo.");
  });
});
