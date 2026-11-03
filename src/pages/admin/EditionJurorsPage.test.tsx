import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EditionJurorsPage from "@/pages/admin/EditionJurorsPage";
import {
  JurorEditionError,
  type EditionJurorItem,
  type EditionJurorsList,
} from "@/fetchs/jurorEdition";

const fetchEditionJurors = vi.fn();
const updateJurorStatuses = vi.fn();
const importPreviousJurors = vi.fn();
const enrollJurorByEmail = vi.fn();

vi.mock("@/fetchs/jurorEdition", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/fetchs/jurorEdition")>()),
  fetchEditionJurors: (...args: unknown[]) => fetchEditionJurors(...args),
  updateJurorStatuses: (...args: unknown[]) => updateJurorStatuses(...args),
  importPreviousJurors: (...args: unknown[]) => importPreviousJurors(...args),
  enrollJurorByEmail: (...args: unknown[]) => enrollJurorByEmail(...args),
}));

vi.mock("@/fetchs/editions", () => ({
  fetchEditions: () => Promise.resolve([]),
}));

// El sidebar real depende de la sesión: aquí solo importa la página
vi.mock("@/components/grupo 9/app-sidebar", () => ({
  AppSidebar: () => <nav>Menú lateral</nav>,
}));

const juror = (
  jurorId: string,
  firstName: string,
  status: EditionJurorItem["status"],
): EditionJurorItem => ({
  jurorId,
  firstName,
  lastName: "Test",
  email: `${jurorId}@test.co`,
  category: status === "AUTOMATIC" ? "Senior" : "Junior",
  type: status === "AUTOMATIC" ? null : "OFFICIAL",
  status,
  source: status === "AUTOMATIC" ? "PROFESSOR_NRC" : "ENROLLED",
  updatedAt: status === "AUTOMATIC" ? null : "2026-11-03T15:20:00.000Z",
});

const listOf = (
  data: EditionJurorItem[],
  { writable = true, PENDING = 2 }: { writable?: boolean; PENDING?: number } = {},
): EditionJurorsList => ({
  data,
  metadata: { totalItems: data.length, itemsOnCurrentPage: data.length, currentPage: 1, itemsPerPage: 20, totalPages: 1 },
  edition: { id: 5, title: "Feria Gamer 2026-30", status: "ACTIVE", writable },
  counts: { PENDING, CONFIRMED: 0, DECLINED: 0, AUTOMATIC: 1 },
});

const JURORS = [
  juror("j-1", "Ana", "PENDING"),
  juror("j-2", "Beto", "PENDING"),
  juror("p-1", "Luis", "AUTOMATIC"),
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <EditionJurorsPage />
    </MemoryRouter>,
  );

