# Changelog de la documentación

> Registro de qué existe y en qué estado. Actualizar en cada cambio.

## 2026-11-18: equipos sin nota fuera del podio en /ranking (HU-34 p3, ARK-238)

- [rutas-y-pantallas](../03-frontend/rutas-y-pantallas.md): en `/ranking` un equipo con `finalScore: null` ya no sale con 0.00 ni con puesto, ni en el podio: va al final de la tabla con «—» y «Nota en proceso». Los equipos con nota mantienen el orden y la posición que manda el back. La lógica de «Sin nota» y «Nota en proceso» pasó de `RankingGroupCard` a `features/results/lib/rankingScore.ts`. A 360 px la tabla usa menos relleno para que «Calificación» no se corte.

## 2026-11-18: textos y formatos del Sprint 3 (HU-34, BG-38, HU-23, BG-30; ARK-255)

- [reglas-de-negocio](../01-negocio/reglas-de-negocio.md) y [rutas-y-pantallas](../03-frontend/rutas-y-pantallas.md): dónde se ve la ponderación de la nota final y por qué el `/ranking` público no dice «junior».
- Front: el aviso «volverá a pendiente» de Editar equipo sale solo si cambia el nombre del equipo o el logo, igual que el back (`features/teams/lib/editNeedsReview.ts`); «Próxima pregunta hacia las 2:33 p. m.» sin doble punto y «1 minuto» en singular; la tarjeta «Calificados» del jurado muestra el puntaje con 2 decimales y el código completo del equipo (también el líder y las pantallas de calificación). Los certificados con un solo formato de fecha son del back (ARK-256).

## 2026-11-18: criterio vacío no es 0 y copia local después de un 403 (BG-43 y BG-41 p3, ARK-249)

- [estado-auth-y-sockets](../03-frontend/estado-auth-y-sockets.md): `RatePage` y `SchoolRatePage` no envían con un criterio vacío y marcan cuál falta; el 0 cuenta solo si se escribe (antes `RatePage` convertía el vacío en 0). El 400 de puntajes nulos del back (ARK-250) se muestra legible, también en lote. Después de un 403 el autoguardado sigue escribiendo la copia local con todo lo que el jurado escribe.

## 2026-11-18: sin grupo «Externos» en el ranking (decisión del 16-nov, ARK-273; back ARK-272)

- [reglas-de-negocio](../01-negocio/reglas-de-negocio.md), [decisiones-abiertas](../01-negocio/decisiones-abiertas.md), [glosario](glosario.md) y [evaluacion-y-ranking](../02-backend/evaluacion-y-ranking.md): la casilla «Externo» es solo informativa; no cambia la nota ni el nivel, y no hay podio «Externos». Reemplaza HU-38 (7-nov).
- [rutas-y-pantallas](../03-frontend/rutas-y-pantallas.md): `/ranking` sin pestaña «Externos»; `/tiebreaker` muestra solo «Ganadores por nivel».
- [estado-actual](../00-inicio-rapido/estado-actual.md), [runbook de promoción](../04-devops/runbook-promocion-a-produccion.md) y [checklist de traspaso](../05-scrum-y-proceso/checklist-traspaso-v5.md): la duda del podio de externos queda cerrada; tras desplegar hay que volver a definir el ranking final.

## 2026-11-16: confirmar la llegada y anularla (BG-49, ARK-252)

