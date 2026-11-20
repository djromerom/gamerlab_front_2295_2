import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { juryManagement } from "@/features/jurors/management/api/juryManagement";
import { ManualAssignTeamDialog } from "./ManualAssignTeamDialog";
import type { LevelTeam } from "@/features/jurors/management/lib/manualAssignment";
import type { BulkAssignResponse } from "@/features/jurors/management/lib/bulkAssignment";

vi.mock("@/features/jurors/management/api/juryManagement", () => ({
  juryManagement: {
    getTeamsByJuror: vi.fn(),
    manualAssignment: vi.fn(),
    bulkAssignment: vi.fn(),
  },
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), message: vi.fn(), info: vi.fn() },
}));

const team = (overrides: Partial<LevelTeam>): LevelTeam => ({
  id: 1,
  name: "Equipo",
  videogame: "Juego",
  teamCode: "N1-ABC-001",
  level: 1,
  levelLabel: "Nivel 1",
  jurorCount: 0,
  ...overrides,
});

// Mismo orden que devuelve el back: por nivel y luego por nombre
const epsilon = team({ id: 500, name: "Equipo Epsilon", videogame: "Juego Epsilon", teamCode: "N0-ABC-001", level: 0, levelLabel: "Colegios" });
const alpha = team({ id: 100, name: "Equipo Alpha", videogame: "Juego Alpha", teamCode: "N1-ABC-010", level: 1, levelLabel: "Nivel 1", jurorCount: 2 });
const beta = team({ id: 200, name: "Equipo Beta", videogame: "Juego Beta", teamCode: "N1-ABC-020", level: 1, levelLabel: "Nivel 1", jurorCount: 1 });
const delta = team({ id: 400, name: "Equipo Delta", videogame: "Juego Delta", teamCode: "N2-ABC-201", level: 2, levelLabel: "Nivel 2", jurorCount: 1 });
const teams = [epsilon, alpha, beta, delta];

const juror = { id: "j-1", firstName: "Ana" };

