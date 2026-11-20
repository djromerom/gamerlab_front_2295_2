import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SubstituteNoticesSection } from "@/features/jurors/substitutes/components/SubstituteNoticesSection";

const fetchUnreadSubstituteNotices = vi.fn();

vi.mock("@/features/jurors/substitutes/api/substituteNotices", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/jurors/substitutes/api/substituteNotices")>()),
  fetchUnreadSubstituteNotices: (...args: unknown[]) => fetchUnreadSubstituteNotices(...args),
}));

const unread = (data: unknown[]) => ({
  edition: { id: 3, title: "Feria" },
  serverTime: "2026-11-14T16:10:00.000Z",
  totals: { unread: data.length, jurors: data.length },
  data,
});

describe("Seguimiento: avisos a suplentes sin leer (HU-22, A1)", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("muestra «Aviso sin leer» y si el correo no salió", async () => {
    fetchUnreadSubstituteNotices.mockResolvedValue(
      unread([
        { noticeId: 7, jurorId: "j1", name: "Sara Gómez", createdAt: "2026-11-14T16:05:00.000Z", teamCount: 2, emailStatus: "FAILED" },
        { noticeId: 8, jurorId: "j2", name: "Luis Mar", createdAt: "2026-11-14T16:07:00.000Z", teamCount: 1, emailStatus: "SENT" },
      ]),
    );
    render(<SubstituteNoticesSection />);

    const sara = (await screen.findByText("Sara Gómez")).closest("tr")!;
    expect(within(sara).getByText("Aviso sin leer")).toBeTruthy();
    expect(within(sara).getByText("El correo no salió")).toBeTruthy();
    expect(within(sara).getByText("2 grupos")).toBeTruthy();
    expect(within(screen.getByText("Luis Mar").closest("tr")!).getByText("Correo enviado")).toBeTruthy();
  });

  it("sin avisos pendientes lo dice", async () => {
    fetchUnreadSubstituteNotices.mockResolvedValue(unread([]));
    render(<SubstituteNoticesSection />);

    expect(await screen.findByText("Todos los suplentes leyeron sus avisos.")).toBeTruthy();
  });

  it("se actualiza cada 10 s y conserva la lista si una consulta falla", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fetchUnreadSubstituteNotices
      .mockResolvedValueOnce(
        unread([{ noticeId: 7, jurorId: "j1", name: "Sara Gómez", createdAt: "2026-11-14T16:05:00.000Z", teamCount: 1, emailStatus: "SENT" }]),
      )
      .mockRejectedValue(new Error("Sin conexión"));
    render(<SubstituteNoticesSection />);

    await act(async () => {});
    expect(screen.getByText("Sara Gómez")).toBeTruthy();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(fetchUnreadSubstituteNotices).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Sara Gómez")).toBeTruthy();
    expect(screen.getByText(/Se mantiene la última información disponible/)).toBeTruthy();
  });
});
