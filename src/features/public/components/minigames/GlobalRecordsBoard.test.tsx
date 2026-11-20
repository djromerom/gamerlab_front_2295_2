import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MinigameRecordError } from "@/features/public/api/minigameRecords";
import { announceMinigameRecordSaved } from "@/features/public/lib/minigameRecords";
import { SONGS } from "./songs";
import GlobalRecordsBoard from "./GlobalRecordsBoard";

const fetchMinigameTop = vi.fn();
const deleteMinigameRecord = vi.fn();
vi.mock("@/features/public/api/minigameRecords", async (original) => ({
  ...(await original<typeof import("@/features/public/api/minigameRecords")>()),
  fetchMinigameTop: (...args: unknown[]) => fetchMinigameTop(...args),
  deleteMinigameRecord: (...args: unknown[]) => deleteMinigameRecord(...args),
}));
const sesion = vi.hoisted(() => ({ userRole: null as string | null }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => sesion }));
const fetchConSesion = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/useFetch", () => ({ useFetch: () => fetchConSesion }));

const fila = (position: number, alias: string, score: number, track: string, id?: number) => ({
  ...(id === undefined ? {} : { id }), position, alias, score, track, createdAt: "2026-11-26T15:02:11.000Z",
});

beforeEach(() => {
  fetchMinigameTop.mockReset();
  deleteMinigameRecord.mockReset();
  sesion.userRole = null;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("GlobalRecordsBoard", () => {
  it("muestra el top 5 de cada juego; Arkad Jam se pide sin canción y cada fila dice la suya", async () => {
    fetchMinigameTop.mockImplementation(async (game: string) =>
      game === "ARKADASH"
        ? { game, track: "global", top: [fila(1, "Pixel", 812, "global"), fila(2, "Nova", 640, "global")] }
        : { game, track: null, top: [fila(1, "Coda", 41250, "piano-0")] },
    );
    render(<GlobalRecordsBoard />);
    const dash = await screen.findByRole("region", { name: "Top 5 global de Arkadash" });
    await waitFor(() => expect(within(dash).getAllByRole("listitem")).toHaveLength(2));
    expect(within(dash).getByText("Pixel")).toBeTruthy();

    const jam = screen.getByRole("region", { name: "Top 5 global de Arkad Jam" });
    expect(within(jam).getByText("41.250")).toBeTruthy();
    await waitFor(() => expect(within(jam).getByText(`${SONGS.piano[0].nombre} · Piano`)).toBeTruthy());
    expect(fetchMinigameTop).toHaveBeenCalledWith("ARKADASH");
    expect(fetchMinigameTop).toHaveBeenCalledWith("ARKAD_JAM");
  });

  it("sin récords invita a jugar", async () => {
    fetchMinigameTop.mockImplementation(async (game: string) => ({ game, track: null, top: [] }));
    render(<GlobalRecordsBoard />);
    expect(await screen.findAllByText(/Aún no hay récords/)).toHaveLength(2);
  });

  it("si el back falla, ese juego no muestra su top", async () => {
    fetchMinigameTop.mockImplementation(async (game: string) => {
      if (game === "ARKAD_JAM") throw new Error("429");
      return { game, track: "global", top: [] };
    });
    render(<GlobalRecordsBoard />);
    await screen.findByText(/Aún no hay récords/);
    expect(screen.queryByRole("region", { name: "Top 5 global de Arkad Jam" })).toBeNull();
  });

  it("si fallan los dos juegos, no se ve nada", async () => {
    fetchMinigameTop.mockImplementation(async () => {
      throw new Error("sin red");
    });
    const { container } = render(<GlobalRecordsBoard />);
    await waitFor(() => expect(container.querySelector(".records-globales")?.hasAttribute("hidden")).toBe(true));
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("al guardar un récord vuelve a pedir el top de ese juego", async () => {
    fetchMinigameTop.mockImplementation(async (game: string) => ({ game, track: null, top: [] }));
    render(<GlobalRecordsBoard />);
    await screen.findAllByText(/Aún no hay récords/);
    fetchMinigameTop.mockResolvedValue({ game: "ARKADASH", track: "global", top: [fila(1, "Nuevo", 99, "global")] });
    act(() => announceMinigameRecordSaved("ARKADASH"));
    expect(await screen.findByText("Nuevo")).toBeTruthy();
    expect(fetchMinigameTop).toHaveBeenCalledTimes(3);
  });
  describe("Administrador", () => {
    const CON_ID = [fila(1, "Grosero", 900, "global", 41), fila(2, "Nova", 640, "global", 42)];
    const responder = (dash: ReturnType<typeof fila>[]) =>
      fetchMinigameTop.mockImplementation(async (game: string) =>
        game === "ARKADASH" ? { game, track: "global", top: dash } : { game, track: null, top: [] },
      );

    it("quien no es Administrador no ve la «x», aunque lleguen id", async () => {
      responder(CON_ID);
      render(<GlobalRecordsBoard />);
      await screen.findByText("Grosero");
      expect(screen.queryByRole("button", { name: /Quitar el récord/ })).toBeNull();
    });

    it("con confirmación borra el récord con la sesión y vuelve a pedir el top", async () => {
      sesion.userRole = "Administrador";
      responder(CON_ID);
      deleteMinigameRecord.mockImplementation(async () => {
        responder([fila(1, "Nova", 640, "global", 42)]); // desde aquí el back ya no lo tiene
        return { game: "ARKADASH", track: "global", top: [] };
      });
      vi.spyOn(window, "confirm").mockReturnValue(true);
      render(<GlobalRecordsBoard />);
      fireEvent.click(await screen.findByRole("button", { name: "Quitar el récord de Grosero" }));

      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("«Grosero»"));
      expect(deleteMinigameRecord).toHaveBeenCalledWith(41, fetchConSesion);
      await waitFor(() => expect(screen.queryByText("Grosero")).toBeNull());
      expect(screen.getByText("Nova")).toBeTruthy();
    });

    it("si cancela no borra nada", async () => {
      sesion.userRole = "Administrador";
      responder(CON_ID);
      vi.spyOn(window, "confirm").mockReturnValue(false);
      render(<GlobalRecordsBoard />);
      fireEvent.click(await screen.findByRole("button", { name: "Quitar el récord de Grosero" }));
      expect(deleteMinigameRecord).not.toHaveBeenCalled();
    });

    it("si otro ya lo borró (404) solo refresca; si falla la sesión, avisa", async () => {
      sesion.userRole = "Administrador";
      responder(CON_ID);
      vi.spyOn(window, "confirm").mockReturnValue(true);
      deleteMinigameRecord.mockRejectedValueOnce(new MinigameRecordError(404, "MINIGAME_RECORD_NOT_FOUND"));
      render(<GlobalRecordsBoard />);
      fireEvent.click(await screen.findByRole("button", { name: "Quitar el récord de Grosero" }));
      await waitFor(() => expect(fetchMinigameTop).toHaveBeenCalledTimes(3));
      expect(screen.queryByRole("alert")).toBeNull();

      deleteMinigameRecord.mockRejectedValueOnce(new MinigameRecordError(403));
      await waitFor(() => expect(screen.getByRole("button", { name: "Quitar el récord de Grosero" }).hasAttribute("disabled")).toBe(false));
      fireEvent.click(screen.getByRole("button", { name: "Quitar el récord de Grosero" }));
      expect((await screen.findByRole("alert")).textContent).toMatch(/No se pudo quitar el récord/);
    });
  });
});
