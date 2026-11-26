import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JurorAssignModal } from "@/features/jurors/assignment/components/JurorAssignModal";

const team = {
  id: 1,
  name: "Equipo A",
  game: "Juego A",
  semester: "2026-1",
  jurados: [],
  requiredJurados: 3,
} as never;

const juror = (id: string, name: string, email: string) =>
  ({
    id,
    name,
    email,
    tipo: "OFFICIAL",
    jurorCategory: "SENIOR",
    evaluatedCount: 0,
    evaluatedGameNames: [],
    unevaluatedCount: 0,
    unevaluatedGameNames: [],
  }) as never;

describe("JurorAssignModal", () => {
  afterEach(cleanup);

  it("Escape cierra el diálogo «Asignar Jurado»", () => {
    const onClose = vi.fn();
    render(
      <JurorAssignModal
        selectedTeam={team}
        juradosDisponiblesParaModal={[]}
        reassignContext={null}
        isSubmitting={false}
        onClose={onClose}
        onAssign={vi.fn()}
        onReassign={vi.fn()}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it("ARK-131: muestra dentro del diálogo el motivo del bloqueo que envía el back", () => {
    const message =
      "No se pueden modificar los jurados del equipo N1-AYP-01: pertenece a «Feria 4», que no es la edición activa. Las ediciones anteriores son de solo lectura.";
    render(
      <JurorAssignModal
        selectedTeam={team}
        juradosDisponiblesParaModal={[]}
        reassignContext={null}
        isSubmitting={false}
        errorMessage={message}
        onClose={vi.fn()}
        onAssign={vi.fn()}
        onReassign={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert").textContent).toBe(message);
  });

  it("sin error no muestra el aviso", () => {
    render(
      <JurorAssignModal
        selectedTeam={team}
        juradosDisponiblesParaModal={[]}
        reassignContext={null}
        isSubmitting={false}
        onClose={vi.fn()}
        onAssign={vi.fn()}
        onReassign={vi.fn()}
      />,
    );

    expect(screen.queryByRole("alert")).toBeNull();
  });

  describe("ARK-277: jurado adicional", () => {
    const fullTeam = {
      ...(team as object),
      jurados: [{ id: "j1" }, { id: "j2" }, { id: "j3" }],
    } as never;
    const aviso = /quedará como jurado adicional/;

    it("avisa que el jurado elegido será adicional cuando el equipo ya tiene 3", () => {
      render(
        <JurorAssignModal
          selectedTeam={fullTeam}
          juradosDisponiblesParaModal={[]}
          reassignContext={null}
          isSubmitting={false}
          onClose={vi.fn()}
          onAssign={vi.fn()}
          onReassign={vi.fn()}
        />,
      );

      expect(screen.getByText(aviso)).toBeTruthy();
      expect(screen.getByText("3/3 jurados asignados")).toBeTruthy();
    });

    it("no avisa si el equipo aún tiene espacios", () => {
      render(
        <JurorAssignModal
          selectedTeam={team}
          juradosDisponiblesParaModal={[]}
          reassignContext={null}
          isSubmitting={false}
          onClose={vi.fn()}
          onAssign={vi.fn()}
          onReassign={vi.fn()}
        />,
      );

      expect(screen.queryByText(aviso)).toBeNull();
    });

    it("no avisa al reasignar, porque no suma jurados", () => {
      render(
        <JurorAssignModal
          selectedTeam={fullTeam}
          juradosDisponiblesParaModal={[]}
          reassignContext={{ teamId: 1, currentJurorId: "j1", currentJurorName: "Ana" }}
          isSubmitting={false}
          onClose={vi.fn()}
          onAssign={vi.fn()}
          onReassign={vi.fn()}
        />,
      );

      expect(screen.queryByText(aviso)).toBeNull();
    });
  });

  describe("barra de búsqueda", () => {
    const disponibles = [
      juror("j1", "José Pérez", "jperez@uninorte.edu.co"),
      juror("j2", "Ana María Núñez", "anunez@gmail.com"),
      juror("j3", "Luis Gómez", "lgomez@uninorte.edu.co"),
    ];
    const renderModal = (props: Partial<Parameters<typeof JurorAssignModal>[0]> = {}) =>
      render(
        <JurorAssignModal
          selectedTeam={team}
          juradosDisponiblesParaModal={disponibles}
          reassignContext={null}
          isSubmitting={false}
          onClose={vi.fn()}
          onAssign={vi.fn()}
          onReassign={vi.fn()}
          {...props}
        />,
      );
    const search = () => screen.getByRole("searchbox", { name: "Buscar jurado por nombre o correo" });
    const type = (text: string) => fireEvent.change(search(), { target: { value: text } });
    const nombres = () => screen.queryAllByRole("button", { name: /Asignar|Reasignar/ }).map((b) => b.parentElement?.querySelector(".truncate")?.textContent);

    it("filtra la lista por nombre sin tildes y la devuelve completa al borrar", () => {
      renderModal();
      expect(nombres()).toEqual(["José Pérez", "Ana María Núñez", "Luis Gómez"]);

      type("jose");
      expect(nombres()).toEqual(["José Pérez"]);

      type("");
      expect(nombres()).toHaveLength(3);
    });

    it("filtra por correo", () => {
      renderModal();
      type("gmail");
      expect(nombres()).toEqual(["Ana María Núñez"]);
    });

    it("sin coincidencias lo dice, distinto de cuando no hay jurados disponibles", () => {
      renderModal();
      type("zzz");
      expect(nombres()).toEqual([]);
      expect(screen.getByText("Ningún jurado disponible coincide con «zzz».")).toBeTruthy();
      expect(screen.queryByText(/No hay jurados disponibles para asignar/)).toBeNull();
    });

    it("«Asignar» de un resultado filtrado asigna ese jurado", () => {
      const onAssign = vi.fn();
      renderModal({ onAssign });
      type("gomez");
      fireEvent.click(screen.getByRole("button", { name: "Asignar" }));
      expect(onAssign).toHaveBeenCalledWith(1, disponibles[2]);
    });

    it("al reasignar también se puede buscar", () => {
      const onReassign = vi.fn();
      renderModal({ reassignContext: { teamId: 1, currentJurorId: "j9", currentJurorName: "Otro" }, onReassign });
      type("nuñez");
      fireEvent.click(screen.getByRole("button", { name: "Reasignar" }));
      expect(onReassign).toHaveBeenCalledWith(1, "j9", disponibles[1]);
    });

    it("sin jurados disponibles no muestra la búsqueda", () => {
      renderModal({ juradosDisponiblesParaModal: [] });
      expect(screen.queryByRole("searchbox")).toBeNull();
      expect(screen.getByText(/No hay jurados disponibles para asignar/)).toBeTruthy();
    });

    it("Escape sigue cerrando la ventana aunque se esté escribiendo", () => {
      const onClose = vi.fn();
      renderModal({ onClose });
      type("ana");
      fireEvent.keyDown(search(), { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
