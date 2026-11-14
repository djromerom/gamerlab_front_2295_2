# Autenticación, estado global y sockets

> **Audiencia:** Frontend · **Actualizado:** 2026-11-05 · **Estado:** parcial (`AuthContext`, `lib/session.ts`, `SocketContext`, `MultiFormContext` leídos en `origin/main`; `TextSizeContext` sin leer) · **Fuente:** `src/contexts/*`, `src/lib/session.ts`

## Contextos
| Contexto | Qué hace |
|---|---|
| `AuthContext` | `user` (perfil de `GET /auth/me`), `loading`, login/logout, renovación de sesión. Al cargar pide el perfil; mientras `loading` el router muestra `LoadingScreen` |
| `SocketContext` | Una conexión `socket.io` única (singleton) a `VITE_ENDPOINT_BACKEND`, `withCredentials: false`; expone `socket` e `isConnected`. Lo usan los likes (`useLikesSocket`) |
| `MultiFormContext` | Paso actual del formulario de registro (`next`, `back`, `reset`, `initialStep` restaurado del borrador) |
| `TextSizeContext` | Tamaño de texto (accesibilidad) |
| `contexts/GlobalStateContext` | Estado global de criterios |

## Sesión (HU-05, HU-06)
- Cookies HttpOnly del backend; el front **no** guarda el token en `localStorage`.
- **Renovación programada** (`lib/session.ts`): se renueva el access token **5 min antes de vencer** (`REFRESH_MARGIN_MS`); con el token de 15 min, cada **10 min**. Si el backend no envía `accessTokenExpiresIn`, se asume 15 min. Si un token dura menos que el margen, renueva a la mitad de su vida. Reintento a los **30 s** si el refresh falla por red/servidor.
- Si el backend rechaza el refresh token (401/403), `apiFetch` lanza `SessionRejectedError` y emite el evento global `auth:session-expired` (`SESSION_EXPIRED_EVENT`) → cierre de sesión.
- Un 401 en una petición que no es de `/auth/` provoca **un** intento de refresh y la repetición de la petición original.
- Refresh en un solo vuelo: peticiones simultáneas no disparan varios refresh (ver `lib/api.ts` y `api.test.ts`).
El `setInterval` fijo de 14 minutos de la copia local de mayo ya no existe en `main` (un comentario en `AuthContext.tsx` lo deja anotado): lo reemplazó la renovación programada.

## Sockets
Los sockets **solo se usan para los likes** de los videojuegos: `useLikesSocket` emite `subscribe:likes` / `unsubscribe:likes` y escucha `likes:updated`; `GameDetailModal` también escucha `likes:updated`. No hay sockets en seguimiento ni asistencia.

Esas pantallas usan **sondeo (polling)**: `RealtimeTrackingPage` recarga cada `REFRESH_SECONDS` (según el backlog, 10 s) y `useJurorAttendance` cada `pollMs`. Los demás `setInterval` son de animaciones (confeti, carrusel, cuenta regresiva, créditos).

## Borradores y persistencia local
- Registro de equipos: borrador en `sessionStorage` (BG-11).
- **Borradores de calificación (HU-18, ARK-105; back ARK-104):** `RatePage`, `SchoolRatePage` y `BatchRatePage` guardan en el servidor (`/evaluation/drafts`).
  - Al abrir: `GET /evaluation/drafts/:id` (individual) o un solo `GET /evaluation/drafts` (lote).
  - Autoguardado (`features/grading/lib/draftAutosaver.ts`, hook `useDraftAutosave`): `PUT` con el formulario completo y la `version` tras 2,5 s sin cambios; una petición a la vez por juego. Indicador «Guardando… / Guardado hace X».
  - 409 `DRAFT_VERSION_CONFLICT`: diálogo «Cargar la versión guardada / Sobrescribir». 409 ya enviada o 403: deja de autoguardar y muestra el mensaje.
  - `localStorage` (`evaluation-draft-<id>`) solo guarda lo que no se pudo sincronizar (sin red, 5xx o sesión perdida), junto con la `version` del servidor sobre la que se escribió (`baseVersion`); reintenta cada 15 s y al volver la red. Al abrir (`pickInitialDraft`, `lib/evaluationDrafts.ts`) **decide la versión, no la hora**: si hay copia local distinta de lo que tiene el servidor, se sube con su `baseVersion`; si el servidor cambió desde otro dispositivo, el 409 abre el diálogo de conflicto. Si la copia es igual a lo del servidor, manda el servidor. Antes se comparaba la hora del navegador con la del servidor y, con el reloj del navegador atrasado, se perdía lo último escrito (corregido el 2026-11-14, front #310; los respaldos viejos sin `baseVersion` todavía se deciden por hora). Las claves antiguas (`rate-draft-`, `batch-rate-draft-`, `school-rate-draft-`) se leen una vez y se borran.
  - Al enviar, el back cierra el borrador; el front detiene el autoguardado y borra la copia local. Al cerrar sesión se borran todas las copias locales (BG-08).
  - Pendientes (`/pendientes-calificar`, `/colegios-calificar`): etiqueta «Borrador · guardado hace X» con `hasDraft`/`draftUpdatedAt`, y panel «Mis borradores» (Continuar, o Descartar si ya se envió o se reasignó el grupo).
