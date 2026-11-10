import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/pages/grupo 9/HomePage";
import type { AuthContextType } from "@/types/auth";

const auth: Partial<AuthContextType> = {};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => auth,
}));

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={["/inicio"]}>
      <Routes>
        <Route path="/inicio" element={<HomePage />} />
        <Route path="/check-in-jurados" element={<p>Registrar llegada</p>} />
        <Route path="/mi-registro" element={<p>Mi registro</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe("HomePage: inicio de los roles con un solo panel", () => {
  afterEach(cleanup);

  it("el presentador externo va directo a /mi-registro (HU-33)", () => {
    Object.assign(auth, { user: { firstName: "Ana" }, userRole: "Presentador externo" });
    renderHome();

    expect(screen.getByText("Mi registro")).toBeTruthy();
    expect(screen.queryByText(/Bienvenido a Arkad/)).toBeNull();
  });

  it("Staff sigue yendo al check-in de jurados", () => {
    Object.assign(auth, { user: { firstName: "Sam" }, userRole: "Staff" });
    renderHome();

    expect(screen.getByText("Registrar llegada")).toBeTruthy();
  });
});
