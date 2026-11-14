import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NrcsPage from "@/features/academic/pages/NrcsPage";

const apiCalls: string[] = [];
let nrcsResponse: unknown = null;

const json = (body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

const fakeFetch = vi.fn((input: RequestInfo | URL) => {
  const url = String(input);
  apiCalls.push(url);
  if (url.includes("/nrcs?")) return json(nrcsResponse);
  return json([]); // materias y profesores del formulario
});

vi.mock("@/hooks/useFetch", () => ({ useFetch: () => fakeFetch }));

vi.mock("@/api/editions", () => ({
  fetchEditions: () =>
    Promise.resolve([
      { id: 5, title: "Feria 5", status: "ACTIVE" },
      { id: 4, title: "Feria 4", status: "INACTIVE" },
    ]),
}));

// El sidebar real depende de la sesión: aquí solo importa la página
vi.mock("@/layouts/AppSidebar", () => ({
  AppSidebar: () => <nav>Menú lateral</nav>,
}));

const metadata = (totalItems: number) => ({
  totalItems,
  itemsOnCurrentPage: totalItems,
  currentPage: 1,
  itemsPerPage: 20,
  totalPages: totalItems ? 1 : 0,
});

const nrc = {
  id: 1,
  code: "2501",
  professorId: "p1",
  subjectId: 1,
  professor: { id: "p1", firstName: "Ana", lastName: "Prof", email: "ana@x.co", isActive: true },
  subject: { id: 1, name: "Algoritmos", code: "IST", isActive: true, semester: 1 },
  members: [],
  createdAt: "",
  updatedAt: "",
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <NrcsPage />
    </MemoryRouter>,
  );

describe("Página de NRC por edición (ARK-136)", () => {
  beforeEach(() => {
    apiCalls.length = 0;
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
  });

  it("por defecto pide la edición activa y permite agregar", async () => {
    nrcsResponse = {
      data: [nrc],
      metadata: metadata(1),
      edition: { id: 5, title: "Feria 5", status: "ACTIVE", readOnly: false },
    };
    renderPage();

    expect(await screen.findByText("Algoritmos")).toBeTruthy();
    expect(apiCalls.find((u) => u.includes("/nrcs?"))).not.toContain("editionId");
    expect(screen.getByRole("button", { name: /Agregar/ })).toBeTruthy();
    expect(screen.getByText(/carga aquí sus NRC y después abre las inscripciones/)).toBeTruthy();
  });

  it("al elegir una edición anterior la pide al back y queda en solo lectura", async () => {
    nrcsResponse = {
      data: [nrc],
      metadata: metadata(1),
      edition: { id: 5, title: "Feria 5", status: "ACTIVE", readOnly: false },
    };
    renderPage();
    await screen.findByText("Algoritmos");
    await screen.findByRole("option", { name: /Feria 4/ });

    nrcsResponse = {
      data: [nrc],
      metadata: metadata(1),
      edition: { id: 4, title: "Feria 4", status: "INACTIVE", readOnly: true },
    };
    fireEvent.change(screen.getByLabelText("Edición"), { target: { value: "4" } });

    expect(await screen.findByText("Edición de solo lectura")).toBeTruthy();
    expect(apiCalls.some((u) => u.includes("/nrcs?") && u.includes("editionId=4"))).toBe(true);
    await waitFor(() => expect(screen.queryByRole("button", { name: /Agregar/ })).toBeNull());
    expect(screen.queryByText("Abrir menú")).toBeNull();
  });

  it("avisa cuando la edición activa todavía no tiene NRC", async () => {
    nrcsResponse = {
      data: [],
      metadata: metadata(0),
      edition: { id: 5, title: "Feria 5", status: "ACTIVE", readOnly: false },
    };
    renderPage();

    expect(await screen.findByText("Feria 5 todavía no tiene NRC")).toBeTruthy();
    expect(screen.getByText(/cárgalos antes de abrir las inscripciones/)).toBeTruthy();
  });
});
