import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Tabs } from "@/components/ui/tabs";

const state = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock("@/fetchs/grupo 1/GlobalStateContext", () => ({
  useGlobalState: () => state.value,
}));

import GraphicDisplay from "@/components/grupo 1/GraphicsDisplay";

const base = {
  videojuegoSeleccionado: { id: 1, nombre: "Juego", materia: "Física", nrc: "101", promedio: 4, criterios: {} },
  listaVideojuegos: [{ id: 1, nombre: "Juego", materia: "Física", nrc: "101", promedio: 4 }],
  listaVideojuegosFiltrados: [],
  nrcsFiltrados: [],
  filtroMateria: "Todas",
  isLoading: false,
  error: null,
  fetchGlobalData: vi.fn(),
};

const AVISO = "Disponible cuando se publique el ranking";

function renderIt() {
  return render(
    <Tabs value="graficos">
      <GraphicDisplay />
    </Tabs>,
  );
}

describe("GraphicsDisplay con promedios", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
    errorSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("todos null: muestra el aviso en la tabla por materia y sin NaN", () => {
    state.value = { ...base, datosGraficoTortaMaterias: [{ name: "Álgebra", value: null }, { name: "Cálculo", value: null }] };
    const { container } = renderIt();
    expect(screen.getAllByText(AVISO).length).toBeGreaterThan(0);
    expect(screen.queryByText("Álgebra")).toBeNull();
    expect(container.textContent).not.toMatch(/NaN|Infinity/);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("todos null: el gráfico de barras (slide 3) muestra el aviso", () => {
    state.value = { ...base, datosGraficoTortaMaterias: [{ name: "Física", value: null }] };
    renderIt();
    fireEvent.click(screen.getByLabelText("Ir al gráfico 3"));
    expect(screen.getAllByText(AVISO).length).toBe(2);
  });

  it("por NRC todos null: el gráfico muestra el aviso, no ceros", () => {
    state.value = {
      ...base,
      filtroMateria: "Física",
      datosGraficoTortaMaterias: [],
      listaVideojuegosFiltrados: [{ materia: "Física", nrc: "101" }],
      nrcsFiltrados: [{ codigo: 101, promedioxNRC: null }],
    };
    renderIt();
    fireEvent.click(screen.getByLabelText("Ir al gráfico 3"));
    expect(screen.getAllByText(AVISO).length).toBe(1);
  });

  it("algunos null: omite los null y muestra los numéricos", () => {
    state.value = { ...base, datosGraficoTortaMaterias: [{ name: "Álgebra", value: null }, { name: "Cálculo", value: 3.5 }] };
    const { container } = renderIt();
    expect(screen.queryByText(AVISO)).toBeNull();
    expect(screen.getByText("Cálculo")).toBeTruthy();
    expect(screen.getByText("3.50")).toBeTruthy();
    expect(screen.queryByText("Álgebra")).toBeNull();
    expect(container.textContent).not.toMatch(/NaN|Infinity/);
  });

  it("con números: comportamiento actual", () => {
    state.value = { ...base, datosGraficoTortaMaterias: [{ name: "Álgebra", value: 4 }, { name: "Cálculo", value: 3.5 }] };
    renderIt();
    expect(screen.queryByText(AVISO)).toBeNull();
    expect(screen.getByText("Álgebra")).toBeTruthy();
    expect(screen.getAllByText("4.00").length).toBeGreaterThan(0);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
