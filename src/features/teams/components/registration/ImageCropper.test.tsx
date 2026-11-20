import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImageCropper, INVALID_IMAGE_MESSAGE } from "@/features/teams/components/registration/ImageCropper";

// El recorte del logo (registro, edición del equipo y asistente del administrador)
describe("ImageCropper: archivo que no es imagen (ARK-117)", () => {
  afterEach(cleanup);

  const renderCropper = (file: File) => {
    const onCropComplete = vi.fn();
    const onClose = vi.fn();
    render(
      <ImageCropper file={file} open onClose={onClose} onCropComplete={onCropComplete} />,
    );
    return { onCropComplete, onClose };
  };

  const applyButton = () =>
    screen.getByRole("button", { name: "Aplicar recorte" }) as HTMLButtonElement;

  it("un archivo renombrado a .png que no se puede abrir muestra el error y no deja aplicar", async () => {
    const { onCropComplete } = renderCropper(
      new File(["%PDF-1.7 no soy una imagen"], "logo.png", { type: "image/png" }),
    );

    // El navegador intenta decodificarlo y falla
    const img = await screen.findByAltText("Imagen para recortar");
    fireEvent.error(img);

    expect((await screen.findByRole("alert")).textContent).toBe(INVALID_IMAGE_MESSAGE);
    expect(screen.queryByAltText("Imagen para recortar")).toBeNull();
    expect(applyButton().disabled).toBe(true);
    fireEvent.click(applyButton());
    expect(onCropComplete).not.toHaveBeenCalled();
  });

  it("un archivo cuyo tipo no es de imagen muestra el error sin intentar cargarlo", async () => {
    renderCropper(new File(["hola"], "logo.txt", { type: "text/plain" }));

    expect((await screen.findByRole("alert")).textContent).toBe(INVALID_IMAGE_MESSAGE);
    expect(screen.queryByAltText("Imagen para recortar")).toBeNull();
    expect(applyButton().disabled).toBe(true);
  });

  it("Cancelar cierra y limpia el error", async () => {
    const { onClose } = renderCropper(new File(["hola"], "logo.txt", { type: "text/plain" }));
    await screen.findByRole("alert");

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("con una imagen que carga bien no hay error y se puede aplicar el recorte", async () => {
    renderCropper(new File([new Uint8Array([137, 80, 78, 71])], "logo.png", { type: "image/png" }));

    const img = await screen.findByAltText("Imagen para recortar");
    Object.defineProperty(img, "width", { value: 200 });
    Object.defineProperty(img, "height", { value: 200 });
    fireEvent.load(img);

    await waitFor(() => expect(applyButton().disabled).toBe(false));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("Ajusta la imagen para que quede circular")).toBeTruthy();
  });
});
