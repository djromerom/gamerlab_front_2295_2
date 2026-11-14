import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Tabs } from "@/components/ui/tabs";

const state = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock("@/fetchs/grupo 1/GlobalStateContext", () => ({ useGlobalState: () => state.value }));

import RankingTable from "@/features/results/components/RankingTable";

const render_ = () => render(<Tabs value="ranking"><RankingTable /></Tabs>);
afterEach(cleanup);

describe("RankingTable", () => {
  it("sin promedio (ranking oculto): aviso en lugar de posiciones y N/A", () => {
    state.value = {
      isLoading: false, error: null, fetchGlobalData: vi.fn(),
      listaVideojuegosFiltrados: [{ id: 1, nombre: "A" }, { id: 2, nombre: "B" }],
    };
    const { container } = render_();
    expect(screen.getByText("Disponible cuando se publique el ranking")).toBeTruthy();
    expect(screen.queryByText("N/A")).toBeNull();
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });
  it("con números: tabla ordenada como hoy", () => {
    state.value = {
      isLoading: false, error: null, fetchGlobalData: vi.fn(),
      listaVideojuegosFiltrados: [{ id: 1, nombre: "A", promedio: 3 }, { id: 2, nombre: "B", promedio: 4.5 }],
    };
    render_();
    expect(screen.queryByText("Disponible cuando se publique el ranking")).toBeNull();
    const rows = screen.getAllByRole("row").map((r) => r.textContent);
    expect(rows[1]).toContain("B");
    expect(rows[1]).toContain("4.50");
  });
});
