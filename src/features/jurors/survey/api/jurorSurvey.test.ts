import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  JUROR_SURVEY_EXPORT_FALLBACK_NAME,
  JurorSurveyApiError,
  downloadJurorSurveyExport,
  fetchJurorSurveyStatus,
  fetchJurorSurveySummary,
  submitJurorSurvey,
} from "@/features/jurors/survey/api/jurorSurvey";

const apiFetch = vi.fn();

vi.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const payload = {
  loginEase: 5,
  groupsClarity: 4,
  gradingEase: 4,
  stability: 3,
  fairOrganization: 5,
  overall: 4,
  comments: "Faltó señalizar el salón",
};

describe("Encuesta del jurado: llamadas a la API (ARK-184)", () => {
  afterEach(() => {
    apiFetch.mockReset();
    vi.restoreAllMocks();
  });

  it("consulta el estado sin caché", async () => {
    const status = {
      editionId: 3,
      available: true,
      reason: null,
      answered: false,
      answeredAt: null,
      assigned: 2,
      evaluated: 2,
    };
    apiFetch.mockResolvedValue(json(200, status));

    await expect(fetchJurorSurveyStatus()).resolves.toEqual(status);
    const [url, options] = apiFetch.mock.calls[0];
    expect(url).toBe("http://api.test/juror-survey/status");
    expect(options).toMatchObject({ credentials: "include", cache: "no-store" });
  });

  it("envía la respuesta y devuelve el agradecimiento del back", async () => {
    apiFetch.mockResolvedValue(
      json(201, { id: 12, createdAt: "2026-11-26T16:05:00.000Z", message: "¡Gracias por contarnos tu experiencia!" }),
    );

    await expect(submitJurorSurvey(payload)).resolves.toEqual({
      outcome: "saved",
      message: "¡Gracias por contarnos tu experiencia!",
    });
    const [url, options] = apiFetch.mock.calls[0];
    expect(url).toBe("http://api.test/juror-survey");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual(payload);
  });

  it("un 409 cuenta como ya guardada", async () => {
    apiFetch.mockResolvedValue(
      json(409, { code: "SURVEY_ALREADY_ANSWERED", message: "Ya respondiste la encuesta de esta edición. ¡Gracias!" }),
    );

    await expect(submitJurorSurvey(payload)).resolves.toEqual({
      outcome: "alreadyAnswered",
      message: "Ya respondiste la encuesta de esta edición. ¡Gracias!",
    });
  });

  it("un 403 trae el motivo y el mensaje del back", async () => {
    apiFetch.mockResolvedValue(
      json(403, {
        code: "SURVEY_NOT_AVAILABLE",
        reason: "PENDING_EVALUATIONS",
        message: "La encuesta se habilita cuando envíes las evaluaciones de todos tus grupos asignados.",
      }),
    );

    const error = await submitJurorSurvey(payload).catch((e) => e);
    expect(error).toBeInstanceOf(JurorSurveyApiError);
    expect(error).toMatchObject({
      status: 403,
      code: "SURVEY_NOT_AVAILABLE",
      reason: "PENDING_EVALUATIONS",
      message: "La encuesta se habilita cuando envíes las evaluaciones de todos tus grupos asignados.",
    });
  });

  it("un 400 une los mensajes por campo", async () => {
    apiFetch.mockResolvedValue(
      json(400, {
        message: [
          "«Experiencia general» debe ser un número entero de 1 a 5",
          "Los comentarios admiten como máximo 1000 caracteres",
        ],
      }),
    );

    await expect(submitJurorSurvey(payload)).rejects.toThrow(
      "«Experiencia general» debe ser un número entero de 1 a 5. Los comentarios admiten como máximo 1000 caracteres",
    );
  });

  it("si la red falla avisa que las respuestas siguen ahí", async () => {
    apiFetch.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await submitJurorSurvey(payload).catch((e) => e);
    expect(error).toMatchObject({ status: 0 });
    expect(error.message).toMatch(/tus respuestas siguen aquí/);
  });

  it("un 500 permite reintentar con un mensaje propio", async () => {
    apiFetch.mockResolvedValue(json(500, { message: "Internal server error" }));

    const error = await submitJurorSurvey(payload).catch((e) => e);
    expect(error).toMatchObject({ status: 500 });
    expect(error.message).toMatch(/Inténtalo de nuevo/);
  });

  it("pide el resumen de la edición activa o de la elegida", async () => {
    apiFetch.mockImplementation(async () => json(200, { totals: {} }));

    await fetchJurorSurveySummary();
    await fetchJurorSurveySummary(7);

    expect(apiFetch.mock.calls[0][0]).toBe("http://api.test/juror-survey/summary");
    expect(apiFetch.mock.calls[1][0]).toBe("http://api.test/juror-survey/summary?editionId=7");
  });

  it("muestra el mensaje del back si el resumen falla", async () => {
    apiFetch.mockResolvedValue(json(404, { message: "La edición 99 no existe" }));

    await expect(fetchJurorSurveySummary(99)).rejects.toThrow("La edición 99 no existe");
  });
});

describe("Encuesta del jurado: exportar a Excel (ARK-184)", () => {
  let clicked: string[] = [];

  beforeEach(() => {
    clicked = [];
    window.URL.createObjectURL = vi.fn(() => "blob:fake");
    window.URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this.download);
    });
  });

  afterEach(() => {
    apiFetch.mockReset();
    vi.restoreAllMocks();
  });

  it("descarga el Excel con el nombre que manda el back", async () => {
    apiFetch.mockResolvedValue(
      new Response(new Blob(["xlsx"]), {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="encuesta_jurados_2025-30_2026-11-08.xlsx"`,
        },
      }),
    );

    await expect(downloadJurorSurveyExport(3)).resolves.toBe("encuesta_jurados_2025-30_2026-11-08.xlsx");
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch.mock.calls[0][0]).toBe("http://api.test/juror-survey/export?editionId=3");
    expect(clicked).toEqual(["encuesta_jurados_2025-30_2026-11-08.xlsx"]);
  });

  it("usa un nombre por defecto si no viene Content-Disposition", async () => {
    apiFetch.mockResolvedValue(new Response(new Blob(["xlsx"]), { status: 200 }));

    await expect(downloadJurorSurveyExport()).resolves.toBe(JUROR_SURVEY_EXPORT_FALLBACK_NAME);
    expect(apiFetch.mock.calls[0][0]).toBe("http://api.test/juror-survey/export");
  });

  it("no descarga nada si el back responde un error", async () => {
    apiFetch.mockResolvedValue(json(403, { message: "Forbidden resource" }));

    await expect(downloadJurorSurveyExport()).rejects.toThrow("Forbidden resource");
    expect(clicked).toEqual([]);
  });
});
