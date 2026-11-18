import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Tabs } from "@/components/ui/tabs";

const state = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock("@/contexts/GlobalStateContext", () => ({
  useGlobalState: () => state.value,
}));

import GraphicsDisplay from "@/features/results/components/GraphicsDisplay";

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
      <GraphicsDisplay />
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

  it("algunos null: la materia sin notas dice «Sin nota» (ARK-265) y las demás su promedio", () => {
    state.value = { ...base, datosGraficoTortaMaterias: [{ name: "Álgebra", value: null }, { name: "Cálculo", value: 3.5 }] };
    const { container } = renderIt();
    expect(screen.queryByText(AVISO)).toBeNull();
    expect(screen.getByText("Cálculo")).toBeTruthy();
    expect(screen.getByText("3.50")).toBeTruthy();
    expect(screen.getByText("Álgebra")).toBeTruthy();
    expect(screen.getByText("Sin nota")).toBeTruthy();
    expect(container.textContent).not.toMatch(/NaN|Infinity|0\.00|N\/A/);
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

describe("GraphicsDisplay con videojuegoData sin promedio (ranking oculto)", () => {
  beforeEach(() => {
    Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("Top 3, promedio general y criterios muestran el aviso, sin N/A, NaN ni undefined", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    state.value = {
      ...base,
      videojuegoSeleccionado: { id: 1, nombre: "Juego", materia: "Física", nrc: "101" },
      listaVideojuegos: [{ id: 1, nombre: "Juego", materia: "Física", nrc: "101" }],
      datosGraficoTortaMaterias: [],
    };
    const { container } = renderIt();
    expect(screen.getAllByText(AVISO).length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByText("N/A")).toBeNull();
    expect(container.textContent).not.toMatch(/NaN|undefined|Infinity/);
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
  });
});

describe("GraphicsDisplay: ranking visible con un juego sin promedio/criterios", () => {
  const SIN_CRITERIOS = "Datos de criterios no disponibles para este gráfico.";
  const conNota = { id: 1, nombre: "Con nota", materia: "Física", nrc: "101", promedio: 4, criterios: { Interfaz: 4 } };
  const sinNota = { id: 2, nombre: "Sin nota", materia: "Física", nrc: "102" };

  beforeEach(() => {
    Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("juego sin promedio con ranking visible: «Sin calificar», no el aviso de ranking oculto", () => {
    state.value = { ...base, videojuegoSeleccionado: sinNota, listaVideojuegos: [conNota, sinNota], datosGraficoTortaMaterias: [] };
    renderIt();
    expect(screen.getByText("Sin calificar")).toBeTruthy();
    expect(screen.queryByText(AVISO)).toBeNull();
  });

  it("juego con promedio: círculo con la nota (sin regresión)", () => {
    state.value = { ...base, videojuegoSeleccionado: conNota, listaVideojuegos: [conNota, sinNota], datosGraficoTortaMaterias: [] };
    renderIt();
    expect(screen.getByText("Calificación promedio total")).toBeTruthy();
    expect(screen.queryByText("Sin calificar")).toBeNull();
    expect(screen.queryByText(AVISO)).toBeNull();
  });

  it("sin juego seleccionado: mismo mensaje que antes", () => {
    state.value = { ...base, videojuegoSeleccionado: null, listaVideojuegos: [conNota], datosGraficoTortaMaterias: [] };
    renderIt();
    expect(screen.getByText(/Selecciona un videojuego de la lista/)).toBeTruthy();
    expect(screen.queryByText(AVISO)).toBeNull();
  });

  it("criterios: con criterios hay gráfica; sin criterios mensaje propio; oculto el aviso", () => {
    state.value = { ...base, videojuegoSeleccionado: conNota, listaVideojuegos: [conNota, sinNota], datosGraficoTortaMaterias: [] };
    const a = renderIt();
    expect(a.container.querySelector(".recharts-responsive-container")).not.toBeNull();
    expect(screen.queryByText(SIN_CRITERIOS)).toBeNull();
    cleanup();

    state.value = { ...base, videojuegoSeleccionado: sinNota, listaVideojuegos: [conNota, sinNota], datosGraficoTortaMaterias: [] };
    renderIt();
    expect(screen.getByText(SIN_CRITERIOS)).toBeTruthy();
    expect(screen.queryByText(AVISO)).toBeNull();
    cleanup();

    state.value = { ...base, videojuegoSeleccionado: { id: 3, nombre: "X" }, listaVideojuegos: [{ id: 3, nombre: "X" }], datosGraficoTortaMaterias: [] };
    renderIt();
    expect(screen.queryByText(SIN_CRITERIOS)).toBeNull();
    expect(screen.getAllByText(AVISO).length).toBeGreaterThan(0);
  });
});
