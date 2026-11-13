import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ExternalPresenterError,
  createExternalPresenter,
  createExternalPresentersBulk,
  describeCertificateFailure,
  downloadExternalPresenterTeamCertificate,
  sendExternalPresenterTeamCertificate,
  downloadExternalPresentersExport,
  fetchExternalPresenters,
  fetchMyExternalPresenter,
  removeExternalPresenter,
  sendAllExternalPresenterCertificates,
  sendExternalPresenterCertificate,
  updateExternalPresenter,
} from "@/fetchs/externalPresenters";

const apiFetch = vi.fn();

vi.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

const API = "http://api.test";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const INPUT = {
  email: "ana@empresa.com",
  confirmEmail: "ana@empresa.com",
  firstName: "Ana",
  lastName: "Pérez",
};

describe("Cliente de presentadores externos (ARK-194 / HU-33)", () => {
  afterEach(() => {
    apiFetch.mockReset();
    vi.restoreAllMocks();
  });

  it("pide la lista de la edición activa o de la edición elegida", async () => {
    apiFetch.mockImplementation(async () => json(200, { edition: null, presenters: [] }));

    await expect(fetchExternalPresenters()).resolves.toEqual({ edition: null, presenters: [] });
    await fetchExternalPresenters(3);

    expect(apiFetch.mock.calls[0][0]).toBe(`${API}/external-presenters`);
    expect(apiFetch.mock.calls[1][0]).toBe(`${API}/external-presenters?editionId=3`);
  });

  it("registra con POST y el correo repetido en el cuerpo", async () => {
    apiFetch.mockResolvedValue(json(201, { id: 9, ...INPUT }));

    await createExternalPresenter(INPUT);

    const [url, options] = apiFetch.mock.calls[0];
    expect(url).toBe(`${API}/external-presenters`);
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual(INPUT);
  });

  it("los errores conservan el código HTTP y el `code` del back", async () => {
    apiFetch.mockResolvedValue(
      json(409, {
        statusCode: 409,
        code: "EMAIL_IN_USE_BY_OTHER_ROLE",
        message: "Ya existe una cuenta con ese correo con el rol «Administrador». Usa otro correo.",
      }),
    );

    const error = await createExternalPresenter(INPUT).catch((e) => e);
    expect(error).toBeInstanceOf(ExternalPresenterError);
    expect(error).toMatchObject({ status: 409, code: "EMAIL_IN_USE_BY_OTHER_ROLE" });
    expect(error.message).toMatch(/rol «Administrador»/);
  });

  it("une la lista de mensajes de validación del back", async () => {
    apiFetch.mockResolvedValue(
      json(400, { message: ["El nombre es obligatorio", "El correo no es válido"] }),
    );

    await expect(createExternalPresentersBulk([INPUT])).rejects.toThrow(
      "El nombre es obligatorio, El correo no es válido",
    );
    expect(JSON.parse(apiFetch.mock.calls[0][1].body)).toEqual({ presenters: [INPUT] });
  });

  it("edita con PATCH, borra con DELETE y envía el certificado con POST", async () => {
    apiFetch
      .mockResolvedValueOnce(json(200, { id: 9 }))
      .mockResolvedValueOnce(json(200, { removed: true }))
      .mockResolvedValueOnce(json(200, { id: 9, email: "a", certificateSentAt: "x" }))
      .mockResolvedValueOnce(json(200, { sent: 1, failed: [], message: "ok" }));

    await updateExternalPresenter(9, { organization: null });
    await removeExternalPresenter(9);
    await sendExternalPresenterCertificate(9);
    await sendAllExternalPresenterCertificates();

    const calls = apiFetch.mock.calls.map(([url, options]) => [url, options.method]);
    expect(calls).toEqual([
      [`${API}/external-presenters/9`, "PATCH"],
      [`${API}/external-presenters/9`, "DELETE"],
      [`${API}/external-presenters/9/certificate`, "POST"],
      [`${API}/external-presenters/certificates/send-all`, "POST"],
    ]);
    // null borra la organización en el back
    expect(JSON.parse(apiFetch.mock.calls[0][1].body)).toEqual({ organization: null });
  });

  it("el panel del presentador pide /me y un 404 conserva su estado", async () => {
    apiFetch.mockResolvedValue(
      json(404, { code: "EXTERNAL_PRESENTER_NOT_FOUND", message: "No encontrado" }),
    );

    const error = await fetchMyExternalPresenter().catch((e) => e);
    expect(apiFetch.mock.calls[0][0]).toBe(`${API}/external-presenters/me`);
    expect(error).toMatchObject({ status: 404, code: "EXTERNAL_PRESENTER_NOT_FOUND" });
  });
});

