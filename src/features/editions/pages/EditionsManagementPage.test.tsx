import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ fetchEditions: vi.fn() }));
vi.mock("@/api/editions", () => mocks);
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/layouts/LayoutApplication", () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("@/features/editions/components/modals/CreateEditionModal", () => ({ CreateEditionModal: () => null }));
vi.mock("@/features/editions/components/EditionsTable", () => ({
  EditionsTable: ({ editions, onSelectEdition }: { editions: { id: number; title: string }[]; onSelectEdition: (id: number) => void }) => (
    <ul>
      {editions.map((e) => (
        <li key={e.id}>
          <button onClick={() => onSelectEdition(e.id)}>{e.title}</button>
        </li>
      ))}
    </ul>
  ),
}));
vi.mock("@/features/editions/components/EditionDetailView", () => ({
  EditionDetailView: ({ edition, onBack }: { edition: { title: string }; onBack: () => void }) => (
    <section>
      <h2>Detalle de {edition.title}</h2>
      <button onClick={onBack}>Volver</button>
    </section>
  ),
}));

import EditionsManagementPage from "./EditionsManagementPage";

let navigate: ReturnType<typeof useNavigate>;
function Location() {
  navigate = useNavigate();
  const { pathname, search } = useLocation();
  return <p data-testid="location">{pathname + search}</p>;
}

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/gestionar-ediciones" element={<><EditionsManagementPage /><Location /></>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  mocks.fetchEditions.mockReset().mockResolvedValue([
    { id: 3, title: "Feria 2025-2" },
    { id: 4, title: "Feria 2026-1" },
  ]);
});
afterEach(cleanup);

describe("EditionsManagementPage · URL del detalle (BG-66)", () => {
  it("abrir una edición cambia la URL y «Atrás» del navegador vuelve a la lista", async () => {
    renderAt("/gestionar-ediciones");
    fireEvent.click(await screen.findByRole("button", { name: "Feria 2026-1" }));

    expect(screen.getByRole("heading", { name: "Detalle de Feria 2026-1" })).toBeTruthy();
    expect(screen.getByTestId("location").textContent).toBe("/gestionar-ediciones?edicion=4");

    act(() => navigate(-1));
    expect(await screen.findByRole("button", { name: "Feria 2026-1" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: /Detalle/ })).toBeNull();
  });

  it("el enlace directo abre el detalle", async () => {
    renderAt("/gestionar-ediciones?edicion=3");
    expect(await screen.findByRole("heading", { name: "Detalle de Feria 2025-2" })).toBeTruthy();
  });

  it("una edición que no existe lo dice y deja volver a la lista", async () => {
    renderAt("/gestionar-ediciones?edicion=99");
    expect(await screen.findByText("No se encontró la edición.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Volver a la lista de ediciones" }));
    expect(screen.getByTestId("location").textContent).toBe("/gestionar-ediciones");
  });
});
