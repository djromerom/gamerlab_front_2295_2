import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JurorsListModal } from "./JurorsListModal";

const noop = () => {};

function renderList(props: Partial<Parameters<typeof JurorsListModal>[0]> = {}) {
  return render(
    <JurorsListModal
      juradosFiltrados={[]}
      jurorSearch=""
      onJurorSearchChange={noop}
      openJurorMenuId={null}
      onOpenJurorMenuIdChange={noop}
      isSubmitting={false}
      onClose={noop}
      onExport={noop}
      onOpenCreateJuror={noop}
      onEditJuror={noop}
      onResendConfirmation={noop}
      onSendJuradoCert={noop}
      onDownloadJuradoCert={noop}
      onRemoveTeamsFromJuror={noop}
      onToggleJurorType={noop}
      onDeleteJuror={noop}
      {...props}
    />,
  );
}

afterEach(cleanup);

describe("JurorsListModal · filtro por tipo (BG-66)", () => {
  it("abierta desde «Suplentes» dice que está filtrada y deja ver todos", () => {
    const onClearTypeFilter = vi.fn();
    renderList({ typeFilter: "suplentes", onClearTypeFilter });
    expect(screen.getByText("Mostrando solo: Suplentes")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ver todos" }));
    expect(onClearTypeFilter).toHaveBeenCalledTimes(1);
  });

  it("sin filtro no muestra el aviso", () => {
    renderList();
    expect(screen.queryByText(/Mostrando solo/)).toBeNull();
  });
});
