import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppSidebar } from "@/layouts/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { AuthContextType, Role } from "@/types/auth";

const auth: Partial<AuthContextType> = {};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => auth,
}));

// La insignia de edición del administrador pide las ediciones
vi.mock("@/api/editions", () => ({
  fetchEditions: () => Promise.resolve([]),
}));

const fetchMemberTeam = vi.fn();
vi.mock("@/lib/ownTeam", () => ({
  fetchMemberTeam: (...args: unknown[]) => fetchMemberTeam(...args),
}));

const renderAs = (role: Role) => {
  Object.assign(auth, {
    userRole: role,
    user: { firstName: "Ana", lastName: "Pérez", email: "ana@empresa.com", role: { name: role } },
    logout: vi.fn(),
  });
  return render(
    <MemoryRouter>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </MemoryRouter>,
  );
};

const menuLinks = () =>
  screen
    .getAllByRole("link")
    .map((a) => a.getAttribute("href"))
    .filter((href) => href !== "/");

describe("Menú lateral: presentadores externos (HU-33)", () => {
  beforeEach(() => {
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

  it("el presentador externo solo ve «Mi registro»", () => {
    renderAs("Presentador externo");

    expect(screen.getByText("Mi registro")).toBeTruthy();
    expect(menuLinks()).toEqual(["/mi-registro"]);
  });

  it("el administrador tiene «Presentadores externos» en Personal", () => {
    renderAs("Administrador");

    const link = screen.getByRole("link", { name: /Presentadores externos/ });
    expect(link.getAttribute("href")).toBe("/presentadores-externos");
  });

  it("otros roles no ven la pantalla del administrador", () => {
    renderAs("Staff");

    expect(screen.queryByText("Presentadores externos")).toBeNull();
    expect(screen.queryByText("Mi registro")).toBeNull();
  });
});

describe("Menú lateral del profesor sin seguimiento ni «Mis empates» (ARK-297)", () => {
  beforeEach(() => {
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

  it("el profesor no ve «Seguimiento → Avance por hora» ni «Empates del ranking»", () => {
    renderAs("Profesor");

    expect(screen.queryByText("Seguimiento")).toBeNull();
    expect(screen.queryByText("Avance por hora")).toBeNull();
    expect(screen.queryByText("Empates del ranking")).toBeNull();
    expect(menuLinks()).not.toContain("/realtime-tracking-panel");
    expect(menuLinks()).not.toContain("/ranking/mis-empates");
    expect(menuLinks()).toEqual(["/home-profesor", "/colegios-calificar", "/colegios-evaluados", "/criterios", "/notificaciones"]);
  });

  it("el administrador sigue viendo el Panel de Seguimiento", () => {
    renderAs("Administrador");

    expect(screen.getByRole("link", { name: /Panel de Seguimiento/ }).getAttribute("href")).toBe("/realtime-tracking-panel");
  });
});

describe("Menú lateral: rúbricas en solo lectura (HU-53)", () => {
  beforeEach(() => {
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

  it.each<Role>(["Jurado", "Profesor"])("el rol %s tiene «Rúbricas» hacia /criterios", (role) => {
    renderAs(role);

    expect(screen.getByRole("link", { name: /Rúbricas/ }).getAttribute("href")).toBe("/criterios");
  });

  it("el jurado ve «Rúbricas» junto a sus proyectos", () => {
    renderAs("Jurado");

    expect(menuLinks()).toEqual(["/pendientes-calificar", "/calificados", "/criterios", "/instalar-app", "/notificaciones"]);
  });

  it.each<Role>(["Estudiante", "Staff", "Consultor", "Presentador externo"])("el rol %s no la ve", (role) => {
    renderAs(role);

    expect(screen.queryByText("Rúbricas")).toBeNull();
    expect(menuLinks()).not.toContain("/criterios");
  });

  it("el administrador conserva «Criterios de Calificación»", () => {
    renderAs("Administrador");

    expect(screen.getByRole("link", { name: /Criterios de Calificación/ }).getAttribute("href")).toBe("/criterios");
    expect(screen.queryByText("Rúbricas")).toBeNull();
  });
});

describe("Menú lateral: «Editar equipo» solo para el líder", () => {
  beforeEach(() => {
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
    fetchMemberTeam.mockReset();
  });

  const renderStudent = () => {
    Object.assign(auth, {
      userRole: "Estudiante",
      user: { id: "u-1", firstName: "Ana", lastName: "Pérez", email: "ana@uninorte.edu.co", role: { name: "Estudiante" } },
      logout: vi.fn(),
    });
    return render(
      <MemoryRouter>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </MemoryRouter>,
    );
  };

  it("el integrante que no es líder no ve «Editar equipo»", async () => {
    fetchMemberTeam.mockResolvedValue({ id: 3, teamName: "Cripta 8 Bits", isMine: false, isMember: true });
    renderStudent();

    await waitFor(() => expect(screen.queryByText("Editar equipo")).toBeNull());
    expect(menuLinks()).toEqual(["/inicio", "/mi-equipo", "/mis-jurados"]);
  });

  it("el líder sigue viendo «Editar equipo»", async () => {
    fetchMemberTeam.mockResolvedValue({ id: 3, teamName: "Cripta 8 Bits", isMine: true, isMember: true });
    renderStudent();

    await waitFor(() => expect(fetchMemberTeam).toHaveBeenCalledWith("u-1"));
    expect(screen.getByText("Editar equipo")).toBeTruthy();
  });

  it("el estudiante sin equipo sigue viendo «Editar equipo» (ahí se le ofrece inscribirse)", async () => {
    fetchMemberTeam.mockRejectedValue(new Error("sin equipo"));
    renderStudent();

    await waitFor(() => expect(fetchMemberTeam).toHaveBeenCalled());
    expect(screen.getByText("Editar equipo")).toBeTruthy();
  });
});
