import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CircularProgress from "@/components/CircularProgress";
import type { AuthContextType } from "@/types/auth";

const auth: Partial<AuthContextType> = {};
const apiFetch = vi.fn();
const fetchMemberTeam = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => auth,
}));

vi.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));
vi.mock("@/lib/ownTeam", () => ({
  fetchMemberTeam: (...args: unknown[]) => fetchMemberTeam(...args),
}));

describe("CircularProgress: calificaciones recibidas (BG-04)", () => {
  afterEach(() => {
    cleanup();
    apiFetch.mockReset();
    fetchMemberTeam.mockReset();
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

  // ARK-111: evaluation-stats solo devuelve conteos; el componente no usa datos de los jurados
  it("muestra las calificaciones recibidas del equipo del estudiante", async () => {
    Object.assign(auth, {
      user: { id: 1, role: { name: "Estudiante" } },
      userRole: "Estudiante",
    });
    fetchMemberTeam.mockResolvedValue({ id: 100 });
    apiFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 100 }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totalJurorsAssigned: 4, jurorsWhoEvaluated: 1 }),
      });

    const { findByText, getByText } = render(<CircularProgress labelFormatter={undefined} />);

    expect(await findByText("1/4")).toBeTruthy();
    expect(getByText("25%")).toBeTruthy();
    expect(apiFetch).toHaveBeenLastCalledWith(
      "http://api.test/juror/teams/100/evaluation-stats",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("no se rompe si evaluation-stats responde sin permiso (ARK-111)", async () => {
    Object.assign(auth, {
      user: { id: 1, role: { name: "Estudiante" } },
      userRole: "Estudiante",
    });
    fetchMemberTeam.mockResolvedValue({ id: 100 });
    apiFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 100 }) })
      .mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({}) });

    const { getByText } = render(<CircularProgress labelFormatter={undefined} />);

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
    expect(getByText("0/0")).toBeTruthy();
    expect(getByText("0%")).toBeTruthy();
  });

  it("captura los fallos de la consulta del estudiante", async () => {
    Object.assign(auth, {
      user: { id: 1, role: { name: "Estudiante" } },
      userRole: "Estudiante",
    });
    fetchMemberTeam.mockRejectedValue(new Error("Hubo un error al obtener los datos"));

    render(<CircularProgress labelFormatter={undefined} />);

    await waitFor(() => expect(fetchMemberTeam).toHaveBeenCalledTimes(1));
  });
});
