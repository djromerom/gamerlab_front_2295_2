import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Role } from "@/types/auth";
import CriteriaPage from "@/features/academic/pages/CriteriaPage";
import { RUBRICS_EMPTY_MESSAGE, RUBRICS_ERROR_MESSAGE } from "@/features/academic/lib/rubrics";

const auth: { userRole: Role | null } = { userRole: null };
const fetchMock = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("@/hooks/useFetch", () => ({ useFetch: () => fetchMock }));
vi.mock("@/lib/api", () => ({ apiFetch: (...args: unknown[]) => fetchMock(...args) }));
vi.mock("@/layouts/LayoutApplication", () => ({
  default: ({ children, breadcrumbs }: { children: React.ReactNode; breadcrumbs: { label: string }[] }) => (
    <div>
      <nav>{breadcrumbs.map((b) => b.label).join(" / ")}</nav>
      {children}
    </div>
  ),
}));
vi.mock("@/features/academic/components/CriterionTable", () => ({
  CriterionTable: () => <p>Tabla del administrador</p>,
}));

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const criteria = (data: unknown[]) =>
  json(200, {
    data,
    metadata: { totalItems: data.length, itemsOnCurrentPage: data.length, currentPage: 1, itemsPerPage: 100, totalPages: 1, totalWeight: 1 },
  });

const ACTIVE = [
  { id: 2, name: "Jugabilidad", description: "Qué tan divertido es", weight: 0.6, isActive: true },
  { id: 1, name: "Arte", description: null, weight: 0.4, isActive: true },
  { id: 3, name: "Viejo", description: "Inactivo", weight: 0.1, isActive: false },
];

const renderAs = (role: Role) => {
  auth.userRole = role;
  return render(<CriteriaPage />);
};

describe("Rúbricas en solo lectura (HU-53)", () => {
  afterEach(() => {
    cleanup();
    fetchMock.mockReset();
  });

  it.each<Role>(["Jurado", "Profesor"])("el rol %s ve nombre, descripción y peso de los criterios activos", async (role) => {
    fetchMock.mockResolvedValueOnce(criteria(ACTIVE));
    renderAs(role);

    await screen.findByText("Jugabilidad");
    expect(screen.getByRole("heading", { name: "Criterios de Evaluación" })).toBeTruthy();
    expect(screen.getAllByRole("columnheader").map((th) => th.textContent)).toEqual(["Nombre", "Descripción", "Peso"]);
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows.map((tr) => [...tr.querySelectorAll("td")].map((td) => td.textContent))).toEqual([
      ["Jugabilidad", "Qué tan divertido es", "0.6"],
      ["Arte", "-", "0.4"],
    ]);
    expect(screen.queryByText("Viejo")).toBeNull();
    expect(screen.getByText("Rúbricas", { selector: "nav" })).toBeTruthy();
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/criteria\?page=1&limit=100$/);
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("includeInactive");
  });

  it("no muestra acciones de escritura ni la advertencia de pesos", async () => {
    fetchMock.mockResolvedValueOnce(criteria(ACTIVE));
    renderAs("Jurado");
    await screen.findByText("Arte");

    for (const action of [/Agregar/, /Editar/, /Eliminar/, /Restaurar/, /Abrir menú/]) {
      expect(screen.queryByRole("button", { name: action })).toBeNull();
    }
    expect(screen.queryByText(/Advertencia/)).toBeNull();
    expect(screen.queryByText("Tabla del administrador")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sin criterios muestra «Aún no hay rúbricas publicadas»", async () => {
    fetchMock.mockResolvedValueOnce(criteria([]));
    renderAs("Profesor");

    expect(await screen.findByText(RUBRICS_EMPTY_MESSAGE)).toBeTruthy();
  });

  it("si falla la carga muestra el error y «Reintentar» vuelve a pedirlos", async () => {
    fetchMock.mockResolvedValueOnce(json(500, { message: "boom" })).mockResolvedValueOnce(criteria(ACTIVE));
    renderAs("Jurado");

    expect(await screen.findByText(RUBRICS_ERROR_MESSAGE)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Jugabilidad")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("el administrador sigue viendo su tabla de siempre", async () => {
    fetchMock.mockResolvedValueOnce(criteria(ACTIVE));
    renderAs("Administrador");

    expect(await screen.findByText("Tabla del administrador")).toBeTruthy();
    expect(screen.getByText("Criterios", { selector: "nav" })).toBeTruthy();
  });
});
