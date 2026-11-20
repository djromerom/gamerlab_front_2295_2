import { describe, expect, it } from "vitest";
import { finalizeSummary, groupLabel } from "@/features/results/lib/rankingGroups";

describe("Ranking oficial por nivel, sin grupo «Externos» (ARK-273)", () => {
  it("cada nivel, empate o decisión se llama «N{nivel}»", () => {
    expect(groupLabel({ level: 1 })).toBe("N1");
    expect(groupLabel({ level: 0 })).toBe("N0");
  });

  it("el cierre cuenta solo niveles", () => {
    expect(finalizeSummary({ teams: 14, levels: [{}, {}, {}, {}] })).toBe("Ranking final definido: 14 grupos en 4 niveles.");
    expect(finalizeSummary({ teams: 3, levels: [{}] })).toBe("Ranking final definido: 3 grupos en 1 nivel.");
  });
});
