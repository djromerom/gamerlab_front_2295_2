import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ apiFetch }));

import {
  TeamVerificationError,
  fetchTeamVerificationState,
  setTeamVerificationRequired,
} from "@/features/teams/api/teamVerification";

const API = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => apiFetch.mockReset());

describe("fetchTeamVerificationState (HU-50, ARK-311)", () => {
  it("lee `required` cuando el back lo envía", async () => {
    apiFetch.mockResolvedValue(json({ status: { 1: true }, locks: {}, required: { 1: false } }));
    await expect(fetchTeamVerificationState([1])).resolves.toEqual({
      status: { 1: true },
      locks: {},
      required: { 1: false },
    });
  });

  it("con un back anterior `required` queda vacío", async () => {
    apiFetch.mockResolvedValue(json({ status: { 1: false }, locks: {} }));
    expect((await fetchTeamVerificationState([1])).required).toEqual({});
    apiFetch.mockResolvedValue(json({ 1: false }));
    expect(await fetchTeamVerificationState([1])).toEqual({ status: { 1: false }, locks: {}, required: {} });
  });
});

describe("setTeamVerificationRequired (HU-50, ARK-311)", () => {
  it("envía PATCH {required} a /team-verification/:teamId/required", async () => {
    apiFetch.mockResolvedValue(json({ teamId: 41, verificationRequired: false, changed: true }));
    await expect(setTeamVerificationRequired(41, false)).resolves.toEqual({
      teamId: 41,
      verificationRequired: false,
      changed: true,
    });
    const [url, init] = apiFetch.mock.calls[0];
    expect(url).toBe(`${API}/team-verification/41/required`);
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ required: false });
  });

  it("si el back lo rechaza lanza su mensaje con el status", async () => {
    apiFetch.mockResolvedValue(
      json({ statusCode: 400, message: "Los equipos de colegios (N0) no tienen código de verificación" }, 400),
    );
    const error = await setTeamVerificationRequired(5, false).catch((e) => e);
    expect(error).toBeInstanceOf(TeamVerificationError);
    expect(error).toMatchObject({
      status: 400,
      message: "Los equipos de colegios (N0) no tienen código de verificación",
    });
  });
});
