import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StudentGradeFilters from "./StudentGradeFilters";

afterEach(cleanup);

const fairs = [
  { id: 5, year: 2026, semester: 30 },
  { id: 4, year: 2026, semester: 20 },
  { id: 3, year: 2026, semester: 10 },
];

const renderFilters = (overrides: Partial<Parameters<typeof StudentGradeFilters>[0]> = {}) => {
  const props = {
    selectedFair: "", setSelectedFair: vi.fn(), setSelectedNRC: vi.fn(), availableFairs: fairs,
    selectedEdition: undefined, availableNRCs: [{ id: 7, code: "2501" }], selectedNRC: "7", initialLoading: false,
    filterSearch: "", setFilterSearch: vi.fn(), sortBy: "team" as const, setSortBy: vi.fn(),
    sortOrder: "asc" as const, setSortOrder: vi.fn(), onClear: vi.fn(),
    ...overrides,
  };
  render(<StudentGradeFilters {...props} />);
  return props;
};

describe("StudentGradeFilters: etiqueta del semestre (BG-63)", () => {
  it("muestra «2026 - 2», «2026 - Intersemestral» y «2026 - 1», nunca «S20»", () => {
    renderFilters({ selectedFair: "5", selectedEdition: fairs[0] });
    expect(screen.getByRole("button", { name: "2026 - 2" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2026 - Intersemestral" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2026 - 1" })).toBeTruthy();
    expect(screen.getByText("Filtrar por NRC · 2026 - 2")).toBeTruthy();
    expect(screen.queryByText(/S\d+/)).toBeNull();
  });

  it("elegir una feria no borra el NRC desde el filtro: lo decide el hook", () => {
    const props = renderFilters();
    fireEvent.click(screen.getByRole("button", { name: "2026 - 2" }));
    expect(props.setSelectedFair).toHaveBeenCalledWith("5");
    expect(props.setSelectedNRC).not.toHaveBeenCalled();
  });
});
