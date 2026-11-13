import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ARK-222: resguardo contra páginas que quedan sin responder a toques y clics.
 * Los diálogos y menús de Radix ponen `pointer-events: none` en el <body> mientras están abiertos; si se cambia de
 * ruta con uno abierto (p. ej. el menú de usuario dentro del panel lateral del celular), a veces ese estilo no se
 * retira. Al cambiar de ruta, si ya no queda ninguna capa abierta, se devuelve la interacción a la página.
 */
export function RestablecerInteraccion() {
  const { pathname } = useLocation();

  useEffect(() => {
    const id = window.setTimeout(() => {
      const capaAbierta = document.querySelector('[role="dialog"][data-state="open"], [role="menu"][data-state="open"], [role="alertdialog"][data-state="open"]');
      if (!capaAbierta && document.body.style.pointerEvents === "none") {
        document.body.style.pointerEvents = "";
      }
    }, 350); // después de la animación de cierre de los paneles
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}

export default RestablecerInteraccion;
