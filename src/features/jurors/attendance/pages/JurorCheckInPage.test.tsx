import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import JurorCheckInPage from "@/features/jurors/attendance/pages/JurorCheckInPage";
import type { CheckInResult, JurorSearchItem } from "@/features/jurors/attendance/api/jurorCheckIn";

const searchJurors = vi.fn();
const checkInJurorManually = vi.fn();
const scanJurorBadge = vi.fn();
const previewJurorBadge = vi.fn();

vi.mock("@/features/jurors/attendance/api/jurorCheckIn", () => ({
  searchJurors: (...args: unknown[]) => searchJurors(...args),
  checkInJurorManually: (...args: unknown[]) => checkInJurorManually(...args),
  scanJurorBadge: (...args: unknown[]) => scanJurorBadge(...args),
  previewJurorBadge: (...args: unknown[]) => previewJurorBadge(...args),
}));

// jsdom no tiene cámara: el escáner falso guarda la función que recibe cada lectura
const scanner = vi.hoisted(() => ({ onScan: null as ((token: string) => void) | null, pause: vi.fn(), resume: vi.fn() }));
vi.mock("html5-qrcode", () => ({
  Html5Qrcode: class {
    start = vi.fn(async (_camera: unknown, _config: unknown, onScan: (token: string) => void) => {
      scanner.onScan = onScan;
    });
    stop = vi.fn(async () => undefined);
    clear = vi.fn();
    pause = scanner.pause;
    resume = scanner.resume;
  },
  Html5QrcodeSupportedFormats: { QR_CODE: 0 },
}));

vi.mock("@/layouts/AppSidebar", () => ({
  AppSidebar: () => <nav>Menú lateral</nav>,
}));

const auth = vi.hoisted(() => ({ userRole: "Staff" as string | null }));
vi.mock("@/contexts/AuthContext", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/contexts/AuthContext")>()),
  useAuth: () => ({ userRole: auth.userRole }),
}));

const ana: JurorSearchItem = {
  id: "j-1",
  name: "Ana Pérez",
  category: "Senior",
  hasBadge: true,
  checkedInAt: null,
};

const checkIn: CheckInResult = {
  status: "CHECKED_IN",
  checkedInAt: "2026-11-26T13:05:12.000Z",
  method: "MANUAL",
  juror: { id: "j-1", name: "Ana Pérez", category: "Senior", teams: [{ id: 1, name: "Grupo 1" }] },
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <JurorCheckInPage />
    </MemoryRouter>,
  );

/** Busca a Ana en el registro manual y devuelve su resultado. */
async function searchAna() {
  fireEvent.change(screen.getByPlaceholderText(/Buscar por nombre/), { target: { value: "Ana" } });
  return screen.findByRole("button", { name: /Ana Pérez/ });
}

describe("Check-in de jurados: categoría según el rol (HU-35)", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    searchJurors.mockReset().mockResolvedValue([ana]);
    checkInJurorManually.mockReset().mockResolvedValue(checkIn);
    auth.userRole = "Staff";
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("el Staff ve «Jurado» en la búsqueda y al registrar la llegada", async () => {
    const { container } = renderPage();
    const option = await searchAna();
    expect(option.textContent).toContain("Jurado · Tiene escarapela");

    fireEvent.click(option);
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar llegada" }));
    await waitFor(() => expect(screen.getByText("Llegada registrada")).toBeTruthy());
    expect(container.textContent).not.toMatch(/junior|senior/i);
  });

  it("el administrador sigue viendo la categoría", async () => {
    auth.userRole = "Administrador";
    renderPage();
    const option = await searchAna();
    expect(option.textContent).toContain("Senior · Tiene escarapela");

    fireEvent.click(option);
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar llegada" }));
    await waitFor(() => expect(screen.getByText("Llegada registrada")).toBeTruthy());
    expect(screen.getByText(/· Senior/)).toBeTruthy();
  });
});

