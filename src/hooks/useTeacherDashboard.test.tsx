import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTeacherDashboard } from "@/hooks/useTeacherDashboard";

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
});
