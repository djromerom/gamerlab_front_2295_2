import { describe, expect, it, vi } from "vitest";
import { fetchAllPages, MAX_PAGE_LIMIT, pageLabel, pageStatus } from "./pagination";

describe("fetchAllPages (ARK-156)", () => {
  it("recorre todas las páginas y nunca pide más de 100 por página", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: ["a", "b"], totalPages: 3 })
      .mockResolvedValueOnce({ items: ["c"], totalPages: 3 })
      .mockResolvedValueOnce({ items: ["d"], totalPages: 3 });

    await expect(fetchAllPages(fetchPage)).resolves.toEqual(["a", "b", "c", "d"]);

    expect(MAX_PAGE_LIMIT).toBe(100);
    expect(fetchPage.mock.calls).toEqual([
      [1, 100],
      [2, 100],
      [3, 100],
    ]);
  });

  it("hace una sola petición si la lista está vacía", async () => {
    const fetchPage = vi.fn().mockResolvedValue({ items: [], totalPages: 0 });

    await expect(fetchAllPages(fetchPage)).resolves.toEqual([]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("no se queda en un ciclo si una página llega vacía antes del final", async () => {
    const fetchPage = vi.fn().mockResolvedValue({ items: [], totalPages: 5 });

    await fetchAllPages(fetchPage);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("propaga el error de una página", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: ["a"], totalPages: 2 })
      .mockRejectedValueOnce(new Error("Error 500"));

    await expect(fetchAllPages(fetchPage)).rejects.toThrow("Error 500");
  });
});

describe("pageStatus y pageLabel (BG-66)", () => {
  it("una lista vacía es «1 de 1» sin anterior ni siguiente", () => {
    expect(pageLabel(0, 0)).toBe("1 de 1");
    expect(pageStatus(1, 0)).toEqual({ page: 1, totalPages: 1, canPrev: false, canNext: false });
    expect(pageStatus(undefined, undefined)).toMatchObject({ canNext: false });
  });

  it("en medio de la lista habilita los dos botones", () => {
    expect(pageLabel(2, 5)).toBe("2 de 5");
    expect(pageStatus(2, 5)).toEqual({ page: 2, totalPages: 5, canPrev: true, canNext: true });
    expect(pageStatus(5, 5).canNext).toBe(false);
  });
});
