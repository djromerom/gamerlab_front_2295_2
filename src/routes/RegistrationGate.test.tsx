import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import RegistrationGate from "@/routes/RegistrationGate";

vi.mock("@/pages/teams/TeamRegisterPage", () => ({
  default: () => <p>Formulario de registro</p>,
}));

const API = import.meta.env.VITE_ENDPOINT_BACKEND;

const stub = (res: () => Promise<Response>) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === `${API}/settings/registrations`) return res();
      return new Response("{}", { status: 404 });
    }),
  );

const renderGate = () =>
  render(
    <MemoryRouter>
      <RegistrationGate />
    </MemoryRouter>,
  );

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("RegistrationGate", () => {
  it("abierto: muestra el formulario", async () => {
    stub(async () => new Response(JSON.stringify({ registrationsOpen: true }), { status: 200 }));
    renderGate();
    expect(await screen.findByText("Formulario de registro")).toBeTruthy();
  });

  it("cerrado: muestra Inscripciones cerradas", async () => {
    stub(async () => new Response(JSON.stringify({ registrationsOpen: false }), { status: 200 }));
    renderGate();
    expect(await screen.findByText("Inscripciones cerradas")).toBeTruthy();
  });

  it("si el GET falla: cerrado", async () => {
    stub(async () => {
      throw new Error("red");
    });
    renderGate();
    expect(await screen.findByText("Inscripciones cerradas")).toBeTruthy();
  });

  it("mientras carga no muestra ninguno", () => {
    stub(() => new Promise(() => {}));
    renderGate();
    expect(screen.queryByText("Inscripciones cerradas")).toBeNull();
    expect(screen.queryByText("Formulario de registro")).toBeNull();
  });
});
