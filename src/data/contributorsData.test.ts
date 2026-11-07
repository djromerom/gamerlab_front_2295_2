import { describe, expect, it } from "vitest";
import { departments, developers, projectStats } from "@/data/contributorsData";

// CreditsPage filtra por department y version: un id mal escrito deja a la persona fuera de los filtros
describe("contributorsData", () => {
  it("cada desarrollador pertenece a departamentos que existen", () => {
    const ids = new Set(departments.map((d) => d.id));
    for (const dev of developers) {
      expect(dev.department.length, dev.name).toBeGreaterThan(0);
      for (const dept of dev.department) expect(ids.has(dept), `${dev.name}: ${dept}`).toBe(true);
    }
  });

  it("cada desarrollador tiene al menos una versión y los ids no se repiten", () => {
    for (const dev of developers) expect(dev.version.length, dev.name).toBeGreaterThan(0);
    expect(new Set(developers.map((d) => d.id)).size).toBe(developers.length);
  });

  it("la estadística de desarrolladores coincide con la lista", () => {
    const stat = projectStats.find((s) => s.label === "Desarrolladores");
    expect(stat?.value).toBe(String(developers.length));
  });

  it("Daniel Romero Martínez aparece como contribuidor de la versión 4", () => {
    const daniel = developers.find((developer) => developer.name === "Daniel Romero Martínez");
    expect(daniel?.role).toBe("Software Architect");
    expect(daniel?.version).toContain(4);
    expect(daniel?.github).toBe("https://github.com/djromerom");
    expect(daniel?.email).toBe("djromero@uninorte.edu.co");
  });
});
