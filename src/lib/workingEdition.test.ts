import { describe, expect, it } from "vitest";
import {
  confirmRemoveAllAssignmentsText,
  confirmRemoveJurorAssignmentsText,
  findWorkingEdition,
} from "./workingEdition";

describe("textos de quitar asignaciones (ARK-133)", () => {
  it("«quitar todas» nombra la edición y aclara que el historial se conserva", () => {
    const text = confirmRemoveAllAssignmentsText("Feria 5");
    expect(text).toContain("«Feria 5»");
    expect(text).toContain("ediciones anteriores se conservan");
  });

  it("«quitar los equipos de un jurado» nombra al jurado y la edición", () => {
    const text = confirmRemoveJurorAssignmentsText("Ana Senior", "Feria 5");
    expect(text).toContain("Ana Senior");
    expect(text).toContain("«Feria 5»");
  });

  it("sin nombre de edición dice «la edición activa»", () => {
    expect(confirmRemoveAllAssignmentsText(null)).toContain("de la edición activa");
    expect(confirmRemoveJurorAssignmentsText("Ana", undefined)).toContain("en la edición activa");
  });
});

describe("workingEdition (ARK-130)", () => {
  it("la edición de trabajo es la activa, no la de id más alto", () => {
    const editions = [
      { id: 3, status: "ACTIVE", title: "Feria 3" },
      { id: 4, status: "INACTIVE", title: "Feria 4 (recién creada)" },
    ];
    expect(findWorkingEdition(editions)?.title).toBe("Feria 3");
  });

  it("sin edición activa devuelve null", () => {
    expect(findWorkingEdition([{ id: 1, status: "ARCHIVED" }])).toBeNull();
  });

  it("si hubiera dos activas, gana la más reciente", () => {
    expect(findWorkingEdition([{ id: 2, status: "ACTIVE" }, { id: 5, status: "ACTIVE" }])?.id).toBe(5);
  });
});
