import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GradedPage from "@/features/grading/pages/GradedPage";
import SchoolGradesPage from "@/features/grading/pages/SchoolGradesPage";
import { apiFetch } from "@/lib/api";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));
vi.mock("@/layouts/LayoutApplication", () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

const API = import.meta.env.VITE_ENDPOINT_BACKEND;

const respuesta = {
  data: [
    {
      videogameId: 24,
      videogameName: "Stella",
      logoUrl: "",
      teamName: "Los Astros",
      members: [{ fullName: "Ana Pérez" }],
      nrc: "1234",
      subject: "Algoritmos",
      description: "Un juego espacial",
      isEvaluated: true,
      totalScore: 4.5,
      comments: "Buen trabajo",
    },
  ],
  metadata: { totalItems: 1, itemsOnCurrentPage: 1, currentPage: 1, itemsPerPage: 10, totalPages: 1 },
};

beforeEach(() => {
  vi.mocked(apiFetch).mockResolvedValue(
    new Response(JSON.stringify(respuesta), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.mocked(apiFetch).mockReset();
});

describe.each([
  ["Calificados (jurado)", GradedPage],
  ["Equipos Evaluados (profesor)", SchoolGradesPage],
])("%s", (_nombre, Pagina) => {
  it("pide /graded-games sin jurorId ni texto de relleno", async () => {
    render(
      <MemoryRouter>
        <Pagina />
      </MemoryRouter>,
    );
    expect(await screen.findByText("Stella")).toBeTruthy();

    const urls = vi.mocked(apiFetch).mock.calls.map(([url]) => String(url));
    expect(urls).toEqual([`${API}/graded-games?page=1&limit=10`]);
    expect(urls.join(" ")).not.toContain("JUROR_ID_AQUI");
  });

  it("no muestra la casilla de calificación en lote", async () => {
    render(
      <MemoryRouter>
        <Pagina />
      </MemoryRouter>,
    );
    await screen.findByText("Stella");
    expect(screen.queryByRole("checkbox")).toBeNull();
  });
});
