import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ArkadBackground } from "@/components/background/ArkadBackground";
import { PanelBackground } from "@/components/background/PanelBackground";

afterEach(() => {
  delete document.body.dataset.estilo;
});

describe("ArkadBackground", () => {
  it("dibuja un canvas decorativo que no intercepta clics ni se imprime", () => {
    const { container } = render(<ArkadBackground modo="lento" />);
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas?.getAttribute("aria-hidden")).toBe("true");
    expect(canvas?.getAttribute("data-fondo")).toBe("lento");
    expect(canvas?.className).toContain("pointer-events-none");
    expect(canvas?.className).toContain("print:hidden");
  });

  it("activa el estilo nuevo de las páginas públicas mientras está montado", () => {
    const { unmount } = render(<ArkadBackground modo="lento" estiloNuevo />);
    expect(document.body.dataset.estilo).toBe("nuevo");
    unmount();
    expect(document.body.dataset.estilo).toBeUndefined();
  });

  it("no cambia el estilo de la página si no se le pide", () => {
    render(<ArkadBackground modo="vivo" />);
    expect(document.body.dataset.estilo).toBeUndefined();
  });
});

describe("PanelBackground", () => {
  const matchMediaOriginal = window.matchMedia;
  afterEach(() => {
    window.matchMedia = matchMediaOriginal;
  });
  function simularPantalla(celular: boolean) {
    window.matchMedia = ((consulta: string) => ({
      matches: celular,
      media: consulta,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
  }

  it("en PC no dibuja fondo: el panel conserva el fondo liso del tema", () => {
    simularPantalla(false);
    const { container } = render(<PanelBackground />);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("en celular usa el fondo quieto (degradado)", () => {
    simularPantalla(true);
    const { container } = render(<PanelBackground />);
    expect(container.querySelector("canvas")?.getAttribute("data-fondo")).toBe("quieto");
  });
});
