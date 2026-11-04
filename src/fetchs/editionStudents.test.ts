import { describe, expect, it } from "vitest";
import { editionStudentsQueryString, teamsUrl } from "./editionStudents";

describe("editionStudents (ARK-129)", () => {
  it("sin edición no manda editionId: el back usa la activa", () => {
    expect(editionStudentsQueryString({ page: 1, limit: 20 })).toBe("page=1&limit=20");
    expect(teamsUrl("http://api", { page: 1, limit: 10 })).toBe("http://api/teams?page=1&limit=10");
    expect(teamsUrl("http://api", {})).toBe("http://api/teams");
  });

  it("con edición la agrega a la consulta de estudiantes y de equipos", () => {
    expect(editionStudentsQueryString({ editionId: 4, videogameStatus: "CONFIRMADO" })).toBe(
      "editionId=4&videogameStatus=CONFIRMADO",
    );
    expect(teamsUrl("http://api", { page: 2, limit: 10, editionId: 4 })).toBe(
      "http://api/teams?page=2&limit=10&editionId=4",
    );
  });

  it("la búsqueda se omite con menos de 2 caracteres y se recorta", () => {
    expect(editionStudentsQueryString({ search: " a " })).toBe("");
    expect(editionStudentsQueryString({ search: "  ana " })).toBe("search=ana");
  });
});
