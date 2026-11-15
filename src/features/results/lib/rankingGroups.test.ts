import { describe, expect, it } from "vitest";
import {
  competesAsExternal,
  finalizeSummary,
  groupLabel,
  levelFromTeamCode,
  publicTabQuery,
  publicTeamsFor,
  rankingGroups,
} from "@/features/results/lib/rankingGroups";

describe("Grupo Externos del ranking (HU-38, ARK-219)", () => {
  it("lee el nivel del código del equipo", () => {
    expect(levelFromTeamCode("N2-EXT-001")).toBe(2);
    expect(levelFromTeamCode("n10-ABC-1001")).toBe(10);
    expect(levelFromTeamCode("SIN-NIVEL")).toBeNull();
    expect(levelFromTeamCode(undefined)).toBeNull();
  });

  it("los empates y decisiones de externos se llaman «Externos», nunca «Nnull»", () => {
    expect(groupLabel({ level: null, external: true })).toBe("Externos");
    expect(groupLabel({ level: 1, external: false })).toBe("N1");
    expect(groupLabel({ level: 0 })).toBe("N0");
  });

  it("un externo compite en Externos, salvo un colegio (N0), que sigue en su nivel", () => {
    expect(competesAsExternal({ isExternal: true, teamCode: "N1-EXT-01" })).toBe(true);
    expect(competesAsExternal({ isExternal: true, teamCode: "N0-COL-01" })).toBe(false);
    expect(competesAsExternal({ isExternal: false, teamCode: "N1-ABC-01" })).toBe(false);
  });

  it("pone el grupo Externos después de los niveles, solo si existe", () => {
    expect(rankingGroups({ levels: ["N1", "N2"], external: "EXT" })).toEqual(["N1", "N2", "EXT"]);
    expect(rankingGroups({ levels: ["N1"], external: null })).toEqual(["N1"]);
  });

  it("el cierre cuenta los niveles aparte del grupo Externos", () => {
    expect(
      finalizeSummary({ teams: 9, levels: [{ external: false }, { external: false }, { external: true }] }),
    ).toBe("Ranking final definido: 9 grupos en 2 niveles y el grupo Externos.");
    expect(finalizeSummary({ teams: 3, levels: [{ external: false }] })).toBe("Ranking final definido: 3 grupos en 1 nivel.");
  });
});

describe("Vista pública del ranking", () => {
  const teams = [
    { name: "Ana", teamCode: "N1-ABC-01", isExternal: false, levelPosition: 1 },
    { name: "Ext B", teamCode: "N2-EXT-02", isExternal: true, levelPosition: 2 },
    { name: "Beto", teamCode: "N1-ABC-02", isExternal: false, levelPosition: 2 },
    { name: "Ext A", teamCode: "N1-EXT-01", isExternal: true, levelPosition: 1 },
    { name: "Colegio", teamCode: "N0-COL-01", isExternal: true, levelPosition: 1 },
  ];

  it("la pestaña Externos pide la lista completa", () => {
    expect(publicTabQuery("external")).toBe("all");
    expect(publicTabQuery("n1")).toBe("n1");
  });

  it("en un nivel no aparece un externo de ese nivel", () => {
    const n1 = teams.filter((t) => t.teamCode.startsWith("N1"));
    expect(publicTeamsFor("n1", n1).map((t) => t.name)).toEqual(["Ana", "Beto"]);
  });

  it("un colegio externo sigue en Colegios", () => {
    expect(publicTeamsFor("n0", [teams[4]]).map((t) => t.name)).toEqual(["Colegio"]);
  });

  it("Externos muestra solo a los externos de cualquier nivel, por su puesto en el grupo", () => {
    expect(publicTeamsFor("external", teams).map((t) => t.name)).toEqual(["Ext A", "Ext B"]);
  });

  it("«Todos» no cambia", () => {
    expect(publicTeamsFor("all", teams)).toEqual(teams);
  });
});
