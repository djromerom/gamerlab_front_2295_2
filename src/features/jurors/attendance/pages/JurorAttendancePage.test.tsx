import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import JurorAttendancePage from "@/features/jurors/attendance/pages/JurorAttendancePage";
import {
  AnnulArrivalError,
  JurorAttendanceError,
  type JurorAttendanceItem,
  type JurorAttendanceResult,
} from "@/features/jurors/attendance/api/jurorAttendance";

const fetchJurorAttendance = vi.fn();
const annulJurorArrival = vi.fn();

vi.mock("@/features/jurors/attendance/api/jurorAttendance", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/jurors/attendance/api/jurorAttendance")>()),
  fetchJurorAttendance: (...args: unknown[]) => fetchJurorAttendance(...args),
  annulJurorArrival: (...args: unknown[]) => annulJurorArrival(...args),
}));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), info: vi.fn(), error: vi.fn() }), Toaster: () => null }));

// El sidebar real depende de la sesión: aquí solo importa la página
vi.mock("@/layouts/AppSidebar", () => ({
  AppSidebar: () => <nav>Menú lateral</nav>,
}));

// HU-35: la categoría depende del rol de quien mira
const auth = vi.hoisted(() => ({ userRole: "Administrador" as string | null }));
vi.mock("@/contexts/AuthContext", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/contexts/AuthContext")>()),
  useAuth: () => ({ userRole: auth.userRole }),
}));

const missing: JurorAttendanceItem = {
  jurorId: "j-1",
  attendanceId: null,
  name: "Luis Gómez",
  category: "Junior",
  isProfessor: false,
  hasBadge: false,
  status: "MISSING",
  checkedInAt: null,
  method: null,
  checkedInBy: null,
};

const present: JurorAttendanceItem = {
  jurorId: "p-1",
  attendanceId: 31,
  name: "Ana Pérez",
  category: "Senior",
  isProfessor: true,
  hasBadge: true,
  status: "PRESENT",
  checkedInAt: "2026-11-26T13:05:12.000Z",
  method: "QR",
  checkedInBy: { id: "s-1", name: "Staff Mesa 1" },
};

