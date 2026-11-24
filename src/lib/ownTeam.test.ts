import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { fetchMemberTeam, fetchOwnTeam, resetOwnTeamCacheForTests } from "./ownTeam";
import type { Team } from "@/types/team";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));

const team = (id: number, editionId: number, isMine: boolean): Team => ({
  id,
  videogameId: id,
  gameName: `Juego ${id}`,
  teamName: `Equipo ${id}`,
  teamCode: `T-${id}`,
  editionId,
  isMine,
  status: "CONFIRMADO",
});

describe("fetchOwnTeam", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      resetOwnTeamCacheForTests();
    });

    it("resuelve el equipo marcado como propio", async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([team(11, 1, true)]),
      } as unknown as Response);

      await expect(fetchOwnTeam("student-1")).resolves.toMatchObject({ id: 11 });
    });

    it("rechaza cuando el usuario no tiene equipo propio", async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([team(11, 1, false)]),
      } as unknown as Response);

      await expect(fetchOwnTeam("student-1")).rejects.toThrow(
        "No tienes un equipo en la edición actual.",
      );
    });

    it("no reutiliza el equipo entre usuarios distintos", async () => {
      vi.mocked(apiFetch)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue([team(11, 1, true)]),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue([team(22, 1, true)]),
        } as unknown as Response);

      await fetchOwnTeam("student-1");
      await expect(fetchOwnTeam("student-2")).resolves.toMatchObject({ id: 22 });
    });
  });

describe("fetchMemberTeam", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetOwnTeamCacheForTests();
  });

  it("resuelve el equipo del integrante que no es líder, pero fetchOwnTeam no", async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([{ ...team(11, 1, false), isMember: true }]),
    } as unknown as Response);

    await expect(fetchMemberTeam("student-1")).resolves.toMatchObject({ id: 11 });
    await expect(fetchOwnTeam("student-1")).rejects.toThrow(
      "No tienes un equipo en la edición actual.",
    );
  });

  it("rechaza cuando el usuario no pertenece a ningún equipo", async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([{ ...team(11, 1, false), isMember: false }]),
    } as unknown as Response);

    await expect(fetchMemberTeam("student-1")).rejects.toThrow(
      "No tienes un equipo en la edición actual.",
    );
  });
});
