import { describe, expect, it } from "vitest";
import type { Jurado } from "@/features/jurors/types/jurors";
import { countLabel, filterJurorsList, searchJurors } from "./jurorsListFilter";

const juror = (id: string, name: string, tipo: Jurado["tipo"]): Jurado => ({
  id,
  firstName: name,
  lastName: "",
  name,
  email: `${id}@uninorte.edu.co`,
  avatar: "",
  tipo,
  evaluatedCount: 0,
  evaluatedGameNames: [],
  unevaluatedCount: 0,
  unevaluatedGameNames: [],
});

const jurados = [juror("a", "Ana", "OFFICIAL"), juror("b", "Beto", "BACKUP"), juror("c", "Carla", "OFFICIAL")];

describe("filterJurorsList (BG-66)", () => {
  it("«todos» muestra la lista completa", () => {
    expect(filterJurorsList(jurados, "", "todos").map((j) => j.id)).toEqual(["a", "b", "c"]);
  });

  it("filtra por tipo y por búsqueda", () => {
    expect(filterJurorsList(jurados, "", "suplentes").map((j) => j.id)).toEqual(["b"]);
    expect(filterJurorsList(jurados, "car", "oficiales").map((j) => j.id)).toEqual(["c"]);
  });
});

describe("countLabel (BG-66)", () => {
  it("usa singular con 1", () => {
    expect(countLabel(1, "Suplente", "Suplentes")).toBe("1 Suplente");
    expect(countLabel(3, "Suplente", "Suplentes")).toBe("3 Suplentes");
  });
});

describe("searchJurors · búsqueda de «Asignar Jurado»", () => {
  const lista = [
    { ...juror("jp", "José Pérez", "OFFICIAL"), email: "jperez@uninorte.edu.co" },
    { ...juror("am", "Ana María Núñez", "BACKUP"), email: "anunez@gmail.com" },
    { ...juror("lg", "Luis Gómez", "OFFICIAL"), email: "lgomez@uninorte.edu.co" },
  ];
  const ids = (search: string) => searchJurors(lista, search).map((j) => j.id);

  it("sin texto (o solo espacios) deja la lista completa", () => {
    expect(ids("")).toEqual(["jp", "am", "lg"]);
    expect(ids("   ")).toEqual(["jp", "am", "lg"]);
  });

  it("no distingue tildes ni mayúsculas, en ninguno de los dos sentidos", () => {
    expect(ids("jose")).toEqual(["jp"]);
    expect(ids("NUÑEZ")).toEqual(["am"]);
    expect(ids("nunez")).toEqual(["am"]);
    expect(ids("gómez")).toEqual(["lg"]);
  });

  it("busca también por correo", () => {
    expect(ids("gmail")).toEqual(["am"]);
    expect(ids("uninorte")).toEqual(["jp", "lg"]);
  });

  it("cada palabra debe aparecer, en cualquier orden", () => {
    expect(ids("perez jose")).toEqual(["jp"]);
    expect(ids("  ana   nunez ")).toEqual(["am"]);
    expect(ids("ana gomez")).toEqual([]);
  });
});
