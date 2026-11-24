import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import MyJurorsPage from "@/features/teams/pages/MyJurorsPage";

const apiFetch = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u-1", email: "matias@uninorte.edu.co" }, userRole: "Estudiante" }),
}));
vi.mock("@/lib/api", () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }));
vi.mock("@/layouts/LayoutApplication", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const ok = (body: unknown) =>
  ({ ok: true, json: vi.fn().mockResolvedValue(body) }) as unknown as Response;

const jurado = {
  id: "j1",
  nombre: "Ana Jurado",
  correo: "ana@uninorte.edu.co",
  estado: "CONFIRMADO",
  videojuegosAsignados: ["Cripta"],
  videojuegosCompletos: [],
};

describe("MyJurorsPage: estudiante que no es líder", () => {
  afterEach(() => {
    cleanup();
    apiFetch.mockReset();
  });

  it("el integrante ve los jurados de su equipo (isMember sin isMine)", async () => {
    apiFetch.mockImplementation((url: string) =>
      Promise.resolve(
        url.endsWith("/teams")
          ? ok([
              { id: 1, gameName: "Otro", isMine: false, isMember: false },
              { id: 3, gameName: "Cripta", videogameName: "Cripta", isMine: false, isMember: true },
            ])
          : ok([jurado]),
      ),
    );

    render(<MyJurorsPage />);

    expect(await screen.findByText("Ana Jurado")).toBeTruthy();
    expect(screen.queryByText("Aún no tienes jurados asignados a tu equipo.")).toBeNull();
  });

  it("sin equipo no consulta los jurados", async () => {
    apiFetch.mockResolvedValue(ok([{ id: 1, videogameName: "Otro", isMine: false, isMember: false }]));

    render(<MyJurorsPage />);

    expect(await screen.findByText("Aún no tienes jurados asignados a tu equipo.")).toBeTruthy();
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });
});
