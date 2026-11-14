import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import JurorCheckInPage from "@/features/jurors/attendance/pages/JurorCheckInPage";
import type { CheckInResult, JurorSearchItem } from "@/features/jurors/attendance/api/jurorCheckIn";

const searchJurors = vi.fn();
const checkInJurorManually = vi.fn();

vi.mock("@/features/jurors/attendance/api/jurorCheckIn", () => ({
  searchJurors: (...args: unknown[]) => searchJurors(...args),
  checkInJurorManually: (...args: unknown[]) => checkInJurorManually(...args),
  scanJurorBadge: vi.fn(),
}));

// jsdom no tiene cámara: el escáner no se usa en estas pruebas
vi.mock("html5-qrcode", () => ({
  Html5Qrcode: class {
    start = vi.fn();
    stop = vi.fn();
    clear = vi.fn();
  },
  Html5QrcodeSupportedFormats: { QR_CODE: 0 },
}));

vi.mock("@/components/grupo 9/app-sidebar", () => ({
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
    await waitFor(() => expect(screen.getByText("Llegada registrada")).toBeTruthy());
    expect(container.textContent).not.toMatch(/junior|senior/i);
  });

  it("el administrador sigue viendo la categoría", async () => {
    auth.userRole = "Administrador";
    renderPage();
    const option = await searchAna();
    expect(option.textContent).toContain("Senior · Tiene escarapela");

    fireEvent.click(option);
    await waitFor(() => expect(screen.getByText("Llegada registrada")).toBeTruthy());
    expect(screen.getByText(/· Senior/)).toBeTruthy();
  });
});
