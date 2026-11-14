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

  it("el diálogo de certificados de participación no ofrece equipos presentadores externos", async () => {
    renderTable();

    fireEvent.click(screen.getByRole("button", { name: "Enviar certificados" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Los Bytes")).toBeTruthy();
    expect(within(dialog).queryByText("Los Pixeles")).toBeNull();
  });
});
