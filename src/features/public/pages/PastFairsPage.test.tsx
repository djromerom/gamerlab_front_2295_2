import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PastFairsPage from "./PastFairsPage";

const mocks = vi.hoisted(() => ({
  fetchEditions: vi.fn(),
  fetchTestimonials: vi.fn(),
  fetchEducationalFocuses: vi.fn(),
  fetchHighlightedGames: vi.fn(),
}));

vi.mock("@/api/editions", () => mocks);
vi.mock("@/components/NavBar", () => ({ default: () => <nav>Menú</nav> }));
vi.mock("@/components/background/ArkadBackground", () => ({ ArkadBackground: () => null }));

const edition = (id: number, year: number, semester: number, startsAt: string, endsAt: string) => ({
  id, year, semester, startsAt, endsAt, title: `Feria Gamer ${year}-${semester}`, status: "INACTIVE", photos: [],
});

// La de prueba va primero, como la devolvía el back en Arkad-test
const prueba2099 = edition(9, 2099, 10, "2099-05-20T13:00:00.000Z", "2099-05-20T22:00:00.000Z");
const feria2025S2 = edition(4, 2025, 30, "2025-11-27T13:30:00.000Z", "2025-11-27T17:30:00.000Z");
const feria2025S1 = edition(2, 2025, 10, "2025-05-15T13:00:00.000Z", "2025-05-15T22:00:00.000Z");

const renderPage = () => render(<MemoryRouter><PastFairsPage /></MemoryRouter>);

// El año y el semestre van en elementos distintos: se compara el texto del primer h2
const expectEditionHeading = (text: string) => waitFor(() =>
  expect(screen.getAllByRole("heading", { level: 2 })[0].textContent).toBe(text));

describe("Ediciones pasadas: edición por defecto (ARK-248)", () => {
  beforeEach(() => {
    mocks.fetchEditions.mockReset().mockResolvedValue([prueba2099, feria2025S1, feria2025S2]);
    mocks.fetchTestimonials.mockReset().mockResolvedValue([]);
    mocks.fetchEducationalFocuses.mockReset().mockResolvedValue([]);
    mocks.fetchHighlightedGames.mockReset().mockResolvedValue([]);
  });

  afterEach(() => cleanup());

  it("abre la última edición terminada y no la de prueba con fecha futura", async () => {
    renderPage();

    await expectEditionHeading("Edición 2025 - 2");
    // Los datos de la edición se piden en un efecto que corre después de pintar el título: en un
    // computador lento (el runner de GitHub) la aserción llegaba antes y la prueba fallaba al azar.
    await waitFor(() => expect(mocks.fetchTestimonials).toHaveBeenCalledWith(4));
    expect(mocks.fetchTestimonials).not.toHaveBeenCalledWith(9);
  });

  it("la edición futura sigue en la lista para elegirla a mano", async () => {
    renderPage();
    await expectEditionHeading("Edición 2025 - 2");

    fireEvent.click(screen.getByRole("button", { name: /Cambiar Edición/ }));
    fireEvent.click(screen.getByRole("button", { name: /2099 - 1 \(Primer semestre\)/ }));

    await expectEditionHeading("Edición 2099 - 1");
  });

  it("si ninguna edición terminó, lo dice en vez de abrir una futura", async () => {
    mocks.fetchEditions.mockResolvedValue([prueba2099]);
    renderPage();

    expect(await screen.findByText(/Todavía no hay ediciones terminadas/)).toBeTruthy();
    await expectEditionHeading("Ediciones pasadas");
    expect(mocks.fetchTestimonials).not.toHaveBeenCalled();
  });
});

describe("Ediciones pasadas: formato del semestre (BG-66, ARK-266)", () => {
  beforeEach(() => {
    mocks.fetchTestimonials.mockReset().mockResolvedValue([]);
    mocks.fetchEducationalFocuses.mockReset().mockResolvedValue([]);
    mocks.fetchHighlightedGames.mockReset().mockResolvedValue([]);
  });

  afterEach(() => cleanup());

  it("el intersemestral se titula igual que los demás y no como «2024-20»", async () => {
    mocks.fetchEditions.mockReset().mockResolvedValue([
      edition(7, 2024, 20, "2024-07-10T13:00:00.000Z", "2024-07-10T22:00:00.000Z"),
    ]);
    renderPage();

    await expectEditionHeading("Edición 2024 - Intersemestral");
  });

  it("dice «videojuegos» (sin la errata «videouegos»)", async () => {
    mocks.fetchEditions.mockReset().mockResolvedValue([feria2025S2]);
    renderPage();

    expect(await screen.findByText(/muestras de videojuegos/)).toBeTruthy();
    expect(screen.queryByText(/videouegos/)).toBeNull();
  });
});
