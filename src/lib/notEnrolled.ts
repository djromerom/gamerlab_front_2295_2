/**
 * ARK-128: el estudiante no tiene equipo en la edición activa (participó en una edición
 * anterior y aún no se inscribe, o nunca se ha inscrito). No es un error de carga: las
 * pantallas lo muestran con el aviso de `NotEnrolledNotice` en vez de un mensaje de error.
 *
 * Cualquier función que busque "mi equipo" (por ejemplo `fetchOwnTeamForEdition`) debe lanzar
 * este error cuando no lo encuentra, para que las pantallas lo distingan de una falla real.
 */
export class NotEnrolledError extends Error {
  constructor(message = "No tienes un equipo en la edición actual.") {
    super(message);
    this.name = "NotEnrolledError";
  }
}

export function isNotEnrolledError(error: unknown): error is NotEnrolledError {
  return error instanceof NotEnrolledError;
}
