import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Team } from "@/types/team";

vi.mock("@/hooks/useFetch", () => ({ useFetch: () => vi.fn(async () => ({ liked: false })) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/contexts/SocketContext", () => ({ useSocket: () => ({ socket: null }) }));
let touchOnly = false;
vi.mock("@/hooks/useTouchOnly", () => ({ useTouchOnly: () => touchOnly }));

import { GameDetailModal } from "@/features/games/components/GameDetailModal";

const team: Team = {
  id: 5,
  videogameId: 87,
  gameName: "Ruta 66",
  teamName: "Byte Club",
  teamCode: "N1-05",
  status: "CONFIRMADO",
  gameFileUrl: "https://blob/juego.zip?sig=x",
};

function Location() {
  return <p data-testid="location">{useLocation().pathname}</p>;
}

function renderModal(props: Partial<Parameters<typeof GameDetailModal>[0]> = {}) {
  return render(
    <MemoryRouter initialEntries={["/ediciones-pasadas/1/juegos"]}>
      <Routes>
        <Route path="*" element={<><GameDetailModal team={team} onClose={() => {}} onRefresh={() => {}} {...props} /><Location /></>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  touchOnly = false;
});
afterEach(cleanup);

describe("GameDetailModal · Jugar (HU-40)", () => {
  it("en ediciones pasadas abre el juego histórico con su id, no otro juego en vivo", () => {
    renderModal({ gameKind: "historical" });
    fireEvent.click(screen.getByRole("button", { name: "Jugar" }));
    expect(screen.getByTestId("location").textContent).toBe("/play-game/historical/87");
  });

  it("un juego en vivo sigue en /play-game/:id", () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Jugar" }));
    expect(screen.getByTestId("location").textContent).toBe("/play-game/87");
  });

  it("en el celular muestra el aviso en vez de Jugar", () => {
    touchOnly = true;
    renderModal();
    expect(screen.queryByRole("button", { name: "Jugar" })).toBeNull();
    expect(screen.getByText("Este juego se juega en computador")).toBeTruthy();
  });

  it("ARK-317: en el celular, Brainrot Breakout (294) sí ofrece Jugar", () => {
    touchOnly = true;
    renderModal({ team: { ...team, videogameId: 294 } });
    expect(screen.getByRole("button", { name: "Jugar" })).toBeTruthy();
    expect(screen.queryByText("Este juego se juega en computador")).toBeNull();
  });

  it("ARK-317: la excepción es solo del juego en vivo, no de un histórico con el mismo id", () => {
    touchOnly = true;
    renderModal({ team: { ...team, videogameId: 294 }, gameKind: "historical" });
    expect(screen.queryByRole("button", { name: "Jugar" })).toBeNull();
  });

  it("sin zip no hay Jugar ni aviso", () => {
    renderModal({ team: { ...team, gameFileUrl: undefined } });
    expect(screen.queryByRole("button", { name: "Jugar" })).toBeNull();
    expect(screen.queryByText("Este juego se juega en computador")).toBeNull();
  });
});

describe("GameDetailModal · detalle público (BG-66)", () => {
  it("muestra el estado como «Confirmado» y no en mayúsculas crudas", () => {
    renderModal();
    expect(screen.getByText("Confirmado")).toBeTruthy();
    expect(screen.queryByText("CONFIRMADO")).toBeNull();
  });

  it("sin video ni imágenes no le pide al visitante que suba nada", () => {
    renderModal();
    expect(screen.getByText("Sin video ni imágenes adicionales")).toBeTruthy();
    expect(screen.queryByText(/Sube un video/)).toBeNull();
  });

  it("se cierra con Escape", () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("queda por encima de los botones flotantes (z-50)", () => {
    renderModal();
    const overlay = screen.getByRole("dialog").parentElement!;
    expect(overlay.className).toContain("z-[60]");
  });

  it("se monta en document.body, fuera del contenedor de la página que la dejaba debajo de la barra", () => {
    const { container } = renderModal();
    const overlay = screen.getByRole("dialog").parentElement!;
    expect(container.contains(overlay)).toBe(false);
    expect(overlay.parentElement).toBe(document.body);
  });

  it("en vertical va en columna y en horizontal en fila, sin pasar del alto de la pantalla", () => {
    renderModal();
    const classes = screen.getByRole("dialog").className.split(" ");
    expect(classes).toEqual(expect.arrayContaining(["flex-col", "landscape:flex-row", "max-h-full", "landscape:h-[min(550px,100%)]"]));
    // antes: md:h-[550px] fijo, que en el celular acostado (390 px de alto) dejaba la ventana fuera de la pantalla
    expect(classes).not.toContain("md:h-[550px]");
  });
});

describe("GameDetailModal · textos largos", () => {
  it("un nombre con una palabra larga se parte y no saca el like de la ventana", () => {
    renderModal({ team: { ...team, gameName: "Supercalifragilístico Aventura" }, liveCount: 7 });
    const title = screen.getByRole("heading", { level: 2, name: "Supercalifragilístico Aventura" });
    // el tamaño del título va según el ancho de la columna de información (consulta de contenedor)
    expect(title.closest('[class~="@container"]')).not.toBeNull();
    expect(title.className.split(" ")).toEqual(expect.arrayContaining(["min-w-0", "break-words", "text-xl", "@min-[22rem]:text-2xl", "@lg:text-3xl"]));
    expect(screen.getByText("7").closest("button")!.parentElement!.className.split(" ")).toContain("shrink-0");
  });

  it("los botones de GitHub y YouTube pasan a dos líneas en vez de salirse del botón", () => {
    renderModal({ team: { ...team, repo: "https://github.com/equipo/juego", video: "https://youtu.be/abc" } });
    for (const name of ["Ver repositorio en GitHub", "Ver trailer del juego en Youtube"]) {
      const classes = screen.getByRole("button", { name }).className.split(" ");
      expect(classes).toEqual(expect.arrayContaining(["whitespace-normal", "h-auto"]));
      expect(classes).not.toContain("whitespace-nowrap");
    }
  });

  it("en el celular acostado las fotos y la información van mitad y mitad", () => {
    renderModal();
    const media = screen.getByRole("dialog").children[1];
    expect(media.className.split(" ")).toEqual(expect.arrayContaining(["landscape:w-3/5", "landscape-short:w-1/2"]));
  });
});