describe("Página «Jurados de la edición» (ARK-126)", () => {
  beforeEach(() => {
    // jsdom no implementa matchMedia y SidebarProvider lo usa para detectar móvil
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("muestra los textos de ayuda, los contadores y a los profesores sin casilla", async () => {
    fetchEditionJurors.mockResolvedValue(listOf(JURORS));
    renderPage();

    expect(await screen.findByText("Ana Test")).toBeTruthy();
    expect(screen.getByText(/Cargue primero los NRC de la edición/)).toBeTruthy();
    expect(screen.getByText(/Solo los jurados confirmados y los profesores con NRC/)).toBeTruthy();
    expect(screen.getByText(/créelo en Personal → Jurados/)).toBeTruthy();

    expect(screen.getByRole("tab", { name: /Pendientes \(2\)/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Todos \(3\)/ })).toBeTruthy();

    expect(screen.getByLabelText("Seleccionar Ana Test")).toBeTruthy();
    expect(screen.queryByLabelText("Seleccionar Luis Test")).toBeNull();
    expect(screen.getAllByText("Profesor con NRC").length).toBeGreaterThan(0);
  });

  it("en una edición de solo lectura oculta las acciones y las casillas", async () => {
    fetchEditionJurors.mockResolvedValue(listOf(JURORS, { writable: false }));
    renderPage();

    expect(await screen.findByText("Edición de solo lectura")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Traer de la edición anterior/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Inscribir por correo/ })).toBeNull();
    expect(screen.queryByLabelText("Seleccionar Ana Test")).toBeNull();
  });

  it("sin edición activa muestra el aviso y deja el selector de edición", async () => {
    fetchEditionJurors.mockRejectedValue(new JurorEditionError("No hay una edición activa", 404));
    renderPage();

    expect(await screen.findByText(/No hay una edición activa. Elija una edición/)).toBeTruthy();
    expect(screen.getByLabelText("Edición")).toBeTruthy();
  });

  it("confirmar y declinar el resto pide confirmación con los pendientes que se declinarán", async () => {
    // La lista general (5 pendientes) se pide sin búsqueda ni tipo para calcular N
    fetchEditionJurors.mockImplementation(async (query: { limit?: number }) =>
      query.limit === 1 ? listOf([], { PENDING: 5 }) : listOf(JURORS),
    );
    updateJurorStatuses.mockResolvedValue({ results: [{ jurorId: "j-1", ok: true }], declined: 4 });
    renderPage();

    fireEvent.click(await screen.findByLabelText("Seleccionar Ana Test"));
    fireEvent.click(screen.getByRole("button", { name: /Confirmar seleccionados y declinar el resto/ }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(/se declinarán 4 jurados/)).toBeTruthy();
    expect(fetchEditionJurors).toHaveBeenCalledWith({ editionId: 5, limit: 1 });

    fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }));

    await vi.waitFor(() => expect(updateJurorStatuses).toHaveBeenCalledTimes(1));
    expect(updateJurorStatuses).toHaveBeenCalledWith({
      editionId: 5,
      declineRemaining: true,
      items: [{ jurorId: "j-1", status: "CONFIRMED" }],
    });
  });

  it("confirma con el tipo elegido y resalta las filas que el back rechaza", async () => {
    fetchEditionJurors.mockResolvedValue(listOf(JURORS));
    updateJurorStatuses.mockResolvedValue({
      results: [
        { jurorId: "j-1", ok: true },
        { jurorId: "j-2", ok: false, error: "NOT_ENROLLED" },
      ],
      declined: 0,
    });
    renderPage();

    fireEvent.click(await screen.findByLabelText("Seleccionar Ana Test"));
    fireEvent.click(screen.getByLabelText("Seleccionar Beto Test"));
    fireEvent.change(screen.getByLabelText("Tipo al confirmar"), { target: { value: "BACKUP" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(await screen.findByText("No está en esta edición: inscríbalo por correo")).toBeTruthy();
    expect(updateJurorStatuses).toHaveBeenCalledWith({
      editionId: 5,
      items: [
        { jurorId: "j-1", status: "CONFIRMED", type: "BACKUP" },
        { jurorId: "j-2", status: "CONFIRMED", type: "BACKUP" },
      ],
    });
    // Queda seleccionado solo el que falló
    expect(screen.getByText("1 seleccionado")).toBeTruthy();
  });

  it("inscribir un correo sin cuenta lleva al alta de jurado", async () => {
    fetchEditionJurors.mockResolvedValue(listOf(JURORS));
    enrollJurorByEmail.mockRejectedValue(new JurorEditionError("Not Found", 404));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Inscribir por correo/ }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Correo"), { target: { value: "nadie@test.co" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Inscribir" }));

    expect(await within(dialog).findByText("No existe una cuenta con ese correo.")).toBeTruthy();
    expect(enrollJurorByEmail).toHaveBeenCalledWith({ email: "nadie@test.co", editionId: 5, type: "OFFICIAL" });
    expect(
      within(dialog).getByRole("link", { name: /Personal → Jurados/ }).getAttribute("href"),
    ).toBe("/jurados");
  });

  it("si ya está inscrito muestra el motivo del back (409)", async () => {
    fetchEditionJurors.mockResolvedValue(listOf(JURORS));
    enrollJurorByEmail.mockRejectedValue(
      new JurorEditionError("El jurado ya está en esta edición como Pendiente", 409),
    );
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Inscribir por correo/ }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Correo"), { target: { value: "ana@test.co" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Inscribir" }));

    expect(await within(dialog).findByText("El jurado ya está en esta edición como Pendiente")).toBeTruthy();
    expect(within(dialog).queryByRole("link")).toBeNull();
  });
});
