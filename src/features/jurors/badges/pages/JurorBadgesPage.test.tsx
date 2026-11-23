import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import JurorBadgesPage from "@/features/jurors/badges/pages/JurorBadgesPage";

const fetchJurorBadges = vi.fn();
const downloadJurorBadgesPdf = vi.fn();

vi.mock("@/features/jurors/badges/api/jurorBadges", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/jurors/badges/api/jurorBadges")>()),
  fetchJurorBadges: (...args: unknown[]) => fetchJurorBadges(...args),
  downloadJurorBadgesPdf: (...args: unknown[]) => downloadJurorBadgesPdf(...args),
}));
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), info: vi.fn(), error: vi.fn() }),
  Toaster: () => null,
}));
vi.mock("@/layouts/AppSidebar", () => ({
  AppSidebar: () => <nav>Menú lateral</nav>,
}));

beforeAll(() => {
  // Radix Select usa APIs de puntero que jsdom no trae
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

const renderPage = async () => {
  render(
    <MemoryRouter>
      <JurorBadgesPage />
    </MemoryRouter>,
  );
  await screen.findByText("2 escarapelas");
};

const downloadButton = () => screen.getByRole("button", { name: /Descargar PDF/ });

describe("Escarapelas: selector de tamaño de hoja", () => {
  beforeEach(() => {
    // jsdom no implementa matchMedia y SidebarProvider lo usa para detectar móvil
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    fetchJurorBadges.mockResolvedValue({
      editionId: 5,
      data: [
        { jurorId: "j-1", name: "Ana Pérez", category: "Senior", token: "t1" },
        { jurorId: "j-2", name: "Luis Gómez", category: "Junior", token: "t2" },
      ],
    });
    downloadJurorBadgesPdf.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("por defecto está en tabloide y descarga en tabloide", async () => {
    await renderPage();

    expect(screen.getByRole("combobox", { name: "Tamaño de hoja" }).textContent).toBe(
      "Tabloide (35 por hoja)",
    );
    expect(screen.getByText(/Imprime al 100 %/)).toBeTruthy();

    fireEvent.click(downloadButton());
    await waitFor(() =>
      expect(downloadJurorBadgesPdf).toHaveBeenCalledWith(undefined, "TABLOID"),
    );
  });

  it("al elegir carta, descarga en carta", async () => {
    await renderPage();

    const trigger = screen.getByRole("combobox", { name: "Tamaño de hoja" });
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.click(await screen.findByRole("option", { name: "Carta (15 por hoja)" }));

    expect(trigger.textContent).toBe("Carta (15 por hoja)");

    fireEvent.click(downloadButton());
    await waitFor(() =>
      expect(downloadJurorBadgesPdf).toHaveBeenCalledWith(undefined, "LETTER"),
    );
  });
});
