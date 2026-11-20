import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PWA_INSTALL_NOTICE_DISMISSED_KEY,
  PwaInstallNotice,
} from "@/features/pwa/components/PwaInstallNotice";

const stubMedia = ({ touch, standalone }: { touch: boolean; standalone: boolean }) => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(pointer: coarse)" ? touch : query === "(display-mode: standalone)" ? standalone : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
};

const renderNotice = () =>
  render(
    <MemoryRouter>
      <PwaInstallNotice />
    </MemoryRouter>,
  );

describe("PwaInstallNotice", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("invita a instalar ARKAD en el celular y enlaza la guía", () => {
    stubMedia({ touch: true, standalone: false });
    renderNotice();

    expect(screen.getByText("Instala ARKAD en tu celular")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ver cómo instalarla" }).getAttribute("href")).toBe("/instalar-app");
  });

  it("no aparece si ARKAD ya está instalada", () => {
    stubMedia({ touch: true, standalone: true });
    renderNotice();

    expect(screen.queryByText("Instala ARKAD en tu celular")).toBeNull();
  });

  it("no aparece en computador", () => {
    stubMedia({ touch: false, standalone: false });
    renderNotice();

    expect(screen.queryByText("Instala ARKAD en tu celular")).toBeNull();
  });

  it("al cerrarlo no vuelve a aparecer", () => {
    stubMedia({ touch: true, standalone: false });
    renderNotice();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso de instalación" }));
    expect(screen.queryByText("Instala ARKAD en tu celular")).toBeNull();
    expect(window.localStorage.getItem(PWA_INSTALL_NOTICE_DISMISSED_KEY)).toBe("1");

    cleanup();
    renderNotice();
    expect(screen.queryByText("Instala ARKAD en tu celular")).toBeNull();
  });
});
