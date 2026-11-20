import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RankingPage from "@/features/results/pages/RankingPage";

const apiFetch = vi.fn();

vi.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));
vi.mock("@/components/NavBar", () => ({ default: () => <nav>Navegación</nav> }));
vi.mock("@/components/background/ArkadBackground", () => ({ ArkadBackground: () => null }));
vi.mock("@/components/TextSizeControl", () => ({ TextSizeControl: () => null }));
vi.mock("@/components/DiscordButton", () => ({ DiscordButton: () => null }));

const row = (teamId: number, teamCode: string, videogameName: string, finalScore: number | null, levelPosition: number | null, isExternal = false) => ({
  teamId,
  teamCode,
  videogameName,
  finalScore,
  levelPosition,
  isExternal,
});

// Lo que devuelve el back: equipos con la casilla «Externo» en N1 y en N0; compiten en su nivel (ARK-272)
const ALL = [
  row(1, "N1-ABC-101", "Pixel Hunters", 4.5, 1),
  row(2, "N1-ABC-102", "Code Knights", 4.1, 2),
  row(40, "N1-DAT-435", "Operación de Datos", 3.0, 3, true),
  row(50, "N0-COL-001", "Aventura Escolar", 4.0, 1),
  row(51, "N0-COL-007", "Red Invisible", 3.6, 2, true),
];

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });

describe("Ranking público por nivel, sin pestaña «Externos» (ARK-273)", () => {
  beforeEach(() => {
    apiFetch.mockImplementation((url: string) => {
      if (url.endsWith("/settings/show-ranking")) return Promise.resolve(json({ showRanking: true }));
      const n = url.split("/").pop();
      if (n === "all") return Promise.resolve(json(ALL));
      return Promise.resolve(json(ALL.filter((t) => t.teamCode.toLowerCase().startsWith(`${n}-`))));
    });
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  const renderPage = async () => {
    render(
      <MemoryRouter>
        <RankingPage />
      </MemoryRouter>,
    );
    await screen.findByRole("button", { name: "Colegios" });
  };

  it("no hay pestaña «Externos»", async () => {
    await renderPage();
    expect(screen.queryByRole("button", { name: "Externos" })).toBeNull();
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual([
      "Todos",
      "Primer Semestre",
      "Segundo Semestre",
      "Tercer Semestre",
      "Cuarto Semestre",
      "Décimo Semestre",
      "Colegios",
    ]);
  });

  it("un equipo marcado «Externo» sale en su semestre", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Primer Semestre" }));

    expect(await screen.findByText("Operación de Datos")).toBeTruthy();
    expect(screen.getByText("Pixel Hunters")).toBeTruthy();
    await waitFor(() => expect(apiFetch).toHaveBeenLastCalledWith(expect.stringMatching(/by-n\/n1$/)));
  });

  it("muestra la ponderación de la nota final, sin «junior» porque es pública (HU-34, HU-35)", async () => {
    await renderPage();
    expect(screen.getByText("Nota final: 60 % profesores y 40 % jurados")).toBeTruthy();
    expect(screen.queryByText(/junior/)).toBeNull();
  });

  it("un colegio marcado «Externo» compite en Colegios como los demás", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Colegios" }));

    expect(await screen.findByText("Red Invisible")).toBeTruthy();
    expect(screen.getByText("Aventura Escolar")).toBeTruthy();
  });
});

// Lo que devuelve el back en el caso de HU-34 p3 (16-nov): un solo equipo de Primer Semestre con
// nota y dos con `finalScore: null`, que el back manda al final con `position` 2 y 3.
const WITH_UNSCORED = [
  row(1, "N1-ABC-101", "Pixel Hunters", 4.5, 1),
  row(50, "N0-COL-001", "Aventura Escolar", 4.0, 1),
  row(2, "N1-ABC-102", "Code Knights", 3.2, 2),
  row(3, "N1-ABC-103", "Sin Nota Uno", null, null),
  row(4, "N1-ABC-104", "Sin Nota Dos", null, null),
];

