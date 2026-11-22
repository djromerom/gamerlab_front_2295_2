import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TeamsManagementTable } from "@/features/teams/components/TeamsManagementTable";
import type { TeamRowData } from "@/features/teams/lib/teamsUtils";

const setTeamNotGradable = vi.fn();
const toast = vi.hoisted(() => ({ success: vi.fn(), warning: vi.fn(), error: vi.fn() }));

vi.mock("@/features/teams/api/teamGradable", () => ({
  setTeamNotGradable: (...args: unknown[]) => setTeamNotGradable(...args),
}));

vi.mock("sonner", () => ({ toast }));

// HU-50 (ARK-311): se conserva isCollegeTeamCode y solo se simula el PATCH
const setTeamVerificationRequired = vi.fn();
vi.mock("@/features/teams/api/teamVerification", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/teams/api/teamVerification")>()),
  setTeamVerificationRequired: (...args: unknown[]) => setTeamVerificationRequired(...args),
}));

// Carga de materias al montar: aquí no importa
vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(async () => new Response(JSON.stringify({ data: [] }), { status: 200 })),
}));

// El asistente de alta/edición no se usa en estas pruebas
vi.mock("@/features/teams/components/TeamWizardDialog", () => ({
  default: () => null,
  toInitialValuesFromTeam: vi.fn(),
}));

const team = (id: number, name: string, extra: Partial<TeamRowData> = {}): TeamRowData => ({
  id_equipo: id,
  nombre_equipo: name,
  fecha_registro: "2026-11-01T10:00:00.000Z",
  id_usuario: "u",
  id_edicion: 3,
  activo: true,
  isExternal: false,
  teamCode: `N2-ABC-${id}`,
  integrantes: [
    {
      id_integrante: id * 10,
      nombre: "Ana",
      apellido: "Ruiz",
      correo: `lider${id}@uninorte.edu.co`,
      codigo_estudiantil: "200",
      id_equipo: id,
      activo: true,
      creado_en: "",
      actualizado_en: "",
      nrcs: [],
    },
  ],
  videojuego: {
    id_videojuego: id,
    nombre: `Juego ${id}`,
    descripcion: "",
    logo_url: "",
    fecha_registro: "",
    id_estado_videojuego: 1,
  },
  ...extra,
});

const PIXELES = team(400, "Los Pixeles", { notGradable: true });
const BYTES = team(401, "Los Bytes");

const renderTable = (props: Record<string, unknown> = {}) => {
  const refreshData = vi.fn();
  render(
    <TeamsManagementTable
      teams={[PIXELES, BYTES]}
      allTeams={[PIXELES, BYTES]}
      paginationMeta={{ itemsPerPage: 10, currentPage: 1, totalPages: 1 }}
      apiBaseUrl="http://api.test"
      onPageChange={vi.fn()}
      onLimitChange={vi.fn()}
      refreshData={refreshData}
      statusEmailLeader={() => ({ confirmationStatus: { status: "Confirmado" } })}
      {...props}
    />,
  );
  return { refreshData };
};

const rowOf = (name: string) => screen.getByText(name).closest("tr")!;

/** Radix abre el menú con el teclado; jsdom no simula bien el puntero */
const openRowMenu = (name: string) => {
  const trigger = within(rowOf(name)).getByRole("button", { name: "Abrir menú" });
  fireEvent.keyDown(trigger, { key: "Enter" });
};

