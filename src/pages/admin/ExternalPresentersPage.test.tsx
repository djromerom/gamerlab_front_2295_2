import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ExternalPresentersPage from "@/pages/admin/ExternalPresentersPage";
import type { ExternalPresenter, ExternalPresentersList } from "@/fetchs/externalPresenters";

const fetchExternalPresenters = vi.fn();
const removeExternalPresenter = vi.fn();
const sendExternalPresenterCertificate = vi.fn();
const sendAllExternalPresenterCertificates = vi.fn();
const downloadExternalPresentersExport = vi.fn();

vi.mock("@/fetchs/externalPresenters", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/fetchs/externalPresenters")>()),
  fetchExternalPresenters: (...args: unknown[]) => fetchExternalPresenters(...args),
  removeExternalPresenter: (...args: unknown[]) => removeExternalPresenter(...args),
  sendExternalPresenterCertificate: (...args: unknown[]) => sendExternalPresenterCertificate(...args),
  sendAllExternalPresenterCertificates: (...args: unknown[]) =>
    sendAllExternalPresenterCertificates(...args),
  downloadExternalPresentersExport: (...args: unknown[]) => downloadExternalPresentersExport(...args),
}));

vi.mock("@/fetchs/editions", () => ({
  fetchEditions: () =>
    Promise.resolve([
      { id: 3, title: "Feria Gamer 2025 - S2", status: "ACTIVE" },
      { id: 2, title: "Feria Gamer 2025 - S1", status: "ARCHIVED" },
    ]),
}));

// El sidebar real depende de la sesión: aquí solo importa la página
vi.mock("@/components/grupo 9/app-sidebar", () => ({
  AppSidebar: () => <nav>Menú lateral</nav>,
}));

const presenter = (id: number, firstName: string, extra: Partial<ExternalPresenter> = {}): ExternalPresenter => ({
  id,
  userId: `u-${id}`,
  email: `${firstName.toLowerCase()}@empresa.com`,
  firstName,
  lastName: "Pérez",
  organization: "Estudio Indie Caribe",
  presentationTitle: "Diseño de niveles",
  editionId: 3,
  lastSignInAt: null,
  certificateSentAt: null,
  createdAt: "2026-11-08T07:47:16.279Z",
  ...extra,
});

const ANA = presenter(9, "Ana");
const LUIS = presenter(10, "Luis", {
  lastSignInAt: "2026-11-08T10:00:00.000Z",
  certificateSentAt: "2026-11-08T15:30:00.000Z",
  organization: null,
});

