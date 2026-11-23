import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import VerificationCodesCard from "@/features/editions/components/VerificationCodesCard";

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ apiFetch }));

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const ENABLED = { verificationCodesEnabled: true, changedAt: null, changedBy: null };
const DISABLED = {
  verificationCodesEnabled: false,
  changedAt: "2026-11-21T20:10:00.000Z",
  changedBy: { id: "a1", name: "Allison Ruiz" },
};

const mockBackend = (get: () => Response, patch?: () => Response) =>
  apiFetch.mockImplementation(async (url: string, init?: RequestInit) => {
    if (!String(url).endsWith("/settings/verification-codes")) return json({}, 404);
    return init?.method === "PATCH" ? patch!() : get();
  });

const toggle = () => screen.getByRole("switch", { name: "Exigir código de verificación a los jurados" });

afterEach(() => {
  cleanup();
  apiFetch.mockReset();
});

describe("VerificationCodesCard (HU-50, ARK-311)", () => {
  it("se muestra encendido por defecto y sin «último cambio» si nunca se cambió", async () => {
    mockBackend(() => json(ENABLED));
    render(<VerificationCodesCard />);

    await waitFor(() => expect(toggle().getAttribute("aria-checked")).toBe("true"));
    expect(toggle().hasAttribute("disabled")).toBe(false);
    expect(screen.queryByText(/Último cambio/)).toBeNull();
  });

  it("apagarlo pide confirmación, envía {enabled: false} y muestra quién y cuándo", async () => {
    mockBackend(() => json(ENABLED), () => json(DISABLED));
    render(<VerificationCodesCard />);
    await waitFor(() => expect(toggle().getAttribute("aria-checked")).toBe("true"));

    fireEvent.click(toggle());
    expect(await screen.findByText("¿Dejar de exigir el código de verificación?")).toBeTruthy();
    expect(apiFetch.mock.calls.some(([, init]) => init?.method === "PATCH")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Dejar de exigirlo" }));

    await screen.findByText(/Último cambio: Allison Ruiz, el 21\/11\/2026/);
    const patch = apiFetch.mock.calls.find(([, init]) => init?.method === "PATCH");
    expect(JSON.parse(patch![1].body)).toEqual({ enabled: false });
    expect(toggle().getAttribute("aria-checked")).toBe("false");
  });

  it("encenderlo no pide confirmación", async () => {
    mockBackend(() => json(DISABLED), () => json({ ...DISABLED, verificationCodesEnabled: true }));
    render(<VerificationCodesCard />);
    await waitFor(() => expect(toggle().getAttribute("aria-checked")).toBe("false"));

    fireEvent.click(toggle());

    await waitFor(() => expect(toggle().getAttribute("aria-checked")).toBe("true"));
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("si el back rechaza el cambio, se revierte y muestra el motivo", async () => {
    mockBackend(
      () => json(DISABLED),
      () => json({ code: "EVENT_CONFIGURATION_NOT_FOUND", message: "La edición activa no tiene configuración" }, 404),
    );
    render(<VerificationCodesCard />);
    await waitFor(() => expect(toggle().getAttribute("aria-checked")).toBe("false"));

    fireEvent.click(toggle());

    expect(await screen.findByText("La edición activa no tiene configuración")).toBeTruthy();
    expect(toggle().getAttribute("aria-checked")).toBe("false");
  });

  it("si no se puede leer, deja el interruptor deshabilitado con «Reintentar»", async () => {
    mockBackend(() => json({}, 500));
    render(<VerificationCodesCard />);

    expect(await screen.findByText(/No se pudo leer si se exige el código/)).toBeTruthy();
    expect(toggle().hasAttribute("disabled")).toBe(true);

    mockBackend(() => json(ENABLED));
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(toggle().getAttribute("aria-checked")).toBe("true"));
  });
});