describe("Equipos sin nota final en el ranking público (ARK-238)", () => {
  let data = WITH_UNSCORED;

  beforeEach(() => {
    data = WITH_UNSCORED;
    apiFetch.mockImplementation((url: string) => {
      if (url.endsWith("/settings/show-ranking")) return Promise.resolve(json({ showRanking: true }));
      const n = url.split("/").pop();
      if (n === "all") return Promise.resolve(json(data));
      return Promise.resolve(json(data.filter((t) => t.teamCode.toLowerCase().startsWith(`${n}-`))));
    });
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  const renderPage = async () => {
    render(
      <MemoryRouter>
        <RankingPage />
      </MemoryRouter>,
    );
    await screen.findByRole("button", { name: "Colegios" });
  };

  const bodyRows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1);
  const cells = (tr: HTMLElement) => within(tr).getAllByRole("cell").map((td) => td.textContent?.trim());

  it("en Todos, los equipos con nota conservan orden y posición y los sin nota van al final sin puesto ni 0.00", async () => {
    await renderPage();
    await screen.findByText("Sin Nota Dos");

    expect(bodyRows().map(cells)).toEqual([
      ["1", "PPixel Hunters", "4.50"],
      ["2", "AAventura Escolar", "4.00"],
      ["3", "CCode Knights", "3.20"],
      ["—", "SSin Nota Uno", "Nota en proceso"],
      ["—", "SSin Nota Dos", "Nota en proceso"],
    ]);
    expect(screen.queryByText("0.00")).toBeNull();
    expect(screen.getAllByLabelText("Sin puesto")).toHaveLength(2);
  });

  it("en un semestre, ningún equipo sin nota sale en el podio", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Primer Semestre" }));
    await waitFor(() => expect(apiFetch).toHaveBeenLastCalledWith(expect.stringMatching(/by-n\/n1$/)));
    await screen.findByText("Sin Nota Dos");

    const podium = [...document.querySelectorAll("[data-podium-place]")].map((el) => ({
      place: el.getAttribute("data-podium-place"),
      text: el.textContent,
    }));
    expect(podium).toEqual([
      { place: "2", text: expect.stringContaining("Code Knights") },
      { place: "1", text: expect.stringContaining("Pixel Hunters") },
    ]);
    expect(podium.some((p) => p.text?.includes("Sin Nota"))).toBe(false);

    expect(bodyRows().map(cells)).toEqual([
      ["—", "SSin Nota Uno", "Nota en proceso"],
      ["—", "SSin Nota Dos", "Nota en proceso"],
    ]);
    expect(screen.queryByText("0.00")).toBeNull();
  });

  it("los equipos con nota que no caben en el podio siguen desde el puesto 4", async () => {
    data = [
      row(1, "N1-ABC-101", "Uno", 4.9, 1),
      row(2, "N1-ABC-102", "Dos", 4.5, 2),
      row(3, "N1-ABC-103", "Tres", 4.1, 3),
      row(4, "N1-ABC-104", "Cuatro", 3.7, 4),
      row(5, "N1-ABC-105", "Pendiente", null, null),
    ];
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Primer Semestre" }));
    await screen.findByText("Pendiente");
    await waitFor(() => expect(document.querySelectorAll("[data-podium-place]")).toHaveLength(3));

    expect(bodyRows().map(cells)).toEqual([
      ["4", "CCuatro", "3.70"],
      ["—", "PPendiente", "Nota en proceso"],
    ]);
  });

  it("un nivel sin ningún equipo con nota no muestra podio", async () => {
    data = [row(3, "N1-ABC-103", "Sin Nota Uno", null, null)];
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Primer Semestre" }));

    expect(await screen.findByText("Aún no hay equipos con nota en este nivel.")).toBeTruthy();
    expect(document.querySelectorAll("[data-podium-place]")).toHaveLength(0);
    expect(cells(bodyRows()[0])).toEqual(["—", "SSin Nota Uno", "Nota en proceso"]);
  });

  it("una nota de 0 sí es nota: tiene puesto y se ve 0.00", async () => {
    data = [row(1, "N1-ABC-101", "Cero Real", 0, 1), row(3, "N1-ABC-103", "Sin Nota Uno", null, null)];
    await renderPage();
    await screen.findByText("Sin Nota Uno");

    expect(bodyRows().map(cells)).toEqual([
      ["1", "CCero Real", "0.00"],
      ["—", "SSin Nota Uno", "Nota en proceso"],
    ]);
  });
});
