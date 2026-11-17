import { afterEach, describe, expect, it, vi } from "vitest";
import {
  base64UrlToUint8Array,
  getPushSubscription,
  pushAvailability,
  requiresInstalledPwa,
} from "./pushNotifications";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
// iPadOS se presenta como un Mac con pantalla táctil
const IPADOS = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36";

const restore: (() => void)[] = [];
function setNavigator(key: string, value: unknown) {
  const original = Object.getOwnPropertyDescriptor(navigator, key);
  Object.defineProperty(navigator, key, { configurable: true, value });
  restore.push(() => (original ? Object.defineProperty(navigator, key, original) : delete (navigator as unknown as Record<string, unknown>)[key]));
}
function device({ ua, platform = "", touch = 0, standalone = false }: { ua: string; platform?: string; touch?: number; standalone?: boolean }) {
  setNavigator("userAgent", ua);
  setNavigator("platform", platform);
  setNavigator("maxTouchPoints", touch);
  setNavigator("standalone", standalone);
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: standalone && query.includes("standalone"), media: query, addEventListener() {}, removeEventListener() {} }));
}

afterEach(() => {
  while (restore.length) restore.pop()!();
  vi.unstubAllGlobals();
});

describe("base64UrlToUint8Array", () => {
  it("decodifica una clave VAPID base64url", () => {
    const bytes = base64UrlToUint8Array("AQID");
    expect(Array.from(bytes)).toEqual([1, 2, 3]);
  });

  it("acepta guiones y guiones bajos de base64url", () => {
    const bytes = base64UrlToUint8Array("-w");
    expect(Array.from(bytes)).toEqual([251]);
  });
});

describe("requiresInstalledPwa", () => {
  it("iPhone en Safari sin la app instalada", () => {
    device({ ua: IPHONE, platform: "iPhone", touch: 5 });
    expect(requiresInstalledPwa()).toBe(true);
  });

  it("iPad con iPadOS (se presenta como Mac): antes no se reconocía", () => {
    device({ ua: IPADOS, platform: "MacIntel", touch: 5 });
    expect(requiresInstalledPwa()).toBe(true);
  });

  it("con la app instalada ya no hace falta", () => {
    device({ ua: IPHONE, platform: "iPhone", touch: 5, standalone: true });
    expect(requiresInstalledPwa()).toBe(false);
  });

  it("un Mac de verdad (sin pantalla táctil) o Android no lo necesitan", () => {
    device({ ua: IPADOS, platform: "MacIntel", touch: 0 });
    expect(requiresInstalledPwa()).toBe(false);
    device({ ua: ANDROID, platform: "Linux armv8l", touch: 5 });
    expect(requiresInstalledPwa()).toBe(false);
  });
});

describe("pushAvailability", () => {
  it("iPhone sin la app: hay que instalarla primero", () => {
    device({ ua: IPHONE, platform: "iPhone", touch: 5 });
    expect(pushAvailability()).toBe("needsInstall");
  });

  it("Android con push: compatible", () => {
    device({ ua: ANDROID, platform: "Linux armv8l", touch: 5 });
    setNavigator("serviceWorker", {});
    vi.stubGlobal("Notification", function Notification() {});
    vi.stubGlobal("PushManager", function PushManager() {});
    expect(pushAvailability()).toBe("supported");
  });

  it("un navegador sin PushManager: no compatible", () => {
    device({ ua: ANDROID, platform: "Linux armv8l", touch: 5 });
    setNavigator("serviceWorker", {});
    expect(pushAvailability()).toBe("unsupported");
  });
});

describe("getPushSubscription", () => {
  it("sin pushManager (Safari sin la app) devuelve null en vez de lanzar", async () => {
    setNavigator("serviceWorker", { getRegistration: async () => ({}) });
    await expect(getPushSubscription()).resolves.toBeNull();
  });

  it("sin service worker devuelve null", async () => {
    setNavigator("serviceWorker", { getRegistration: async () => undefined });
    await expect(getPushSubscription()).resolves.toBeNull();
  });

  it("con pushManager devuelve la suscripción del navegador", async () => {
    const subscription = { endpoint: "https://push.test/abc" };
    setNavigator("serviceWorker", { getRegistration: async () => ({ pushManager: { getSubscription: async () => subscription } }) });
    await expect(getPushSubscription()).resolves.toBe(subscription);
  });
});
