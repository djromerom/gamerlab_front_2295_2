import { describe, expect, it } from "vitest";
import { filterGroupsByLevel } from "./trackingLevelFilter";

const groups = [
  { teamId: 1, level: "N0" },
  { teamId: 2, level: "N1" },
  { teamId: 3, level: "N0" },
  { teamId: 4, level: null },
  { teamId: 5, level: "N10" },
];

describe("filterGroupsByLevel (panel de seguimiento, BG-59)", () => {
  it("con un nivel deja solo los grupos de ese nivel", () => {
    expect(filterGroupsByLevel(groups, "N0").map((group) => group.teamId)).toEqual([1, 3]);
    expect(filterGroupsByLevel(groups, "N1").map((group) => group.teamId)).toEqual([2]);
  });

  it("sin nivel («Todos los niveles») devuelve todos, también los que no tienen nivel", () => {
    expect(filterGroupsByLevel(groups, "")).toEqual(groups);
    expect(filterGroupsByLevel(groups, undefined)).toEqual(groups);
  });

  it("no distingue mayúsculas y no devuelve nada si ningún grupo tiene ese nivel", () => {
    expect(filterGroupsByLevel(groups, "n0").map((group) => group.teamId)).toEqual([1, 3]);
    expect(filterGroupsByLevel(groups, "N4")).toEqual([]);
  });

  it("compara el nivel completo: N1 no trae los grupos N10", () => {
    expect(filterGroupsByLevel(groups, "N1").map((group) => group.teamId)).toEqual([2]);
  });
});
