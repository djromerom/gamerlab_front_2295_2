import { describe, expect, it } from "vitest";
import { findWorkingEdition } from "./workingEdition";

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
