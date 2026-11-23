# Rutas y pantallas por rol

> **Audiencia:** Frontend, QA · **Actualizado:** 2026-11-05 · **Estado:** completo para `RoutesConfiguration.tsx` de `origin/main` (`5b70d2e`) · **Fuente:** `src/routes/RoutesConfiguration.tsx`

Un solo router (`BrowserRouter`) con una lista `routes` de `{ path, element, roles? }`. Si `roles` está definido, la ruta va dentro de `ProtectedRoute`; si no, es pública. Mientras `AuthContext` carga, se muestra `LoadingScreen`. El rol `Consultor` es un resto sin uso (redirige a `/inicio`). **Staff** es el rol nuevo de V4.

## Públicas (sin sesión)
| Ruta | Pantalla |
|---|---|
| `/` | LandingPage: portada, galería de las ferias pasadas (fotos en `public/galeria/`) y sección de juegos con dos pestañas: minijuegos Arkadash y Arkad Jam, y «De los estudiantes» (destacados por edición de `GET /highlighted-games`, HU-41; se juegan en la cabina con `/play-game/:id?embed=1`, o `/play-game/historical/:id?embed=1` si son de una edición archivada) (ARK-233; código en `features/public/components/gallery/` y `minigames/`) |
| `/ranking` | RankingPage (HU-48, ARK-307): una pestaña por nivel que tenga podio (semestres y al final Colegios, sin «Todos» ni «Externos»), empezando por el primero; cada una muestra solo el 1.º, 2.º y 3.º con logo, equipo y videojuego, ubicados por `levelPosition`, sin nota, sin lista debajo y sin el texto de la ponderación. Pide `GET /teams/final-score/by-n/all` una vez y reparte por `level` (`features/results/api/publicPodium.ts`, `lib/publicPodium.ts`, `hooks/usePublicPodium.ts`, `components/PublicPodium.tsx`). Sin «Ranking público» muestra el aviso de siempre; si falla la consulta, error con «Reintentar» |
| `/informacion` | InformationPage |
| `/equipos` | VideogamesPage (galería) |
| `/ediciones-pasadas` y `/ediciones-pasadas/:editionId/juegos` | PastFairsPage, HistoricalVideogamesPage |
| `/contribuidores` | CreditsPage |
| `/registro-equipo` | **RegistrationGate**: consulta si las inscripciones están abiertas y muestra `TeamRegisterPage` o `RegistrationClosedPage` |
| `/login`, `/OlvidastePassword`, `/establecer-contrasena`, `/verificar-cuenta` | Acceso y cuenta |
| `/play-game/:videogameID` | GamePlayerPage: juego de un equipo de la edición en curso. Descarga el zip y lo abre en un iframe con el service worker (`src/sw.ts`); en celular muestra «Este juego se juega en computador» (HU-40, ARK-225) |
| `/play-game/historical/:videogameID` | GamePlayerPage con el id de un `HistoricalVideogame` (ediciones pasadas y destacados históricos; `GET /historicals/videogames/:id/game-file`, HU-40) |
| `/unauthorized`, `/auth-error` | Errores |

## Por rol
| Rol | Rutas |
|---|---|
| **Todos con sesión** | `/inicio` (HomePage, con Staff incluido) |
| **Administrador** | `/estadisticas`, `/jurados`, `/jurados-assignment`, `/jurados-edicion` (jurados de la edición), `/escarapelas`, `/cuentas-staff`, `/gestionar-ediciones`, `/materias`, `/nrcs`, `/criterios`, `/profesores`, `/equipos-inscritos`, `/tiebreaker` (solo lectura desde HU-47: ganadores por nivel, empates resueltos por fecha de inscripción con su motivo y las decisiones anteriores como historial), `/ponderado-calificaciones`, `/configuracion-evento` (interruptores del evento; desde HU-46, ARK-302, incluye «Notas finales para los estudiantes», que reemplaza la página `/notas-finales`), `/encuesta-jurados` (resultados de la encuesta de experiencia, HU-17), `/realtime-tracking-panel` (seguimiento; solo de la organización, el Profesor ya no entra desde ARK-297) |
| **Administrador + Staff** | `/check-in-jurados` (la llegada se registra solo después de confirmar el nombre, por búsqueda o por QR con `GET /juror-checkin/badge`; ARK-252), `/asistencia-jurados` (el administrador ve además «Agregar jurado del día», HU-24, y «Anular llegada», BG-49) |
| **Administrador + Profesor** | `/profesor` (redirige a `/inicio`) |
| **Profesor** | `/home-profesor`, `/colegios-calificar`, `/colegios-calificar/:id`, `/colegios-evaluados` (sin «Mis empates» desde HU-47, ARK-305). Se usan a 360 px sin scroll horizontal: las filas de botones se envuelven (ARK-295). En `/home-profesor` el botón dice siempre «Editar notas»; si no se puede usar se ve atenuado y al tocarlo avisa la causa (HU-45, ARK-296) |
| **Profesor + Jurado** | `/calificar-lote` |
| **Profesor + Estudiante** | `/mi-equipo` |
| **Jurado** | `/pendientes-calificar`, `/pendientes-calificar/:id`, `/calificados`; `/jurado` redirige a `/inicio` |
| **Estudiante** | `/editar-equipo`, `/mis-jurados` |
| **Consultor** | `/consultor` → `/inicio` |

Hay una ruta `NotFoundPage` para URLs desconocidas.

**Encuesta de experiencia del jurado (HU-17)**: no tiene ruta propia. Es un diálogo (`features/jurors/survey/components/`) que se abre solo cuando el jurado (o profesor jurado) envía su última evaluación (`/pendientes-calificar`, `/colegios-calificar` o `/calificar-lote`). Si la omite, queda el acceso «Responder encuesta» en `/inicio` y en las páginas de pendientes mientras `GET /juror-survey/status` diga `available: true`.

## Reglas al agregar una pantalla
1. Añadirla a `routes` con sus `roles`.
2. Agregarla al **menú lateral** (`layouts/LayoutApplication.tsx`) según rol.
3. Si es un rol nuevo: añadirlo al tipo `Role` (aquí y en `types/auth.ts`), a la lista de rutas permitidas y a la pantalla de inicio; si no, el usuario verá «no autorizado» o un menú vacío.
4. El control real de permisos lo hace el **backend**; ocultar rutas en el front es solo UX.
5. Revisar a **360 px** de ancho (DoD).
6. Prueba en `RoutesConfiguration.test.tsx` si cambia el acceso.

## Nota de seguridad
`ProtectedRoute` guarda en el estado la ruta de origen (`state.from`) para volver tras el login; el cambio de usuario en el mismo navegador produjo «Acceso no autorizado» (BG-08): la ruta de origen se ignora si el rol no tiene permiso.
