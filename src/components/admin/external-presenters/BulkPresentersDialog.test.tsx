import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BulkPresentersDialog } from "@/components/admin/external-presenters/BulkPresentersDialog";
import { ExternalPresenterError } from "@/fetchs/externalPresenters";

const createExternalPresentersBulk = vi.fn();

vi.mock("@/fetchs/externalPresenters", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/fetchs/externalPresenters")>()),
  createExternalPresentersBulk: (...args: unknown[]) => createExternalPresentersBulk(...args),
}));

const renderDialog = () => {
  const onRegistered = vi.fn();
  render(<BulkPresentersDialog open onOpenChange={vi.fn()} onRegistered={onRegistered} />);
  return { onRegistered };
};

const paste = (text: string) =>
  fireEvent.change(screen.getByLabelText("Presentadores"), { target: { value: text } });

const submitButton = () => screen.getByRole("button", { name: /^Registrar/ });

describe("Carga por lote de presentadores externos (HU-33)", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("con una fila inválida la marca y no deja registrar", () => {
    renderDialog();
    paste("ana@empresa.com;Ana;Pérez\nmal-correo;Luis;Gómez");

    expect(screen.getByText(/1 con errores/)).toBeTruthy();
    expect(screen.getByText(/Línea 2: El correo no es válido/)).toBeTruthy();
    expect((submitButton() as HTMLButtonElement).disabled).toBe(true);
  });

  it("envía la lista y muestra los registrados y los que fallaron por fila", async () => {
    createExternalPresentersBulk.mockResolvedValue({
      successful: [{ id: 10, email: "ana@empresa.com", firstName: "Ana", lastName: "Pérez" }],
      failed: [
        {
          email: "admin@uninorte.edu.co",
          code: "EMAIL_IN_USE_BY_OTHER_ROLE",
          message: "Ya existe una cuenta con ese correo con el rol «Administrador». Usa otro correo.",
        },
      ],
      message: "Procesados 2: 1 registrados, 1 con error.",
    });
    const { onRegistered } = renderDialog();
    paste("Correo;Nombre;Apellido\nana@empresa.com;Ana;Pérez\nadmin@uninorte.edu.co;Admin;Romero");
    fireEvent.click(submitButton());

    expect(await screen.findByText("Procesados 2: 1 registrados, 1 con error.")).toBeTruthy();
    expect(createExternalPresentersBulk).toHaveBeenCalledWith([
      expect.objectContaining({ email: "ana@empresa.com", confirmEmail: "ana@empresa.com" }),
      expect.objectContaining({ email: "admin@uninorte.edu.co" }),
    ]);
    expect(screen.getByText(/Ana Pérez · ana@empresa.com/)).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toMatch(/admin@uninorte.edu.co.*rol «Administrador»/);
    expect(onRegistered).toHaveBeenCalled();
  });

  it("si el back rechaza toda la carga (400) muestra el motivo y no recarga la lista", async () => {
    createExternalPresentersBulk.mockRejectedValue(
      new ExternalPresenterError("presenters.0.El correo electrónico no es válido", 400),
    );
    const { onRegistered } = renderDialog();
    paste("ana@empresa.com;Ana;Pérez");
    fireEvent.click(submitButton());

    expect((await screen.findByRole("alert")).textContent).toMatch(/no es válido/);
    await waitFor(() => expect((submitButton() as HTMLButtonElement).disabled).toBe(false));
    expect(onRegistered).not.toHaveBeenCalled();
  });

  it("carga el texto de un CSV subido", async () => {
    renderDialog();
    const file = new File(["luz@empresa.com;Luz;Ruiz;Estudio;Charla"], "lista.csv", { type: "text/csv" });
    fireEvent.change(screen.getByLabelText("Subir archivo CSV"), { target: { files: [file] } });

    expect(await screen.findByText("luz@empresa.com")).toBeTruthy();
    expect(screen.getByText("Charla")).toBeTruthy();
  });
});