const listOf = (presenters: ExternalPresenter[], readOnly = false): ExternalPresentersList => ({
  edition: { id: 3, title: "Feria Gamer 2025 - S2", status: readOnly ? "ARCHIVED" : "ACTIVE", readOnly },
  presenters,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <ExternalPresentersPage />
    </MemoryRouter>,
  );

describe("Página «Presentadores externos» (HU-33)", () => {
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
    vi.clearAllMocks();
  });

  it("lista a los presentadores con su cuenta y su certificado", async () => {
    fetchExternalPresenters.mockResolvedValue(listOf([ANA, LUIS]));
    renderPage();

    const anaRow = (await screen.findByText("Ana Pérez")).closest("tr")!;
    expect(within(anaRow).getByText("Pendiente de activar")).toBeTruthy();
    expect(within(anaRow).getByText("Sin enviar")).toBeTruthy();

    const luisRow = screen.getByText("Luis Pérez").closest("tr")!;
    expect(within(luisRow).getByText("Activa")).toBeTruthy();
    expect(within(luisRow).getByText(/Enviado el 8 de noviembre de 2026/)).toBeTruthy();
    expect(within(luisRow).getByText("—")).toBeTruthy(); // sin organización

    expect(fetchExternalPresenters).toHaveBeenCalledWith(undefined);
  });

  it("filtra «Sin activar» y «Sin certificado»", async () => {
    fetchExternalPresenters.mockResolvedValue(listOf([ANA, LUIS]));
    renderPage();
    await screen.findByText("Ana Pérez");

    expect(screen.getByRole("tab", { name: /Todos \(2\)/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: /Sin activar \(1\)/ }));
    expect(screen.getByText("Ana Pérez")).toBeTruthy();
    expect(screen.queryByText("Luis Pérez")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: /Sin certificado \(1\)/ }));
    expect(screen.queryByText("Luis Pérez")).toBeNull();
  });

  it("envía el certificado de uno con indicador de carga y actualiza la fila", async () => {
    fetchExternalPresenters.mockResolvedValue(listOf([ANA]));
    let finish!: (value: unknown) => void;
    sendExternalPresenterCertificate.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Enviar certificado a Ana Pérez" }));
    expect(await screen.findByText("Enviando...")).toBeTruthy();
    expect(sendExternalPresenterCertificate).toHaveBeenCalledWith(9);

    finish({ id: 9, email: ANA.email, certificateSentAt: "2026-11-08T15:30:00.000Z" });
    expect(await screen.findByText(/Enviado el 8 de noviembre de 2026/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reenviar certificado a Ana Pérez" })).toBeTruthy();
  });

  it("quita a un presentador después de confirmar", async () => {
    fetchExternalPresenters.mockResolvedValue(listOf([ANA, LUIS]));
    removeExternalPresenter.mockResolvedValue(undefined);
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Quitar a Ana Pérez" }));
    expect(screen.getByText("¿Quitar a Ana Pérez?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Quitar" }));

    await waitFor(() => expect(screen.queryByText("Ana Pérez")).toBeNull());
    expect(removeExternalPresenter).toHaveBeenCalledWith(9);
    expect(screen.getByText("Luis Pérez")).toBeTruthy();
  });

  it("«Enviar certificado a todos» pide confirmación y muestra los que fallaron", async () => {
    fetchExternalPresenters.mockResolvedValue(listOf([ANA, LUIS]));
    sendAllExternalPresenterCertificates.mockResolvedValue({
      sent: 1,
      failed: [{ id: 9, email: ANA.email, error: "Gotenberg no respondió" }],
      message: "Certificados enviados: 1 de 2.",
    });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Enviar certificado a todos/ }));
    expect(screen.getByText(/Se enviará por correo a 2 presentadores/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Enviar a todos" }));

    expect(await screen.findByText("ana@empresa.com: Gotenberg no respondió")).toBeTruthy();
    expect(sendAllExternalPresenterCertificates).toHaveBeenCalledTimes(1);
    // vuelve a pedir la lista para traer las fechas de envío
    await waitFor(() => expect(fetchExternalPresenters).toHaveBeenCalledTimes(2));
  });

  it("exporta a Excel la edición elegida", async () => {
    fetchExternalPresenters.mockResolvedValue(listOf([ANA]));
    downloadExternalPresentersExport.mockResolvedValue("presentadores.xlsx");
    renderPage();
    await screen.findByText("Ana Pérez");
    await screen.findByRole("option", { name: /Feria Gamer 2025 - S1/ });

    fireEvent.change(screen.getByLabelText("Edición"), { target: { value: "2" } });
    await waitFor(() => expect(fetchExternalPresenters).toHaveBeenLastCalledWith(2));
    fireEvent.click(await screen.findByRole("button", { name: /Exportar a Excel/ }));

    await waitFor(() => expect(downloadExternalPresentersExport).toHaveBeenCalledWith(2));
  });

  it("en una edición de solo lectura oculta registrar, editar, quitar y enviar", async () => {
    fetchExternalPresenters.mockResolvedValue(listOf([ANA], true));
    renderPage();

    expect(await screen.findByText("Edición de solo lectura")).toBeTruthy();
    expect(screen.getByText("Ana Pérez")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Registrar presentador/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Registrar varios/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Enviar certificado/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Quitar a Ana Pérez" })).toBeNull();
    expect(screen.getByRole("button", { name: /Exportar a Excel/ })).toBeTruthy();
  });

  it("sin edición activa lo avisa y no deja registrar", async () => {
    fetchExternalPresenters.mockResolvedValue({ edition: null, presenters: [] });
    renderPage();

    expect(await screen.findByText("No hay una edición activa")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Registrar presentador/ })).toBeNull();
  });

  it("registrar abre el formulario con «Repite el correo»", async () => {
    fetchExternalPresenters.mockResolvedValue(listOf([]));
    renderPage();

    expect(await screen.findByText("Todavía no hay presentadores externos en esta edición.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Registrar presentador/ }));
    expect(await screen.findByLabelText("Repite el correo")).toBeTruthy();
  });
});
