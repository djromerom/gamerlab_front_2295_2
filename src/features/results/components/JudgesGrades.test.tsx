import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ apiFetch }));

import JudgesGrades from "@/features/results/components/JudgesGrades";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("JudgesGrades sin la nota de cada jurado (HU-30)", () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });
  afterEach(cleanup);

  it("muestra el nombre, «Jurado» y si evaluó", async () => {
    apiFetch.mockResolvedValue(
      json(200, [
        { id: "j1", nombre: "Ana Ruiz", categoria: "JUNIOR", haEvaluado: true },
        { id: "j2", nombre: "Eva Paz", categoria: "SIN_CATEGORIA", haEvaluado: false },
      ]),
    );
    render(<JudgesGrades />);
    await waitFor(() => expect(screen.getByText("Ana Ruiz")).toBeTruthy());
    expect(screen.getAllByText("Jurado")).toHaveLength(2);
    expect(screen.getByText("Evaluó")).toBeTruthy();
    expect(screen.getByText("Pendiente")).toBeTruthy();
  });

  it("no distingue junior, senior ni profesor aunque el back mande la categoría (HU-35)", async () => {
    apiFetch.mockResolvedValue(
      json(200, [
        { id: "j1", nombre: "Ana Ruiz", categoria: "JUNIOR", haEvaluado: true },
        { id: "j2", nombre: "Eva Paz", categoria: "SENIOR", haEvaluado: false },
        { id: "p1", nombre: "Luis Mora", categoria: "PROFESOR", haEvaluado: true },
      ]),
    );
    const { container } = render(<JudgesGrades />);
    await waitFor(() => expect(screen.getByText("Ana Ruiz")).toBeTruthy());
    expect(screen.getAllByText("Jurado")).toHaveLength(3);
    expect(container.textContent).not.toMatch(/junior|senior|profesor/i);
  });

  it("no muestra la nota aunque el back viejo todavía envíe totalScore", async () => {
    apiFetch.mockResolvedValue(
      json(200, [{ id: "j1", nombre: "Ana Ruiz", categoria: "JUNIOR", totalScore: 4.5, haEvaluado: true }]),
    );
    const { container } = render(<JudgesGrades />);
    await waitFor(() => expect(screen.getByText("Ana Ruiz")).toBeTruthy());
    expect(container.textContent).not.toMatch(/4\.5/);
  });
});
