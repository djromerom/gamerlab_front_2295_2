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
});
