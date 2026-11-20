import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { fetchOwnTeam, resetOwnTeamCacheForTests } from "./ownTeam";
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
