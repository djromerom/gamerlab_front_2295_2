import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ submitJurorSurvey: vi.fn() }));

vi.mock("@/features/jurors/survey/api/jurorSurvey", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/jurors/survey/api/jurorSurvey")>()),
  submitJurorSurvey: mocks.submitJurorSurvey,
}));

import { JurorSurveyApiError } from "@/features/jurors/survey/api/jurorSurvey";
import { JurorSurveyDialog } from "@/features/jurors/survey/components/JurorSurveyDialog";
import { SURVEY_QUESTIONS } from "@/lib/jurorSurvey";

const scores = [5, 4, 4, 3, 5, 4];

function answerAll() {
  SURVEY_QUESTIONS.forEach(({ label }, i) => {
    const group = screen.getByRole("group", { name: new RegExp(label.replace(/[()]/g, "\\$&")) });
    fireEvent.click(within(group).getByLabelText(String(scores[i])));
  });
}

function renderDialog(props: Partial<Parameters<typeof JurorSurveyDialog>[0]> = {}) {
  const handlers = {
    onOpenChange: vi.fn(),
    onAnswered: vi.fn(),
    onUnavailable: vi.fn(),
  };
  render(<JurorSurveyDialog open {...handlers} {...props} />);
  return handlers;
}

describe("Formulario de la encuesta del jurado (ARK-184)", () => {
  beforeEach(() => {
    mocks.submitJurorSurvey.mockReset();
  });
  afterEach(cleanup);

  it("pide responder las 6 preguntas antes de enviar", async () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Enviar encuesta" }));

    expect(await screen.findByRole("alert")).toHaveProperty("textContent", expect.stringContaining("Faltan 6 preguntas"));
    expect(mocks.submitJurorSurvey).not.toHaveBeenCalled();
  });

  it("envía las notas y el comentario y muestra el agradecimiento del back", async () => {
    mocks.submitJurorSurvey.mockResolvedValue({ outcome: "saved", message: "¡Gracias por contarnos tu experiencia!" });
    const { onAnswered } = renderDialog();

    answerAll();
    fireEvent.change(screen.getByLabelText(/Comentarios y sugerencias/), {
      target: { value: "  Faltó señalizar el salón " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar encuesta" }));

    expect(await screen.findByText("¡Gracias por contarnos tu experiencia!")).toBeTruthy();
    expect(mocks.submitJurorSurvey).toHaveBeenCalledWith({
      loginEase: 5,
      groupsClarity: 4,
      gradingEase: 4,
      stability: 3,
      fairOrganization: 5,
      overall: 4,
      comments: "Faltó señalizar el salón",
    });
    expect(onAnswered).toHaveBeenCalledTimes(1);
  });

  it("cuenta los caracteres del comentario (máximo 1000)", () => {
    renderDialog();
    const textarea = screen.getByLabelText(/Comentarios y sugerencias/) as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: "Hola" } });
    expect(screen.getByText("4/1000")).toBeTruthy();

    fireEvent.change(textarea, { target: { value: "x".repeat(1200) } });
    expect(textarea.value).toHaveLength(1000);
    expect(screen.getByText("1000/1000")).toBeTruthy();
  });

  it("si falla la red conserva lo elegido y permite reintentar", async () => {
    mocks.submitJurorSurvey
      .mockRejectedValueOnce(
        new JurorSurveyApiError(
          "No pudimos enviar la encuesta. Revisa tu conexión e inténtalo de nuevo; tus respuestas siguen aquí.",
          0,
        ),
      )
      .mockResolvedValueOnce({ outcome: "saved", message: "¡Gracias por contarnos tu experiencia!" });
    renderDialog();

    answerAll();
    fireEvent.click(screen.getByRole("button", { name: "Enviar encuesta" }));

    expect(await screen.findByText(/tus respuestas siguen aquí/)).toBeTruthy();
    const overall = screen.getByRole("group", { name: /Experiencia general/ });
    expect((within(overall).getByLabelText("4") as HTMLInputElement).checked).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("¡Gracias por contarnos tu experiencia!")).toBeTruthy();
    expect(mocks.submitJurorSurvey).toHaveBeenCalledTimes(2);
    expect(mocks.submitJurorSurvey.mock.calls[1][0]).toEqual(mocks.submitJurorSurvey.mock.calls[0][0]);
  });

  it("un 409 se muestra como ya guardada", async () => {
    mocks.submitJurorSurvey.mockResolvedValue({
      outcome: "alreadyAnswered",
      message: "Ya respondiste la encuesta de esta edición. ¡Gracias!",
    });
    const { onAnswered } = renderDialog();

    answerAll();
    fireEvent.click(screen.getByRole("button", { name: "Enviar encuesta" }));

    expect(await screen.findByText("Ya respondiste la encuesta de esta edición. ¡Gracias!")).toBeTruthy();
    expect(onAnswered).toHaveBeenCalled();
  });

  it("un 403 muestra el motivo y pide volver a consultar el estado", async () => {
    mocks.submitJurorSurvey.mockRejectedValue(
      new JurorSurveyApiError(
        "La encuesta se habilita cuando envíes las evaluaciones de todos tus grupos asignados.",
        403,
        "SURVEY_NOT_AVAILABLE",
        "PENDING_EVALUATIONS",
      ),
    );
    const { onUnavailable } = renderDialog();

    answerAll();
    fireEvent.click(screen.getByRole("button", { name: "Enviar encuesta" }));

    expect(await screen.findByText(/La encuesta se habilita cuando envíes/)).toBeTruthy();
    await waitFor(() => expect(onUnavailable).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Enviar encuesta" })).toBeTruthy();
  });

  it("«Omitir» cierra sin guardar nada", () => {
    const { onOpenChange } = renderDialog();

    answerAll();
    fireEvent.click(screen.getByRole("button", { name: "Omitir" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mocks.submitJurorSurvey).not.toHaveBeenCalled();
  });
});
