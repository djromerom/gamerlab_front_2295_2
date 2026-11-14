import { useEffect, useLayoutEffect, useRef } from "react";
import { createScene, type Scene, type BackgroundMode } from "@/components/background/scene";

interface ArkadBackgroundProps {
  /** "vivo" en la landing, "lento" en las páginas públicas de lectura, "quieto" en los paneles (solo celular). */
  modo: BackgroundMode;
  /** Centro de la escena en fracciones de la ventana (x, y). Por defecto el centro. */
  centro?: [number, number];
  /** Opacidad del logo 3D; 0 lo oculta. */
  opacidadLogo?: number;
  /** Aplica el estilo visual nuevo de las páginas públicas (ver index.css, [data-estilo="nuevo"]). */
  estiloNuevo?: boolean;
}

// jsdom (pruebas) no implementa canvas: ahí no se monta la escena
const sinCanvas = typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent);

function forzarOscuro() {
  const raiz = document.documentElement.classList;
  raiz.remove("light", "high-contrast");
  raiz.add("dark");
}

/**
 * Fondo nuevo de Arkad (ARK-222): escena en un canvas fijo detrás de la página.
 * No intercepta clics, no se imprime y no se muestra en alto contraste.
 */
export function ArkadBackground({ modo, centro, opacidadLogo, estiloNuevo = false }: ArkadBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const escenaRef = useRef<Scene | null>(null);
  const cx = centro?.[0], cy = centro?.[1];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || sinCanvas) return;
    const escena = createScene(canvas, { modo });
    escenaRef.current = escena;
    return () => {
      escena.destruir();
      escenaRef.current = null;
    };
    // la escena se crea una vez; los cambios de opciones van por actualizar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    escenaRef.current?.actualizar({
      modo,
      centro: cx !== undefined && cy !== undefined ? [cx, cy] : undefined,
      opacidadLogo,
    });
  }, [modo, cx, cy, opacidadLogo]);

  // Las páginas públicas (vivo y lento) van siempre en tema oscuro. Algunas no lo forzaban y, al llegar desde otra
  // que lo quita al desmontarse (p. ej. Videojuegos → Ediciones pasadas), quedaban en tema claro. Se aplica antes del
  // primer pintado y se reafirma después de las limpiezas de la página anterior. El panel reaplica el tema guardado.
  useLayoutEffect(() => {
    if (modo !== "quieto") forzarOscuro();
  }, [modo]);
  useEffect(() => {
    if (modo !== "quieto") forzarOscuro();
  }, [modo]);

  // Antes del primer pintado: así la página no muestra un instante el estilo viejo ni dispara sus transiciones
  useLayoutEffect(() => {
    if (!estiloNuevo) return;
    document.body.dataset.estilo = "nuevo";
    return () => {
      delete document.body.dataset.estilo;
    };
  }, [estiloNuevo]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-fondo={modo}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full print:hidden"
    />
  );
}

export default ArkadBackground;
