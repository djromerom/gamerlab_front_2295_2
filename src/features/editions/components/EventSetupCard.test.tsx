import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { updateEventSetting } = vi.hoisted(() => ({ updateEventSetting: vi.fn() }));
vi.mock("@/features/editions/api/eventSettings", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/editions/api/eventSettings")>()),
  updateEventSetting,
}));

import EventSetupCard from "@/features/editions/components/EventSetupCard";
import { EventSettingError } from "@/features/editions/api/eventSettings";

const props = {
  url: "/settings/show-ranking",
  title: "Ranking Público",
  subtitle: "Hace visible el ranking general de los equipos para el público.",
  hint: "Se habilita después de activar «Notas finales para los estudiantes».",
};

beforeEach(() => updateEventSetting.mockReset());
afterEach(cleanup);

describe("EventSetupCard", () => {
  it("BG-67: si el back no deja publicar el ranking, lo dice y el interruptor queda apagado", async () => {
    updateEventSetting.mockRejectedValueOnce(
      new EventSettingError("Primero libera la nota final; el ranking se publica después.", 400, "RANKING_REQUIRES_FINAL_GRADE"),
    );
    const onChange = vi.fn();
    render(<EventSetupCard {...props} value={false} onChange={onChange} />);
    expect(screen.getByText(props.hint)).toBeTruthy();
    const toggle = screen.getByRole("switch", { name: "Ranking Público" });
    fireEvent.click(toggle);
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Primero libera la nota final; el ranking se publica después.");
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("cuando se guarda, avisa el valor nuevo a la página", async () => {
    updateEventSetting.mockResolvedValueOnce(undefined);
    const onChange = vi.fn();
    render(<EventSetupCard {...props} value={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch", { name: "Ranking Público" }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(true));
    expect(updateEventSetting).toHaveBeenCalledWith("/settings/show-ranking", "show", true);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("toma el valor que llega después de montar (antes se quedaba con el inicial)", () => {
    const { rerender } = render(<EventSetupCard {...props} value={false} />);
    rerender(<EventSetupCard {...props} value={true} />);
    expect(screen.getByRole("switch", { name: "Ranking Público" }).getAttribute("aria-checked")).toBe("true");
  });

  it("deshabilitado no deja cambiar el valor", () => {
    render(<EventSetupCard {...props} value={false} disabled />);
    const toggle = screen.getByRole("switch", { name: "Ranking Público" });
    expect(toggle.hasAttribute("disabled")).toBe(true);
    fireEvent.click(toggle);
    expect(updateEventSetting).not.toHaveBeenCalled();
  });

  it("con save propio no llama a /settings", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    render(<EventSetupCard title="Notas" subtitle="x" value={false} save={save} />);
    fireEvent.click(screen.getByRole("switch", { name: "Notas" }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(true));
    expect(updateEventSetting).not.toHaveBeenCalled();
  });

  it("si confirm devuelve un diálogo, guarda solo al aceptar", async () => {
    updateEventSetting.mockResolvedValue(undefined);
    const confirm = vi.fn((value: boolean) => (value ? { title: "¿Seguro?", description: "Texto", action: "Sí" } : null));
    render(<EventSetupCard {...props} value={false} confirm={confirm} />);
    fireEvent.click(screen.getByRole("switch", { name: "Ranking Público" }));
    expect(await screen.findByRole("alertdialog")).toBeTruthy();
    expect(updateEventSetting).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Sí" }));
    await waitFor(() => expect(updateEventSetting).toHaveBeenCalledWith("/settings/show-ranking", "show", true));
  });
});
