import { describe, expect, it } from "vitest";
import {
  decisionMethodLabel,
  formatRegistrationDate,
  orderedTieTeams,
  tiePositions,
  tieReason,
} from "@/features/results/lib/tieResolution";

const team = (teamId: number, registrationDate: string | null) => ({
  teamId,
  teamCode: `N1-ABC-${teamId}`,
  teamName: `Equipo ${teamId}`,
  videogameName: null,
  registrationDate,
});

describe("tieResolution (HU-47)", () => {
  it("ordena los equipos como dice `order` (el back ya desempató)", () => {
    const tie = { teams: [team(12, "2026-10-05T15:00:00.000Z"), team(15, "2026-10-03T15:00:00.000Z")], order: [15, 12] };
    expect(orderedTieTeams(tie).map((t) => t.teamId)).toEqual([15, 12]);
  });

  it("un equipo que no está en `order` va al final", () => {
    const tie = { teams: [team(9, null), team(12, "2026-10-05T15:00:00.000Z")], order: [12] };
    expect(orderedTieTeams(tie).map((t) => t.teamId)).toEqual([12, 9]);
  });

  it("misma fecha: respeta el orden por id del back", () => {
    const same = "2026-10-03T15:00:00.000Z";
    const tie = { teams: [team(20, same), team(7, same)], order: [7, 20] };
    expect(orderedTieTeams(tie).map((t) => t.teamId)).toEqual([7, 20]);
  });

  it("la fecha de inscripción va en hora de Bogotá; sin fecha es null", () => {
    expect(formatRegistrationDate("2026-10-03T15:00:00.000Z")).toMatch(/^03\/10\/2026.*10:00/);
    expect(formatRegistrationDate(null)).toBeNull();
    expect(formatRegistrationDate("x")).toBeNull();
  });

  it("el motivo quita el detalle con fechas ISO y conserva el aviso de la misma fecha", () => {
    expect(
      tieReason(
        "Resuelto por fecha de inscripción: primero el grupo inscrito antes. Hay grupos con la misma fecha de inscripción: entre ellos va primero el de id menor. Orden: N1-A (2026-10-03T15:00:00.000Z), N1-B (2026-10-03T15:00:00.000Z).",
      ),
    ).toBe(
      "Resuelto por fecha de inscripción: primero el grupo inscrito antes. Hay grupos con la misma fecha de inscripción: entre ellos va primero el de id menor.",
    );
    expect(tieReason("Otro texto")).toBe("Otro texto");
  });

  it("puestos y quién decidió en el historial", () => {
    expect(tiePositions([2, 3])).toBe("puestos 2 y 3");
    expect(tiePositions([1, 3])).toBe("puestos 1 a 3");
    expect(tiePositions([4, 4])).toBe("puesto 4");
    expect(decisionMethodLabel("PROFESSOR")).toBe("Profesor");
    expect(decisionMethodLabel("REGISTRATION")).toBe("Fecha de inscripción");
  });
});