- [rutas-y-pantallas](../03-frontend/rutas-y-pantallas.md): en `/check-in-jurados` tocar un resultado o leer un QR abre una confirmación con el nombre; en `/asistencia-jurados` el Administrador tiene «Anular llegada» (`PATCH /juror-attendance/:attendanceId/annul`, back ARK-251). La confirmación del QR usa `GET /juror-checkin/badge?token=` (back #307, sin efectos); si entre la vista previa y «Confirmar» otra mesa registró la llegada, `ALREADY_CHECKED_IN` se muestra como aviso. En un servidor sin la ruta, el QR pide buscar por nombre.

## 2026-11-16: notas solo con el ranking publicado (BG-67, ARK-269)

- [estado-auth-y-sockets](../03-frontend/estado-auth-y-sockets.md): `GlobalDataAuthSync` (antes `JuradosAuthSync`) pide las notas de `/reports` solo para el Administrador y las borra al salir; los visitantes ya no reciben 401 de esas rutas.
- [consumo-de-api](../03-frontend/consumo-de-api.md): `features/editions/api/eventSettings.ts`. El interruptor «Ranking Público» muestra el mensaje del back si la nota final no está liberada, y ocultar la nota final deja el interruptor apagado (back ARK-268).

## 2026-11-17: Históricos del profesor (BG-63, ARK-263)

- Front, Panel de Calificaciones: el pie dice «Mostrando 1-25 de 216 equipo(s)» con `metadata.totalItems` del back; los botones de página tienen `aria-label` («Página anterior» / «Página siguiente»).
- Etiqueta de feria única con `src/lib/semesterLabel.ts` (10 → «1», 20 → «Intersemestral», 30 → «2»; p. ej. «2026 - 2»), igual que el back; ya no sale «S20».
- Las columnas «Calificación Feria» y «Calificación Docente» van después de «Equipo» para verse a 1280 px; al cambiar de feria se conserva el NRC si pertenece a la nueva y, si no, vuelve a «Todos» con un aviso.

## 2026-11-16: jugar en el computador los juegos de los equipos (HU-40, ARK-225)

- [rutas-y-pantallas](../03-frontend/rutas-y-pantallas.md): ruta nueva `/play-game/historical/:videogameID` y el aviso de celular en `/play-game`.
- [deuda-tecnica](../03-frontend/deuda-tecnica.md) y [consumo-de-api](../03-frontend/consumo-de-api.md): F1–F8 de SP-03 en el front (COEP `credentialless`, rutas decodificadas, tipos MIME, errores visibles, Cache Storage si el SW se detiene, solo dos juegos guardados, `allow` del iframe y límite de 200 MB con el mensaje del back), `useGameLoader`, `useTouchOnly` y `gameFrame` para juegos en vivo e históricos (back ARK-226).
- **Pendiente aparte:** `01-negocio/juegos-web-por-motor.md` vive solo en el back; sus instrucciones para los equipos todavía dicen 100 MB y «no uses SVG ni `.mjs` hasta F3».

## 2026-11-16: destacados históricos en el selector del admin (HU-41, ARK-230)

- [consumo-de-api](../03-frontend/consumo-de-api.md): `features/editions/api/highlightedGames.ts` (históricos de una edición archivada, `POST` con `historicalVideogameId` y `DELETE …/highlighted-games/historical/:id`) y el hook `useHighlightedGamesSelector`. El selector de Ediciones → Juegos Destacados lista los históricos cuando la edición está `ARCHIVED`, marca cuáles tienen zip y lee los destacados de `GET /highlighted-games?editionId=` (back ARK-229).

## 2026-11-16: notificaciones en Safari de iPhone o iPad sin la app (HU-37, ARK-240)

- [estado-auth-y-sockets](../03-frontend/estado-auth-y-sockets.md): al salir, la baja de la suscripción push va aparte y `POST /auth/logout` se llama siempre. `/notificaciones` usa `getPushSubscription()` y `pushAvailability()` (`features/notifications/lib/pushNotifications.ts`) con la detección de iOS de `lib/pwa.ts` (incluye el iPad con iPadOS): sin la app instalada muestra de una vez cómo instalarla, sin error técnico.

## 2026-11-14: subdominio `jurors/substitutes` (HU-22, ARK-85)

- Nuevo subdominio del front `features/jurors/substitutes/`: aviso «Te asignaron grupos» al suplente (consulta cada 10 s), su explicación con «Entendido» guardado en el navegador por usuario y edición, y la sección «Avisos a suplentes sin leer» del seguimiento. Agregado a la tabla de [dominios](../03-frontend/estructura-objetivo-y-convenciones.md#dominios) y al árbol de [estructura del proyecto](../03-frontend/estructura-del-proyecto.md).

## 2026-11-14: pruebas e2e (TA-06, ARK-42), integración en serie (TA-24, ARK-208) y borradores con reloj desfasado
- [estado-auth-y-sockets](../03-frontend/estado-auth-y-sockets.md): el respaldo local de un borrador se decide por versión (`baseVersion`) y no por la hora del navegador; con el reloj atrasado se perdía lo último escrito (front #310).
- [pruebas-y-verificacion](../04-devops/pruebas-y-verificacion.md): fila nueva de las e2e del front (Playwright contra Arkad-test, workflow `E2E-Arkad-test`, 9 de 9 el 14-nov) y el CI del back con `test:e2e` / `test:db` en serie.
- Copia de [pruebas](../02-backend/pruebas.md) y del [índice de 02-backend](../02-backend/README.md) igualada con el back: 15 e2e, 29 `*.db.spec.ts`, `npm run test:db`, TA-24 y TA-06 (Hecho) y TA-11 (por hacer).
- [`e2e/README.md`](../../../e2e/README.md): capturas del resumen y del informe rehechas con la corrida de 9 de 9 (ya no hay prueba omitida).

## 2026-11-13: reorganización de carpetas aplicada (TA-15, ARK-51)
- Los documentos que citaban rutas o nombres viejos apuntan a la estructura nueva (`src/jurors/` en el back, `src/features/<dominio>/` en el front): [estructura-del-proyecto](../03-frontend/estructura-del-proyecto.md) (árbol reescrito), [consumo-de-api](../03-frontend/consumo-de-api.md), [arquitectura-modulos](../02-backend/arquitectura-modulos.md), [endpoints](../02-backend/endpoints.md) (`members` ya no existe), [integraciones](../02-backend/integraciones.md), [riesgos-y-deuda](../04-devops/riesgos-y-deuda.md), [inventario-de-rutas](../02-backend/inventario-de-rutas.md) (sección `PendingGamesController`) y el resto de `03-frontend/`.
- [Mapa de movimientos](mapa-de-movimientos-ark-51.md): estado «ejecutado» con los PR de cada bloque. Los diagnósticos y las convenciones no se tocan (son el «antes» y la regla).

## 2026-11-13: estructura objetivo y convenciones (TA-14, ARK-50)
- Nuevos: [estructura objetivo y convenciones del backend](../02-backend/estructura-objetivo-y-convenciones.md) (módulo por dominio, `src/jurors/`, nombres y capas), [del frontend](../03-frontend/estructura-objetivo-y-convenciones.md) (`src/features/<dominio>/`) y el [mapa de movimientos para TA-15](mapa-de-movimientos-ark-51.md). Propuesta a validar con el equipo y el profesor el 17-nov.
- Guías de contribución de back y front, [arquitectura-modulos](../02-backend/arquitectura-modulos.md), [estructura-del-proyecto](../03-frontend/estructura-del-proyecto.md), índices y [checklist de traspaso](../05-scrum-y-proceso/checklist-traspaso-v5.md) enlazan a las convenciones.
- Corregido el H4 del [diagnóstico del back](../02-backend/diagnostico-estructura.md): `members/dto/update-member.dto.ts` sigue en uso.
- Decisiones del equipo (13-nov) y ensayo local de TA-15 sin regresiones: se borra `members`; el símbolo principal se llama como su archivo (40 renombres); lo genérico queda en compartido y lo común a subdominios de `jurors` va a `features/jurors/<tipo>/`; imports entre módulos hermanos de `src/jurors/` con `src/`; regla de ubicación del front sin contradicción. El [mapa de movimientos](mapa-de-movimientos-ark-51.md) suma los archivos que entraron con #298 y #299 y corrige destinos y conteos.

## 2026-11-13: diagnóstico de la estructura de los repos (TA-13, ARK-49)
- Nuevos: [diagnóstico del backend](../02-backend/diagnostico-estructura.md) y [diagnóstico del frontend](../03-frontend/diagnostico-estructura.md), medidos sobre `origin/dev` (`a564190`) y `origin/dev-deploy` (`10b4bd7f`), con hallazgos priorizados para TA-14 (ARK-50).
- [estructura-del-proyecto](../03-frontend/estructura-del-proyecto.md) y [deuda-tecnica](../03-frontend/deuda-tecnica.md) del front apuntan al diagnóstico para las cifras de tamaño; se corrige qué contiene `grupo 11`. Índices de [02-backend](../02-backend/README.md) y [03-frontend](../03-frontend/README.md).
- **Pendiente aparte:** las dos copias de `docs/arkad/` (back y front) difieren en 13 archivos desde antes de este cambio; reconciliarlas no es parte de TA-13.

## 2026-11-11: TA-25 (ARK-211)
- Sprint 3 pasa a 157 pts con TA-25 (cambio manual del rol de un profesor de Jurado a Profesor en producción, Santiago). Actualizados [estado-actual](../00-inicio-rapido/estado-actual.md) y [sprints-historial](../05-scrum-y-proceso/sprints-historial.md).

## 2026-11-10: hallazgos de Juan (ARK-158, ARK-188, ARK-194) y decisiones de Allison
- **Presentador externo:** puede ser persona sin equipo (HU-33) o equipo no calificable (HU-39, ARK-207). Certificado solo por correo enviado por el administrador; nadie lo descarga. Actualizados [glosario](glosario.md), [roles-y-permisos](../01-negocio/roles-y-permisos.md) y [reglas-de-negocio](../01-negocio/reglas-de-negocio.md).
- **Equipo rechazado (BG-43, ARK-205):** sin nota final ni ranking, evaluaciones conservadas. Actualizado [reglas-de-negocio](../01-negocio/reglas-de-negocio.md).
- Sprint 3 pasa a 156 pts con BG-43, BG-44 (ARK-206), HU-39 y TA-24 (ARK-208): [estado-actual](../00-inicio-rapido/estado-actual.md) y [sprints-historial](../05-scrum-y-proceso/sprints-historial.md). Claves nuevas en [backlog-y-epicas](../05-scrum-y-proceso/backlog-y-epicas.md).

## 2026-11-10: limpieza de variables, secretos y código muerto (TA-18, ARK-175)
- [riesgos-y-deuda](../04-devops/riesgos-y-deuda.md), [pipeline-y-despliegue](../04-devops/pipeline-y-despliegue.md), [runbook-incidentes](../04-devops/runbook-incidentes.md) y [checklist-traspaso-v5](../05-scrum-y-proceso/checklist-traspaso-v5.md): los `main.yml` legados de los receptores están deshabilitados (falta eliminarlos); el receptor del back es `openlabun/Arkad-Api` (antes «repo openlab»); dependencias retiradas y secretos de GitHub borrados.
- [variables-y-accesos](../04-devops/variables-y-accesos.md) e [integraciones](../02-backend/integraciones.md): secretos que quedan en `Arkad-Api` y retiro de `AZURE_BLOB_SAS_URL` del `.env` de test y prod.
- [endpoints](../02-backend/endpoints.md) y [arquitectura-modulos](../02-backend/arquitectura-modulos.md): `/teams/:teamId/members` no existe en la API (`MembersModule` no está montado).

## 2026-11-09: borradores de calificación en el servidor (HU-18, ARK-105)
- `estado-auth-y-sockets`: la sección de borradores describe el autoguardado en el servidor, el respaldo local sin red, el conflicto de versión y la lista «Mis borradores». **Pendiente:** copiar el cambio a `docs/arkad/` del backend.

## 2026-11-07: etiqueta de la nota final en el front (BG-32, ARK-148)
- `reglas-de-negocio`: dónde se aplica la etiqueta (`gradeLabel` en `src/lib/grades.ts`, panel del estudiante).

## 2026-11-07: zona horaria de las ediciones en el front (BG-34)
- **BG-34 (ARK-157):** el front fija `America/Bogota` al guardar y mostrar las horas de las ediciones. Actualizados [ediciones](../01-negocio/ediciones.md#horas-de-las-ediciones-y-zona-horaria) y [deuda técnica del front](../03-frontend/deuda-tecnica.md). **Pendiente:** copiar estos cambios a `docs/arkad/` del backend para mantener las dos copias iguales.

## 2026-11-07: decisiones de la reunión con profesores (6-nov) y aclaración de externos
- **P-02 cerrada:** 60 % el promedio de los profesores que calificaron al grupo, 40 % el promedio de los jurados junior (HU-34); la nota incompleta queda en «Nota en proceso». Actualizados `glosario`, `reglas-de-negocio`, `decisiones-abiertas`, `que-es-arkad`, `evaluacion-y-ranking`, `estado-actual` y `calendario-feria`.
- **Tres tipos de participante** aclarados en `glosario`, `reglas-de-negocio` y `roles-y-permisos`: equipo normal, colegio (N0, externo, sí se califica solo con seniors) y **presentador externo** (rol nuevo HU-33: lo registra solo el administrador y nunca se califica). La nota de los colegios (promedio de seniors al 100 %) es una propuesta del 7-nov a confirmar con los profesores.
- Decididos por Allison el 7-nov: **rangos de las etiquetas de nota** (BG-32: Excelente 4.50–5.00, Muy bueno 4.00–4.49, Bueno 3.50–3.99, Aceptable 3.00–3.49, Insuficiente 0.00–2.99) y **podio propio para los equipos externos** (HU-38, ARK-204, por confirmar con el profesor). Actualizados `reglas-de-negocio`, `decisiones-abiertas`, `glosario` y `estado-actual`.
- Sprint 3 armado en Jira (142 pts, id 8): `sprints-historial`, `backlog-y-epicas` y `estado-actual`.
- Publicada la actualización en `docs/arkad/` de los repos de backend (a `dev`) y frontend (a `dev-deploy`) por PR, sin `07-`, `08-` ni `entrega-documentacion-ARK-48`. **Pendiente:** `sprints-historial` sigue sin velocidad ni retrospectiva del Sprint 2, y sus estados de Jira por ticket son del 5-nov.

## 2026-11-06: publicación en los repos (Sprint 3) y cierre de BG-14
- La carpeta se publica en `docs/arkad/` de los repos de backend y frontend (mismo contenido en ambos). **No se publican** las carpetas de accesos y credenciales ni las fuentes originales, ni la entrega original de DevOps (`entrega-documentacion-ARK-48`, que trae correos reales de pruebas); los enlaces a esos documentos se quitaron y las referencias dicen «fuera del repo».
- README del frontend reescrito (era la plantilla de Vite) y sección de documentación en el README del backend.
- **BG-14 (ARK-119):** revisada la investigación de Rafael. Causa: dato mal guardado (ya corregido en test) y zona horaria del navegador en el front. Se anota en [ediciones](../01-negocio/ediciones.md#horas-de-las-ediciones-y-zona-horaria), [deuda técnica del front](../03-frontend/deuda-tecnica.md), [backlog](../05-scrum-y-proceso/backlog-y-epicas.md), [sprints](../05-scrum-y-proceso/sprints-historial.md) y [estado actual](../00-inicio-rapido/estado-actual.md). ARK-119 pasó a «Hecho» y el arreglo del front quedó en BG-34 (ARK-157).
- Las demás pendientes de la lista de abajo siguen abiertas.

## 2026-11-05: primera versión completa de la estructura (ticket de documentación, Sprint 2)

| Área | Archivos | Estado |
|---|---|---|
| Raíz | `README.md` | completo |
| 00-inicio-rapido | `que-es-arkad`, `arquitectura-general`, `onboarding-por-rol` | completo |
| 00-inicio-rapido | `estado-actual` | parcial (foto al 5-nov; actualizar al cierre del turno) |
| 01-negocio | `reglas-de-negocio`, `jurados`, `ediciones`, `decisiones-abiertas` | completo según el backlog (P-02 abierta) |
| 01-negocio | `roles-y-permisos`, `equipos-y-verificacion` | completo (2.ª pasada: flujo de registro, verificación y permisos con el inventario) |
| 02-backend | `README`, `auth-y-sesiones`, `cache-y-throttling`, `modelo-de-datos`, `migraciones-y-seed`, `guia-de-contribucion` | completo (leído del código) |
| 02-backend | `arquitectura-modulos`, `endpoints`, `evaluacion-y-ranking`, `integraciones`, `pruebas`, `inventario-de-rutas` | completo contrastado con `origin/main` (2.ª pasada); falta el detalle de excepciones por servicio |
| 03-frontend | `rutas-y-pantallas`, `README`, `guia-de-contribucion` | completo (leído de `origin/main`) |
| 03-frontend | `estructura-del-proyecto`, `estado-auth-y-sockets`, `consumo-de-api`, `deuda-tecnica` | completo en lo verificable (2.ª pasada: sockets, `fetch` directo y pantallas grandes); no se leyó cada componente |
| 04-devops | `README`, `pipeline-y-despliegue`, `variables-y-accesos`, `runbook-promocion-a-produccion`, `riesgos-y-deuda`, `flujo-fullstack-y-ramas` | completo (según Santiago) |
| 04-devops | `runbook-incidentes`, `base-de-datos-operacion`, `docker-y-builds`, `pruebas-y-verificacion` | completo salvo el `docker run` exacto de los receptores (necesita acceso a los repos openlab) |
| 05-scrum-y-proceso | `jira-y-flujo-de-trabajo`, `roles-y-revisiones`, `calendario-feria`, `checklist-traspaso-v5` | completo / se completa al cierre |
| 05-scrum-y-proceso | `sprints-historial`, `backlog-y-epicas` | completo salvo velocidad y retrospectiva (tabla de Jira y resultados por tickets al 5-nov) |
| 06-referencia | `glosario`, `mapa-de-fuentes`, `changelog-documentacion` | completo |

**Notas de método**
- Backend leído de `repo back` en la rama local `fix/ARK-128-team-code-per-edition` (`b075066`, 59 migraciones; producción tiene 61). Frontend leído de `origin/main` (`5b70d2e`) con `git show`; la copia local del front es de mayo y no sirve.
- Se encontró y corrigió que el front **sí** tiene pruebas Vitest y que `Test-front` ya no es un placeholder.
- No se copió `NOTAS_PERSONALES_ALLISON.md`.
- Verificación: 211 enlaces relativos revisados (0 rotos) y búsqueda de IPs, llaves y contraseñas fuera de las carpetas 07 y 08 (0 hallazgos).

## 2026-11-05 (segunda pasada): pendientes resueltos
- **Jira:** tabla ticket → estado en [backlog-y-epicas](../05-scrum-y-proceso/backlog-y-epicas.md) y resultados por tickets de los sprints 1 y 2 en [sprints-historial](../05-scrum-y-proceso/sprints-historial.md). Corrige que HU-07, HU-08, HU-11 y HU-25 ya están «Hecho».
- **Backend contrastado con producción (`origin/main` `bcfe237`):** nuevo [inventario-de-rutas](../02-backend/inventario-de-rutas.md) (203 rutas, 0 sin decidir); módulos nuevos documentados en `arquitectura-modulos` y `endpoints`; `finalize` del ranking, integraciones (comportamiento ante fallos), caché y tiempos de token en sus archivos.
- **Pruebas ejecutadas:** `npm run test:ci` sobre `origin/main`: 1313 pasan, 77 omitidas, 0 fallan ([pruebas](../02-backend/pruebas.md)).
- **Frontend:** `fetch` directo (solo 2 usos), sockets (solo likes) y pantallas más grandes (`JuradosAssignment` ~1960 líneas).
- **Negocio:** flujo de registro de equipos y código de verificación; estado de permisos con el inventario. Se corrigió que el SAS de lectura dura **3 años** por defecto (no 3600 s).
- **Operación:** plan de contingencia técnico propuesto en [calendario-feria](../05-scrum-y-proceso/calendario-feria.md); cómo ejecutar los scripts de `verificacion/`.

## Pendiente para cerrar la documentación (lo que no se puede resolver sin una persona o un acceso)
1. **Comando exacto de `docker run` de los receptores:** está en repos que la cuenta `Ally2403` no puede ver (`openlabun/Arkad-Front` y el repo openlab del back). Lo completa quien tenga acceso ([docker-y-builds](../04-devops/docker-y-builds.md)).
2. **Velocidad en puntos y retrospectiva** de los sprints 1 y 2 (Scrum Master, al cerrar el 6-nov).
3. **P-02** (ponderación definitiva) y las demás decisiones abiertas con los profesores (6-nov).
4. **Fechas de vencimiento** (secreto de Entra ID, dueños de consolas) y **contacto técnico de guardia** del 26-nov.
5. Ensayar la contingencia técnica en el ensayo del 25-nov y ajustar la tabla.
6. Revisar con ojo humano las 48 rutas públicas del inventario.
7. Resultado de la feria del 26-nov y traspaso a V5; actualizar `estado-actual` al cierre del turno.
8. Detalle por servicio de lo que lanza cada excepción (no documentado servicio por servicio).
