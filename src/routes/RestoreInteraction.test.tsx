import { act, render } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RestoreInteraction } from "@/routes/RestoreInteraction";

let navegar: ReturnType<typeof useNavigate>;
function CapturarNavegacion() {
  navegar = useNavigate();
  return null;
}

function montar() {
  render(
    <MemoryRouter initialEntries={["/asistencia-jurados"]}>
      <RestoreInteraction />
      <CapturarNavegacion />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.useRealTimers();
  document.body.style.pointerEvents = "";
  document.body.innerHTML = "";
});

describe("RestoreInteraction", () => {
  it("devuelve la interacción si se cambió de ruta y quedó el body bloqueado sin capas abiertas", () => {
    vi.useFakeTimers();
    montar();
    document.body.style.pointerEvents = "none";
    act(() => navegar("/"));
    act(() => vi.advanceTimersByTime(400));
    expect(document.body.style.pointerEvents).toBe("");
  });

  it("no toca el bloqueo mientras haya un diálogo abierto", () => {
    vi.useFakeTimers();
    montar();
    const dialogo = document.createElement("div");
    dialogo.setAttribute("role", "dialog");
    dialogo.setAttribute("data-state", "open");
    document.body.appendChild(dialogo);
    document.body.style.pointerEvents = "none";
    act(() => navegar("/"));
    act(() => vi.advanceTimersByTime(400));
    expect(document.body.style.pointerEvents).toBe("none");
  });
});
