import { describe, expect, it } from "vitest";
import { formatScore } from "@/features/grading/lib/scoreFormat";

describe("formatScore (BG-30)", () => {
  it("muestra 2 decimales", () => {
    expect(formatScore(4.552)).toBe("4.55");
    expect(formatScore(3)).toBe("3.00");
    expect(formatScore(0)).toBe("0.00");
    expect(formatScore("4.552")).toBe("4.55");
  });

  it("sin nota muestra «—»", () => {
    expect(formatScore(null)).toBe("—");
    expect(formatScore(undefined)).toBe("—");
    expect(formatScore("")).toBe("—");
    expect(formatScore("abc")).toBe("—");
  });
});
