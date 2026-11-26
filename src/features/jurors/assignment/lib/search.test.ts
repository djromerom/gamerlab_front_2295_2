import { describe, expect, it } from "vitest";
import type { Team } from "@/features/jurors/types/jurors";
import { matchesSearch, searchTeams } from "./search";

describe("matchesSearch", () => {
  it("sin texto (o solo espacios) todo coincide", () => {
    expect(matchesSearch(["Ana"], "")).toBe(true);
    expect(matchesSearch(["Ana"], "   ")).toBe(true);
  });

  it("no distingue tildes ni mayúsculas, en ninguno de los dos sentidos", () => {
    expect(matchesSearch(["José Núñez"], "jose nunez")).toBe(true);
    expect(matchesSearch(["Jose Nunez"], "JOSÉ NÚÑEZ")).toBe(true);
  });

  it("cada palabra debe aparecer en algún campo, en cualquier orden", () => {
    expect(matchesSearch(["Bosque Eterno", "Los Druidas"], "druidas bosque")).toBe(true);
    expect(matchesSearch(["Bosque Eterno", "Los Druidas"], "bosque piratas")).toBe(false);
  });

  it("ignora los campos vacíos", () => {
    expect(matchesSearch([null, undefined, "", "Ana"], "ana")).toBe(true);
  });
});

describe("searchTeams · lista «Equipos» de la asignación de jurados", () => {
  const team = (id: number, game: string, name: string, leaderName: string): Team => ({
    id,
    game,
    name,
    leaderName,
    leaderEmail: `lider${id}@uninorte.edu.co`,
    semester: "",
    jurados: [],
    requiredJurados: 3,
  });
  const teams = [
    team(1, "(Dis)connected", "Alternative Studios", "Luisa Fernanda Mercado Royert"),
    team(2, "Alcalde Digital", "Altrius", "Sebastián Blanco"),
    team(3, "Bosque Eterno", "Los Druidas", "María José Núñez"),
  ];
  const ids = (search: string) => searchTeams(teams, search).map((t) => t.id);

  it("sin texto deja todos los equipos, en el mismo orden", () => {
    expect(ids("")).toEqual([1, 2, 3]);
  });

  it("busca por videojuego, por nombre del equipo y por líder", () => {
    expect(ids("dis)con")).toEqual([1]);
    expect(ids("altrius")).toEqual([2]);
    expect(ids("sebastian")).toEqual([2]);
    expect(ids("nunez")).toEqual([3]);
  });

  it("una palabra que está en varios equipos los deja a todos", () => {
    expect(ids("alt")).toEqual([1, 2]);
  });

  it("no busca por el correo del líder, que la tarjeta no muestra", () => {
    expect(ids("lider2@")).toEqual([]);
  });
});
