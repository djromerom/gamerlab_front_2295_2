import { afterEach, describe, expect, it, vi } from "vitest";
import { previewJurorBadge, QR_PREVIEW_UNAVAILABLE } from "@/features/jurors/attendance/api/jurorCheckIn";

const apiFetch = vi.fn();
vi.mock("@/lib/api", () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }));

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

afterEach(() => apiFetch.mockReset());

describe("previewJurorBadge (ARK-252)", () => {
  it("pide de quién es el QR sin registrar la llegada (GET, sin POST)", async () => {
    apiFetch.mockResolvedValueOnce(json(200, { juror: { id: "j", name: "Kevin Lara", category: "Junior", teams: [] }, checkedInAt: null }));
    await expect(previewJurorBadge(" abc+/= ")).resolves.toMatchObject({ juror: { name: "Kevin Lara" } });
    const [url, init] = apiFetch.mock.calls[0];
    expect(url).toBe("http://api.test/juror-checkin/badge?token=abc%2B%2F%3D");
    expect(init).toBeUndefined();
  });

  it("un QR inválido muestra el mensaje del back", async () => {
    apiFetch.mockResolvedValueOnce(json(404, { message: "Código QR no válido o de otra edición" }));
    await expect(previewJurorBadge("x")).rejects.toThrow("Código QR no válido o de otra edición");
  });

  it("el 400 trae message como lista: se muestra el texto", async () => {
    apiFetch.mockResolvedValueOnce(json(400, { statusCode: 400, message: ["El código QR es obligatorio"], error: "Bad Request" }));
    await expect(previewJurorBadge("")).rejects.toThrow("El código QR es obligatorio");
  });

  it("si el back aún no tiene la ruta, dice que se busque por nombre", async () => {
    apiFetch.mockResolvedValueOnce(json(404, { message: "Cannot GET /juror-checkin/badge?token=x", error: "Not Found", statusCode: 404 }));
    await expect(previewJurorBadge("x")).rejects.toThrow(QR_PREVIEW_UNAVAILABLE);
  });
});
