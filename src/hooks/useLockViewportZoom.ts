import { useEffect } from "react";

// ARK-165: escala fija en las pantallas del Staff (check-in y asistencia).
// maximum-scale=1 evita en Android el zoom por doble toque y en iOS el zoom al enfocar un campo;
// touch-action: manipulation quita el zoom por doble toque en Safari (iOS ignora maximum-scale para eso).
export const LOCKED_VIEWPORT = "width=device-width, initial-scale=1.0, maximum-scale=1";
export const TOUCH_CLASS = "touch-manipulation";

/**
 * Fija la escala solo mientras la pantalla está montada y deja todo como estaba al salir,
 * para que las pantallas públicas sigan permitiendo el zoom del navegador (accesibilidad).
 */
export function useLockViewportZoom() {
  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "viewport";
      document.head.appendChild(meta);
    }
    const previousContent = meta.getAttribute("content");
    meta.setAttribute("content", LOCKED_VIEWPORT);

    // Clase de Tailwind (touch-action: manipulation); en <html> aplica a botones, listas y la tabla
    const root = document.documentElement;
    const addedClass = !root.classList.contains(TOUCH_CLASS);
    root.classList.add(TOUCH_CLASS);

    return () => {
      if (created) meta.remove();
      else if (previousContent === null) meta.removeAttribute("content");
      else meta.setAttribute("content", previousContent);
      if (addedClass) root.classList.remove(TOUCH_CLASS);
    };
  }, []);
}
