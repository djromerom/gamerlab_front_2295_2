import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PushAvailability } from "@/features/notifications/lib/pushNotifications";

vi.mock("@/layouts/LayoutApplication", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
let role = "Jurado";
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ userRole: role }) }));

const { api, getPushSubscription } = vi.hoisted(() => ({
  api: {
    getPushPublicKey: vi.fn(async () => ({ enabled: true, publicKey: "AQID" })),
    getPushStatus: vi.fn(async () => ({ devices: 0 })),
    subscribeToPush: vi.fn(async () => ({ devices: 1 })),
    unsubscribeFromPush: vi.fn(async () => ({ devices: 0 })),
    sendArrivalReminder: vi.fn(),
    sendPendingEvaluationsNotice: vi.fn(),
  },
  getPushSubscription: vi.fn(async (): Promise<unknown> => null),
}));
vi.mock("@/features/notifications/api/pushNotifications", () => api);

let availability: PushAvailability = "supported";
vi.mock("@/features/notifications/lib/pushNotifications", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/features/notifications/lib/pushNotifications")>();
  return { ...real, pushAvailability: () => availability, getPushSubscription: () => getPushSubscription() };
});

import PushNotificationsPage from "@/features/notifications/pages/PushNotificationsPage";

const renderPage = () =>
  render(
    <MemoryRouter>
      <PushNotificationsPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  role = "Jurado";
  availability = "supported";
  getPushSubscription.mockReset();
  getPushSubscription.mockResolvedValue(null);
  Object.values(api).forEach((fn) => fn.mockClear());
});
afterEach(cleanup);

describe("PushNotificationsPage", () => {
  it("iPhone o iPad sin la app: muestra de una vez cómo instalarla, sin error técnico", async () => {
    availability = "needsInstall";
    renderPage();
    expect(await screen.findByText(/primero instala ARKAD como aplicación/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ver la guía para instalar la app" }).getAttribute("href")).toBe("/instalar-app");
    expect(screen.queryByRole("button", { name: "Activar notificaciones" })).toBeNull();
    await waitFor(() => expect(screen.getByText("Desactivadas")).toBeTruthy());
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("al profesor no le ofrece la guía de jurados, pero sí el mensaje", async () => {
    role = "Profesor";
    availability = "needsInstall";
    renderPage();
    expect(await screen.findByText(/primero instala ARKAD como aplicación/)).toBeTruthy();
    expect(screen.queryByRole("link", { name: /guía/ })).toBeNull();
  });

  it("un navegador sin push lo dice sin error técnico", async () => {
    availability = "unsupported";
    renderPage();
    expect(await screen.findByText(/no es compatible con las notificaciones/)).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("con soporte (Android o la app instalada) se pueden activar como antes", async () => {
    renderPage();
    const button = await screen.findByRole("button", { name: "Activar notificaciones" });
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
    expect(getPushSubscription).toHaveBeenCalled();
    expect(screen.queryByText(/instala ARKAD/)).toBeNull();
  });

  it("con una suscripción activa se puede desactivar", async () => {
    const unsubscribe = vi.fn(async () => true);
    getPushSubscription.mockResolvedValue({ endpoint: "https://push.test/abc", unsubscribe, toJSON: () => ({ endpoint: "https://push.test/abc" }) });
    api.getPushStatus.mockResolvedValueOnce({ devices: 1 });
    renderPage();
    const button = await screen.findByRole("button", { name: "Desactivar" });
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(button);
    expect(await screen.findByText("Notificaciones desactivadas en este dispositivo.")).toBeTruthy();
    expect(api.unsubscribeFromPush).toHaveBeenCalledWith("https://push.test/abc");
    expect(unsubscribe).toHaveBeenCalled();
  });
});
