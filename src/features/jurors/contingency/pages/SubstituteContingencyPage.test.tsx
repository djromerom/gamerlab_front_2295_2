import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SubstituteContingencyPage from "@/features/jurors/contingency/pages/SubstituteContingencyPage";
import {
  ContingencyError,
  type ContingencySettings,
  type GroupSuggestion,
  type SuggestionsResult,
} from "@/features/jurors/contingency/api/contingency";
import { AssignmentWarningsError } from "@/features/jurors/assignment/lib/assignmentWarnings";

const api = vi.hoisted(() => ({
  fetchContingencySuggestions: vi.fn(),
  acceptSubstituteSuggestions: vi.fn(),
  rejectSubstituteSuggestion: vi.fn(),
  fetchContingencySettings: vi.fn(),
  updateContingencySettings: vi.fn(),
}));

vi.mock("@/features/jurors/contingency/api/contingency", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/jurors/contingency/api/contingency")>()),
  ...api,
}));

// El sidebar real depende de la sesión: aquí solo importa la página
vi.mock("@/layouts/AppSidebar", () => ({
  AppSidebar: () => <nav>Menú lateral</nav>,
}));

const pixelHunters: GroupSuggestion = {
  teamId: 12,
  codigo: "N1-AYP-06",
  nombre: "Pixel Hunters",
  videojuego: "Pixel Quest",
  nivel: 1,
  juradosContados: 2,
  faltantes: 1,
  jurados: [
    { id: "j-ana", nombre: "Ana Pérez", categoria: "JUNIOR", estado: "ABSENT", evaluo: false, cuenta: false },
    { id: "j-luis", nombre: "Luis Díaz", categoria: "JUNIOR", estado: "PRESENT", evaluo: true, cuenta: true },
    { id: "j-marta", nombre: "Marta Ruiz", categoria: "SENIOR", estado: "LEFT", evaluo: false, cuenta: false },
  ],
  sugeridos: [
    { id: "s-laura", nombre: "Laura Gómez", categoria: "JUNIOR", carga: 1, llegada: true, mismoNivel: true, mismaCategoria: true, rechazado: false },
  ],
  alternativas: [
    { id: "s-pedro", nombre: "Pedro Lara", categoria: "SENIOR", carga: 2, llegada: false, mismoNivel: false, mismaCategoria: false, rechazado: true },
  ],
  sinCubrir: 0,
  advertencias: [{ code: "JUROR_MIXED_LEVELS", message: "Laura quedaría con grupos de dos niveles", jurorId: "s-laura" }],
};

const schoolGroup: GroupSuggestion = {
  ...pixelHunters,
  teamId: 20,
  codigo: "N0-COL-02",
  nombre: "Colegio Andino",
  nivel: 0,
  faltantes: 2,
  jurados: [],
  sugeridos: [
    { id: "s-rosa", nombre: "Rosa Mejía", categoria: "SENIOR", carga: 1, llegada: true, mismoNivel: true, mismaCategoria: false, rechazado: false },
  ],
  alternativas: [],
  sinCubrir: 1,
  advertencias: [],
};

const resultOf = (grupos: GroupSuggestion[], overrides: Partial<SuggestionsResult> = {}): SuggestionsResult => ({
  edicion: { id: 3, title: "Feria 2026-2" },
  fase: "CONTROL",
  base: "PRESENT",
  minimoEvaluaciones: 3,
  generadoEn: "2026-11-26T16:30:00.000Z",
  totales: {
    gruposEnRiesgo: grupos.length,
    faltantes: grupos.reduce((sum, group) => sum + group.faltantes, 0),
    sugeridos: grupos.reduce((sum, group) => sum + group.sugeridos.length, 0),
    sinCubrir: grupos.reduce((sum, group) => sum + group.sinCubrir, 0),
  },
  suplentesDisponibles: 4,
  grupos,
  ...overrides,
});

const settings: ContingencySettings = {
  edicion: { id: 3, title: "Feria 2026-2" },
  minEvaluationsPerTeam: 3,
  cronograma: { fairDate: "2026-11-26", startTime: "08:00", alertTime: "10:00", controlTime: "11:00", closeTime: "12:00" },
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <SubstituteContingencyPage />
    </MemoryRouter>,
  );

// Deja que se resuelvan las promesas pendientes dentro de act
const flush = () => act(async () => {});