describe("Check-in de jurados: confirmar antes de registrar (ARK-252)", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    searchJurors.mockReset().mockResolvedValue([ana]);
    checkInJurorManually.mockReset().mockResolvedValue(checkIn);
    scanJurorBadge.mockReset().mockResolvedValue({ ...checkIn, method: "QR" });
    previewJurorBadge.mockReset();
    scanner.onScan = null;
    scanner.pause.mockReset();
    scanner.resume.mockReset();
    auth.userRole = "Staff";
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("tocar un resultado no registra: muestra el nombre y espera «Confirmar llegada»", async () => {
    renderPage();
    fireEvent.click(await searchAna());
    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("Ana Pérez");
    expect(dialog.textContent).toContain("Jurado · Tiene escarapela");
    expect(checkInJurorManually).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar llegada" }));
    await waitFor(() => expect(checkInJurorManually).toHaveBeenCalledWith("j-1"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("«Cancelar» no registra", async () => {
    renderPage();
    fireEvent.click(await searchAna());
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(checkInJurorManually).not.toHaveBeenCalled();
    expect(screen.queryByText("Llegada registrada")).toBeNull();
  });

  it("si ya llegó, lo avisa en la confirmación", async () => {
    searchJurors.mockResolvedValue([{ ...ana, checkedInAt: "2026-11-26T13:05:12.000Z" }]);
    renderPage();
    fireEvent.click(await searchAna());
    expect((await screen.findByRole("dialog")).textContent).toMatch(/Ya llegó/);
  });

  async function startCamera() {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Activar cámara/ }));
    await waitFor(() => expect(scanner.onScan).not.toBeNull());
  }

  it("leer un QR muestra el nombre del jurado leído, pausa la cámara y solo registra al confirmar", async () => {
    previewJurorBadge.mockResolvedValue({
      juror: { id: "j-2", name: "Kevin Lara", category: "Junior", teams: [{ id: 3, name: "Grupo 3" }] },
      checkedInAt: null,
    });
    await startCamera();
    scanner.onScan!("token-qr");
    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("Kevin Lara");
    expect(dialog.textContent).toContain("el escáner puede leer el QR de al lado");
    expect(dialog.textContent).toContain("Grupos: Grupo 3");
    expect(previewJurorBadge).toHaveBeenCalledWith("token-qr");
    expect(scanJurorBadge).not.toHaveBeenCalled();
    await waitFor(() => expect(scanner.pause).toHaveBeenCalled());

    // otra lectura mientras está abierta la confirmación se ignora
    scanner.onScan!("otro-token");
    expect(previewJurorBadge).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Confirmar llegada" }));
    await waitFor(() => expect(scanJurorBadge).toHaveBeenCalledWith("token-qr"));
    await waitFor(() => expect(scanner.resume).toHaveBeenCalled());
  });

  it("si otra persona lo registró entre la vista previa y «Confirmar», lo muestra como aviso, no como error", async () => {
    previewJurorBadge.mockResolvedValue({ juror: { id: "j-2", name: "Kevin Lara", category: "Junior", teams: [] }, checkedInAt: null });
    scanJurorBadge.mockResolvedValue({ ...checkIn, status: "ALREADY_CHECKED_IN", method: "QR", juror: { ...checkIn.juror, name: "Kevin Lara" } });
    await startCamera();
    scanner.onScan!("token-qr");
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar llegada" }));
    expect(await screen.findByText("Ya estaba registrado")).toBeTruthy();
    expect(screen.getByText(/No se registró otra vez/)).toBeTruthy();
    expect(screen.queryByText("No se pudo completar el registro")).toBeNull();
  });

  it("cancelar un QR no registra", async () => {
    previewJurorBadge.mockResolvedValue({ juror: { id: "j-2", name: "Kevin Lara", category: "Junior", teams: [] }, checkedInAt: null });
    await startCamera();
    scanner.onScan!("token-qr");
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(scanJurorBadge).not.toHaveBeenCalled();
  });

  it("tras cancelar, el mismo QR (el de al lado) no vuelve a abrir la confirmación enseguida; otro QR sí", async () => {
    previewJurorBadge.mockResolvedValue({ juror: { id: "j-2", name: "Kevin Lara", category: "Junior", teams: [] }, checkedInAt: null });
    await startCamera();
    scanner.onScan!("token-vecino");
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    scanner.onScan!("token-vecino");
    await new Promise((r) => setTimeout(r, 20));
    expect(previewJurorBadge).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();

    scanner.onScan!("token-correcto");
    await screen.findByRole("dialog");
    expect(previewJurorBadge).toHaveBeenLastCalledWith("token-correcto");
  });

  it("un QR que no sirve muestra el error y no abre la confirmación", async () => {
    previewJurorBadge.mockRejectedValue(new Error("Código QR no válido"));
    await startCamera();
    scanner.onScan!("token-malo");
    expect(await screen.findByText("Código QR no válido")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(scanJurorBadge).not.toHaveBeenCalled();
  });
});
