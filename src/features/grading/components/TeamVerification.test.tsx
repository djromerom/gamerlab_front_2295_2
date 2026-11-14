import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import {
  TeamVerificationForm,
  TeamVerificationGate,
} from "@/features/grading/components/TeamVerification";
import { useTeamVerification } from "@/hooks/useTeamVerification";
import { apiFetch } from "@/lib/api";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const API = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";
const NOW = new Date(2026, 9, 30, 10, 0, 0); // hora local
const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

type Handlers = {
  status: () => Response | Promise<Response>;
  verify?: () => Response;
};

function mockBackend(h: Handlers) {
  vi.mocked(apiFetch).mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith(`${API}/team-verification/status`)) return h.status();
    if (url === `${API}/team-verification/verify`) return h.verify!();
    return json(404, {});
  });
}

async function renderGate() {
  render(
    <TeamVerificationGate teamId={7} teamName="Grupo X">
      <div>FORMULARIO DE CALIFICACION</div>
    </TeamVerificationGate>,
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

const input = () => screen.getByLabelText("Código de verificación") as HTMLInputElement;
const button = () => screen.getByRole("button", { name: "Verificar" }) as HTMLButtonElement;

async function submit(code: string) {
  fireEvent.change(input(), { target: { value: code } });
  await act(async () => {
    fireEvent.click(button());
    await vi.advanceTimersByTimeAsync(0);
  });
}

describe("TeamVerificationForm: bloqueo por intentos", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("un 429 con hora deshabilita campo y botón y muestra la hora de desbloqueo", async () => {
    const until = new Date(NOW.getTime() + 10 * 60 * 1000);
    mockBackend({
      status: () => json(200, { status: { 7: false }, locks: {} }),
      verify: () =>
        json(429, { message: "Demasiados intentos fallidos. Espera 10 minutos", lockedUntil: until.toISOString() }),
    });
    await renderGate();
    await submit("ABCDEF");

    expect(input().disabled).toBe(true);
    expect(button().disabled).toBe(true);
    expect(screen.getByRole("alert").textContent).toContain(`Intenta de nuevo a las ${hhmm(until)}`);
  });

  it("un 429 sin hora muestra «Espera 10 minutos» y bloquea", async () => {
    mockBackend({
      status: () => json(200, { status: { 7: false }, locks: {} }),
      verify: () => json(429, { message: "Demasiados intentos fallidos. Espera 10 minutos" }),
    });
    await renderGate();
    await submit("ABCDEF");

    expect(input().disabled).toBe(true);
    expect(screen.getByRole("alert").textContent).toContain("Espera 10 minutos");
  });

  it("un 400 con intentos restantes no bloquea", async () => {
    mockBackend({
      status: () => json(200, { status: { 7: false }, locks: {} }),
      verify: () => json(400, { message: "Código incorrecto. Intentos restantes: 3" }),
    });
    await renderGate();
    await submit("ABCDEF");

    expect(input().disabled).toBe(false);
    expect(screen.getByRole("alert").textContent).toContain("Intentos restantes: 3");
  });

  it("al abrir un grupo bloqueado el campo ya sale deshabilitado con la hora", async () => {
    const until = new Date(NOW.getTime() + 7 * 60 * 1000);
    mockBackend({
      status: () =>
        json(200, {
          status: { 7: false },
          locks: { 7: { locked: true, lockedUntil: until.toISOString() } },
        }),
    });
    await renderGate();

    expect(input().disabled).toBe(true);
    expect(button().disabled).toBe(true);
    expect(screen.getByRole("alert").textContent).toContain(`Intenta de nuevo a las ${hhmm(until)}`);
    const url = String(vi.mocked(apiFetch).mock.calls[0][0]);
    expect(url).toContain("includeLocks=true");
  });

  it("cuando pasa lockedUntil el campo se habilita solo", async () => {
    const until = new Date(NOW.getTime() + 60 * 1000);
    mockBackend({
      status: () =>
        json(200, {
          status: { 7: false },
          locks: { 7: { locked: true, lockedUntil: until.toISOString() } },
        }),
    });
    await renderGate();
    expect(input().disabled).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(61 * 1000);
    });
    expect(input().disabled).toBe(false);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("limpia el temporizador al desmontar", async () => {
    const until = new Date(NOW.getTime() + 60 * 1000);
    mockBackend({
      status: () =>
        json(200, {
          status: { 7: false },
          locks: { 7: { locked: true, lockedUntil: until.toISOString() } },
        }),
    });
    await renderGate();
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    cleanup();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("si status falla el formulario funciona como hoy", async () => {
    mockBackend({ status: () => json(500, { message: "boom" }) });
    vi.spyOn(console, "error").mockImplementation(() => {});
    await renderGate();

    expect(input().disabled).toBe(false);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("si el backend viejo no envía locks (mapa plano) no asume bloqueo", async () => {
    mockBackend({ status: () => json(200, { 7: false }) });
    await renderGate();

    expect(input().disabled).toBe(false);
  });

  it("una verificación correcta habilita el formulario de calificación", async () => {
    mockBackend({
      status: () => json(200, { status: { 7: false }, locks: {} }),
      verify: () => json(201, {}),
    });
    await renderGate();
    await submit("ABCDEF");

    expect(screen.getByText("FORMULARIO DE CALIFICACION")).toBeTruthy();
  });

  it("backend viejo: 400 con «Intentos restantes: 0» bloquea 10 minutos sin hora", async () => {
    mockBackend({
      status: () => json(200, { status: { 7: false }, locks: {} }),
      verify: () => json(400, { message: "Código incorrecto. Intentos restantes: 0" }),
    });
    await renderGate();
    await submit("ABCDEF");

    expect(input().disabled).toBe(true);
    expect(button().disabled).toBe(true);
    expect(screen.getByRole("alert").textContent).toContain("Espera 10 minutos");
  });

  it("al expirar el bloqueo no reaparece el error obsoleto", async () => {
    const until = new Date(NOW.getTime() + 60 * 1000);
    mockBackend({
      status: () => json(200, { status: { 7: false }, locks: {} }),
      verify: () =>
        json(429, {
          message: "Demasiados intentos fallidos. Espera 10 minutos",
          lockedUntil: until.toISOString(),
        }),
    });
    await renderGate();
    await submit("ABCDEF");
    expect(input().disabled).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(61 * 1000);
    });
    expect(input().disabled).toBe(false);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("el bloqueo sin hora persiste al cambiar de grupo y volver; el otro grupo no se bloquea", async () => {
    mockBackend({
      status: () => json(200, { status: { 1: false, 2: false }, locks: {} }),
      verify: () => json(429, { message: "Demasiados intentos fallidos. Espera 10 minutos" }),
    });
    function Harness() {
      const [active, setActive] = useState(1);
      const v = useTeamVerification([1, 2]);
      return (
        <>
          <button onClick={() => setActive(1)}>ir A</button>
          <button onClick={() => setActive(2)}>ir B</button>
          {!v.isLoading && (
            <TeamVerificationForm
              key={active}
              teamId={active}
              onVerified={v.markVerified}
              lockedUntil={v.getLockedUntil(active)}
              lockEstimated={v.isLockEstimated(active)}
              onLocked={v.markLocked}
            />
          )}
        </>
      );
    }
    render(<Harness />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    await submit("ABCDEF");
    expect(input().disabled).toBe(true);

    fireEvent.click(screen.getByText("ir B"));
    expect(input().disabled).toBe(false);
    fireEvent.click(screen.getByText("ir A"));
    expect(input().disabled).toBe(true);
    expect(screen.getByRole("alert").textContent).toContain("Espera 10 minutos");
  });

  it("el gate no arrastra el bloqueo al cambiar de grupo", async () => {
    mockBackend({
      status: () => json(200, { status: { 7: false, 8: false }, locks: {} }),
      verify: () => json(429, { message: "Demasiados intentos fallidos. Espera 10 minutos" }),
    });
    const ui = (id: number) => (
      <TeamVerificationGate teamId={id}>
        <div>OK</div>
      </TeamVerificationGate>
    );
    const { rerender } = render(ui(7));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    await submit("ABCDEF");
    expect(input().disabled).toBe(true);

    rerender(ui(8));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(input().disabled).toBe(false);
  });
});
