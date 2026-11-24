import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import EditBoard from "@/features/teams/components/EditBoard";
import { NotEnrolledError } from "@/lib/notEnrolled";

const fetchOwnTeam = vi.fn();
const fetchMemberTeam = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u-1" }, userRole: "Estudiante" }),
}));
vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));
vi.mock("@/lib/ownTeam", () => ({
  fetchOwnTeam: (...args: unknown[]) => fetchOwnTeam(...args),
  fetchMemberTeam: (...args: unknown[]) => fetchMemberTeam(...args),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
// El formulario del videojuego consulta si las inscripciones están abiertas al montarse. Sin este
// mock hace una petición real que puede terminar después de cerrar el entorno de pruebas
// (en CI: «ReferenceError: window is not defined», rechazo sin manejar).
vi.mock("@/api/registrations", () => ({ fetchRegistrationsOpen: vi.fn().mockResolvedValue(true) }));

const renderBoard = () =>
  render(
    <MemoryRouter>
      <EditBoard />
    </MemoryRouter>,
  );

describe("EditBoard: estudiante que no es líder", () => {
  afterEach(() => {
    cleanup();
    fetchOwnTeam.mockReset();
    fetchMemberTeam.mockReset();
  });

  it("el integrante ve que solo el líder edita, sin «Inscribir equipo»", async () => {
    fetchOwnTeam.mockRejectedValue(new NotEnrolledError());
    fetchMemberTeam.mockResolvedValue({ id: 3, teamName: "Cripta 8 Bits" });

    renderBoard();

    expect(await screen.findByText("Solo el líder puede editar el equipo")).toBeTruthy();
    expect(screen.getByText(/Estás inscrito como integrante de Cripta 8 Bits/)).toBeTruthy();
    expect(screen.queryByText("Inscribir equipo")).toBeNull();
  });

  it("quien no pertenece a ningún equipo sigue viendo «Inscribir equipo»", async () => {
    fetchOwnTeam.mockRejectedValue(new NotEnrolledError());
    fetchMemberTeam.mockRejectedValue(new NotEnrolledError());

    renderBoard();

    expect(await screen.findByText("Inscribir equipo")).toBeTruthy();
    expect(screen.queryByText("Solo el líder puede editar el equipo")).toBeNull();
  });
});
