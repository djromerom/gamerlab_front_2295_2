import { describe, expect, it } from "vitest";
import { findMyTeam, isOwnLikeEvent, resolveMyTeam } from "@/lib/opaqueKeys";
import type { Team } from "@/types/Team";

const team = (id: number, extra: Partial<Team> = {}): Team => ({
  id,
  videogameId: id,
  gameName: `g${id}`,
  teamName: `t${id}`,
  teamCode: `c${id}`,
  status: "CONFIRMADO",
  ...extra,
});

describe("findMyTeam", () => {
  it("resuelve mi equipo con isMine sin depender de userId", () => {
    const teams = [team(1, { userId: "u-x" }), team(2, { isMine: true }), team(3, { isMine: false })];
    expect(findMyTeam(teams)?.id).toBe(2);
  });
  it("devuelve null si ningún equipo trae isMine (sin sesión)", () => {
    expect(findMyTeam([team(1, { userId: "u-1" }), team(2)])).toBeNull();
  });
});

describe("isOwnLikeEvent", () => {
  it("true cuando triggerKey coincide con likeKey", () => {
    expect(isOwnLikeEvent({ triggerKey: "abc123" }, "abc123")).toBe(true);
  });
  it("false con otra clave, sin triggerKey o sin likeKey", () => {
    expect(isOwnLikeEvent({ triggerKey: "abc123" }, "zzz")).toBe(false);
    expect(isOwnLikeEvent({}, "abc123")).toBe(false);
    expect(isOwnLikeEvent({ triggerKey: undefined }, undefined)).toBe(false);
  });
});

describe("extractTeams / resolveMyTeam", () => {
  const mine = { id: 2, isMine: true };
  const other = { id: 1, userId: "u-1" };
  it("resuelve con isMine en array, data e items, ignorando userId", () => {
    expect(resolveMyTeam([other, mine])).toBe(mine);
    expect(resolveMyTeam({ data: [other, mine] })).toBe(mine);
    expect(resolveMyTeam({ items: [other, mine] })).toBe(mine);
  });
  it("null si no hay isMine", () => {
    expect(resolveMyTeam({ data: [other] }, )).toBeNull();
    expect(resolveMyTeam(null)).toBeNull();
  });
});
