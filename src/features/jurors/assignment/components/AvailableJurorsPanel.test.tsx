import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AvailableJurorsPanel } from "@/features/jurors/assignment/components/AvailableJurorsPanel";
import type { Jurado, JurorType } from "@/features/jurors/types/jurors";

function jurado(id: string, name: string, tipo: JurorType): Jurado {
  return {
    id,
    firstName: name,
    lastName: "",
    name,
    email: `${id}@test.co`,
    avatar: "",
    tipo,
    jurorCategory: "SENIOR",
    evaluatedCount: 0,
    evaluatedGameNames: [],
    unevaluatedCount: 0,
    unevaluatedGameNames: [],
  };
}

const oficiales = [jurado("o1", "Ana Oficial", "OFFICIAL"), jurado("o2", "Beto Oficial", "OFFICIAL")];
const suplentes = [jurado("s1", "Carla Suplente", "BACKUP")];

function renderPanel(props: Partial<Parameters<typeof AvailableJurorsPanel>[0]> = {}) {
  const onToggleMobile = vi.fn();
  render(
    <AvailableJurorsPanel
      oficiales={oficiales}
      suplentes={suplentes}
      expandedMobile={false}
      onToggleMobile={onToggleMobile}
      {...props}
    />,
  );
  return onToggleMobile;
}

const panel = () => screen.getByRole("complementary", { name: "Disponibilidad de jurados" });
const listaOficiales = () => screen.getByRole("list", { name: "Jurados oficiales disponibles" });
const listaSuplentes = () => screen.getByRole("list", { name: "Jurados suplentes disponibles" });

describe("AvailableJurorsPanel (ARK-279)", () => {
  afterEach(cleanup);

  it("muestra los oficiales y los suplentes disponibles en listas separadas", () => {
    renderPanel();

    expect(within(listaOficiales()).getAllByRole("listitem")).toHaveLength(2);
    expect(within(listaOficiales()).getByText("Ana Oficial")).toBeTruthy();
    expect(within(listaSuplentes()).getAllByRole("listitem")).toHaveLength(1);
    expect(within(listaSuplentes()).getByText("Carla Suplente")).toBeTruthy();
    expect(screen.getByText("3 libres")).toBeTruthy();
  });

  it("en computador la columna sticky no pasa del alto de la pantalla y tiene un solo scroll", () => {
    renderPanel();

    const clases = panel().className.split(/\s+/);
    expect(clases).toEqual(
      expect.arrayContaining([
        "lg:sticky",
        "lg:top-6",
        "lg:max-h-[calc(100dvh-3rem)]",
        "lg:overflow-y-auto",
      ]),
    );
  });

  it("en computador las listas no tienen scroll propio que capture la rueda del mouse", () => {
    renderPanel();

    for (const lista of [listaOficiales(), listaSuplentes()]) {
      const clases = lista.className.split(/\s+/);
      expect(clases).toEqual(expect.arrayContaining(["lg:max-h-none", "lg:overflow-visible"]));
    }
  });

  it("en celular cada lista conserva su tope de alto para que los suplentes no queden muy abajo", () => {
    renderPanel({ expandedMobile: true });

    for (const lista of [listaOficiales(), listaSuplentes()]) {
      const clases = lista.className.split(/\s+/);
      expect(clases).toEqual(expect.arrayContaining(["max-h-[400px]", "overflow-y-auto"]));
    }
  });

  it("el botón de celular indica si el panel está abierto y avisa al pulsarlo", () => {
    const onToggleMobile = renderPanel({ expandedMobile: false });
    const boton = screen.getByRole("button", { name: /Disponibilidad de Jurados/ });

    expect(boton.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(boton);
    expect(onToggleMobile).toHaveBeenCalledTimes(1);

    cleanup();
    renderPanel({ expandedMobile: true });
    expect(
      screen.getByRole("button", { name: /Disponibilidad de Jurados/ }).getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("sin jurados libres muestra los mensajes vacíos en lugar de las listas", () => {
    renderPanel({ oficiales: [], suplentes: [] });

    expect(screen.getByText("No hay jurados oficiales disponibles")).toBeTruthy();
    expect(screen.getByText("No hay jurados suplentes disponibles")).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
  });
});