describe("Equipos presentadores externos (ARK-209 / HU-39)", () => {
  afterEach(() => {
    apiFetch.mockReset();
    vi.restoreAllMocks();
  });

  it("envía el certificado del equipo con POST a /external-presenters/teams/:id/certificate", async () => {
    apiFetch.mockResolvedValue(json(200, { teamId: 400, sentTo: ["ana@uninorte.edu.co"], failed: [] }));

    await expect(sendExternalPresenterTeamCertificate(400)).resolves.toEqual({
      teamId: 400,
      sentTo: ["ana@uninorte.edu.co"],
      failed: [],
    });
    const [url, options] = apiFetch.mock.calls[0];
    expect(url).toBe(`${API}/external-presenters/teams/400/certificate`);
    expect(options.method).toBe("POST");
  });

  it("si el equipo ya no está marcado conserva el código CERTIFICATE_TEAM_GRADABLE", async () => {
    apiFetch.mockResolvedValue(
      json(400, { code: "CERTIFICATE_TEAM_GRADABLE", message: "El equipo no es presentador externo" }),
    );

    const error = await sendExternalPresenterTeamCertificate(400).catch((e) => e);
    expect(error).toBeInstanceOf(ExternalPresenterError);
    expect(error).toMatchObject({ status: 400, code: "CERTIFICATE_TEAM_GRADABLE" });
  });

  it("descarga el PDF del equipo con GET y el código del equipo en el nombre", async () => {
    const downloaded: string[] = [];
    window.URL.createObjectURL = vi.fn(() => "blob:fake");
    window.URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      downloaded.push(this.download);
    });
    apiFetch.mockResolvedValue(new Response(new Blob(["pdf"]), { status: 200 }));

    await downloadExternalPresenterTeamCertificate({ id: 400, teamCode: "N2-ABC-201" });

    expect(apiFetch.mock.calls[0][0]).toBe(`${API}/external-presenters/teams/400/certificate`);
    expect(apiFetch.mock.calls[0][1]?.method ?? "GET").toBe("GET");
    expect(downloaded).toEqual(["certificado-presentador-N2-ABC-201.pdf"]);
  });

  it("describe los fallos sea texto u objeto", () => {
    expect(describeCertificateFailure("Sin correo")).toBe("Sin correo");
    expect(describeCertificateFailure({ email: "a@b.co", error: "Buzón lleno" })).toBe("a@b.co: Buzón lleno");
    expect(describeCertificateFailure({ teamName: "Los Pixeles", message: "Timeout" })).toBe("Los Pixeles: Timeout");
    expect(describeCertificateFailure({})).toBe("Error desconocido");
  });
});

describe("Exportar presentadores externos a Excel", () => {
  let downloaded: string[] = [];

  beforeEach(() => {
    downloaded = [];
    window.URL.createObjectURL = vi.fn(() => "blob:fake");
    window.URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloaded.push(this.download);
    });
  });

  afterEach(() => {
    apiFetch.mockReset();
    vi.restoreAllMocks();
  });

  it("descarga con el nombre que manda el back y la edición elegida", async () => {
    apiFetch.mockResolvedValue(
      new Response(new Blob(["xlsx"]), {
        status: 200,
        headers: { "Content-Disposition": `attachment; filename="presentadores_2025-S2.xlsx"` },
      }),
    );

    await expect(downloadExternalPresentersExport(3)).resolves.toBe("presentadores_2025-S2.xlsx");
    expect(apiFetch.mock.calls[0][0]).toBe(`${API}/external-presenters/export?editionId=3`);
    expect(downloaded).toEqual(["presentadores_2025-S2.xlsx"]);
  });

  it("si el back falla no descarga nada y lanza su mensaje", async () => {
    apiFetch.mockResolvedValue(json(404, { message: "No hay una edición activa" }));

    await expect(downloadExternalPresentersExport()).rejects.toThrow("No hay una edición activa");
    expect(downloaded).toEqual([]);
  });
});
