import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuditModal } from "@/features/jurors/assignment/components/AuditModal";
import type { AssignmentAuditLog } from "@/features/jurors/types/jurors";

const ACTOR_ID = "eec17349-02c7-4c57-a5dd-417e35ffc190";
const JUROR_ID = "c3d4e5f6-a7b8-4012-c345-567890123456";

const log = (over: Partial<AssignmentAuditLog> = {}): AssignmentAuditLog => ({
  id: 1,
  action: "ASSIGN",
  teamId: 10,
  jurorId: JUROR_ID,
  newJurorId: JUROR_ID,
  actorUserId: ACTOR_ID,
  actorName: "Admin Romero",
  jurorName: "Ana Gómez",
  newJurorName: "Ana Gómez",
  teamName: "Los Pixeles",
  teamCode: "N1-ABC-101",
  gameName: "Juego Uno",
  notes: "Asignación manual desde módulo admin.",
  notesText: "Asignación manual desde módulo admin.",
  createdAt: "2026-11-18T10:00:00.000Z",
  ...over,
});

const noLookup = () => null;

function renderModal(props: Partial<React.ComponentProps<typeof AuditModal>> = {}) {
  const onLoadMore = vi.fn();
  render(
    <AuditModal
      auditLogs={[log()]}
      totalItems={1}
      loadingMore={false}
      onLoadMore={onLoadMore}
      onClose={vi.fn()}
      getJurorNameById={noLookup}
      getTeamNameById={noLookup}
      getActorNameById={noLookup}
      {...props}
    />
  );
  return { onLoadMore };
}

describe("AuditModal (ARK-262)", () => {
  afterEach(cleanup);

  it("muestra los nombres que trae el back y ningún identificador interno", () => {
    renderModal();

    expect(screen.getByText(/Admin Romero/)).toBeTruthy();
    expect(screen.getByText(/Los Pixeles \(Juego Uno\)/)).toBeTruthy();
    expect(screen.getAllByText(/Ana Gómez/).length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toContain(ACTOR_ID);
    expect(document.body.textContent).not.toContain(JUROR_ID);
  });

  it("si el back no trae el nombre ni la pantalla lo conoce, dice «no disponible» y no el id", () => {
    renderModal({
      auditLogs: [log({ actorName: null, jurorName: null, newJurorName: null, teamName: null, gameName: null })],
    });

    expect(screen.getByText(/Usuario no disponible/)).toBeTruthy();
    expect(screen.getAllByText(/Jurado no disponible/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Equipo no disponible/)).toBeTruthy();
    expect(document.body.textContent).not.toContain(ACTOR_ID);
    expect(document.body.textContent).not.toContain(JUROR_ID);
    expect(document.body.textContent).not.toMatch(/Equipo: 10/);
  });

  it("usa el nombre de las listas de la pantalla cuando el back no lo trae", () => {
    renderModal({
      auditLogs: [log({ actorName: null })],
      getActorNameById: (id) => (id === ACTOR_ID ? "Del listado" : null),
    });

    expect(screen.getByText(/Del listado/)).toBeTruthy();
  });

  it("la nota sale con el texto de la advertencia, no con el código", () => {
    renderModal({
      auditLogs: [
        log({
          notes: "Desasignación manual desde módulo admin. Advertencias aceptadas: TEAM_UNDER_MIN.",
          notesText:
            "Desasignación manual desde módulo admin. Advertencias aceptadas: El grupo quedaría con menos de 3 jurados.",
        }),
      ],
    });

    expect(screen.getByText(/El grupo quedaría con menos de 3 jurados/)).toBeTruthy();
    expect(document.body.textContent).not.toContain("TEAM_UNDER_MIN");
  });

  it("muestra cuántos registros hay y «Cargar más» mientras falten", () => {
    const { onLoadMore } = renderModal({ auditLogs: [log({ id: 2 }), log({ id: 1 })], totalItems: 287 });

    expect(screen.getByText("Mostrando 2 de 287 registros")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cargar más" }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("al cargar la siguiente página el botón se bloquea", () => {
    renderModal({ auditLogs: [log()], totalItems: 287, loadingMore: true });

    const button = screen.getByRole("button", { name: "Cargando..." }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("con todos los registros cargados no ofrece «Cargar más»", () => {
    renderModal({ auditLogs: [log({ id: 2 }), log({ id: 1 })], totalItems: 2 });

    expect(screen.getByText("Mostrando 2 de 2 registros")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Cargar más" })).toBeNull();
  });

  it("sin registros avisa y no muestra el contador", () => {
    renderModal({ auditLogs: [], totalItems: 0 });

    expect(screen.getByText("No hay registros de auditoría.")).toBeTruthy();
    expect(screen.queryByText(/Mostrando/)).toBeNull();
  });
});
