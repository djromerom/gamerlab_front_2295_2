import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthContextType } from "@/types/auth";
import {
  SubstituteNoticeError,
  type MySubstituteNotices,
  type SubstituteNotice,
} from "@/features/jurors/substitutes/api/substituteNotices";
import { SubstituteNoticesProvider } from "@/features/jurors/substitutes/contexts/SubstituteNoticesContext";
import { SubstituteNotices } from "@/features/jurors/substitutes/components/SubstituteNotices";
import { SubstituteGuideAccess } from "@/features/jurors/substitutes/components/SubstituteGuideAccess";

const fetchMySubstituteNotices = vi.fn();
const markSubstituteNoticeRead = vi.fn();
const auth: Partial<AuthContextType> = {};

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));

vi.mock("@/features/jurors/substitutes/api/substituteNotices", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/jurors/substitutes/api/substituteNotices")>()),
  fetchMySubstituteNotices: (...args: unknown[]) => fetchMySubstituteNotices(...args),
  markSubstituteNoticeRead: (...args: unknown[]) => markSubstituteNoticeRead(...args),
}));

const NOTICE: SubstituteNotice = {
  id: 7,
  createdAt: "2026-11-14T16:05:00.000Z", // 11:05 a. m. en Colombia
  readAt: null,
  message: "Te asignaron grupos",
  teams: [
    { teamId: 1, teamCode: "N1-AYP-06", teamName: "Pixel", videogameName: "Pixel Quest", level: 1, levelLabel: "Nivel 1" },
    { teamId: 2, teamCode: "N0-COL-02", teamName: "Colegio Andino", videogameName: null, level: 0, levelLabel: "Colegios" },
  ],
};

const mine = (data: SubstituteNotice[], extra: Partial<MySubstituteNotices> = {}): MySubstituteNotices => ({
  edition: { id: 3, title: "Feria Gamer 2026-2" },
  serverTime: "2026-11-14T16:06:00.000Z",
  unreadCount: data.filter((n) => n.readAt === null).length,
  data,
  ...extra,
});

const renderNotices = () =>
  render(
    <SubstituteNoticesProvider>
      <MemoryRouter initialEntries={["/inicio"]}>
        <SubstituteNotices />
        <Routes>
          <Route path="/inicio" element={<SubstituteGuideAccess />} />
          <Route path="/pendientes-calificar" element={<p>Pendientes por calificar</p>} />
        </Routes>
      </MemoryRouter>
    </SubstituteNoticesProvider>,
  );

const acknowledgeIfShown = async () => {
  fireEvent.click(await screen.findByRole("button", { name: "Entendido" }));
};

