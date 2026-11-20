import { useEffect, useState } from "react";

/**
 * Celulares y tabletas: sin mouse ni hover. Un portátil con pantalla táctil sigue contando como computador
 * (su puntero principal es el mouse o el touchpad).
 */
export const TOUCH_ONLY_QUERY = "(hover: none) and (pointer: coarse)";

const matches = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(TOUCH_ONLY_QUERY).matches;

/**
 * true en celulares y tabletas. Los juegos de los equipos se juegan solo en computador (decisión del 15-nov, HU-40):
 * ahí se muestra el aviso «Este juego se juega en computador» en vez de cargar el zip.
 */
export function useTouchOnly(): boolean {
  const [touchOnly, setTouchOnly] = useState(matches);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(TOUCH_ONLY_QUERY);
    const onChange = () => setTouchOnly(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return touchOnly;
}
