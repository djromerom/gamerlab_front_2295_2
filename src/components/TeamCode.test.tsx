import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TeamCode from "@/components/TeamCode";
import type { AuthContextType } from "@/types/auth";

const auth: Partial<AuthContextType> = {};
const apiFetch = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => auth,
}));
vi.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));
vi.mock("@/features/teams/components/NotEnrolledNotice", () => ({
  default: () => <p>Aún no estás inscrito en la edición actual.</p>,
}));

const teamsResponse = (teams: unknown[]) =>
  ({ ok: true, json: vi.fn().mockResolvedValue(teams) }) as unknown as Response;

const byteInvaders = {
  id: 6,
  teamName: "ByteInvaders",
  teamCode: "BYTE-06",
  status: "PENDIENTE",
};

const MEMBER_NOTICE = "Estás inscrito como integrante de este equipo. Solo el líder puede hacer cambios.";

describe("TeamCode: tarjeta Equipo del inicio", () => {
  afterEach(() => {
    cleanup();
    apiFetch.mockReset();
  });

  const asStudent = () =>
    Object.assign(auth, { user: { id: "u-1", firstName: "Matías" }, userRole: "Estudiante" });

  it("el integrante que no es líder ve su equipo y el aviso de solo lectura, no «Inscribir equipo»", async () => {
    asStudent();
    apiFetch.mockResolvedValue(
      teamsResponse([
        { id: 1, teamName: "Otro", teamCode: "OTRO-01", isMine: false, isMember: false },
        { ...byteInvaders, isMine: false, isMember: true },
      ]),
    );

    render(<TeamCode variant="title" />);

    expect(await screen.findByText("ByteInvaders")).toBeTruthy();
    expect(screen.getByText("BYTE-06")).toBeTruthy();
    expect(screen.getByText(MEMBER_NOTICE)).toBeTruthy();
    expect(screen.queryByText("Aún no estás inscrito en la edición actual.")).toBeNull();
  });

  it("el líder ve su equipo sin el aviso de integrante", async () => {
    asStudent();
    apiFetch.mockResolvedValue(teamsResponse([{ ...byteInvaders, isMine: true, isMember: true }]));

    render(<TeamCode variant="title" />);

    expect(await screen.findByText("BYTE-06")).toBeTruthy();
    expect(screen.queryByText(MEMBER_NOTICE)).toBeNull();
  });

  it("el estudiante sin equipo sigue viendo el aviso de no inscrito", async () => {
    asStudent();
    apiFetch.mockResolvedValue(teamsResponse([{ ...byteInvaders, isMine: false, isMember: false }]));

    render(<TeamCode variant="title" />);

    expect(await screen.findByText("Aún no estás inscrito en la edición actual.")).toBeTruthy();
  });

  it("variante compacta: el integrante ve el aviso junto al código", async () => {
    asStudent();
    apiFetch.mockResolvedValue(teamsResponse([{ ...byteInvaders, isMine: false, isMember: true }]));

    render(<TeamCode />);

    expect(await screen.findByText("BYTE-06")).toBeTruthy();
    expect(screen.getByText(MEMBER_NOTICE)).toBeTruthy();
  });
});
