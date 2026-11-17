import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TOUCH_ONLY_QUERY, useTouchOnly } from "@/hooks/useTouchOnly";

afterEach(() => vi.unstubAllGlobals());

function screenWith(matches: boolean) {
  const queries: string[] = [];
  vi.stubGlobal("matchMedia", (query: string) => {
    queries.push(query);
    return { matches, media: query, addEventListener: () => {}, removeEventListener: () => {} };
  });
  return queries;
}

describe("useTouchOnly", () => {
  it("es true en un celular (sin hover y con puntero grueso)", () => {
    const queries = screenWith(true);
    expect(renderHook(() => useTouchOnly()).result.current).toBe(true);
    expect(queries).toContain(TOUCH_ONLY_QUERY);
  });

  it("es false en un computador", () => {
    screenWith(false);
    expect(renderHook(() => useTouchOnly()).result.current).toBe(false);
  });
});
