import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import StudentGradeTable from "./StudentGradeTable";

vi.mock("@/hooks/useFetch", () => ({ useFetch: () => vi.fn() }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), info: vi.fn(), success: vi.fn(), dismiss: vi.fn() }) }));
vi.mock("@/hooks/useTeacherDashboard", () => ({
  useTeacherDashboard: () => ({
    selectedNRC: "7", setSelectedNRC: vi.fn(), selectedFair: "", setSelectedFair: vi.fn(), selectedEdition: undefined,
    availableFairs: [], currentPage: 1, setCurrentPage: vi.fn(), paginationMetadata: { totalPages: 1 }, availableNRCs: [],
    isLoading: false, initialLoading: false, error: null, noStudents: false, teams: [], handlePreviousPage: vi.fn(),
    handleNextPage: vi.fn(), reloadProjects: vi.fn(), retryLoad: vi.fn(),
  }),
}));

afterEach(cleanup);

describe("StudentGradeTable", () => {
  it("deshabilita la exportacion en la pestana de historicos", () => {
    render(<TooltipProvider><StudentGradeTable /></TooltipProvider>);
    const exportButton = screen.getByRole("button", { name: /exportar resultados filtrados/i });
    expect((exportButton as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole("tab", { name: "Históricos" }));
    expect((exportButton as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("button", { name: /exportar resultados filtrados/i }).getAttribute("title")).toBe("La exportación solo incluye la feria activa");
  });
});
