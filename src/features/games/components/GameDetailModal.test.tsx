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

  it("sin zip no hay Jugar ni aviso", () => {
    renderModal({ team: { ...team, gameFileUrl: undefined } });
    expect(screen.queryByRole("button", { name: "Jugar" })).toBeNull();
    expect(screen.queryByText("Este juego se juega en computador")).toBeNull();
  });
});
