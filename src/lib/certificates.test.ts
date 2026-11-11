import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { batchFailureMessage, downloadCertificatePdf, runInBatches } from "./certificates";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));

describe("runInBatches", () => {
  it("nunca corre más de una tanda a la vez y conserva el orden", async () => {
    let running = 0;
    let peak = 0;
    const results = await runInBatches(
      [1, 2, 3, 4, 5, 6, 7],
      async (n) => {
        running++;
        peak = Math.max(peak, running);
        await Promise.resolve();
        running--;
        return n * 2;
      },
      3,
    );
    expect(peak).toBe(3);
    expect(results.map((r) => r.ok && r.value)).toEqual([2, 4, 6, 8, 10, 12, 14]);
  });

  it("un fallo no detiene a los demás", async () => {
    const results = await runInBatches([1, 2], async (n) => {
      if (n === 1) throw new Error("no confirmado");
      return n;
    });
    expect(results[0]).toEqual({ ok: false, item: 1, error: "no confirmado" });
    expect(results[1]).toEqual({ ok: true, item: 2, value: 2 });
  });
});

describe("batchFailureMessage", () => {
  it("dice cuántos fallaron y un motivo", () => {
    expect(batchFailureMessage(["a", "b"])).toBe("Fallaron 2 envíos. Por ejemplo: a");
  });
});

describe("downloadCertificatePdf", () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
    window.URL.createObjectURL = vi.fn(() => "blob:fake");
    window.URL.revokeObjectURL = vi.fn();
  });

  it("descarga el archivo con el nombre pedido", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.mocked(apiFetch).mockResolvedValue(new Response(new Blob(["%PDF"]), { status: 200 }));
    await downloadCertificatePdf("/certificates/juror/1", "certificado.pdf");
    expect(vi.mocked(apiFetch).mock.calls[0][0]).toContain("/certificates/juror/1");
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("muestra el motivo que da el servidor", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify({ message: "no participa" }), { status: 400 }),
    );
    await expect(downloadCertificatePdf("/x", "a.pdf")).rejects.toThrow("no participa");
  });
});
