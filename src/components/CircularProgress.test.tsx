import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CircularProgress from "@/components/CircularProgress";
import type { AuthContextType } from "@/types/auth";

const auth: Partial<AuthContextType> = {};
const apiFetch = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => auth,
}));

vi.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

describe("CircularProgress: calificaciones recibidas (BG-04)", () => {
  afterEach(() => {
    cleanup();
    apiFetch.mockReset();
  });

  it.each(["Administrador", "Jurado", "Profesor"])(
    "no consulta el equipo para el rol %s",
    (role) => {
      Object.assign(auth, { user: { id: 1, role: { name: role } }, userRole: role });
      const { container } = render(<CircularProgress labelFormatter={undefined} />);

      expect(apiFetch).not.toHaveBeenCalled();
      expect(container.innerHTML).toBe("");
    },
  );

  it("captura los fallos de la consulta del estudiante", async () => {
    Object.assign(auth, {
      user: { id: 1, role: { name: "Estudiante" } },
      userRole: "Estudiante",
    });
    apiFetch.mockRejectedValue(new Error("Hubo un error al obtener los datos"));

    render(<CircularProgress labelFormatter={undefined} />);

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1));
  });
});