describe("Equipos inscritos: presentador externo (ARK-210 / HU-39)", () => {
  beforeEach(() => {
    // Radix usa ResizeObserver y scrollIntoView, que jsdom no trae
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("muestra la etiqueta «Presentador externo» solo en el equipo marcado", () => {
    renderTable();

    expect(within(rowOf("Los Pixeles")).getByText("Presentador externo")).toBeTruthy();
    expect(within(rowOf("Los Bytes")).queryByText("Presentador externo")).toBeNull();
  });

  it("marca un equipo después de confirmar y muestra el aviso de jurados retirados", async () => {
    setTeamNotGradable.mockResolvedValue({
      id: 401,
      teamCode: "N2-ABC-401",
      teamName: "Los Bytes",
      notGradable: true,
      juradosRetirados: [{ id: "j1", nombre: "Ana Gómez" }],
      avisoAsignacion: "El equipo se marcó como no calificable y se le retiraron 1 jurado(s).",
    });
    const { refreshData } = renderTable();

    openRowMenu("Los Bytes");
    fireEvent.click(await screen.findByRole("menuitem", { name: "Marcar como presentador externo" }));
    expect(await screen.findByText("¿Marcar a Los Bytes como presentador externo?")).toBeTruthy();
    expect(screen.getByText(/Si tiene jurados asignados, se le retiran/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Marcar" }));

    await waitFor(() => expect(setTeamNotGradable).toHaveBeenCalledWith(401, true));
    await waitFor(() => expect(refreshData).toHaveBeenCalled());
    expect(toast.warning).toHaveBeenCalledWith(
      "El equipo se marcó como no calificable y se le retiraron 1 jurado(s).",
      expect.anything(),
    );
  });

  it("desmarca un equipo marcado y avisa que los jurados no vuelven solos", async () => {
    setTeamNotGradable.mockResolvedValue({ id: 400, teamCode: "N2-ABC-400", teamName: "Los Pixeles", notGradable: false });
    renderTable();

    openRowMenu("Los Pixeles");
    fireEvent.click(await screen.findByRole("menuitem", { name: "Quitar marca de presentador externo" }));
    expect(await screen.findByText(/no vuelven solos/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Quitar marca" }));

    await waitFor(() => expect(setTeamNotGradable).toHaveBeenCalledWith(400, false));
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("si el back rechaza el cambio muestra su mensaje y no recarga", async () => {
    setTeamNotGradable.mockRejectedValue(
      new Error("Solo se puede marcar o desmarcar un equipo de la edición activa."),
    );
    const { refreshData } = renderTable();

    openRowMenu("Los Bytes");
    fireEvent.click(await screen.findByRole("menuitem", { name: "Marcar como presentador externo" }));
    fireEvent.click(await screen.findByRole("button", { name: "Marcar" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Solo se puede marcar o desmarcar un equipo de la edición activa."),
    );
    expect(refreshData).not.toHaveBeenCalled();
  });

  it("en solo lectura (edición anterior) no hay menú para marcar", () => {
    renderTable({ readOnly: true });

    expect(screen.queryByRole("button", { name: "Abrir menú" })).toBeNull();
    // la etiqueta se sigue viendo
    expect(within(rowOf("Los Pixeles")).getByText("Presentador externo")).toBeTruthy();
  });

  describe("menú según el estado del videojuego (ARK-258)", () => {
    const withStatus = (base: TeamRowData, id_estado_videojuego: number): TeamRowData => ({
      ...base,
      videojuego: { ...base.videojuego, id_estado_videojuego },
    });

    it.each([
      ["Pendiente", 2],
      ["Rechazado", 3],
    ])("no ofrece marcar un equipo %s", async (_estado, status) => {
      const bytes = withStatus(BYTES, status);
      renderTable({ teams: [PIXELES, bytes], allTeams: [PIXELES, bytes] });

      openRowMenu("Los Bytes");
      expect(await screen.findByRole("menuitem", { name: "Editar" })).toBeTruthy();
      expect(screen.queryByRole("menuitem", { name: "Marcar como presentador externo" })).toBeNull();
    });

    it("deja quitar la marca aunque el equipo marcado ya no esté Confirmado", async () => {
      const pixeles = withStatus(PIXELES, 3);
      renderTable({ teams: [pixeles, BYTES], allTeams: [pixeles, BYTES] });

      openRowMenu("Los Pixeles");
      expect(await screen.findByRole("menuitem", { name: "Quitar marca de presentador externo" })).toBeTruthy();
    });

    it("oculta «Código de verificación» en un presentador externo y lo deja en los demás", async () => {
      renderTable();

      openRowMenu("Los Pixeles");
      expect(await screen.findByRole("menuitem", { name: "Editar" })).toBeTruthy();
      expect(screen.queryByRole("menuitem", { name: "Código de verificación" })).toBeNull();
      fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
      await waitFor(() => expect(screen.queryByRole("menuitem", { name: "Editar" })).toBeNull());

      openRowMenu("Los Bytes");
      expect(await screen.findByRole("menuitem", { name: "Código de verificación" })).toBeTruthy();
    });
  });

  it("el diálogo de certificados de participación no ofrece equipos presentadores externos", async () => {
    renderTable();

    fireEvent.click(screen.getByRole("button", { name: "Enviar certificados" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Los Bytes")).toBeTruthy();
    expect(within(dialog).queryByText("Los Pixeles")).toBeNull();
  });
});

describe("Equipos inscritos: búsqueda, origen y filas del lado del servidor (BG-53 / ARK-254)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("escribir en el buscador avisa a la página y no filtra la página cargada", () => {
    const onSearchTermChange = vi.fn();
    // El back ya respondió con la búsqueda aplicada: la tabla pinta lo que recibe
    renderTable({ searchTerm: "zzz", onSearchTermChange });

    expect(screen.getByText("Los Bytes")).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar equipos" }), { target: { value: "Nébula" } });
    expect(onSearchTermChange).toHaveBeenCalledWith("Nébula");
  });

  it("las pestañas de origen piden «externo» o «uninorte» y marcan la elegida", () => {
    const onOriginFilterChange = vi.fn();
    const EXTERNO = team(402, "Los Externos", { isExternal: true });
    renderTable({
      teams: [EXTERNO],
      allTeams: [PIXELES, BYTES, EXTERNO],
      originFilter: "externo",
      onOriginFilterChange,
    });

    const externos = screen.getByRole("button", { name: "Externos (1)" });
    expect(externos.getAttribute("aria-pressed")).toBe("true");
    // los contadores son de la edición completa, no de la página filtrada
    fireEvent.click(screen.getByRole("button", { name: "Uninorte (2)" }));
    expect(onOriginFilterChange).toHaveBeenCalledWith("uninorte");
    fireEvent.click(externos); // ya elegida: no vuelve a pedir
    expect(onOriginFilterChange).toHaveBeenCalledTimes(1);
  });

  it("sin coincidencias con filtro lo dice", () => {
    renderTable({ teams: [], searchTerm: "nadie" });

    expect(screen.getByText("No hay equipos que coincidan con la búsqueda o el filtro.")).toBeTruthy();
  });

  it("«Filas: Todos» se ve seleccionado aunque el back responda su tope de 1000", () => {
    renderTable({ paginationMeta: { itemsPerPage: 1000, currentPage: 1, totalPages: 1 } });

    expect(screen.getByRole("combobox", { name: "Filas por página" }).textContent).toBe("Todos");
  });

  it("«Filas» muestra el número elegido", () => {
    renderTable({ paginationMeta: { itemsPerPage: 15, currentPage: 1, totalPages: 2 } });

    expect(screen.getByRole("combobox", { name: "Filas por página" }).textContent).toBe("15");
  });
});

describe("Equipos inscritos: desactivar el código de verificación (HU-50 / ARK-311)", () => {
  const SIN_CODIGO = team(402, "Los Glitch", { verificationRequired: false });
  const COLEGIO = team(403, "Los Peques", { teamCode: "N0-XYZ-403" });
  const renderHu50 = (props: Record<string, unknown> = {}) =>
    renderTable({
      teams: [PIXELES, BYTES, SIN_CODIGO, COLEGIO],
      allTeams: [PIXELES, BYTES, SIN_CODIGO, COLEGIO],
      ...props,
    });

  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("marca con «Código desactivado» solo a los equipos con el código desactivado", () => {
    renderHu50();

    expect(within(rowOf("Los Glitch")).getByText("Código desactivado")).toBeTruthy();
    expect(within(rowOf("Los Bytes")).queryByText("Código desactivado")).toBeNull();
    expect(within(rowOf("Los Peques")).queryByText("Código desactivado")).toBeNull();
  });

  it("desactiva el código de un equipo después de confirmar y recarga la lista", async () => {
    setTeamVerificationRequired.mockResolvedValue({ teamId: 401, verificationRequired: false, changed: true });
    const { refreshData } = renderHu50();

    openRowMenu("Los Bytes");
    fireEvent.click(await screen.findByRole("menuitem", { name: "Desactivar código de verificación" }));
    expect(await screen.findByText("¿Desactivar el código de verificación de Los Bytes?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Desactivar código" }));

    await waitFor(() => expect(setTeamVerificationRequired).toHaveBeenCalledWith(401, false));
    await waitFor(() => expect(refreshData).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("Los jurados calificarán a Los Bytes sin pedir el código.");
  });

  it("vuelve a activarlo en un equipo con el código desactivado, sin regenerarlo", async () => {
    setTeamVerificationRequired.mockResolvedValue({ teamId: 402, verificationRequired: true, changed: true });
    renderHu50();

    openRowMenu("Los Glitch");
    fireEvent.click(await screen.findByRole("menuitem", { name: "Activar código de verificación" }));
    expect(await screen.findByText(/no se regenera/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Activar código" }));

    await waitFor(() => expect(setTeamVerificationRequired).toHaveBeenCalledWith(402, true));
  });

  it("si el back lo rechaza muestra el motivo y no recarga", async () => {
    setTeamVerificationRequired.mockRejectedValue(new Error("No tienes permiso para esta acción"));
    const { refreshData } = renderHu50();

    openRowMenu("Los Bytes");
    fireEvent.click(await screen.findByRole("menuitem", { name: "Desactivar código de verificación" }));
    fireEvent.click(await screen.findByRole("button", { name: "Desactivar código" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No tienes permiso para esta acción"));
    expect(refreshData).not.toHaveBeenCalled();
    expect(screen.getByText("¿Desactivar el código de verificación de Los Bytes?")).toBeTruthy();
  });

  it("no ofrece la opción en colegios (N0) ni en presentadores externos", async () => {
    renderHu50();

    for (const name of ["Los Peques", "Los Pixeles"]) {
      openRowMenu(name);
      expect(await screen.findByRole("menuitem", { name: "Editar" })).toBeTruthy();
      expect(screen.queryByRole("menuitem", { name: /código de verificación$/ })).toBeNull();
      fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
      await waitFor(() => expect(screen.queryByRole("menuitem", { name: "Editar" })).toBeNull());
    }
  });

  it("en solo lectura no hay menú, pero se sigue viendo el indicador", () => {
    renderHu50({ readOnly: true });

    expect(screen.queryByRole("button", { name: "Abrir menú" })).toBeNull();
    expect(within(rowOf("Los Glitch")).getByText("Código desactivado")).toBeTruthy();
  });
});