describe("Suplente: explicación y aviso «Te asignaron grupos» (HU-22, ARK-85)", () => {
  beforeEach(() => {
    Object.assign(auth, { user: { id: "suplente-1", firstName: "Sara" }, userRole: "Jurado" });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("primer ingreso del suplente: la explicación sale sola y no se cierra con Escape", async () => {
    fetchMySubstituteNotices.mockResolvedValue(mine([], { isSubstitute: true }));
    renderNotices();

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Eres jurado suplente")).toBeTruthy();
    expect(within(dialog).getByText(/mesa de escarapelas desde las 8:00/)).toBeTruthy();
    expect(within(dialog).getByText(/solo se promedian las tres primeras evaluaciones/)).toBeTruthy();

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.getByRole("alertdialog")).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "Entendido" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(window.localStorage.getItem("arkad:substitute-guide:suplente-1:3")).not.toBeNull();
    expect(fetchMySubstituteNotices).toHaveBeenCalledWith("all");
  });

  it("después del «Entendido» no vuelve a salir sola, pero se puede consultar desde el inicio", async () => {
    window.localStorage.setItem("arkad:substitute-guide:suplente-1:3", "2026-11-14T13:00:00.000Z");
    fetchMySubstituteNotices.mockResolvedValue(mine([], { isSubstitute: true }));
    renderNotices();

    fireEvent.click(await screen.findByRole("button", { name: "¿Qué hace un suplente?" }));
    expect(await screen.findByRole("alertdialog")).toBeTruthy();
  });

  it("un jurado oficial no ve la explicación ni el acceso", async () => {
    fetchMySubstituteNotices.mockResolvedValue(mine([], { isSubstitute: false }));
    renderNotices();

    await waitFor(() => expect(fetchMySubstituteNotices).toHaveBeenCalled());
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.queryByRole("button", { name: "¿Qué hace un suplente?" })).toBeNull();
  });

  it("un profesor no consulta los avisos", async () => {
    Object.assign(auth, { userRole: "Profesor" });
    renderNotices();

    await act(async () => {});
    expect(fetchMySubstituteNotices).not.toHaveBeenCalled();
  });

  it("muestra el aviso con los grupos y su nivel, y «Ver mis grupos» lleva a pendientes", async () => {
    window.localStorage.setItem("arkad:substitute-guide:suplente-1:3", "x");
    fetchMySubstituteNotices.mockResolvedValue(mine([NOTICE]));
    renderNotices();

    const card = await screen.findByRole("alert");
    expect(within(card).getByText("Te asignaron grupos")).toBeTruthy();
    expect(within(card).getByText(/2 grupos · asignados a las 11:05/)).toBeTruthy();
    expect(within(card).getByText("Pixel")).toBeTruthy();
    expect(within(card).getByText("Nivel 1")).toBeTruthy();
    expect(within(card).getByText("Colegios")).toBeTruthy();
    expect(within(card).getByText(/Pixel Quest/)).toBeTruthy();

    fireEvent.click(within(card).getByRole("link", { name: "Ver mis grupos" }));
    expect(await screen.findByText("Pendientes por calificar")).toBeTruthy();
    // sigue en pantalla hasta que lo marque como leído
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("sin isSubstitute del back, el primer aviso también abre la explicación", async () => {
    fetchMySubstituteNotices.mockResolvedValue(mine([NOTICE]));
    renderNotices();

    await acknowledgeIfShown();
    expect(await screen.findByText("Te asignaron grupos")).toBeTruthy();
  });

  it("marcar como leído quita el aviso", async () => {
    window.localStorage.setItem("arkad:substitute-guide:suplente-1:3", "x");
    fetchMySubstituteNotices.mockResolvedValue(mine([NOTICE]));
    markSubstituteNoticeRead.mockResolvedValue({ ...NOTICE, readAt: "2026-11-14T16:10:00.000Z" });
    renderNotices();

    fireEvent.click(await screen.findByRole("button", { name: /Marcar como leído/ }));

    await waitFor(() => expect(screen.queryByText("Te asignaron grupos")).toBeNull());
    expect(markSubstituteNoticeRead).toHaveBeenCalledWith(7);
  });

  it("sin conexión el aviso se queda y avisa que se puede reintentar", async () => {
    window.localStorage.setItem("arkad:substitute-guide:suplente-1:3", "x");
    fetchMySubstituteNotices.mockResolvedValue(mine([NOTICE]));
    markSubstituteNoticeRead.mockRejectedValue(new TypeError("Failed to fetch"));
    renderNotices();

    fireEvent.click(await screen.findByRole("button", { name: /Marcar como leído/ }));

    expect(await screen.findByText(/No se pudo marcar como leído/)).toBeTruthy();
    expect(screen.getByText("Te asignaron grupos")).toBeTruthy();
  });

  it("si el aviso ya no existe (404) lo quita y vuelve a consultar", async () => {
    window.localStorage.setItem("arkad:substitute-guide:suplente-1:3", "x");
    fetchMySubstituteNotices.mockResolvedValueOnce(mine([NOTICE])).mockResolvedValue(mine([]));
    markSubstituteNoticeRead.mockRejectedValue(
      new SubstituteNoticeError("El aviso no existe o no es tuyo.", 404, "SUBSTITUTE_NOTICE_NOT_FOUND"),
    );
    renderNotices();

    fireEvent.click(await screen.findByRole("button", { name: /Marcar como leído/ }));

    await waitFor(() => expect(screen.queryByText("Te asignaron grupos")).toBeNull());
    expect(fetchMySubstituteNotices).toHaveBeenCalledTimes(2);
  });

  it("consulta cada 10 s y el aviso aparece en cuanto le asignan grupos", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    window.localStorage.setItem("arkad:substitute-guide:suplente-1:3", "x");
    fetchMySubstituteNotices.mockResolvedValueOnce(mine([], { isSubstitute: true })).mockResolvedValue(mine([NOTICE], { isSubstitute: true }));
    renderNotices();

    await act(async () => {});
    expect(screen.queryByText("Te asignaron grupos")).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(screen.getByText("Te asignaron grupos")).toBeTruthy();
    expect(fetchMySubstituteNotices).toHaveBeenCalledTimes(2);
  });

  it("si una consulta falla, conserva el aviso que ya mostraba", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    window.localStorage.setItem("arkad:substitute-guide:suplente-1:3", "x");
    fetchMySubstituteNotices
      .mockResolvedValueOnce(mine([NOTICE]))
      .mockRejectedValue(new SubstituteNoticeError("Error", 503));
    renderNotices();

    await act(async () => {});
    expect(screen.getByText("Te asignaron grupos")).toBeTruthy();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(screen.getByText("Te asignaron grupos")).toBeTruthy();
  });
});
