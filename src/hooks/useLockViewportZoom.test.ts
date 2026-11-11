import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LOCKED_VIEWPORT, TOUCH_CLASS, useLockViewportZoom } from "@/hooks/useLockViewportZoom";

const ORIGINAL = "width=device-width, initial-scale=1.0";
const viewportMeta = () => document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
const root = () => document.documentElement;

describe("useLockViewportZoom", () => {
  beforeEach(() => {
    const meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content = ORIGINAL;
    document.head.appendChild(meta);
  });

  afterEach(() => {
    document.head.querySelectorAll('meta[name="viewport"]').forEach((m) => m.remove());
    root().classList.remove(TOUCH_CLASS);
  });

  it("fija la escala y desactiva el zoom por doble toque mientras la pantalla está montada", () => {
    renderHook(() => useLockViewportZoom());

    expect(viewportMeta()?.content).toBe(LOCKED_VIEWPORT);
    expect(viewportMeta()?.content).toContain("maximum-scale=1");
    expect(root().classList.contains(TOUCH_CLASS)).toBe(true);
  });

  it("al salir deja el viewport como estaba, para no quitar el zoom en las demás pantallas", () => {
    const { unmount } = renderHook(() => useLockViewportZoom());

    unmount();

    expect(viewportMeta()?.content).toBe(ORIGINAL);
    expect(root().classList.contains(TOUCH_CLASS)).toBe(false);
  });

  it("no quita la clase de touch-action si ya estaba antes de montar", () => {
    root().classList.add(TOUCH_CLASS);
    const { unmount } = renderHook(() => useLockViewportZoom());

    unmount();

    expect(root().classList.contains(TOUCH_CLASS)).toBe(true);
  });

  it("si no hay etiqueta viewport la crea y la quita al salir", () => {
    viewportMeta()?.remove();
    const { unmount } = renderHook(() => useLockViewportZoom());

    expect(viewportMeta()?.content).toBe(LOCKED_VIEWPORT);
    unmount();
    expect(viewportMeta()).toBeNull();
  });
});
