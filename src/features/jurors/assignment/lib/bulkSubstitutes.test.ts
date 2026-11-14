import { describe, expect, it } from "vitest";
import type { BulkSubstituteAssignmentResult, EditionEvaluator } from "@/features/jurors/assignment/api/bulkSubstitutes";
import {
  coverageSummary,
  evaluatorRole,
  resultNotes,
  selectionProblem,
  splitCandidates,
} from "@/features/jurors/assignment/lib/bulkSubstitutes";

const person = (id: string, extra: Partial<EditionEvaluator> = {}): EditionEvaluator => ({
  id,
  firstName: id,
  lastName: "",
  email: `${id}@x.co`,
  jurorType: "OFFICIAL",
  jurorCategory: "JUNIOR",
  isProfessor: false,
  assignedTeams: 0,
  ...extra,
});

describe("Reglas del diálogo de suplentes en lote (HU-09)", () => {
  it("a cubrir: solo quienes tienen grupos, con más grupos primero; suplentes: Suplente y no profesor", () => {
    const { coverable, substitutes } = splitCandidates([
      person("Beto", { assignedTeams: 1 }),
      person("Ana", { assignedTeams: 3 }),
      person("Ceci"), // sin grupos: nada que cubrir
      person("Laura", { jurorType: "BACKUP" }),
      person("Profe", { jurorType: "BACKUP", isProfessor: true, assignedTeams: 2 }),
      person("Diego", { jurorType: "BACKUP", assignedTeams: 2 }),
    ]);

    expect(coverable.map((e) => e.id)).toEqual(["Ana", "Diego", "Profe", "Beto"]);
    expect(substitutes.map((e) => e.id)).toEqual(["Diego", "Laura"]);
    expect(evaluatorRole(person("x", { isProfessor: true }))).toBe("Profesor");
  });

  it("pide al menos uno de cada lista, respeta los topes y no deja repetir a nadie", () => {
    expect(selectionProblem([], ["s"])).toMatch(/jurado a cubrir/);
    expect(selectionProblem(["j"], [])).toMatch(/suplente/);
    expect(selectionProblem(Array.from({ length: 21 }, (_, i) => `j${i}`), ["s"])).toMatch(/hasta 20/);
    expect(selectionProblem(["j"], Array.from({ length: 11 }, (_, i) => `s${i}`))).toMatch(/hasta 10/);
    expect(selectionProblem(["j", "s"], ["s"])).toMatch(/misma persona/);
    expect(selectionProblem(["j"], ["s"])).toBeNull();
  });

  it("resume la operación con «hasta» porque los grupos pueden repetirse u omitirse", () => {
    expect(coverageSummary([person("a", { assignedTeams: 3 }), person("b", { assignedTeams: 2 })], [person("s")])).toBe(
      "Se sumará 1 suplente a hasta 5 grupos de 2 jurados.",
    );
    expect(coverageSummary([person("a", { assignedTeams: 1 })], [person("s"), person("t")])).toBe(
      "Se sumarán 2 suplentes a hasta 1 grupo de 1 jurado.",
    );
  });

  it("anota los grupos omitidos y los jurados sin grupos", () => {
    const result = {
      equiposNoAsignables: [
        { id: 1, codigo: "N1-AYP-06", nombre: "Pixel", motivo: "TEAM_NOT_CONFIRMED" },
        { id: 2, codigo: "N2-ABC-201", nombre: "Delta", motivo: "TEAM_NOT_GRADABLE" },
      ],
      juradosSinGrupos: [{ id: "j", nombre: "Ana Pérez" }],
    } as unknown as BulkSubstituteAssignmentResult;

    expect(resultNotes(result)).toEqual([
      "No se asignaron estos grupos: N1-AYP-06 Pixel (sin confirmar); N2-ABC-201 Delta (presentador externo, no se califica).",
      "No tenían grupos en la edición activa: Ana Pérez.",
    ]);
    expect(resultNotes({ equiposNoAsignables: [], juradosSinGrupos: [] } as unknown as BulkSubstituteAssignmentResult)).toEqual([]);
  });
});
