import { describe, expect, it } from "vitest";
import {
  formatScore,
  gradedGamesUrl,
  toGradedCard,
  type GradedGameApi,
} from "@/features/grading/lib/gradedGames";

const fila: GradedGameApi = {
  videogameId: 24,
  videogameName: "Stella",
  logoUrl: "https://cdn.test/stella.png",
  teamName: "Los Astros",
  teamCode: "N1-AYP-119",
  members: [{ fullName: "Ana Pérez" }, { fullName: "Luis Gómez" }],
  nrc: null,
  subject: null,
  description: null,
  isEvaluated: true,
  totalScore: 4.552,
  comments: "Buen trabajo",
  criteria: [{ criterionId: 1, name: "Jugabilidad", score: 4.5 }],
};

describe("gradedGamesUrl", () => {
  it("no lleva jurorId: el back toma el jurado del token", () => {
    const url = gradedGamesUrl("http://api.test", 2, 10);
    expect(url).toBe("http://api.test/graded-games?page=2&limit=10");
    expect(url).not.toContain("jurorId");
    expect(url).not.toContain("JUROR_ID_AQUI");
  });
});

describe("toGradedCard", () => {
  it("convierte la fila del back en la tarjeta del grid, con textos por defecto", () => {
    expect(toGradedCard(fila)).toEqual({
      id: 24,
      nombre: "Stella",
      equipo: "Los Astros",
      teamCode: "N1-AYP-119",
      materia: "Sin materia",
      nrc: "Sin NRC",
      participantes: ["Ana Pérez", "Luis Gómez"],
      imagen: "https://cdn.test/stella.png",
      descripcion: "Sin descripción",
      isEvaluated: true,
      totalScore: 4.552,
      comments: "Buen trabajo",
      criteria: [{ criterionId: 1, name: "Jugabilidad", score: 4.5 }],
    });
  });

  it("deja criteria sin definir si el back no la envía", () => {
    const { criteria: _omitida, ...sinCriterios } = fila;
    expect(toGradedCard(sinCriterios).criteria).toBeUndefined();
  });
});

describe("formatScore", () => {
  it("muestra la nota con 2 decimales", () => {
    expect(formatScore(4.552)).toBe("4.55");
    expect(formatScore(3)).toBe("3.00");
    expect(formatScore(0)).toBe("0.00");
  });

  it("muestra un guion si no hay nota", () => {
    expect(formatScore(undefined)).toBe("—");
    expect(formatScore(null)).toBe("—");
    expect(formatScore(Number.NaN)).toBe("—");
  });
});
