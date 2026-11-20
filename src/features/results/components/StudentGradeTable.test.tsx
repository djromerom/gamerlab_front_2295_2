import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GRADE_DRAFT_KEY, readGradeDraft } from "@/lib/gradeDrafts";
import StudentGradeTable from "./StudentGradeTable";
import { gradeKey, type GradeTeam } from "@/features/results/types/studentGradeTable";

const fetchMock = vi.fn();
const dashboardArgs = vi.fn();
const toastInfo = vi.fn();

vi.mock("@/hooks/useFetch", () => ({ useFetch: () => fetchMock }));
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), info: (...args: unknown[]) => toastInfo(...args), success: vi.fn(), dismiss: vi.fn() }),
}));

const TEAM: GradeTeam = {
  teamCode: "N1-AYP-01",
  nrc: "2501",
  teamName: "Los Pixeles",
  integrantes: ["Ana"],
  videogame: "Juego",
  calificacionFeria: null,
  calificacionDocente: 3,
  videogameId: 10,
  editionId: 3,
  editionLabel: "2026 - S1",
  canEdit: true,
  source: "current",
};
const KEY = gradeKey(TEAM);
// Referencia estable: la tabla vuelve a sincronizar sus filas cuando cambia `teams`.
let mockTeams: GradeTeam[] = [];

vi.mock("@/features/results/hooks/useTeacherDashboard", () => ({
  useTeacherDashboard: (args: unknown) => {
    dashboardArgs(args);
    return {
      selectedNRC: "7", setSelectedNRC: vi.fn(), selectedFair: "3", setSelectedFair: vi.fn(), selectedEdition: undefined,
      availableFairs: [], currentPage: 1, setCurrentPage: vi.fn(), paginationMetadata: { totalPages: 1 }, availableNRCs: [],
      isLoading: false, initialLoading: false, error: null, noStudents: false, teams: mockTeams, handlePreviousPage: vi.fn(),
      handleNextPage: vi.fn(), reloadProjects: vi.fn(), retryLoad: vi.fn(),
    };
  },
}));

const renderTable = () => render(<TooltipProvider><StudentGradeTable /></TooltipProvider>);

beforeEach(() => {
  localStorage.clear();
  mockTeams = [];
  fetchMock.mockReset();
  dashboardArgs.mockReset();
  toastInfo.mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("StudentGradeTable", () => {
  it("deshabilita la exportacion en la pestana de historicos", () => {
    renderTable();
    const exportButton = screen.getByRole("button", { name: /exportar resultados filtrados/i });
    expect((exportButton as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole("tab", { name: "Históricos" }));
    expect((exportButton as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("button", { name: /exportar resultados filtrados/i }).getAttribute("title")).toBe("La exportación solo incluye la feria activa");
  });

  describe("notas sin guardar al recargar (BG-27)", () => {
    it("guarda en el navegador cada nota modificada con la feria y el NRC", () => {
      mockTeams = [TEAM];
      renderTable();
      fireEvent.click(screen.getByRole("button", { name: /editar notas/i }));
      fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "4.5" } });

      const draft = readGradeDraft();
      expect(draft).toMatchObject({ fair: "3", nrc: "7", grades: { [KEY]: "4.5" } });
      expect(draft!.teams[KEY].videogameId).toBe(10);
    });

    it("al recargar retoma la edición con las notas marcadas como modificadas", async () => {
      localStorage.setItem(GRADE_DRAFT_KEY, JSON.stringify({ fair: "3", nrc: "7", grades: { [KEY]: "4.5" }, teams: { [KEY]: TEAM }, savedAt: 1 }));
      mockTeams = [TEAM];
      renderTable();

      expect(dashboardArgs).toHaveBeenCalledWith(expect.objectContaining({ initialFair: "3", initialNRC: "7" }));
      expect((screen.getByRole("spinbutton") as HTMLInputElement).value).toBe("4.5");
      expect(screen.getByText("Modificada")).toBeTruthy();
      expect(screen.getByRole("button", { name: /guardar todo/i })).toBeTruthy();
      await waitFor(() => expect(toastInfo).toHaveBeenCalledWith("Recuperamos 1 nota que no habías guardado", expect.anything()));
    });

    it("sin notas para recuperar no avisa", async () => {
      mockTeams = [TEAM];
      renderTable();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(toastInfo).not.toHaveBeenCalled();
    });

    it("no frena la recarga si las notas quedaron guardadas en el navegador", () => {
      mockTeams = [TEAM];
      renderTable();
      fireEvent.click(screen.getByRole("button", { name: /editar notas/i }));
      fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "4" } });

      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    });

    it("al cancelar y descartar se borra lo guardado en el navegador", () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      localStorage.setItem(GRADE_DRAFT_KEY, JSON.stringify({ fair: "3", nrc: "7", grades: { [KEY]: "4.5" }, teams: { [KEY]: TEAM }, savedAt: 1 }));
      mockTeams = [TEAM];
      renderTable();

      fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
      expect(localStorage.getItem(GRADE_DRAFT_KEY)).toBeNull();
    });

    it("al guardar con éxito se borra; si el guardado falla, se conserva", async () => {
      mockTeams = [TEAM];
      fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
      renderTable();
      fireEvent.click(screen.getByRole("button", { name: /editar notas/i }));
      fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "4" } });

      fireEvent.click(screen.getByRole("button", { name: /guardar todo/i }));
      await waitFor(() => expect(screen.getByRole("button", { name: /guardar todo/i })).toBeTruthy());
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
      expect(readGradeDraft()?.grades[KEY]).toBe("4");

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ results: [{ videogameId: 10, success: true }] }), { status: 200 }),
      );
      fireEvent.click(screen.getByRole("button", { name: /guardar todo/i }));
      await waitFor(() => expect(localStorage.getItem(GRADE_DRAFT_KEY)).toBeNull());
    });
  });
});

describe("StudentGradeTable · celular a 360 px (ARK-295)", () => {
  it("en edición, Cancelar, Guardar todo y Exportar van en una fila que se envuelve", () => {
    mockTeams = [TEAM];
    renderTable();
    fireEvent.click(screen.getByRole("button", { name: /editar notas/i }));

    const actions = screen.getByRole("group", { name: "Acciones del panel" });
    expect(actions.classList).toContain("flex-wrap");
    const group = within(actions);
    expect(group.getByRole("button", { name: /cancelar/i })).toBeTruthy();
    expect(group.getByRole("button", { name: /guardar todo/i })).toBeTruthy();
    expect(group.getByRole("button", { name: /exportar resultados filtrados/i })).toBeTruthy();
  });

  it("las pestañas Feria activa e Históricos se envuelven", () => {
    renderTable();
    expect(screen.getByRole("tablist", { name: "Vista del panel" }).classList).toContain("flex-wrap");
  });
});
