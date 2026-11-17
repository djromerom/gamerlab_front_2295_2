import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTeacherDashboard } from "@/features/results/hooks/useTeacherDashboard";
import { toast } from "sonner";

const fetchMock = vi.fn();

vi.mock("@/hooks/useFetch", () => ({ useFetch: () => fetchMock }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), info: vi.fn() }) }));

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const FILTERS = { editions: [{ id: 3, year: 2026, semester: 10 }], nrcs: [{ id: 7, code: "2501", editionId: 3 }] };
const LIST = { data: [], metadata: { totalItems: 0, itemsOnCurrentPage: 0, currentPage: 1, itemsPerPage: 25, totalPages: 0 } };

const urls = (path: string) =>
  fetchMock.mock.calls.map((call) => new URL(String(call[0]))).filter((url) => url.pathname.endsWith(path));

beforeEach(() => {
  fetchMock.mockReset();
  vi.mocked(toast.info).mockClear();
  fetchMock.mockImplementation(async (input: string) =>
    String(input).includes("filter-options") ? json(200, FILTERS) : json(200, LIST));
});

describe("useTeacherDashboard", () => {
  it("envia search (no team/student) y no pide historicos por defecto", async () => {
    const { result } = renderHook(() => useTeacherDashboard({ search: " Ana " }));
    await waitFor(() => expect(urls("/grading-games").length).toBeGreaterThan(0));
    const list = urls("/grading-games").at(-1)!;
    expect(list.searchParams.get("search")).toBe("Ana");
    expect(list.searchParams.has("team")).toBe(false);
    expect(list.searchParams.has("student")).toBe(false);
    expect(list.searchParams.has("includeHistorical")).toBe(false);
    expect(urls("/filter-options")[0].searchParams.has("includeHistorical")).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("la pestana de historicos pide includeHistorical=true en listado y opciones", async () => {
    const { result } = renderHook(() => useTeacherDashboard({ includeHistorical: true }));
    await waitFor(() => expect(urls("/grading-games").length).toBeGreaterThan(0));
    expect(urls("/grading-games").at(-1)!.searchParams.get("includeHistorical")).toBe("true");
    expect(urls("/filter-options")[0].searchParams.get("includeHistorical")).toBe("true");
    expect(result.current.error).toBeNull();
  });

  it("conserva fairGradeRule de cada fila y lo deduce de isExternal si no llega (ARK-203)", async () => {
    const row = { teamCode: "N1-AYP-01", team: "A", videogame: "J", calificacionFeria: null, editionId: 3 };
    const data = [
      { ...row, fairGradeRule: "EXTERNAL", isExternal: true },
      { ...row, teamCode: "N0-COL-01", fairGradeRule: "SCHOOL", isExternal: true },
      { ...row, teamCode: "N1-AYP-02", fairGradeRule: "STANDARD", isExternal: false },
      { ...row, teamCode: "N1-AYP-03", isExternal: true },
      { ...row, teamCode: "N1-AYP-04" },
    ];
    fetchMock.mockImplementation(async (input: string) =>
      String(input).includes("filter-options")
        ? json(200, FILTERS)
        : json(200, { ...LIST, data, metadata: { ...LIST.metadata, totalItems: 5, itemsOnCurrentPage: 5, totalPages: 1 } }));
    const { result } = renderHook(() => useTeacherDashboard());
    await waitFor(() => expect(result.current.teams).toHaveLength(5));
    expect(result.current.teams.map((t) => t.fairGradeRule)).toEqual(["EXTERNAL", "SCHOOL", "STANDARD", "EXTERNAL", "STANDARD"]);
  });

  it("abre con la feria y el NRC iniciales y los pide al backend (BG-27)", async () => {
    const { result, rerender } = renderHook(
      ({ historical }) => useTeacherDashboard({ includeHistorical: historical, initialFair: "3", initialNRC: "7" }),
      { initialProps: { historical: false } },
    );
    await waitFor(() => expect(urls("/grading-games").length).toBeGreaterThan(0));
    expect(result.current.selectedFair).toBe("3");
    expect(result.current.selectedNRC).toBe("7");
    const list = urls("/grading-games").at(-1)!;
    expect(list.searchParams.get("editionId")).toBe("3");
    expect(list.searchParams.get("nrcId")).toBe("7");

    // Cambiar de pestaña sí reinicia los filtros
    rerender({ historical: true });
    await waitFor(() => expect(result.current.selectedNRC).toBe(""));
    expect(result.current.selectedFair).toBe("");
  });

  it("ante 404 por nrcId ajeno limpia el NRC y recarga sin mostrar error", async () => {
    fetchMock.mockImplementation(async (input: string) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("filter-options")) return json(200, FILTERS);
      if (url.searchParams.get("nrcId")) return json(404, { message: "El NRC no existe o no pertenece al profesor en la feria activa." });
      return json(200, LIST);
    });
    const { result } = renderHook(() => useTeacherDashboard());
    await waitFor(() => expect(result.current.initialLoading).toBe(false));
    act(() => result.current.setSelectedNRC("99"));
    await waitFor(() => expect(result.current.selectedNRC).toBe(""));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(urls("/grading-games").at(-1)!.searchParams.has("nrcId")).toBe(false);
  });

  describe("NRC al cambiar de feria (BG-63)", () => {
    const TWO_FAIRS = {
      editions: [{ id: 3, year: 2026, semester: 10 }, { id: 5, year: 2026, semester: 30 }],
      nrcs: [{ id: 7, code: "2501", editionId: 3 }, { id: 7, code: "2501", editionId: 5 }, { id: 9, code: "2601", editionId: 5 }],
    };
    const setup = async (initialNRC: string) => {
      fetchMock.mockImplementation(async (input: string) =>
        String(input).includes("filter-options") ? json(200, TWO_FAIRS) : json(200, LIST));
      const hook = renderHook(() => useTeacherDashboard({ initialFair: "5", initialNRC }));
      await waitFor(() => expect(hook.result.current.initialLoading).toBe(false));
      return hook;
    };

    it("conserva el NRC si pertenece a la nueva feria, sin aviso", async () => {
      const { result } = await setup("7");
      act(() => result.current.setSelectedFair("3"));
      expect(result.current.selectedFair).toBe("3");
      expect(result.current.selectedNRC).toBe("7");
      expect(toast.info).not.toHaveBeenCalled();
      await waitFor(() => expect(urls("/grading-games").at(-1)!.searchParams.get("editionId")).toBe("3"));
      expect(urls("/grading-games").at(-1)!.searchParams.get("nrcId")).toBe("7");
    });

    it("conserva el NRC al elegir todas las ferias", async () => {
      const { result } = await setup("9");
      act(() => result.current.setSelectedFair(""));
      expect(result.current.selectedNRC).toBe("9");
      expect(toast.info).not.toHaveBeenCalled();
    });

    it("si el NRC no pertenece a la nueva feria vuelve a «Todos» y avisa", async () => {
      const { result } = await setup("9");
      act(() => result.current.setSelectedFair("3"));
      expect(result.current.selectedNRC).toBe("");
      expect(toast.info).toHaveBeenCalledWith(
        "El NRC 2601 no pertenece a la feria 2026 - 1. Se muestran todos los NRC de esa feria.",
        expect.anything(),
      );
    });

    it("la etiqueta de la feria de cada fila usa el semestre real, sin «S»", async () => {
      fetchMock.mockImplementation(async (input: string) =>
        String(input).includes("filter-options")
          ? json(200, TWO_FAIRS)
          : json(200, { ...LIST, data: [{ teamCode: "N1-AYP-01", team: "A", editionId: 5 }] }));
      const { result } = renderHook(() => useTeacherDashboard());
      await waitFor(() => expect(result.current.teams).toHaveLength(1));
      expect(result.current.teams[0].editionLabel).toBe("2026 - 2");
    });
  });
});