const renderDialog = (props: Partial<Parameters<typeof ManualAssignTeamDialog>[0]> = {}) => {
  const onAssigned = vi.fn();
  render(<ManualAssignTeamDialog juror={juror} teams={teams} onAssigned={onAssigned} {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Asignar equipo" }));
  return { onAssigned };
};

const teamList = () => screen.getByRole("group", { name: "Equipos" });
const visibleNames = () =>
  within(teamList())
    .queryAllByRole("checkbox")
    .map((box) => box.getAttribute("aria-label"));
const box = (name: string) => screen.getByRole("checkbox", { name }) as HTMLInputElement;
const mark = (...names: string[]) => names.forEach((name) => fireEvent.click(box(name)));
const assignButton = () => screen.getByRole("button", { name: /^Asignar( \d+ equipos)?$/ }) as HTMLButtonElement;
const rowText = (name: string) => box(name).closest("label")?.textContent ?? "";
const ready = () => screen.findByText("Este jurado aún no tiene equipos asignados.");

const bulkResult = (overrides: Partial<BulkAssignResponse> = {}): BulkAssignResponse => ({
  message: "Se asignaron 2 equipos al jurado. 1 equipo no se asignó por un bloqueo.",
  edicion: { id: 5, title: "Feria Gamer 2026-30" },
  jurado: { id: "j-1", nombre: "Ana Pérez" },
  resultados: [
    { equipoId: 100, codigo: "N1-ABC-010", nombre: "Equipo Alpha", videojuego: "Juego Alpha", estado: "ASSIGNED", advertencias: [], cantidadJurados: 3, bloqueo: null },
    {
      equipoId: 200, codigo: "N1-ABC-020", nombre: "Equipo Beta", videojuego: "Juego Beta", estado: "ASSIGNED_WITH_WARNINGS",
      advertencias: [{ code: "JUROR_OVER_LIMIT", message: "El jurado quedaría con 4 grupos." }], cantidadJurados: 2, bloqueo: null,
    },
    {
      equipoId: 500, codigo: null, nombre: null, videojuego: null, estado: "BLOCKED", advertencias: [], cantidadJurados: null,
      bloqueo: { code: "SCHOOL_REQUIRES_SENIOR", message: "Los jurados JUNIOR no pueden ser asignados a colegios." },
    },
  ],
  totales: { solicitados: 3, asignados: 2, bloqueados: 1 },
  advertenciasAceptadas: [],
  ...overrides,
});

describe("ManualAssignTeamDialog (ARK-189, HU-42)", () => {
  beforeEach(() => {
    vi.mocked(juryManagement.getTeamsByJuror).mockReset().mockResolvedValue([]);
    vi.mocked(juryManagement.manualAssignment).mockReset();
    vi.mocked(juryManagement.bulkAssignment).mockReset();
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
  });

  afterEach(cleanup);

  describe("lista de casillas", () => {
    it("muestra cada equipo con código, videojuego y jurados, agrupado por nivel", async () => {
      renderDialog();
      await ready();

      expect(visibleNames()).toEqual(["Equipo Epsilon", "Equipo Alpha", "Equipo Beta", "Equipo Delta"]);
      const groups = within(teamList()).getAllByRole("group");
      expect(groups.map((group) => group.getAttribute("aria-label"))).toEqual(["Colegios", "Nivel 1", "Nivel 2"]);
      expect(rowText("Equipo Alpha")).toContain("N1-ABC-010 · Juego Alpha · 2 de 3 jurados");
      expect(screen.getByText("4 de 4 equipos")).toBeTruthy();
      expect(screen.getByText("0 equipos marcados")).toBeTruthy();
      expect(assignButton().disabled).toBe(true);
    });

    it("el buscador filtra por nombre, videojuego o código", async () => {
      renderDialog();
      await ready();

      fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "delta" } });
      expect(visibleNames()).toEqual(["Equipo Delta"]);

      fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "n0-abc" } });
      expect(visibleNames()).toEqual(["Equipo Epsilon"]);
      expect(screen.getByText("1 de 4 equipos")).toBeTruthy();
    });

    it("el filtro de nivel solo ofrece los niveles de la lista y filtra por ellos", async () => {
      renderDialog();
      await ready();

      const levelSelect = screen.getByLabelText("Nivel") as HTMLSelectElement;
      expect([...levelSelect.options].map((option) => option.textContent)).toEqual([
        "Todos los niveles",
        "Colegios",
        "Nivel 1",
        "Nivel 2",
      ]);

      fireEvent.change(levelSelect, { target: { value: "1" } });
      expect(visibleNames()).toEqual(["Equipo Alpha", "Equipo Beta"]);
    });

    it("si nada coincide lo dice y no deja asignar", async () => {
      renderDialog();
      await ready();

      fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "zzz" } });

      expect(screen.getByText("Ningún equipo coincide con la búsqueda")).toBeTruthy();
      expect(visibleNames()).toEqual([]);
      expect(assignButton().disabled).toBe(true);
    });

    it("las marcas se conservan al buscar y avisa cuántas quedan fuera de la búsqueda", async () => {
      renderDialog();
      await ready();

      mark("Equipo Alpha", "Equipo Delta");
      expect(screen.getByText("2 equipos marcados")).toBeTruthy();
      expect(assignButton().textContent).toBe("Asignar 2 equipos");

      fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "alpha" } });
      expect(box("Equipo Alpha").checked).toBe(true);
      expect(screen.getByText("2 equipos marcados (1 fuera de la búsqueda)")).toBeTruthy();
    });

    it("«Marcar visibles» marca los equipos filtrados que el jurado no tiene y «Quitar marcas» los limpia", async () => {
      vi.mocked(juryManagement.getTeamsByJuror).mockResolvedValue([alpha]);
      renderDialog();
      await screen.findByText("Este jurado ya tiene: Nivel 1");

      fireEvent.change(screen.getByLabelText("Nivel"), { target: { value: "1" } });
      fireEvent.click(screen.getByRole("button", { name: "Marcar visibles" }));

      expect(box("Equipo Beta").checked).toBe(true);
      expect(box("Equipo Alpha").checked).toBe(false);
      expect(screen.getByText("1 equipo marcado")).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: "Quitar marcas" }));
      expect(box("Equipo Beta").checked).toBe(false);
      expect(screen.getByText("0 equipos marcados")).toBeTruthy();
    });

    it("no deja marcar más de 50 equipos", async () => {
      const many = Array.from({ length: 55 }, (_, i) =>
        team({ id: i + 1, name: `Equipo ${String(i + 1).padStart(2, "0")}`, teamCode: `N1-X-${i + 1}` })
      );
      renderDialog({ teams: many });
      await ready();

      fireEvent.click(screen.getByRole("button", { name: "Marcar visibles" }));

      expect(screen.getByText("50 equipos marcados · máximo 50 por vez")).toBeTruthy();
      expect(box("Equipo 51").checked).toBe(false);
      expect(box("Equipo 51").disabled).toBe(true);
      expect(box("Equipo 01").disabled).toBe(false);
    });

    it("indica los niveles que ya tiene el jurado y advierte al marcar otro nivel", async () => {
      vi.mocked(juryManagement.getTeamsByJuror).mockResolvedValue([
        team({ id: 7, name: "Equipo Ya", level: 1, levelLabel: "Nivel 1" }),
      ]);
      renderDialog();

      await screen.findByText("Este jurado ya tiene: Nivel 1");
      expect(juryManagement.getTeamsByJuror).toHaveBeenCalledWith("j-1");
      expect(rowText("Equipo Epsilon")).toContain("⚠ otro nivel");
      expect(rowText("Equipo Alpha")).not.toContain("otro nivel");

      mark("Equipo Alpha");
      expect(screen.queryByRole("alert")).toBeNull();

      mark("Equipo Delta");
      expect(screen.getByRole("alert").textContent).toContain(
        "«Equipo Delta» es de Nivel 2 y el jurado ya tiene Nivel 1"
      );

      mark("Equipo Epsilon");
      expect(screen.getByRole("alert").textContent).toContain(
        "«Equipo Epsilon» (Colegios), «Equipo Delta» (Nivel 2) son de otro nivel"
      );
    });

    it("si el jurado no tiene equipos, advierte cuando los marcados mezclan niveles", async () => {
      renderDialog();
      await ready();

      mark("Equipo Alpha", "Equipo Delta");
      expect(screen.getByRole("alert").textContent).toContain(
        "Los equipos marcados son de varios niveles (Nivel 1, Nivel 2)"
      );
    });

    it("marca como ya asignados los equipos que el jurado ya tiene y no deja marcarlos", async () => {
      vi.mocked(juryManagement.getTeamsByJuror).mockResolvedValue([alpha]);
      renderDialog();

      await screen.findByText("Este jurado ya tiene: Nivel 1");
      expect(rowText("Equipo Alpha")).toContain("ya asignado");
      expect(box("Equipo Alpha").disabled).toBe(true);
    });

    it("mientras cargan los equipos lo indica y no deja buscar", async () => {
      renderDialog({ teams: null });
      await ready();

      expect(screen.getByText("Cargando equipos...")).toBeTruthy();
      expect((screen.getByLabelText("Buscar") as HTMLInputElement).disabled).toBe(true);
    });

    it("si no hay equipos pendientes de jurados lo dice", async () => {
      renderDialog({ teams: [] });
      await ready();

      expect(screen.getByText("No hay equipos pendientes de jurados")).toBeTruthy();
    });
  });

  describe("con un solo equipo marcado (POST /juror/assignments, sin cambios)", () => {
    it("asigna el equipo, avisa y cierra el diálogo", async () => {
      vi.mocked(juryManagement.manualAssignment).mockResolvedValue({ success: true, message: "Asignación exitosa" });
      const { onAssigned } = renderDialog();
      await ready();

      mark("Equipo Epsilon");
      expect(assignButton().textContent).toBe("Asignar");
      fireEvent.click(assignButton());

      await waitFor(() => expect(onAssigned).toHaveBeenCalledTimes(1));
      expect(juryManagement.manualAssignment).toHaveBeenCalledWith("j-1", 500, false);
      expect(juryManagement.bulkAssignment).not.toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Asignación exitosa");
      expect(screen.queryByText("Asignar equipos a Ana")).toBeNull();
    });

    it("si no se pueden consultar los equipos del jurado (p. ej. un profesor), el diálogo sigue funcionando", async () => {
      vi.mocked(juryManagement.getTeamsByJuror).mockRejectedValue(new Error("Error 400"));
      vi.mocked(juryManagement.manualAssignment).mockResolvedValue({ success: true, message: "Asignación exitosa" });
      const { onAssigned } = renderDialog();

      await screen.findByText("No se pudieron consultar los niveles que ya tiene este jurado.");
      mark("Equipo Delta");
      expect(screen.queryByRole("alert")).toBeNull();

      fireEvent.click(assignButton());
      await waitFor(() => expect(onAssigned).toHaveBeenCalled());
      expect(toast.error).not.toHaveBeenCalled();
    });

    it("con un 409 de advertencias pide confirmación y, al continuar, repite con confirmWarnings", async () => {
      vi.mocked(juryManagement.getTeamsByJuror).mockResolvedValue([alpha]);
      vi.mocked(juryManagement.manualAssignment)
        .mockResolvedValueOnce({
          success: false,
          message: "La asignación rompe reglas de la feria.",
          warnings: [{ code: "JUROR_MIXED_LEVELS", message: "El jurado quedaría con grupos de distintos niveles (Nivel 1, Nivel 2)." }],
        })
        .mockResolvedValueOnce({ success: true, message: "Asignación exitosa" });
      const { onAssigned } = renderDialog();
      await screen.findByText("Este jurado ya tiene: Nivel 1");

      mark("Equipo Delta");
      fireEvent.click(assignButton());

      expect(await screen.findByText("La asignación rompe reglas de la feria")).toBeTruthy();
      expect(screen.getByText("El jurado quedaría con grupos de distintos niveles (Nivel 1, Nivel 2).")).toBeTruthy();
      expect(screen.queryByRole("region", { name: "Equipos que no se asignarán" })).toBeNull();
      expect(onAssigned).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

      await waitFor(() => expect(onAssigned).toHaveBeenCalledTimes(1));
      expect(juryManagement.manualAssignment).toHaveBeenNthCalledWith(1, "j-1", 400, false);
      expect(juryManagement.manualAssignment).toHaveBeenNthCalledWith(2, "j-1", 400, true);
    });

    it("al cancelar las advertencias no se repite la asignación", async () => {
      vi.mocked(juryManagement.manualAssignment).mockResolvedValue({
        success: false,
        message: "La asignación rompe reglas de la feria.",
        warnings: [{ code: "TEAM_UNDER_MIN", message: "Advertencia de prueba" }],
      });
      const { onAssigned } = renderDialog();
      await ready();

      mark("Equipo Epsilon");
      fireEvent.click(assignButton());
      await screen.findByText("Advertencia de prueba");

      fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

      await waitFor(() => expect(screen.queryByText("Advertencia de prueba")).toBeNull());
      expect(juryManagement.manualAssignment).toHaveBeenCalledTimes(1);
      expect(onAssigned).not.toHaveBeenCalled();
    });

    it("un bloqueo del servidor se muestra como error y no cierra el diálogo", async () => {
      vi.mocked(juryManagement.manualAssignment).mockResolvedValue({ success: false, message: "El jurado no tiene categoría." });
      const { onAssigned } = renderDialog();
      await ready();

      mark("Equipo Epsilon");
      fireEvent.click(assignButton());

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("El jurado no tiene categoría."));
      expect(onAssigned).not.toHaveBeenCalled();
      expect(screen.getByText("Asignar equipos a Ana")).toBeTruthy();
    });
  });

  describe("con varios equipos marcados (POST /juror/assignments/bulk)", () => {
    it("envía los equipos marcados y muestra el resultado equipo por equipo; recarga la lista al cerrar", async () => {
      vi.mocked(juryManagement.bulkAssignment).mockResolvedValue({
        success: true,
        message: bulkResult().message,
        result: bulkResult(),
      });
      const { onAssigned } = renderDialog();
      await ready();

      mark("Equipo Alpha", "Equipo Beta", "Equipo Epsilon");
      fireEvent.click(assignButton());

      expect(await screen.findByText(bulkResult().message)).toBeTruthy();
      // En el orden de la lista (nivel y nombre), no en el que se marcaron
      expect(juryManagement.bulkAssignment).toHaveBeenCalledWith("j-1", [500, 100, 200], false);
      expect(juryManagement.manualAssignment).not.toHaveBeenCalled();

      // Solo los hijos directos: las advertencias de cada equipo van en una lista anidada
      const items = [...screen.getByRole("list", { name: "Resultado por equipo" }).children];
      expect(items).toHaveLength(3);
      expect(items[0].textContent).toContain("N1-ABC-010 · Equipo Alpha");
      expect(items[0].textContent).toContain("Asignado · ahora tiene 3 jurados");
      expect(items[1].textContent).toContain("Asignado con advertencia aceptada");
      expect(items[1].textContent).toContain("El jurado quedaría con 4 grupos.");
      // El back manda código y nombre en null: se toman de la lista de casillas
      expect(items[2].textContent).toContain("N0-ABC-001 · Equipo Epsilon");
      expect(items[2].textContent).toContain("No se asignó");
      expect(items[2].textContent).toContain("Los jurados JUNIOR no pueden ser asignados a colegios.");

      expect(onAssigned).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
      expect(onAssigned).toHaveBeenCalledTimes(1);
      expect(screen.queryByText("Asignar equipos a Ana")).toBeNull();
    });

    it("si todos quedan bloqueados muestra el resultado igual y no recarga al cerrar", async () => {
      const allBlocked = bulkResult({
        message: "No se asignó ningún equipo: 2 equipos tienen un bloqueo.",
        resultados: [
          { equipoId: 100, codigo: "N1-ABC-010", nombre: "Equipo Alpha", videojuego: null, estado: "BLOCKED", advertencias: [], cantidadJurados: null, bloqueo: { code: "DUPLICATE_ASSIGNMENT", message: "El jurado ya está asignado a este equipo." } },
          { equipoId: 200, codigo: "N1-ABC-020", nombre: "Equipo Beta", videojuego: null, estado: "BLOCKED", advertencias: [], cantidadJurados: null, bloqueo: { code: "TEAM_NOT_CONFIRMED", message: "La inscripción no está confirmada." } },
        ],
        totales: { solicitados: 2, asignados: 0, bloqueados: 2 },
      });
      vi.mocked(juryManagement.bulkAssignment).mockResolvedValue({ success: true, message: allBlocked.message, result: allBlocked });
      const { onAssigned } = renderDialog();
      await ready();

      mark("Equipo Alpha", "Equipo Beta");
      fireEvent.click(assignButton());

      expect(await screen.findByText("No se asignó ningún equipo: 2 equipos tienen un bloqueo.")).toBeTruthy();
      expect(screen.getByText("La inscripción no está confirmada.")).toBeTruthy();
      expect(toast.error).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
      expect(onAssigned).not.toHaveBeenCalled();
    });

    it("con un 409 muestra las advertencias juntas y los equipos que no se asignarán; al continuar repite con confirmWarnings", async () => {
      vi.mocked(juryManagement.bulkAssignment)
        .mockResolvedValueOnce({
          success: false,
          message: "La asignación rompe reglas de asignación.",
          warnings: [
            { code: "JUROR_OVER_LIMIT", message: "El jurado quedaría con 5 grupos." },
            { code: "JUROR_MIXED_LEVELS", message: "El jurado quedaría con grupos de distintos niveles." },
          ],
          blocked: [{ teamId: 500, codigo: null, code: "SCHOOL_REQUIRES_SENIOR", message: "Solo jurados senior en colegios." }],
        })
        .mockResolvedValueOnce({ success: true, message: bulkResult().message, result: bulkResult() });
      renderDialog();
      await ready();

      mark("Equipo Alpha", "Equipo Beta", "Equipo Epsilon");
      fireEvent.click(assignButton());

      expect(await screen.findByText("El jurado quedaría con 5 grupos.")).toBeTruthy();
      expect(screen.getByText("El jurado quedaría con grupos de distintos niveles.")).toBeTruthy();
      const blocked = screen.getByRole("region", { name: "Equipos que no se asignarán" });
      expect(blocked.textContent).toContain("Este equipo no se asignará aunque continúes:");
      expect(blocked.textContent).toContain("N0-ABC-001 · Equipo Epsilon");
      expect(blocked.textContent).toContain("Solo jurados senior en colegios.");

      fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

      expect(await screen.findByText(bulkResult().message)).toBeTruthy();
      expect(juryManagement.bulkAssignment).toHaveBeenNthCalledWith(1, "j-1", [500, 100, 200], false);
      expect(juryManagement.bulkAssignment).toHaveBeenNthCalledWith(2, "j-1", [500, 100, 200], true);
    });

    it("al cancelar el 409 no se repite ni se guarda nada", async () => {
      vi.mocked(juryManagement.bulkAssignment).mockResolvedValue({
        success: false,
        message: "La asignación rompe reglas de asignación.",
        warnings: [{ code: "JUROR_OVER_LIMIT", message: "Advertencia en lote" }],
        blocked: [],
      });
      const { onAssigned } = renderDialog();
      await ready();

      mark("Equipo Alpha", "Equipo Beta");
      fireEvent.click(assignButton());
      await screen.findByText("Advertencia en lote");

      fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

      await waitFor(() => expect(screen.queryByText("Advertencia en lote")).toBeNull());
      expect(juryManagement.bulkAssignment).toHaveBeenCalledTimes(1);
      expect(onAssigned).not.toHaveBeenCalled();
      expect(box("Equipo Alpha").checked).toBe(true);
    });

    it("un error del jurado o del servidor se muestra y conserva las marcas para reintentar", async () => {
      vi.mocked(juryManagement.bulkAssignment).mockResolvedValue({
        success: false,
        message: "No se pudieron asignar los equipos. No cambió ninguna asignación; puedes intentarlo de nuevo.",
      });
      const { onAssigned } = renderDialog();
      await ready();

      mark("Equipo Alpha", "Equipo Beta");
      fireEvent.click(assignButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          "No se pudieron asignar los equipos. No cambió ninguna asignación; puedes intentarlo de nuevo."
        )
      );
      expect(onAssigned).not.toHaveBeenCalled();
      expect(box("Equipo Alpha").checked).toBe(true);
      expect(assignButton().disabled).toBe(false);
    });
  });
});
