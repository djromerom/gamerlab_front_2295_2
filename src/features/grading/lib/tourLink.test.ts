import { describe, expect, it } from "vitest";
import { buildTourUrl, TOUR_BASE_URL } from "@/features/grading/lib/tourLink";

describe("buildTourUrl", () => {
  const origin = "https://arkad-test.openlab.uninorte.edu.co";

  it("lleva la URL de vuelta al juego y el código del equipo", () => {
    const url = new URL(
      buildTourUrl({ id: 655, teamCode: "N2-MFB-202" }, "/pendientes-calificar", origin),
    );
    expect(`${url.origin}${url.pathname}`).toBe(TOUR_BASE_URL);
    expect(url.searchParams.get("url-dinamica")).toBe(
      "https://arkad-test.openlab.uninorte.edu.co/pendientes-calificar/655",
    );
    expect(url.searchParams.get("equipo")).toBe("N2-MFB-202");
  });

  it("codifica la URL de vuelta para que no se mezcle con los parámetros del tour", () => {
    const href = buildTourUrl({ id: 668, teamCode: "N1-AYP-119" }, "/pendientes-calificar", origin);
    expect(href).toContain(
      "url-dinamica=https%3A%2F%2Farkad-test.openlab.uninorte.edu.co%2Fpendientes-calificar%2F668",
    );
  });

  it("sin código de equipo no manda el parámetro equipo", () => {
    const url = new URL(buildTourUrl({ id: 7 }, "/pendientes-calificar", origin));
    expect(url.searchParams.has("equipo")).toBe(false);
  });
});
