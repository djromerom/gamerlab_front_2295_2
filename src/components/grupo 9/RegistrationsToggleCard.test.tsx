import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RegistrationsToggleCard from "./RegistrationsToggleCard";

const API = import.meta.env.VITE_ENDPOINT_BACKEND;
const url = `${API}/settings/registrations`;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("RegistrationsToggleCard", () => {
  it("lee el estado y envía PATCH {open} al activar", async () => {
    const calls: { method?: string; body?: unknown }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input) !== url) return new Response("{}", { status: 404 });
        calls.push({ method: init?.method, body: init?.body });
        const open = init?.method === "PATCH";
        return new Response(JSON.stringify({ registrationsOpen: open }), { status: 200 });
      }),
    );
    render(<RegistrationsToggleCard />);
    await screen.findByText("Cerradas");
    fireEvent.click(screen.getByRole("switch"));
    await screen.findByText("Abiertas");
    const patch = calls.find((c) => c.method === "PATCH");
    expect(JSON.parse(String(patch?.body))).toEqual({ open: true });
  });

  it("si el PATCH falla, conserva el estado y avisa", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_i: RequestInfo | URL, init?: RequestInit) =>
        init?.method === "PATCH"
          ? new Response("{}", { status: 403 })
          : new Response(JSON.stringify({ registrationsOpen: false }), { status: 200 }),
      ),
    );
    render(<RegistrationsToggleCard />);
    await screen.findByText("Cerradas");
    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() => expect(screen.getByText(/No se pudo actualizar/)).toBeTruthy());
    expect(screen.getByText("Cerradas")).toBeTruthy();
  });

  it("si el back responde con un mensaje, lo muestra junto al código HTTP (ARK-123)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_i: RequestInfo | URL, init?: RequestInit) =>
        init?.method === "PATCH"
          ? new Response(
              JSON.stringify({
                statusCode: 404,
                message: "A configuration for the active edition was not found",
              }),
              { status: 404 },
            )
          : new Response(JSON.stringify({ registrationsOpen: false }), { status: 200 }),
      ),
    );
    render(<RegistrationsToggleCard />);
    await screen.findByText("Cerradas");
    fireEvent.click(screen.getByRole("switch"));
    const alert = await screen.findByText(/No se pudo actualizar las inscripciones/);
    expect(alert.textContent).toContain("A configuration for the active edition was not found");
    expect(alert.textContent).toContain("404");
  });

  it("si el back no manda mensaje, muestra al menos el código HTTP (ARK-123)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_i: RequestInfo | URL, init?: RequestInit) =>
        init?.method === "PATCH"
          ? new Response("<html>Bad Gateway</html>", { status: 502 })
          : new Response(JSON.stringify({ registrationsOpen: false }), { status: 200 }),
      ),
    );
    render(<RegistrationsToggleCard />);
    await screen.findByText("Cerradas");
    fireEvent.click(screen.getByRole("switch"));
    const alert = await screen.findByText(/No se pudo actualizar las inscripciones/);
    expect(alert.textContent).toContain("502");
  });

  it("si el GET falla, muestra error de carga y deshabilita el switch", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 500 })));
    render(<RegistrationsToggleCard />);
    await screen.findByText(/No se pudo cargar/);
    expect(screen.queryByText("Cerradas")).toBeNull();
    expect((screen.getByRole("switch") as HTMLButtonElement).disabled).toBe(true);
  });
  describe("ARK-136: aviso sin NRC al abrir", () => {
    const readinessUrl = `${API}/nrcs/registration-readiness`;
    const stub = (readiness: unknown, calls: { method?: string; body?: unknown }[]) =>
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
          if (String(input) === readinessUrl) {
            return new Response(JSON.stringify(readiness), { status: 200 });
          }
          if (String(input) !== url) return new Response("{}", { status: 404 });
          calls.push({ method: init?.method, body: init?.body });
          const open = init?.method === "PATCH";
          return new Response(JSON.stringify({ registrationsOpen: open }), { status: 200 });
        }),
      );

    it("muestra el orden recomendado", async () => {
      stub({ edition: null, activeNrcCount: 0, hasActiveNrcs: false }, []);
      render(<RegistrationsToggleCard />);
      expect(await screen.findByText(/carga sus NRC y después abre las inscripciones/)).toBeTruthy();
    });

    it("sin NRC pide confirmación; Cancelar no envía el PATCH", async () => {
      const calls: { method?: string }[] = [];
      stub({ edition: { id: 5, title: "Feria 5" }, activeNrcCount: 0, hasActiveNrcs: false }, calls);
      render(<RegistrationsToggleCard />);
      await screen.findByText("Cerradas");
      fireEvent.click(screen.getByRole("switch"));
      expect(await screen.findByText("La edición no tiene NRC activos")).toBeTruthy();
      expect(screen.getByText(/«Feria 5» todavía no tiene NRC activos/)).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
      await waitFor(() => expect(screen.queryByText("La edición no tiene NRC activos")).toBeNull());
      expect(calls.some((c) => c.method === "PATCH")).toBe(false);
      expect(screen.getByText("Cerradas")).toBeTruthy();
    });

    it("sin NRC, Abrir de todas formas envía el PATCH", async () => {
      const calls: { method?: string; body?: unknown }[] = [];
      stub({ edition: { id: 5, title: "Feria 5" }, activeNrcCount: 0, hasActiveNrcs: false }, calls);
      render(<RegistrationsToggleCard />);
      await screen.findByText("Cerradas");
      fireEvent.click(screen.getByRole("switch"));
      fireEvent.click(await screen.findByRole("button", { name: "Abrir de todas formas" }));
      await screen.findByText("Abiertas");
      const patch = calls.find((c) => c.method === "PATCH");
      expect(JSON.parse(String(patch?.body))).toEqual({ open: true });
    });

    it("con NRC abre sin preguntar", async () => {
      const calls: { method?: string }[] = [];
      stub({ edition: { id: 5, title: "Feria 5" }, activeNrcCount: 3, hasActiveNrcs: true }, calls);
      render(<RegistrationsToggleCard />);
      await screen.findByText("Cerradas");
      fireEvent.click(screen.getByRole("switch"));
      await screen.findByText("Abiertas");
      expect(screen.queryByText("La edición no tiene NRC activos")).toBeNull();
    });
  });
});
