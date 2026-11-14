import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MyRegistrationPage from "@/features/external-presenters/pages/MyRegistrationPage";
import { ExternalPresenterError, type MyExternalPresenter } from "@/features/external-presenters/api/externalPresenters";

const fetchMyExternalPresenter = vi.fn();

vi.mock("@/features/external-presenters/api/externalPresenters", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/external-presenters/api/externalPresenters")>()),
  fetchMyExternalPresenter: (...args: unknown[]) => fetchMyExternalPresenter(...args),
}));

vi.mock("@/layouts/AppSidebar", () => ({
  AppSidebar: () => <nav>Menú lateral</nav>,
}));

const REGISTRATION: MyExternalPresenter = {
  id: 9,
  userId: "u-9",
  email: "ana@empresa.com",
  firstName: "Ana",
  lastName: "Pérez",
  organization: "Estudio Indie Caribe",
  presentationTitle: "Diseño de niveles para juegos educativos",
  editionId: 3,
  lastSignInAt: "2026-11-08T09:00:00.000Z",
  certificateSentAt: null,
  createdAt: "2026-11-08T07:47:16.279Z",
  edition: { id: 3, title: "Feria Gamer 2025 - S2" },
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <MyRegistrationPage />
    </MemoryRouter>,
  );

describe("Panel del presentador externo «Mi registro» (HU-33)", () => {
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
    vi.clearAllMocks();
  });

  it("muestra sus datos y que recibirá el certificado por correo", async () => {
    fetchMyExternalPresenter.mockResolvedValue(REGISTRATION);
    renderPage();

    expect(await screen.findByText("Ana Pérez")).toBeTruthy();
    expect(screen.getByText("Presentador externo · Feria Gamer 2025 - S2")).toBeTruthy();
    expect(screen.getByText("Estudio Indie Caribe")).toBeTruthy();
    expect(screen.getByText("Diseño de niveles para juegos educativos")).toBeTruthy();
    expect(screen.getByText(/Recibirás tu certificado por correo/)).toBeTruthy();
  });

  it("si ya se envió, dice cuándo", async () => {
    fetchMyExternalPresenter.mockResolvedValue({
      ...REGISTRATION,
      certificateSentAt: "2026-11-08T15:30:00.000Z",
    });
    renderPage();

    expect(
      await screen.findByText(/Te enviamos el certificado al correo el 8 de noviembre de 2026/),
    ).toBeTruthy();
    expect(screen.queryByText(/Recibirás tu certificado/)).toBeNull();
  });

  it("sin organización ni título lo indica", async () => {
    fetchMyExternalPresenter.mockResolvedValue({
      ...REGISTRATION,
      organization: null,
      presentationTitle: null,
    });
    renderPage();

    expect(await screen.findByText("Sin organización")).toBeTruthy();
    expect(screen.getByText("Sin título registrado")).toBeTruthy();
  });

  it("con 404 (sin registro activo) muestra un aviso, no un error", async () => {
    fetchMyExternalPresenter.mockRejectedValue(
      new ExternalPresenterError("No encontrado", 404, "EXTERNAL_PRESENTER_NOT_FOUND"),
    );
    renderPage();

    expect(await screen.findByText("No tienes un registro activo")).toBeTruthy();
  });

  it("con otro error deja reintentar", async () => {
    fetchMyExternalPresenter
      .mockRejectedValueOnce(new ExternalPresenterError("No se pudo cargar tu registro.", 500))
      .mockResolvedValueOnce(REGISTRATION);
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Ana Pérez")).toBeTruthy();
    expect(fetchMyExternalPresenter).toHaveBeenCalledTimes(2);
  });
});
