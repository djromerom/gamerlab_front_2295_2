import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { juryManagement } from "./juryManagement";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn() } }));

const page = (ids: string[], currentPage: number, totalPages: number) =>
  new Response(
    JSON.stringify({
      data: ids.map((id) => ({ id })),
      metadata: { totalItems: 0, itemsOnCurrentPage: ids.length, currentPage, itemsPerPage: 100, totalPages },
    }),
    { status: 200 },
  );

describe("juryManagement.getAllJuries (buscador de Personal → Jurados)", () => {
  beforeEach(() => vi.mocked(apiFetch).mockReset());

  it("recorre todas las páginas pidiendo como máximo 100 por página", async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce(page(["a", "b"], 1, 3))
      .mockResolvedValueOnce(page(["c"], 2, 3))
      .mockResolvedValueOnce(page(["d"], 3, 3));

    const jurors = await juryManagement.getAllJuries();

    expect(jurors.map((j) => j.id)).toEqual(["a", "b", "c", "d"]);
    const urls = vi.mocked(apiFetch).mock.calls.map(([url]) => String(url));
    expect(urls).toHaveLength(3);
    urls.forEach((url, i) => {
      expect(url).toContain("limit=100");
      expect(url).toContain(`page=${i + 1}`);
    });
  });

  it("hace una sola petición si no hay jurados", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(page([], 1, 0));

    expect(await juryManagement.getAllJuries()).toEqual([]);
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it("propaga el error del backend", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Limit must be at most 100." }), { status: 400 }),
    );

    await expect(juryManagement.getAllJuries()).rejects.toThrow("Error 400: Limit must be at most 100.");
  });
});

describe("juryManagement: quitar todas las asignaciones (ARK-133)", () => {
  beforeEach(() => vi.mocked(apiFetch).mockReset());

  it("si el back responde error no muestra éxito ni recarga", async () => {
    const { toast } = await import("sonner");
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    const reload = vi.spyOn(globalThis, "setTimeout");
    vi.mocked(apiFetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "No hay asignaciones de evaluadores en «Feria 5» para eliminar." }), {
        status: 400,
      }),
    );
    const setLoading = vi.fn();

    await juryManagement.deleteAllAssignments(setLoading);

    expect(toast.error).toHaveBeenCalledWith("No hay asignaciones de evaluadores en «Feria 5» para eliminar.");
    expect(toast.success).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    expect(setLoading).toHaveBeenCalledWith(false);
    reload.mockRestore();
  });

  it("con éxito muestra el mensaje del back (con la edición y la cantidad)", async () => {
    const { toast } = await import("sonner");
    vi.mocked(toast.success).mockClear();
    vi.useFakeTimers();
    vi.mocked(apiFetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Se quitaron 2 equipos de «Feria 5» al evaluador." }), { status: 200 }),
    );

    await juryManagement.deleteAllAsignmentsByJury("j-1", vi.fn());

    expect(toast.success).toHaveBeenCalledWith("Se quitaron 2 equipos de «Feria 5» al evaluador.");
    vi.useRealTimers();
  });
});
