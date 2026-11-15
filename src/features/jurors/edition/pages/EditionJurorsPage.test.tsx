import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EditionJurorsPage from "@/features/jurors/edition/pages/EditionJurorsPage";
import {
  JurorEditionError,
  type EditionJurorItem,
  type EditionJurorsList,
} from "@/features/jurors/edition/api/jurorEdition";

const fetchEditionJurors = vi.fn();
const updateJurorStatuses = vi.fn();
const importPreviousJurors = vi.fn();
const enrollJurorByEmail = vi.fn();

vi.mock("@/features/jurors/edition/api/jurorEdition", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/jurors/edition/api/jurorEdition")>()),
  fetchEditionJurors: (...args: unknown[]) => fetchEditionJurors(...args),
  updateJurorStatuses: (...args: unknown[]) => updateJurorStatuses(...args),
  importPreviousJurors: (...args: unknown[]) => importPreviousJurors(...args),
  enrollJurorByEmail: (...args: unknown[]) => enrollJurorByEmail(...args),
}));

vi.mock("@/api/editions", () => ({
  fetchEditions: () => Promise.resolve([]),
}));

// El sidebar real depende de la sesión: aquí solo importa la página
vi.mock("@/layouts/AppSidebar", () => ({
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

  it("marca con «Alta del día» a quien se dio de alta el día de la feria (HU-24)", async () => {
    fetchEditionJurors.mockResolvedValue(listOf([{ ...juror("w-1", "Laura", "CONFIRMED"), type: "BACKUP", walkIn: true }, ...JURORS]));
    renderPage();

    await screen.findByText("Ana Test");
    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Alta del día")).toBeTruthy();
    expect(screen.getAllByText("Alta del día")).toHaveLength(1);
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

  describe("profesores senior sin NRC (ARK-151)", () => {
    // Fila ENROLLED de un profesor: Senior, Confirmado y Oficial, como responde el back
    const enrolledProfessor: EditionJurorItem = {
      ...juror("p-2", "Carlos", "CONFIRMED"),
      category: "Senior",
    };

    const enroll = async (email: string) => {
      fireEvent.click(await screen.findByRole("button", { name: /Inscribir por correo/ }));
      const dialog = await screen.findByRole("dialog");
      fireEvent.change(within(dialog).getByLabelText("Correo"), { target: { value: email } });
      fireEvent.click(within(dialog).getByRole("button", { name: "Inscribir" }));
      return dialog;
    };

    it("la ayuda explica que el profesor sin NRC se inscribe por correo", async () => {
      fetchEditionJurors.mockResolvedValue(listOf(JURORS));
      renderPage();

      expect(await screen.findByText(/profesores senior sin NRC en esta edición se inscriben/)).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: /Inscribir por correo/ }));
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByText(/un profesor senior sin NRC en esta edición/)).toBeTruthy();
    });

    it("inscribe al profesor y recarga la lista", async () => {
      fetchEditionJurors.mockResolvedValueOnce(listOf(JURORS));
      fetchEditionJurors.mockResolvedValue(listOf([...JURORS, enrolledProfessor]));
      enrollJurorByEmail.mockResolvedValue(enrolledProfessor);
      renderPage();

      await enroll("carlos@test.co");

      expect(await screen.findByText("Carlos Test")).toBeTruthy();
      expect(enrollJurorByEmail).toHaveBeenCalledWith({
        email: "carlos@test.co",
        editionId: 5,
        type: "OFFICIAL",
      });
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("lista al profesor con categoría, tipo y estado, y deja seleccionarlo", async () => {
      fetchEditionJurors.mockResolvedValue(listOf([...JURORS, enrolledProfessor]));
      renderPage();

      const row = (await screen.findByText("Carlos Test")).closest("tr") as HTMLElement;
      expect(within(row).getByText("Senior")).toBeTruthy();
      expect(within(row).getByText("Oficial")).toBeTruthy();
      expect(within(row).getByText("Confirmado")).toBeTruthy();
      expect(within(row).getByLabelText("Seleccionar Carlos Test")).toBeTruthy();
    });

    it("un profesor con NRC activo muestra el motivo del back (409) sin enlace al alta", async () => {
      const message = "El profesor ya es jurado de esta edición porque tiene un NRC activo en ella";
      fetchEditionJurors.mockResolvedValue(listOf(JURORS));
      enrollJurorByEmail.mockRejectedValue(new JurorEditionError(message, 409));
      renderPage();

      const dialog = await enroll("luis@test.co");

      expect(await within(dialog).findByText(message)).toBeTruthy();
      expect(within(dialog).queryByRole("link")).toBeNull();
    });

    it("una cuenta sin rol Jurado ni Profesor muestra el motivo del back (400)", async () => {
      const message = "La cuenta no tiene el rol Jurado ni Profesor";
      fetchEditionJurors.mockResolvedValue(listOf(JURORS));
      enrollJurorByEmail.mockRejectedValue(new JurorEditionError(message, 400));
      renderPage();

      const dialog = await enroll("estudiante@test.co");

      expect(await within(dialog).findByText(message)).toBeTruthy();
      expect(within(dialog).queryByRole("link")).toBeNull();
    });

    it("explica en la fila que el profesor automático no se edita (IS_PROFESSOR)", async () => {
      fetchEditionJurors.mockResolvedValue(listOf(JURORS));
      updateJurorStatuses.mockResolvedValue({
        results: [{ jurorId: "j-1", ok: false, error: "IS_PROFESSOR" }],
        declined: 0,
      });
      renderPage();

      fireEvent.click(await screen.findByLabelText("Seleccionar Ana Test"));
      fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

      expect(await screen.findByText("Profesor con NRC en la edición: es jurado automático")).toBeTruthy();
    });
  });
});
