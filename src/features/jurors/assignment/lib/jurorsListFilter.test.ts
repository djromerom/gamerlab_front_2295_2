import { describe, expect, it } from "vitest";
import type { Jurado } from "@/features/jurors/types/jurors";
import { countLabel, filterJurorsList } from "./jurorsListFilter";

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
