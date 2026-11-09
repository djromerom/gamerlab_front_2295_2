import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { MyDraftsPanel } from "@/components/grupo 8/EvaluationDrafts";
import { apiFetch } from "@/lib/api";
import type { ServerDraft } from "@/lib/evaluationDrafts";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const API = "http://api.test";
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const draft = (patch: Partial<ServerDraft>): ServerDraft => ({
  videogameId: 1,
  videogameName: "Juego",
  teamId: 10,
  teamName: "Equipo",
  teamCode: "N10-ABC-1",
  details: [],
  comments: null,
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: "PENDING",
  ...patch,
});

function RatePageStub() {
  const location = useLocation();
  return <p>Calificando {(location.state as { game: { nombre: string } }).game.nombre}</p>;
}

async function renderPanel(drafts: ServerDraft[]) {
  vi.mocked(apiFetch).mockImplementation(async (input, init) => {
    const url = String(input);
    if (url === `${API}/evaluation/drafts` && !init?.method) return json(200, drafts);
    if (init?.method === "DELETE") return json(200, { discarded: true });
    return json(404, {});
  });
  render(
    <MemoryRouter initialEntries={["/pendientes-calificar"]}>
      <Routes>
        <Route path="/pendientes-calificar" element={<MyDraftsPanel ratePath="/pendientes-calificar" />} />
        <Route path="/pendientes-calificar/:id" element={<RatePageStub />} />
      </Routes>
    </MemoryRouter>,
  );
  await act(async () => {});
}

afterEach(() => {
  cleanup();
  vi.mocked(apiFetch).mockReset();
});

describe("MyDraftsPanel", () => {
  it("no muestra nada si el jurado no tiene borradores", async () => {
    await renderPanel([]);
    expect(screen.queryByText(/Mis borradores/)).toBeNull();
  });

  it("muestra cada borrador con la acción según su estado", async () => {
    await renderPanel([
      draft({ videogameId: 1, videogameName: "Gamma", status: "PENDING" }),
      draft({ videogameId: 2, videogameName: "Delta", status: "ALREADY_SUBMITTED" }),
      draft({
        videogameId: 3,
        videogameName: "Omega",
        status: "NOT_ASSIGNED",
        blockedReason: "Este grupo no está asignado al evaluador",
      }),
    ]);

    expect(screen.getByText("Mis borradores (3)")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Continuar" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Descartar borrador" })).toHaveLength(2);
    expect(screen.getByText(/Ya enviaste la evaluación de este juego/)).toBeTruthy();
    expect(screen.getByText("Este grupo no está asignado al evaluador")).toBeTruthy();
  });

  it("Continuar abre el formulario del juego", async () => {
    await renderPanel([draft({ videogameId: 7, videogameName: "Gamma" })]);
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByText("Calificando Gamma")).toBeTruthy();
  });

  it("Descartar llama a DELETE y quita el borrador de la lista", async () => {
    localStorage.setItem("evaluation-draft-2", JSON.stringify({ scores: {}, comments: "x", savedAt: 1 }));
    await renderPanel([
      draft({ videogameId: 1, videogameName: "Gamma" }),
      draft({ videogameId: 2, videogameName: "Delta", status: "ALREADY_SUBMITTED" }),
    ]);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Descartar borrador" }));
    });

    expect(vi.mocked(apiFetch)).toHaveBeenCalledWith(
      `${API}/evaluation/drafts/2`,
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(screen.queryByText("Delta")).toBeNull();
    expect(screen.getByText("Mis borradores (1)")).toBeTruthy();
    expect(localStorage.getItem("evaluation-draft-2")).toBeNull();
  });
});
