import { Link } from "react-router-dom";

/**
 * ARK-128: la cuenta del estudiante se conserva entre ediciones, pero el equipo es de una
 * edición. Quien participó en una edición anterior no tiene equipo en la activa hasta que se
 * inscribe de nuevo; en vez de pantallas vacías o "Cargando..." se le muestra este aviso.
 */
export default function NotEnrolledNotice() {
  return (
    <>
      <p className="text-center text-sm text-muted-foreground">
        Aún no estás inscrito en la edición actual.
      </p>
      <Link
        to="/registro-equipo"
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
      >
        Inscribir equipo
      </Link>
    </>
  );
}
