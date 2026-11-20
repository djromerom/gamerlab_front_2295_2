import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SubstituteNoticeError,
  fetchMySubstituteNotices,
  fetchUnreadSubstituteNotices,
  isRetryableNoticeError,
  markSubstituteNoticeRead,
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
