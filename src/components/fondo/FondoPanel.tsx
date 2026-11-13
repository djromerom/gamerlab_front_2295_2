import { useEffect, useState } from "react";
import { FondoArkad } from "./FondoArkad";

// Mismo corte que el menú lateral (md): por debajo es celular
const CONSULTA_CELULAR = "(max-width: 767px)";

function useEsCelular() {
  const [celular, setCelular] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(CONSULTA_CELULAR).matches : false,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const consulta = window.matchMedia(CONSULTA_CELULAR);
    const alCambiar = () => setCelular(consulta.matches);
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);
  return celular;
}

/**
 * Fondo de los paneles (jurado, staff, admin, profesor, estudiante, presentador externo):
 * - En PC no hay escena: queda el fondo liso del tema, como en Estadísticas.
 * - En celular, un degradado difuminado que casi no se mueve, con colores según el tema (sin fondo en alto contraste).
 * El área de contenido del panel es transparente solo en celular para dejarlo ver.
 */
export function FondoPanel() {
  const celular = useEsCelular();
  if (!celular) return null;
  return <FondoArkad modo="quieto" />;
}

export default FondoPanel;