const card = (code: string) => screen.getByRole("article", { name: `Grupo ${code}` });

describe("Contingencia con suplentes (HU-14, ARK-214)", () => {
  beforeEach(() => {
    // jsdom no implementa matchMedia y SidebarProvider lo usa para detectar móvil
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    api.fetchContingencySuggestions.mockResolvedValue(resultOf([pixelHunters, schoolGroup]));
    api.fetchContingencySettings.mockResolvedValue(settings);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    Object.values(api).forEach((mock) => mock.mockReset());
  });

  it("muestra los grupos en riesgo con el estado de cada jurado y los sugeridos", async () => {
    renderPage();
    await flush();

    const group = card("N1-AYP-06");
    expect(within(group).getByText("Pixel Hunters")).toBeTruthy();
    expect(within(group).getByText("Faltan 1")).toBeTruthy();
    expect(within(group).getByText("Cuentan 2 de 3")).toBeTruthy();
    expect(within(group).getByText("Sin llegada")).toBeTruthy();
    expect(within(group).getByText("Se retiró")).toBeTruthy();
    expect(within(group).getByText("Presente")).toBeTruthy();
    expect(within(group).getByText("Ya evaluó")).toBeTruthy();
    expect(within(group).getByText("Laura Gómez")).toBeTruthy();
    expect(within(group).getByText("1 grupo si se acepta")).toBeTruthy();

    const school = card("N0-COL-02");
    expect(within(school).getByText(/N0 · Colegios/)).toBeTruthy();
    expect(within(school).getByText("1 faltante sin suplente que lo cubra.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Aceptar todo \(2\)/ }).hasAttribute("disabled")).toBe(false);
  });

  it("no muestra las advertencias de HU-08 en la tarjeta del grupo, pero sí el aviso «sin suplente» (ARK-288)", async () => {
    api.fetchContingencySuggestions.mockResolvedValue(
      resultOf([{ ...pixelHunters, sinCubrir: 1 }]),
    );
    renderPage();
    await flush();

    const group = card("N1-AYP-06");
    expect(within(group).queryByText("Laura quedaría con grupos de dos niveles")).toBeNull();
    expect(within(group).queryByRole("list", { name: "Advertencias de N1-AYP-06" })).toBeNull();
    expect(within(group).getByText("1 faltante sin suplente que lo cubra.")).toBeTruthy();
  });

  it("antes de la hora de control avisa que se cuentan todos los asignados", async () => {
    api.fetchContingencySuggestions.mockResolvedValue(resultOf([pixelHunters], { fase: "ALERT", base: "ASSIGNED" }));
    renderPage();
    await flush();

    expect(screen.getByText(/Aún no es la hora de control \(11:00\): se cuentan todos los asignados/)).toBeTruthy();
  });

  it("marca al jurado que avisó que no vendrá (HU-44)", async () => {
    const withNotComing = {
      ...pixelHunters,
      jurados: pixelHunters.jurados.map((juror) => (juror.id === "j-ana" ? { ...juror, noVendra: true } : juror)),
    };
    api.fetchContingencySuggestions.mockResolvedValue(resultOf([withNotComing], { fase: "ALERT", base: "ASSIGNED" }));
    renderPage();
    await flush();

    expect(within(card("N1-AYP-06")).getByText("No vendrá")).toBeTruthy();
  });

  it("sin grupos en riesgo muestra el estado vacío y desactiva «Aceptar todo»", async () => {
    api.fetchContingencySuggestions.mockResolvedValue(resultOf([]));
    renderPage();
    await flush();

    expect(screen.getByText("Ningún grupo está en riesgo")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Aceptar todo/ }).hasAttribute("disabled")).toBe(true);
  });

  it("aceptar un grupo envía sus sugeridos, muestra el mensaje del back y recarga", async () => {
    api.acceptSubstituteSuggestions.mockResolvedValue({ message: "Se agregaron 1 asignaciones de suplentes en 1 grupos. Nadie perdió grupos." });
    renderPage();
    await flush();

    fireEvent.click(within(card("N1-AYP-06")).getByRole("button", { name: /^Aceptar$/ }));
    await flush();

    expect(api.acceptSubstituteSuggestions).toHaveBeenCalledWith([{ teamId: 12, substituteId: "s-laura" }], false);
    expect(screen.getByText(/Nadie perdió grupos/)).toBeTruthy();
    expect(api.fetchContingencySuggestions).toHaveBeenCalledTimes(2);
  });

  it("«Aceptar todo» envía los sugeridos de todos los grupos", async () => {
    api.acceptSubstituteSuggestions.mockResolvedValue({ message: "Se agregaron 2 asignaciones" });
    renderPage();
    await flush();

    fireEvent.click(screen.getByRole("button", { name: /Aceptar todo/ }));
    await flush();

    expect(api.acceptSubstituteSuggestions).toHaveBeenCalledWith(
      [{ teamId: 12, substituteId: "s-laura" }, { teamId: 20, substituteId: "s-rosa" }],
      false,
    );
  });

  it("con advertencias de HU-08 pide confirmación y reenvía con confirmWarnings", async () => {
    api.acceptSubstituteSuggestions
      .mockRejectedValueOnce(new AssignmentWarningsError("Rompe reglas", [{ code: "JUROR_OVER_LIMIT", message: "Laura quedaría con 6 grupos" }]))
      .mockResolvedValueOnce({ message: "Se agregaron 1 asignaciones" });
    renderPage();
    await flush();

    fireEvent.click(within(card("N1-AYP-06")).getByRole("button", { name: /^Aceptar$/ }));
    await flush();

    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("Laura quedaría con 6 grupos")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }));
    await flush();

    expect(api.acceptSubstituteSuggestions).toHaveBeenLastCalledWith([{ teamId: 12, substituteId: "s-laura" }], true);
    expect(screen.getByText("Se agregaron 1 asignaciones")).toBeTruthy();
  });

  it("un bloqueo al aceptar muestra el error sin recargar", async () => {
    api.acceptSubstituteSuggestions.mockRejectedValue(
      new ContingencyError("Laura es junior y el grupo es de colegios.", 400, "SCHOOL_REQUIRES_SENIOR"),
    );
    renderPage();
    await flush();

    fireEvent.click(within(card("N1-AYP-06")).getByRole("button", { name: /^Aceptar$/ }));
    await flush();

    expect(screen.getByRole("alert").textContent).toContain("Laura es junior y el grupo es de colegios.");
    expect(api.fetchContingencySuggestions).toHaveBeenCalledTimes(1);
  });

  it("rechazar envía el motivo, deja registro y vuelve a pedir la sugerencia", async () => {
    api.rejectSubstituteSuggestion.mockResolvedValue({ message: "Se rechazó la sugerencia de N1-AYP-06." });
    renderPage();
    await flush();

    fireEvent.click(within(card("N1-AYP-06")).getByRole("button", { name: /Rechazar/ }));
    const dialog = screen.getByRole("dialog", { name: "Rechazar sugerencia" });
    fireEvent.change(within(dialog).getByRole("textbox"), { target: { value: "Prefiero a un profesor del área" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Rechazar" }));
    await flush();

    // Todos marcados: se rechaza toda la sugerencia actual (sin substituteIds)
    expect(api.rejectSubstituteSuggestion).toHaveBeenCalledWith({
      teamId: 12,
      substituteIds: [],
      reason: "Prefiero a un profesor del área",
    });
    expect(screen.queryByRole("dialog", { name: "Rechazar sugerencia" })).toBeNull();
    expect(screen.getByText("Se rechazó la sugerencia de N1-AYP-06.")).toBeTruthy();
    expect(api.fetchContingencySuggestions).toHaveBeenCalledTimes(2);
  });

  it("«Elegir otro» asigna a mano un suplente de las alternativas", async () => {
    api.acceptSubstituteSuggestions.mockResolvedValue({ message: "Se agregó 1 asignación" });
    renderPage();
    await flush();

    fireEvent.click(within(card("N1-AYP-06")).getByRole("button", { name: /Elegir otro/ }));
    const dialog = screen.getByRole("dialog", { name: "Elegir otro suplente" });
    expect(within(dialog).getByText("Rechazado para este grupo")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("radio", { name: /Pedro Lara/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Asignar al grupo" }));
    await flush();

    expect(api.acceptSubstituteSuggestions).toHaveBeenCalledWith([{ teamId: 12, substituteId: "s-pedro" }], false);
    expect(screen.queryByRole("dialog", { name: "Elegir otro suplente" })).toBeNull();
  });

  it("si la asignación manual falla, el error queda dentro del diálogo", async () => {
    api.acceptSubstituteSuggestions.mockRejectedValue(new ContingencyError("Ese suplente ya no es Suplente confirmado.", 400, "NOT_A_SUBSTITUTE"));
    renderPage();
    await flush();

    fireEvent.click(within(card("N1-AYP-06")).getByRole("button", { name: /Elegir otro/ }));
    const dialog = screen.getByRole("dialog", { name: "Elegir otro suplente" });
    fireEvent.click(within(dialog).getByRole("radio", { name: /Pedro Lara/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Asignar al grupo" }));
    await flush();

    expect(within(dialog).getByRole("alert").textContent).toContain("Ese suplente ya no es Suplente confirmado.");
  });

  it("guarda el mínimo de evaluaciones y recarga los grupos", async () => {
    api.updateContingencySettings.mockResolvedValue({ ...settings, minEvaluationsPerTeam: 4 });
    renderPage();
    await flush();

    expect(screen.getByText("11:00")).toBeTruthy();
    const input = screen.getByRole("spinbutton", { name: /Mínimo de evaluaciones por grupo/ });
    expect((input as HTMLInputElement).value).toBe("3");
    fireEvent.change(input, { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await flush();

    expect(api.updateContingencySettings).toHaveBeenCalledWith(4);
    expect(screen.getByText("Mínimo guardado.")).toBeTruthy();
    expect(api.fetchContingencySuggestions).toHaveBeenCalledTimes(2);
  });

  it("no guarda un mínimo fuera de 1 a 10", async () => {
    renderPage();
    await flush();

    fireEvent.change(screen.getByRole("spinbutton", { name: /Mínimo de evaluaciones/ }), { target: { value: "11" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await flush();

    expect(api.updateContingencySettings).not.toHaveBeenCalled();
    expect(screen.getByText("El mínimo debe estar entre 1 y 10.")).toBeTruthy();
  });

  it("se refresca sola cada 60 segundos", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    renderPage();
    await flush();
    expect(api.fetchContingencySuggestions).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });
    expect(api.fetchContingencySuggestions).toHaveBeenCalledTimes(2);
  });

  it("si falla la carga lo dice", async () => {
    api.fetchContingencySuggestions.mockRejectedValue(new ContingencyError("No hay una edición activa.", 404));
    renderPage();
    await flush();

    expect(screen.getByRole("alert").textContent).toContain("No hay una edición activa.");
  });

  it("marca al sugerido sin categoría y, si se acepta, nombra al suplente y al grupo", async () => {
    const withoutCategory: GroupSuggestion = {
      ...pixelHunters,
      advertencias: [],
      sugeridos: [{ ...pixelHunters.sugeridos[0], id: "juror-junior", nombre: "Juror Junior", categoria: null }],
    };
    api.fetchContingencySuggestions.mockResolvedValue(resultOf([withoutCategory]));
    api.acceptSubstituteSuggestions.mockRejectedValue(
      new ContingencyError("El jurado no tiene categoría asignada (JUNIOR/SENIOR).", 400, "MISSING_JUROR_CATEGORY", "juror-junior", 12),
    );
    renderPage();
    await flush();

    expect(within(card("N1-AYP-06")).getByText(/Sin categoría: no se podrá asignar/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Aceptar todo/ }));
    await flush();

    expect(screen.getByRole("alert").textContent).toContain(
      "No se pudo asignar a Juror Junior en N1-AYP-06: no tiene categoría (Junior o Senior).",
    );
  });

  it("rechazar solo a un suplente envía su id", async () => {
    const twoSuggested: GroupSuggestion = {
      ...pixelHunters,
      faltantes: 2,
      sugeridos: [...pixelHunters.sugeridos, { ...pixelHunters.sugeridos[0], id: "s-tomas", nombre: "Tomás Rey" }],
    };
    api.fetchContingencySuggestions.mockResolvedValue(resultOf([twoSuggested]));
    api.rejectSubstituteSuggestion.mockResolvedValue({ message: "Se rechazó a Tomás Rey." });
    renderPage();
    await flush();

    fireEvent.click(within(card("N1-AYP-06")).getByRole("button", { name: /Rechazar/ }));
    const dialog = screen.getByRole("dialog", { name: "Rechazar sugerencia" });
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Rechazar a Laura Gómez" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Rechazar" }));
    await flush();

    expect(api.rejectSubstituteSuggestion).toHaveBeenCalledWith({ teamId: 12, substituteIds: ["s-tomas"], reason: "" });
  });
});
