import { cleanup, render, screen } from "@testing-library/react";
import { Toaster } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GRADE_DRAFT_KEY } from "@/lib/gradeDrafts";
import StudentGradeTable from "./StudentGradeTable";
import { gradeKey, type GradeTeam } from "@/features/results/types/studentGradeTable";

// ARK-241: aquí sonner es el real; la otra suite lo mockea y por eso no veía que el aviso se perdía.
vi.mock("@/hooks/useFetch", () => ({ useFetch: () => vi.fn() }));

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
const OTHER: GradeTeam = { ...TEAM, teamCode: "N1-AYP-02", teamName: "Los Bits", videogameId: 11 };
const mockTeams = [TEAM, OTHER];

vi.mock("@/features/results/hooks/useTeacherDashboard", () => ({
  useTeacherDashboard: () => ({
    selectedNRC: "7", setSelectedNRC: vi.fn(), selectedFair: "3", setSelectedFair: vi.fn(), selectedEdition: undefined,
    availableFairs: [], currentPage: 1, setCurrentPage: vi.fn(), paginationMetadata: { totalPages: 1 }, availableNRCs: [],
    isLoading: false, initialLoading: false, error: null, noStudents: false, teams: mockTeams, handlePreviousPage: vi.fn(),
    handleNextPage: vi.fn(), reloadProjects: vi.fn(), retryLoad: vi.fn(),
  }),
}));

// Mismo orden que LayoutApplication: la página primero y el Toaster después, como hermano.
const renderPage = () => render(
  <TooltipProvider>
    <StudentGradeTable />
    <Toaster />
  </TooltipProvider>,
);

beforeEach(() => {
  localStorage.clear();
  // jsdom no implementa matchMedia y el Toaster lo usa para el tema del sistema
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("StudentGradeTable con el Toaster montado después (ARK-241)", () => {
  it("al recargar con notas sin guardar muestra «Recuperamos N notas…» con el número correcto", async () => {
    localStorage.setItem(GRADE_DRAFT_KEY, JSON.stringify({
      fair: "3", nrc: "7", grades: { [gradeKey(TEAM)]: "4.5", [gradeKey(OTHER)]: "2" },
      teams: { [gradeKey(TEAM)]: TEAM, [gradeKey(OTHER)]: OTHER }, savedAt: 1,
    }));
    renderPage();

    expect(await screen.findByText("Recuperamos 2 notas que no habías guardado")).toBeTruthy();
  });

  it("sin notas para recuperar no muestra el aviso", async () => {
    renderPage();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.queryByText(/Recuperamos/)).toBeNull();
  });
});
