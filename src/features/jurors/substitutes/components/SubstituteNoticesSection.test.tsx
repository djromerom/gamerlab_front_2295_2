import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SubstituteNoticeError } from "@/features/jurors/substitutes/api/substituteNotices";
import { SubstituteNoticesSection } from "@/features/jurors/substitutes/components/SubstituteNoticesSection";

const fetchUnreadSubstituteNotices = vi.fn();
const resendSubstituteNoticeEmail = vi.fn();
const toast = vi.hoisted(() => ({ success: vi.fn(), info: vi.fn(), error: vi.fn() }));

vi.mock("sonner", () => ({ toast }));

vi.mock("@/features/jurors/substitutes/api/substituteNotices", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/jurors/substitutes/api/substituteNotices")>()),
  fetchUnreadSubstituteNotices: (...args: unknown[]) => fetchUnreadSubstituteNotices(...args),
  resendSubstituteNoticeEmail: (...args: unknown[]) => resendSubstituteNoticeEmail(...args),
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

const failed = { noticeId: 7, jurorId: "j1", name: "Sara Gómez", createdAt: "2026-11-14T16:05:00.000Z", teamCount: 2, emailStatus: "FAILED" };
const sent = { noticeId: 8, jurorId: "j2", name: "Luis Mar", createdAt: "2026-11-14T16:07:00.000Z", teamCount: 1, emailStatus: "SENT" };

describe("Seguimiento: reenviar el correo que no salió (BG-74)", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("solo ofrece «Reenviar correo» en los avisos cuyo correo no salió", async () => {
    fetchUnreadSubstituteNotices.mockResolvedValue(
      unread([failed, sent, { ...sent, noticeId: 9, name: "Ana Paz", emailStatus: "PENDING" }, { ...sent, noticeId: 10, name: "Eva Ruiz", emailStatus: "SKIPPED" }]),
    );
    render(<SubstituteNoticesSection />);

    await screen.findByText("Sara Gómez");
    expect(screen.getAllByRole("button", { name: /Reenviar correo/ })).toHaveLength(1);
    expect(within(screen.getByText("Sara Gómez").closest("tr")!).getByRole("button", { name: "Reenviar correo a Sara Gómez" })).toBeTruthy();
  });

  it("deshabilita el botón mientras reenvía, pasa la fila a «Enviando correo» y vuelve a consultar", async () => {
    fetchUnreadSubstituteNotices.mockResolvedValueOnce(unread([failed])).mockResolvedValue(unread([{ ...failed, emailStatus: "PENDING" }]));
    let finish!: (value: unknown) => void;
    resendSubstituteNoticeEmail.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<SubstituteNoticesSection />);

    fireEvent.click(await screen.findByRole("button", { name: "Reenviar correo a Sara Gómez" }));
    const button = screen.getByRole("button", { name: "Reenviar correo a Sara Gómez" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe("Reenviando...");
    expect(resendSubstituteNoticeEmail).toHaveBeenCalledWith(7);

    await act(async () => finish({ noticeId: 7, emailStatus: "PENDING" }));
    const row = screen.getByText("Sara Gómez").closest("tr")!;
    await waitFor(() => expect(within(row).getByText("Enviando correo")).toBeTruthy());
    expect(within(row).queryByRole("button")).toBeNull();
    expect(fetchUnreadSubstituteNotices).toHaveBeenCalledTimes(2);
    expect(toast.success).toHaveBeenCalledWith("Se reenvió el correo a Sara Gómez", expect.anything());
  });

  it.each([
    [new SubstituteNoticeError("Ya no", 409, "SUBSTITUTE_NOTICE_EMAIL_NOT_FAILED"), "Ese correo ya se estaba reenviando o ya salió. Se actualizó la lista."],
    [new SubstituteNoticeError("No existe", 404, "SUBSTITUTE_NOTICE_NOT_FOUND"), "Ese aviso ya no existe. Se actualizó la lista."],
  ])("con %s muestra un aviso corto y refresca la lista", async (error, message) => {
    fetchUnreadSubstituteNotices.mockResolvedValueOnce(unread([failed])).mockResolvedValue(unread([{ ...failed, emailStatus: "SENT" }]));
    resendSubstituteNoticeEmail.mockRejectedValue(error);
    render(<SubstituteNoticesSection />);

    fireEvent.click(await screen.findByRole("button", { name: "Reenviar correo a Sara Gómez" }));
    await waitFor(() => expect(toast.info).toHaveBeenCalledWith(message));
    expect(toast.error).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText("Correo enviado")).toBeTruthy());
    expect(fetchUnreadSubstituteNotices).toHaveBeenCalledTimes(2);
  });

  it("con otro error lo muestra y deja el botón para intentar de nuevo", async () => {
    fetchUnreadSubstituteNotices.mockResolvedValue(unread([failed]));
    resendSubstituteNoticeEmail.mockRejectedValue(new SubstituteNoticeError("No tienes permiso para reenviar el correo.", 403));
    render(<SubstituteNoticesSection />);

    fireEvent.click(await screen.findByRole("button", { name: "Reenviar correo a Sara Gómez" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No tienes permiso para reenviar el correo."));
    const button = (await screen.findByRole("button", { name: "Reenviar correo a Sara Gómez" })) as HTMLButtonElement;
    await waitFor(() => expect(button.disabled).toBe(false));
    expect(screen.getByText("El correo no salió")).toBeTruthy();
  });
});
