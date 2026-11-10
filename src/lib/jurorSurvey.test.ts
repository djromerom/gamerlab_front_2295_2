import { describe, expect, it } from "vitest";
import {
  SURVEY_QUESTIONS,
  buildSurveyPayload,
  distributionPercent,
  emptySurveyAnswers,
  formatSurveyAverage,
  hasJurorSurveyCheck,
  missingSurveyAnswers,
} from "@/lib/jurorSurvey";

const allAnswered = () => ({
  loginEase: 5,
  groupsClarity: 4,
  gradingEase: 4,
  stability: 3,
  fairOrganization: 5,
  overall: 4,
});

describe("Encuesta del jurado: reglas del formulario (ARK-184)", () => {
  it("tiene las 6 preguntas del back, en orden", () => {
    expect(SURVEY_QUESTIONS.map((q) => q.key)).toEqual([
      "loginEase",
      "groupsClarity",
      "gradingEase",
      "stability",
      "fairOrganization",
      "overall",
    ]);
  });

  it("lista las preguntas sin responder", () => {
    const answers = { ...emptySurveyAnswers(), loginEase: 5, overall: 3 };
    expect(missingSurveyAnswers(answers)).toEqual([
      "groupsClarity",
      "gradingEase",
      "stability",
      "fairOrganization",
    ]);
  });

  it("no arma el cuerpo si falta una pregunta", () => {
    expect(buildSurveyPayload({ ...allAnswered(), stability: null }, "")).toBeNull();
  });

  it("recorta el comentario y lo omite si queda vacío", () => {
    expect(buildSurveyPayload(allAnswered(), "   ")).toEqual(allAnswered());
    expect(buildSurveyPayload(allAnswered(), "  Faltó señalizar el salón \n")).toEqual({
      ...allAnswered(),
      comments: "Faltó señalizar el salón",
    });
  });

  it("calcula el porcentaje de la distribución sin dividir por cero", () => {
    expect(distributionPercent(1, 3)).toBe(33);
    expect(distributionPercent(0, 0)).toBe(0);
  });

  it("muestra el promedio con coma decimal o una raya sin respuestas", () => {
    expect(formatSurveyAverage(4.333)).toBe("4,3");
    expect(formatSurveyAverage(5)).toBe("5,0");
    expect(formatSurveyAverage(null)).toBe("—");
  });

  it("reconoce el aviso de navegación tras un envío", () => {
    expect(hasJurorSurveyCheck({ jurorSurveyCheck: true })).toBe(true);
    expect(hasJurorSurveyCheck({ games: [] })).toBe(false);
    expect(hasJurorSurveyCheck(null)).toBe(false);
  });
});
