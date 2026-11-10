import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExternalPresenterFormDialog } from "@/components/admin/external-presenters/ExternalPresenterFormDialog";
import { ExternalPresenterError, type ExternalPresenter } from "@/fetchs/externalPresenters";

const createExternalPresenter = vi.fn();
const updateExternalPresenter = vi.fn();

vi.mock("@/fetchs/externalPresenters", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/fetchs/externalPresenters")>()),
  createExternalPresenter: (...args: unknown[]) => createExternalPresenter(...args),
  updateExternalPresenter: (...args: unknown[]) => updateExternalPresenter(...args),
}));

const PRESENTER: ExternalPresenter = {
  id: 9,
  userId: "u-9",
  email: "ana@empresa.com",
  firstName: "Ana",
  lastName: "Pérez",
  organization: "Estudio Indie Caribe",
  presentationTitle: "Diseño de niveles",
  editionId: 3,
  lastSignInAt: null,
  certificateSentAt: null,
  createdAt: "2026-11-08T07:47:16.279Z",
};

const renderDialog = (presenter?: ExternalPresenter) => {
  const onSaved = vi.fn();
  const onOpenChange = vi.fn();
  render(
    <ExternalPresenterFormDialog
      open
      onOpenChange={onOpenChange}
      presenter={presenter}
      onSaved={onSaved}
    />,
  );
  return { onSaved, onOpenChange };
};

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const fillCreate = (confirmEmail = "ANA@empresa.com") => {
  type("Correo", "ana@empresa.com");
  type("Repite el correo", confirmEmail);
  type("Nombre", "Ana");
  type("Apellido", "Pérez");
};

describe("Formulario de presentador externo (HU-33)", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("no deja pegar ni arrastrar en «Repite el correo» (HU-32)", () => {
    renderDialog();
    const confirm = screen.getByLabelText("Repite el correo");

    // dispatchEvent devuelve false cuando el componente cancela el evento
    expect(fireEvent.paste(confirm)).toBe(false);
    expect(fireEvent.drop(confirm)).toBe(false);
    expect(fireEvent.paste(screen.getByLabelText("Correo"))).toBe(true);
  });

  it("si los correos no coinciden avisa y no envía", () => {
    renderDialog();
    fillCreate("otra@empresa.com");
    fireEvent.click(screen.getByRole("button", { name: "Registrar" }));

    expect(screen.getByText("Los correos no coinciden")).toBeTruthy();
    expect(createExternalPresenter).not.toHaveBeenCalled();
  });

  it("registra sin enviar la organización ni el título vacíos", async () => {
    createExternalPresenter.mockResolvedValue(PRESENTER);
    const { onSaved, onOpenChange } = renderDialog();
    fillCreate();
    type("Organización (opcional)", "   ");
    fireEvent.click(screen.getByRole("button", { name: "Registrar" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(PRESENTER, "create"));
    expect(createExternalPresenter).toHaveBeenCalledWith({
      email: "ana@empresa.com",
      confirmEmail: "ANA@empresa.com",
      firstName: "Ana",
      lastName: "Pérez",
      organization: undefined,
      presentationTitle: undefined,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("muestra el mensaje del back, por ejemplo un correo de otro rol", async () => {
    createExternalPresenter.mockRejectedValue(
      new ExternalPresenterError(
        "Ya existe una cuenta con ese correo con el rol «Estudiante». Usa otro correo.",
        409,
        "EMAIL_IN_USE_BY_OTHER_ROLE",
      ),
    );
    const { onSaved } = renderDialog();
    fillCreate();
    fireEvent.click(screen.getByRole("button", { name: "Registrar" }));

    expect((await screen.findByRole("alert")).textContent).toMatch(/rol «Estudiante»/);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("al editar no muestra los correos y envía null para borrar la organización", async () => {
    updateExternalPresenter.mockResolvedValue({ ...PRESENTER, organization: null });
    const { onSaved } = renderDialog(PRESENTER);

    expect(screen.queryByLabelText("Correo")).toBeNull();
    expect(screen.queryByLabelText("Repite el correo")).toBeNull();
    expect((screen.getByLabelText("Nombre") as HTMLInputElement).value).toBe("Ana");

    type("Organización (opcional)", "");
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(updateExternalPresenter).toHaveBeenCalledWith(9, {
      firstName: "Ana",
      lastName: "Pérez",
      organization: null,
      presentationTitle: "Diseño de niveles",
    });
  });
});
