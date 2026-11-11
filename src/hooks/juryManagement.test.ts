import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { juryManagement } from "./juryManagement";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn() } }));

const page = (ids: string[], currentPage: number, totalPages: number) =>
  new Response(
    JSON.stringify({
      data: ids.map((id) => ({ id })),
      metadata: { totalItems: 0, itemsOnCurrentPage: ids.length, currentPage, itemsPerPage: 100, totalPages },
    }),
    { status: 200 },
  );

describe("juryManagement.getAllJuries (buscador de Personal → Jurados)", () => {
  beforeEach(() => vi.mocked(apiFetch).mockReset());

  it("recorre todas las páginas pidiendo como máximo 100 por página", async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce(page(["a", "b"], 1, 3))
      .mockResolvedValueOnce(page(["c"], 2, 3))
      .mockResolvedValueOnce(page(["d"], 3, 3));

    const jurors = await juryManagement.getAllJuries();

    expect(jurors.map((j) => j.id)).toEqual(["a", "b", "c", "d"]);
    const urls = vi.mocked(apiFetch).mock.calls.map(([url]) => String(url));
    expect(urls).toHaveLength(3);
    urls.forEach((url, i) => {
      expect(url).toContain("limit=100");
      expect(url).toContain(`page=${i + 1}`);
    });
  });

  it("hace una sola petición si no hay jurados", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(page([], 1, 0));

    expect(await juryManagement.getAllJuries()).toEqual([]);
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it("propaga el error del backend", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Limit must be at most 100." }), { status: 400 }),
    );

    await expect(juryManagement.getAllJuries()).rejects.toThrow("Error 400: Limit must be at most 100.");
  });
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("juryManagement: asignación manual con nivel (ARK-189)", () => {
  beforeEach(() => vi.mocked(apiFetch).mockReset());

  it("getIncompleteJurors devuelve cada equipo con su nivel", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(
      json([
        {
          id: 500,
          nombre: "Equipo Epsilon Mock",
          teamCode: "N0-ABC-001",
          nivel: 0,
          nivelEtiqueta: "Colegios",
          videojuego: "Juego Epsilon",
          cantidadJurados: 0,
        },
      ]),
    );

    expect(await juryManagement.getIncompleteJurors()).toEqual([
      {
        id: 500,
        name: "Equipo Epsilon Mock",
        videogame: "Juego Epsilon",
        teamCode: "N0-ABC-001",
        level: 0,
        levelLabel: "Colegios",
        jurorCount: 0,
      },
    ]);
    expect(String(vi.mocked(apiFetch).mock.calls[0][0])).toBe("http://api.test/teams/incomplete-jurors");
  });

  it("getTeamsByJuror trae el nivel y lee el videojuego como objeto", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(
      json([
        {
          id: 400,
          nombre: "Equipo Delta Mock",
          teamCode: "N2-ABC-201",
          nivel: 2,
          nivelEtiqueta: "Nivel 2",
          videojuego: { id: 9, nombre: "Juego Delta", descripcion: "" },
          cantidadJurados: 1,
        },
      ]),
    );

    const [team] = await juryManagement.getTeamsByJuror("j-1");

    expect(team).toMatchObject({ id: 400, name: "Equipo Delta Mock", videogame: "Juego Delta", level: 2, levelLabel: "Nivel 2" });
    expect(String(vi.mocked(apiFetch).mock.calls[0][0])).toBe("http://api.test/juror/j-1/teams");
  });

  it("getTeamsByJuror propaga el mensaje del back (p. ej. 400 con un profesor)", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(json({ message: "El usuario no es un jurado." }, 400));

    await expect(juryManagement.getTeamsByJuror("p-1")).rejects.toThrow("El usuario no es un jurado.");
  });

  it("manualAssignment sin confirmar no envía confirmWarnings", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(json({ ok: true }, 201));

    expect(await juryManagement.manualAssignment("j-1", 400)).toEqual({ success: true, message: "Asignación exitosa" });
    expect(JSON.parse(vi.mocked(apiFetch).mock.calls[0][1].body as string)).toEqual({ jurorId: "j-1", teamId: 400 });
  });

  it("manualAssignment al confirmar envía confirmWarnings: true", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(json({ ok: true }, 201));

    await juryManagement.manualAssignment("j-1", 400, true);

    expect(JSON.parse(vi.mocked(apiFetch).mock.calls[0][1].body as string)).toEqual({
      jurorId: "j-1",
      teamId: 400,
      confirmWarnings: true,
    });
  });

  it("manualAssignment devuelve las advertencias de un 409 ASSIGNMENT_WARNINGS", async () => {
    const warning = { code: "JUROR_MIXED_LEVELS", message: "Distintos niveles", jurorId: "j-1" };
    vi.mocked(apiFetch).mockResolvedValueOnce(
      json({ code: "ASSIGNMENT_WARNINGS", message: "La asignación rompe reglas.", warnings: [warning] }, 409),
    );

    expect(await juryManagement.manualAssignment("j-1", 400)).toEqual({
      success: false,
      message: "La asignación rompe reglas.",
      warnings: [warning],
    });
  });

  it("manualAssignment con un bloqueo devuelve el mensaje sin advertencias", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(json({ message: "El jurado ya está asignado a este equipo." }, 409));

    expect(await juryManagement.manualAssignment("j-1", 400)).toEqual({
      success: false,
      message: "El jurado ya está asignado a este equipo.",
    });
  });
});

describe("juryManagement: quitar todas las asignaciones (ARK-133)", () => {
  beforeEach(() => vi.mocked(apiFetch).mockReset());

  it("si el back responde error no muestra éxito ni recarga", async () => {
    const { toast } = await import("sonner");
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    const reload = vi.spyOn(globalThis, "setTimeout");
    vi.mocked(apiFetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "No hay asignaciones de evaluadores en «Feria 5» para eliminar." }), {
        status: 400,
      }),
    );
    const setLoading = vi.fn();

    await juryManagement.deleteAllAssignments(setLoading);

    expect(toast.error).toHaveBeenCalledWith("No hay asignaciones de evaluadores en «Feria 5» para eliminar.");
    expect(toast.success).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    expect(setLoading).toHaveBeenCalledWith(false);
    reload.mockRestore();
  });

  it("con éxito muestra el mensaje del back (con la edición y la cantidad)", async () => {
    const { toast } = await import("sonner");
    vi.mocked(toast.success).mockClear();
    vi.useFakeTimers();
    vi.mocked(apiFetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Se quitaron 2 equipos de «Feria 5» al evaluador." }), { status: 200 }),
    );

    await juryManagement.deleteAllAsignmentsByJury("j-1", vi.fn());

    expect(toast.success).toHaveBeenCalledWith("Se quitaron 2 equipos de «Feria 5» al evaluador.");
    vi.useRealTimers();
  });
});
