import { describe, expect, it } from "vitest";
import type { GroupSuggestion, RankedSubstitute } from "@/features/jurors/contingency/api/contingency";
import {
  allSuggestedPairs,
  describeAcceptError,
  levelLabel,
  phaseNotice,
  validateMinimum,
} from "@/features/jurors/contingency/lib/contingency";

const substitute = (id: string): RankedSubstitute => ({
  id,
  nombre: id,
  categoria: "JUNIOR",
  carga: 1,
  llegada: true,
  mismoNivel: true,
  mismaCategoria: true,
  rechazado: false,
});

const group = (teamId: number, sugeridos: string[], advertencias: GroupSuggestion["advertencias"] = []): GroupSuggestion => ({
  teamId,
  codigo: `N1-${teamId}`,
  nombre: `Grupo ${teamId}`,
  videojuego: null,
  nivel: 1,
  juradosContados: 2,
  faltantes: 1,
  jurados: [],
  sugeridos: sugeridos.map(substitute),
  alternativas: [],
  sinCubrir: 0,
  advertencias,
});

describe("Lógica de la contingencia con suplentes (HU-14)", () => {
  it("«Aceptar todo» junta los sugeridos de todos los grupos", () => {
    expect(allSuggestedPairs([group(1, ["a", "b"]), group(2, []), group(3, ["a"])])).toEqual([
      { teamId: 1, substituteId: "a" },
      { teamId: 1, substituteId: "b" },
      { teamId: 3, substituteId: "a" },
    ]);
  });

  it("antes de la hora de control avisa que se cuentan todos los asignados", () => {
    expect(phaseNotice({ fase: "ALERT", base: "ASSIGNED" }, "11:00")?.text).toBe(
      "Aún no es la hora de control (11:00): se cuentan todos los asignados, porque todavía pueden llegar.",
    );
  });

  it("en la fase de control no muestra aviso", () => {
    expect(phaseNotice({ fase: "CONTROL", base: "PRESENT" })).toBeNull();
  });

  it("sin cronograma pide configurarlo", () => {
    expect(phaseNotice({ fase: "NOT_CONFIGURED", base: "ASSIGNED" })).toMatchObject({ tone: "warning" });
  });

  it("N0 se muestra como colegios", () => {
    expect(levelLabel(0)).toBe("N0 · Colegios");
    expect(levelLabel(2)).toBe("N2");
    expect(levelLabel(null)).toBe("Sin nivel");
  });

  it("un suplente sin categoría se nombra con su grupo y se dice cómo arreglarlo", () => {
    const message = describeAcceptError(
      { message: "El jurado no tiene categoría asignada (JUNIOR/SENIOR).", code: "MISSING_JUROR_CATEGORY", jurorId: "b", teamId: 3 },
      [group(1, ["a"]), group(3, ["b"])],
    );
    expect(message).toBe(
      "No se pudo asignar a b en N1-3: no tiene categoría (Junior o Senior). Asígnala en Personal → Jurados y vuelve a intentarlo. No se guardó ninguna asignación.",
    );
  });

  it("otros bloqueos anteponen el suplente y el grupo al mensaje del back", () => {
    expect(
      describeAcceptError({ message: "Es junior y el grupo es de colegios.", code: "SCHOOL_REQUIRES_SENIOR", jurorId: "a", teamId: 1 }, [group(1, ["a"])]),
    ).toBe("a en N1-1: Es junior y el grupo es de colegios.");
  });

  it("sin datos del back deja el mensaje tal cual", () => {
    expect(describeAcceptError({ message: "No se pudo asignar." }, [group(1, ["a"])])).toBe("No se pudo asignar.");
  });

  it("valida el mínimo entre 1 y 10", () => {
    const limits = { min: 1, max: 10 };
    expect(validateMinimum("3", limits)).toBeNull();
    expect(validateMinimum("0", limits)).toMatch(/entre 1 y 10/);
    expect(validateMinimum("11", limits)).toMatch(/entre 1 y 10/);
    expect(validateMinimum("2.5", limits)).toMatch(/entero/);
    expect(validateMinimum("", limits)).toMatch(/entero/);
  });
});
