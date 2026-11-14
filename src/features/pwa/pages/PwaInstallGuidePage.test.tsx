import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PwaInstallGuidePage from "@/features/pwa/pages/PwaInstallGuidePage";

vi.mock("@/layouts/LayoutAplication", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("PwaInstallGuidePage", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("muestra la guía de instalación para Android y iPhone", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    render(<PwaInstallGuidePage />);

    expect(screen.getByRole("heading", { name: "Instala ARKAD en tu celular" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Android · Chrome" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "iPhone · Safari" })).toBeTruthy();
    expect(screen.getByText(/Agregar a pantalla de inicio/)).toBeTruthy();
  });
});
