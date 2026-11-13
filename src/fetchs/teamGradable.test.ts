import { afterEach, describe, expect, it, vi } from "vitest";
import { TeamGradableError, setTeamNotGradable } from "@/fetchs/teamGradable";

const apiFetch = vi.fn();

vi.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

const API = "http://api.test";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("Marca de equipo no calificable (ARK-209 / HU-39)", () => {
  afterEach(() => apiFetch.mockReset());

  it("marca con PATCH /teams/:id/gradable y devuelve el aviso de jurados retirados", async () => {
    const body = {
      id: 400,
      teamCode: "N2-ABC-201",
      teamName: "Los Pixeles",
      notGradable: true,
      juradosRetirados: [{ id: "uuid-jurado", nombre: "Ana Gómez" }],
      avisoAsignacion: "El equipo se marcó como no calificable y se le retiraron 1 jurado(s).",
    };
    apiFetch.mockResolvedValue(json(200, body));

    await expect(setTeamNotGradable(400, true)).resolves.toEqual(body);

    const [url, options] = apiFetch.mock.calls[0];
    expect(url).toBe(`${API}/teams/400/gradable`);
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({ notGradable: true });
  });

  it("desmarca enviando notGradable: false", async () => {
    apiFetch.mockResolvedValue(json(200, { id: 400, teamCode: "X", teamName: "Y", notGradable: false }));

    const result = await setTeamNotGradable(400, false);

    expect(JSON.parse(apiFetch.mock.calls[0][1].body)).toEqual({ notGradable: false });
    expect(result.avisoAsignacion).toBeUndefined();
  });

  it("TEAM_NOT_IN_ACTIVE_EDITION se explica con un mensaje propio", async () => {
    apiFetch.mockResolvedValue(
      json(400, { statusCode: 400, code: "TEAM_NOT_IN_ACTIVE_EDITION", message: "Team not in active edition" }),
    );

    const error = await setTeamNotGradable(400, true).catch((e) => e);
    expect(error).toBeInstanceOf(TeamGradableError);
    expect(error).toMatchObject({ status: 400, code: "TEAM_NOT_IN_ACTIVE_EDITION" });
    expect(error.message).toMatch(/edición activa/);
  });

  it("un 403 sin mensaje dice que solo el administrador puede marcar", async () => {
    apiFetch.mockResolvedValue(new Response("", { status: 403 }));

    await expect(setTeamNotGradable(400, true)).rejects.toThrow(/Solo el administrador/);
  });

  it("usa el mensaje del back cuando no hay código conocido", async () => {
    apiFetch.mockResolvedValue(json(400, { message: ["notGradable must be a boolean value"] }));

    await expect(setTeamNotGradable(400, true)).rejects.toThrow("notGradable must be a boolean value");
  });
});
