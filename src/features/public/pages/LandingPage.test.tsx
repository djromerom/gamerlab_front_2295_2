import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TextSizeProvider } from "@/contexts/TextSizeContext";
import LandingPage from "@/features/public/pages/LandingPage";
import { FAIRS } from "@/features/public/components/gallery/fairs";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, logout: vi.fn() }),
}));
vi.mock("@/features/public/api/highlightedGames", () => ({
  fetchHighlightedGames: () => Promise.resolve([]),
}));

// jsdom no trae matchMedia ni IntersectionObserver: la galería y la barra los usan
beforeEach(() => {
  vi.stubGlobal("matchMedia", (consulta: string) => ({
    // sin animaciones: la galería cambia de feria al instante
    matches: consulta.includes("reduced-motion"),
    media: consulta,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const montar = () =>
  render(
    <TextSizeProvider>
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    </TextSizeProvider>,
  );

describe("LandingPage", () => {
  it("muestra la portada, la galería de las ferias y la sección de juegos", () => {
    montar();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("FERIAGAMER");
    expect(screen.getByRole("link", { name: "Ver videojuegos" }).getAttribute("href")).toBe("/equipos");
    expect(screen.getByRole("link", { name: /REVIVE LAS FERIAS/ }).getAttribute("href")).toBe("#galeria");
    expect(screen.getByRole("heading", { name: "Así se vivió la Feria Gamer" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Juega en la Feria Gamer" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Jugar Arkadash/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Jugar Arkad Jam/ })).toBeTruthy();
  });

  it("activa el ajuste de scroll por secciones solo mientras está montada", () => {
    const { unmount } = montar();
    expect(document.documentElement.classList.contains("landing-arkad")).toBe(true);
    expect(document.documentElement.style.getPropertyValue("--cab")).not.toBe("");
    unmount();
    expect(document.documentElement.classList.contains("landing-arkad")).toBe(false);
    expect(document.documentElement.style.getPropertyValue("--cab")).toBe("");
  });

  it("la galería tiene una pestaña por feria y las flechas pasan de foto", () => {
    montar();
    const pestanas = within(document.getElementById("ferias")!).getAllByRole("tab");
    expect(pestanas).toHaveLength(FAIRS.length);
    expect(pestanas[0].textContent).toContain(`${FAIRS[0].titulo}${FAIRS[0].periodo} · ${FAIRS[0].fotos.length} fotos`);
    expect(pestanas[0].getAttribute("aria-selected")).toBe("true");

    // el visor también tiene flechas: se usan las de la galería
    const galeria = within(document.getElementById("galeria")!);
    const contador = document.getElementById("num")!;
    expect(contador.textContent).toBe(`01 / ${FAIRS[0].fotos.length}`);
    fireEvent.click(galeria.getByRole("button", { name: "Foto siguiente" }));
    expect(contador.textContent).toBe(`02 / ${FAIRS[0].fotos.length}`);
    fireEvent.click(galeria.getByRole("button", { name: "Foto anterior" }));
    fireEvent.click(galeria.getByRole("button", { name: "Foto anterior" }));
    expect(contador.textContent).toBe(`${FAIRS[0].fotos.length} / ${FAIRS[0].fotos.length}`);
  });

  it("al elegir otra feria se cargan sus fotos desde la primera", async () => {
    montar();
    fireEvent.click(within(document.getElementById("ferias")!).getAllByRole("tab")[1]);
    await waitFor(() => expect(document.getElementById("nombreFeria")!.textContent).toBe(`${FAIRS[1].titulo} · ${FAIRS[1].periodo}`));
    await waitFor(() => expect(document.getElementById("num")!.textContent).toBe(`01 / ${FAIRS[1].fotos.length}`));
    expect(within(document.getElementById("ferias")!).getAllByRole("tab")[1].getAttribute("aria-selected")).toBe("true");
    const primera = document.querySelector<HTMLElement>("#carril .tarjeta")!;
    expect(primera.dataset.src).toBe(`${FAIRS[1].ruta}/${FAIRS[1].fotos[0]}.jpg`);
  });

  it("el marco de los juegos empieza cerrado y el volumen oculto hasta abrir uno", () => {
    montar();
    const seccion = document.getElementById("juego")!;
    expect(seccion.querySelector<HTMLElement>("#cabina")!.hidden).toBe(true);
    expect(seccion.querySelector<HTMLElement>("#volumen")!.hidden).toBe(true);
    expect(within(seccion).getByText(/© 2026 Arkad/)).toBeTruthy();
  });

  it("la sección de juegos separa los minijuegos ARKAD de los juegos de los estudiantes", async () => {
    montar();
    const arkad = screen.getByRole("tab", { name: "Minijuegos ARKAD" });
    const estudiantes = screen.getByRole("tab", { name: "De los estudiantes" });
    expect(arkad.getAttribute("aria-selected")).toBe("true");
    expect(document.getElementById("zona-estudiantes")!.hidden).toBe(true);

    fireEvent.click(estudiantes);
    expect(estudiantes.getAttribute("aria-selected")).toBe("true");
    expect(document.getElementById("zona-arkad")!.hidden).toBe(true);
    expect(document.getElementById("zona-estudiantes")!.hidden).toBe(false);
    await screen.findByText(/Pronto verás aquí/);

    fireEvent.keyDown(estudiantes, { key: "ArrowLeft" });
    expect(arkad.getAttribute("aria-selected")).toBe("true");
    expect(document.getElementById("zona-arkad")!.hidden).toBe(false);
  });
});
