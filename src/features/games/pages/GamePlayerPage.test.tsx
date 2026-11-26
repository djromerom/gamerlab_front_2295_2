import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GameLoaderState } from "@/features/games/hooks/useGameLoader";

vi.mock("@/components/NavBar", () => ({ default: () => <nav>Navegación</nav> }));
vi.mock("@/components/background/ArkadBackground", () => ({ ArkadBackground: () => null }));

const loader = vi.fn<(kind: string, id: number, touchOnly: boolean) => GameLoaderState>();
vi.mock("@/features/games/hooks/useGameLoader", () => ({
  useGameLoader: (kind: string, id: number, touchOnly: boolean) => loader(kind, id, touchOnly),
}));
let touchOnly = false;
vi.mock("@/hooks/useTouchOnly", () => ({ useTouchOnly: () => touchOnly }));

import GamePlayerPage from "@/features/games/pages/GamePlayerPage";

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/play-game/:videogameID" element={<GamePlayerPage />} />
        <Route path="/play-game/historical/:videogameID" element={<GamePlayerPage kind="historical" />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  touchOnly = false;
  loader.mockReset();
});
afterEach(cleanup);

describe("GamePlayerPage", () => {
  it("un histórico pide su juego como histórico y lo abre en el iframe con allow (F7)", () => {
    loader.mockReturnValue({ status: "ready", key: "historical-87", entry: "Build/index.html", name: "Ruta 66", teamName: "Byte Club" });
    renderAt("/play-game/historical/87");
    expect(loader).toHaveBeenCalledWith("historical", 87, false);
    const iframe = screen.getByTitle("Ruta 66, de Byte Club");
    expect(iframe.getAttribute("src")).toBe("/play-game/historical-87/Build/index.html");
    expect(iframe.getAttribute("allow")).toBe("fullscreen; autoplay; gamepad");
    expect(iframe.hasAttribute("allowfullscreen")).toBe(true);
  });

  it("un juego en vivo sigue en /play-game/:id", () => {
    loader.mockReturnValue({ status: "loading", phase: "download", progress: 42 });
    renderAt("/play-game/431");
    expect(loader).toHaveBeenCalledWith("live", 431, false);
    expect(screen.getByText("Descargando el juego… 42 %")).toBeTruthy();
  });

  it("F4: el error se ve, con Reintentar", () => {
    loader.mockReturnValue({ status: "error", reason: "zip", message: "No se pudo abrir el archivo del juego: el .zip está dañado o no es un zip." });
    renderAt("/play-game/431");
    expect(screen.getByRole("alert").textContent).toContain("está dañado");
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeTruthy();
    expect(screen.queryByText(/Cargando/)).toBeNull();
  });

  it("sin zip no ofrece Reintentar", () => {
    loader.mockReturnValue({ status: "error", reason: "noFile", message: "Este juego no tiene una versión para jugar." });
    renderAt("/play-game/historical/3");
    expect(screen.getByText("Este juego no tiene una versión para jugar.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
  });

  it("en el celular, un juego sin allowMobile avisa que se juega en computador (el cargador no baja el zip)", () => {
    touchOnly = true;
    loader.mockReturnValue({ status: "touchOnly" });
    renderAt("/play-game/431?embed=1");
    expect(loader).toHaveBeenCalledWith("live", 431, true);
    expect(screen.getByText("Este juego se juega en computador")).toBeTruthy();
    expect(screen.queryByTitle(/Videojuego|, de /)).toBeNull();
  });

  it("TA-36: en el celular, un juego con allowMobile carga (el cargador lo decide con el dato del back)", () => {
    touchOnly = true;
    loader.mockReturnValue({ status: "ready", key: "294", entry: "index.html", name: "Brainrot Breakout", teamName: "Scroll Studios" });
    renderAt("/play-game/294");
    expect(loader).toHaveBeenCalledWith("live", 294, true);
    expect(screen.queryByText("Este juego se juega en computador")).toBeNull();
    expect(screen.getByTitle("Brainrot Breakout, de Scroll Studios")).toBeTruthy();
  });

  it("BG-77: con el juego listo hay un botón para salir (solo se ve en el celular, por CSS); en la cabina no", () => {
    loader.mockReturnValue({ status: "ready", key: "294", entry: "index.html", name: "Brainrot Breakout", teamName: "Scroll Studios" });
    renderAt("/play-game/294");
    expect(screen.getByRole("button", { name: "Salir del juego" })).toBeTruthy();
    cleanup();
    renderAt("/play-game/294?embed=1");
    expect(screen.queryByRole("button", { name: "Salir del juego" })).toBeNull();
  });

  it("BG-66: «1e3» no es un id (antes se pedía el juego 1000)", () => {
    loader.mockReturnValue({ status: "error", reason: "notFound", message: "No encontramos este videojuego. Revisa el enlace." });
    renderAt("/play-game/1e3");
    expect(loader).toHaveBeenCalledWith("live", Number.NaN, false);
    expect(screen.getByRole("alert").textContent).toContain("No encontramos este videojuego");
  });
});