const resultOf = (
  data: JurorAttendanceItem[],
  totals = { present: 42, missing: 71, total: 113 },
  totalPages = 1,
): JurorAttendanceResult => ({
  edition: { id: 5, title: "ARKAD 2026-30" },
  totals,
  data,
  metadata: { totalItems: data.length, itemsOnCurrentPage: data.length, currentPage: 1, itemsPerPage: 50, totalPages },
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <JurorAttendancePage />
    </MemoryRouter>,
  );

// Deja que se resuelvan las promesas pendientes dentro de act
const flush = () => act(async () => {});

describe("Asistencia de jurados (HU-29)", () => {
  beforeEach(() => {
    // jsdom no implementa matchMedia y SidebarProvider lo usa para detectar móvil
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fetchJurorAttendance.mockReset();
    auth.userRole = "Administrador";
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("muestra la edición, las pestañas con los totales y cada jurado con su estado", async () => {
    fetchJurorAttendance.mockResolvedValue(resultOf([missing, present]));
    renderPage();
    await flush();

    expect(screen.getByText(/ARKAD 2026-30/)).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Todos (113)" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Faltan (71)" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Presentes (42)" })).toBeTruthy();

    const rows = screen.getAllByRole("row");
    const luis = within(rows[1]);
    expect(luis.getByText("Luis Gómez")).toBeTruthy();
    expect(luis.getByText("Junior · Sin escarapela")).toBeTruthy();
    expect(luis.getByText("Falta")).toBeTruthy();

    const ana = within(rows[2]);
    expect(ana.getByText("Senior · Profesor")).toBeTruthy();
    expect(ana.getByText("Presente")).toBeTruthy();
    expect(ana.getAllByText(/8:05/).length).toBeGreaterThan(0);
    expect(ana.getAllByText(/Staff Mesa 1/).length).toBeGreaterThan(0);
  });

  it("el Staff ve solo «Jurado», sin junior ni senior (HU-35)", async () => {
    auth.userRole = "Staff";
    fetchJurorAttendance.mockResolvedValue(resultOf([missing, present]));
    const { container } = renderPage();
    await flush();

    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Jurado · Sin escarapela")).toBeTruthy();
    expect(within(rows[2]).getByText("Jurado · Profesor")).toBeTruthy();
    expect(container.textContent).not.toMatch(/junior|senior/i);
    // HU-24: el Staff no da de alta jurados del día
    expect(screen.queryByRole("button", { name: /Agregar jurado del día/ })).toBeNull();
  });

  it("el administrador abre «Agregar jurado del día» (HU-24)", async () => {
    fetchJurorAttendance.mockResolvedValue(resultOf([missing]));
    renderPage();
    await flush();

    fireEvent.click(screen.getByRole("button", { name: /Agregar jurado del día/ }));
    expect(await screen.findByRole("dialog", { name: "Agregar jurado del día" })).toBeTruthy();
    expect(screen.getByLabelText("Correo")).toBeTruthy();
  });

  it("filtrar por estado pide ese estado desde la página 1", async () => {
    fetchJurorAttendance.mockResolvedValue(resultOf([missing]));
    renderPage();
    await flush();

    fireEvent.click(screen.getByRole("tab", { name: /Faltan/ }));
    await flush();

    expect(fetchJurorAttendance).toHaveBeenLastCalledWith({ status: "MISSING", search: "", page: 1 });
  });

  it("la búsqueda se manda al servidor tras una pausa al escribir", async () => {
    fetchJurorAttendance.mockResolvedValue(resultOf([missing]));
    renderPage();
    await flush();

    fireEvent.change(screen.getByLabelText("Buscar jurado por nombre o apellido"), { target: { value: "gomez" } });
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    expect(fetchJurorAttendance).toHaveBeenLastCalledWith({ status: undefined, search: "gomez", page: 1 });
  });

  it("se actualiza sola cada 10 segundos", async () => {
    fetchJurorAttendance.mockResolvedValue(resultOf([missing]));
    renderPage();
    await flush();
    const calls = fetchJurorAttendance.mock.calls.length;

    fetchJurorAttendance.mockResolvedValue(resultOf([{ ...missing, status: "PRESENT", checkedInAt: "2026-11-26T13:30:00.000Z", method: "MANUAL" }]));
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });

    expect(fetchJurorAttendance.mock.calls.length).toBe(calls + 1);
    expect(screen.getByText("Presente")).toBeTruthy();
  });

  it("si una actualización falla, conserva la última lista y avisa", async () => {
    fetchJurorAttendance.mockResolvedValueOnce(resultOf([missing]));
    renderPage();
    await flush();

    fetchJurorAttendance.mockRejectedValue(new Error("Failed to fetch"));
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });

    expect(screen.getByText("Luis Gómez")).toBeTruthy();
    expect(screen.getByText("No se pudo actualizar")).toBeTruthy();
  });

  it("sin feria activa muestra el mensaje del 404", async () => {
    fetchJurorAttendance.mockRejectedValue(new JurorAttendanceError("No hay una feria activa.", 404));
    renderPage();
    await flush();

    expect(screen.getByText("No hay una feria activa.")).toBeTruthy();
  });

  it("una edición sin jurados lo dice", async () => {
    fetchJurorAttendance.mockResolvedValue(resultOf([], { present: 0, missing: 0, total: 0 }));
    renderPage();
    await flush();

    expect(screen.getByText("La edición no tiene jurados confirmados.")).toBeTruthy();
  });

  it("BG-49: el Staff no ve «Anular llegada»", async () => {
    auth.userRole = "Staff";
    fetchJurorAttendance.mockResolvedValue(resultOf([missing, present]));
    renderPage();
    await flush();

    const table = screen.getByRole("table");
    expect(within(table).queryAllByRole("button")).toHaveLength(0);
  });

  it("BG-49: el administrador ve «Anular llegada» solo en quien llegó", async () => {
    fetchJurorAttendance.mockResolvedValue(resultOf([missing, present]));
    renderPage();
    await flush();

    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("button", { name: /Anular llegada/ })).toHaveLength(1);
    expect(within(table).getByRole("button", { name: "Anular llegada de Ana Pérez" })).toBeTruthy();
  });

  it("BG-49: confirma con nombre, hora y quién registró; anula con el motivo y vuelve a consultar la tabla", async () => {
    fetchJurorAttendance.mockResolvedValue(resultOf([missing, present]));
    annulJurorArrival.mockReset().mockResolvedValue({ juror: { id: "p-1", name: "Ana Pérez" }, jurorStatus: "MISSING" });
    renderPage();
    await flush();

    fireEvent.click(screen.getByRole("button", { name: "Anular llegada de Ana Pérez" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("Ana Pérez");
    expect(dialog.textContent).toContain("Staff Mesa 1");
    expect(dialog.textContent).toContain("QR");
    expect(annulJurorArrival).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText("Motivo (opcional)"), { target: { value: "Leyó el QR de al lado" } });
    const callsBefore = fetchJurorAttendance.mock.calls.length;
    fireEvent.click(within(dialog).getByRole("button", { name: "Anular llegada" }));
    await flush();

    expect(annulJurorArrival).toHaveBeenCalledWith(31, "Leyó el QR de al lado");
    expect(fetchJurorAttendance.mock.calls.length).toBeGreaterThan(callsBefore);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("BG-49: «Cancelar» no anula", async () => {
    fetchJurorAttendance.mockResolvedValue(resultOf([present]));
    annulJurorArrival.mockReset();
    renderPage();
    await flush();

    fireEvent.click(screen.getByRole("button", { name: "Anular llegada de Ana Pérez" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" }));
    await flush();
    expect(annulJurorArrival).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("BG-49: un error que no es 404/409 se muestra en el diálogo sin cerrarlo", async () => {
    fetchJurorAttendance.mockResolvedValue(resultOf([present]));
    annulJurorArrival.mockReset().mockRejectedValueOnce(new AnnulArrivalError("Solo el administrador puede anular una llegada.", 403));
    renderPage();
    await flush();

    fireEvent.click(screen.getByRole("button", { name: "Anular llegada de Ana Pérez" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Anular llegada" }));
    await flush();
    expect(within(screen.getByRole("dialog")).getByRole("alert").textContent).toContain("Solo el administrador");
  });

  it("en el celular no hace zoom (ARK-165): escala fija, buscador de 16 px y todo se restaura al salir", async () => {
    fetchJurorAttendance.mockResolvedValue(resultOf([missing]));
    const { unmount } = renderPage();
    await flush();

    const viewport = () => document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    expect(viewport()?.content).toContain("maximum-scale=1");
    expect(document.documentElement.classList.contains("touch-manipulation")).toBe(true);
    expect(screen.getByLabelText("Buscar jurado por nombre o apellido").className).toMatch(/(^|\s)text-base(\s|$)/);

    unmount();
    expect(viewport()?.content ?? "").not.toContain("maximum-scale");
    expect(document.documentElement.classList.contains("touch-manipulation")).toBe(false);
  });
});
