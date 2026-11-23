# Reglas de negocio

> **Audiencia:** todos · **Actualizado:** 2026-11-07 · **Estado:** completo (P-02 cerrada el 6-nov; HU-34 y HU-33 en implementación) · **Fuente:** `ARKAD_v4_plan_y_backlog.md` §1.1, §2.2, §4.2, §10.3. Las reglas "vigentes" son las decididas; donde el código aún no las cumple se indica el ticket.

## 1. Calendario de la feria
- **Feria:** 26-nov-2026, 8:00 a ~12:00.
- **Inscripción de grupos:** 2 al 22 de noviembre. Es un calendario **informativo**: el sistema no bloquea inscripciones fuera de esas fechas.
- **Asignación definitiva de jurados:** 23 o 24 de noviembre. Escarapelas el 25.
- **Cronograma del día (parámetros configurables):** inicio 8:00 · alerta informativa 10:00 · control definitivo 11:00 · cierre ~12:00.
- Detalle operativo: [05-scrum-y-proceso/calendario-feria](../05-scrum-y-proceso/calendario-feria.md).

## 2. Niveles y equipos
- El **nivel** es el primer número del código del equipo (`N1-AYP-06`): N1 a N4 son las asignaturas participantes (menor a mayor). **N0 = colegios invitados.** El nivel pertenece al **grupo**, no al jurado.
- **Tres tipos de participante, que no se mezclan:**
  - **Equipo normal:** se califica con profesores y jurados junior (60 % y 40 %).
  - **Colegio (N0):** es externo a Uninorte y **sí se califica**, pero solo lo califican seniors (P-08); no tiene jurados junior. Regla de nota (propuesta del 7-nov pasada al equipo; confirmar con los profesores si hay casos): su nota final es el promedio de los seniors que lo calificaron al 100 %, y no queda en «Nota en proceso» por falta de junior.
  - **Presentador externo (HU-33):** persona sin equipo, o equipo no calificable que presenta un proyecto (HU-39, 10-nov), que **nunca se califica**; no entra al ranking, a la asignación ni a las exportaciones de notas. Lo registra solo el administrador y recibe el certificado final por correo, enviado por el administrador (nadie lo descarga). **Equipo rechazado (BG-43, 10-nov):** no tiene nota final ni sale en el ranking, pero sus evaluaciones se conservan y reaparecen si se reconfirma.
- **Marca «equipo externo» (`isExternal`):** **solo informativa** (decisión de Allison del 16-nov, ARK-272 back / ARK-273 front). En Arkad solo hay estudiantes Uninorte, colegios y presentadores externos (HU-39: no se califican y solo reciben certificado). La casilla no cambia la nota (se calcula con los porcentajes de HU-34 para todos) ni dónde compite el equipo: cada uno compite en su nivel y un colegio marcado compite en Colegios. Las ediciones congeladas, anteriores a HU-34, conservan su regla. La etiqueta «Uninorte / Externo» de la galería sigue como dato.
- Los equipos de **colegios (N0) no tienen código de verificación** (P-25).
- Detalle: [equipos-y-verificacion](equipos-y-verificacion.md).

## 3. Calificación y nota final
| Regla | Valor | Ref. |
|---|---|---|
| Escala | 0 a 5, **2 decimales**; la nota final se redondea a 2 decimales antes de comparar empates | P-04 |
| Evaluaciones mínimas por grupo | **3**. Puede recibir más (suplentes, jurados tardíos) pero **solo cuentan las 3 primeras** (por hora de envío); las demás se guardan. Un grupo con menos de 3 sigue siendo válido y se marca | P-10 |
| Ponderación profesor/jurados | **Decidida el 6-nov (P-02):** **60 %** el promedio de las notas de los profesores que hayan calificado al grupo y **40 %** el promedio de las notas de los jurados junior. Parámetro por edición con esos valores por defecto (HU-34, Sprint 3, en implementación). El texto «Nota final: 60 % profesores y 40 % jurados junior» sale en `/tiebreaker` (con lo configurado) y en el Panel de Calificaciones del profesor; el `/ranking` público ya no muestra ponderación ni notas (HU-48, ARK-307). Fuera de `/tiebreaker` el front usa 60/40 fijo, porque solo el Administrador puede leer `GET /settings/weights` (ARK-255) | P-02, HU-34 |
| Nota incompleta | Si a un grupo le falta la nota de los profesores o la de los jurados junior, queda en **«Nota en proceso»** y sin posición en el ranking. Las ediciones pasadas no cambian. El administrador ve los grupos incompletos antes de liberar la nota (HU-20). Excepción propuesta: colegios (N0), ver sección 2 | HU-34 |
| Cálculo | Se **unifican** los dos cálculos antiguos (vista del ranking: 50/50 por defecto y promedio ausente = 0; servicio: 60/40 y, si falta un grupo, usa solo el otro) en uno solo con la regla de arriba (SP-02, HU-04, HU-34) | §4.2 #6 |
| Nota del profesor | Debe validarse 0–5 con 2 decimales en pantalla y backend (hoy solo `>= 0`) | HU-01 |
| Nota visible al estudiante | Solo la **nota final** (sin desglose), liberada por el administrador **desde las 12:00** | HU-20, HU-30 |
| Etiqueta de la nota | Decidida el 7-nov (BG-32): **Excelente** 4.50 a 5.00 · **Muy bueno** 4.00 a 4.49 · **Bueno** 3.50 a 3.99 · **Aceptable** 3.00 a 3.49 · **Insuficiente** 0.00 a 2.99. Límite inferior incluido; la nota se redondea a 2 decimales antes de elegir la etiqueta; acompaña solo a la nota final. En el front: `gradeLabel` de `src/features/results/lib/grades.ts`, junto a la nota del panel del estudiante (`Scoreboard.tsx`) | BG-32 |

## 4. Ranking y desempate
- **Ranking oficial por nivel (N0–N4).** El ranking general se conserva como vista informativa (P-03).
- **Podio:** los **3 primeros** de cada nivel, configurable (P-29). La tabla de podio se eliminó de la BD en mayo de 2026: el podio se calcula desde el ranking.
- El administrador ve ganadores y empates por nivel para comunicarlos.
- **Ranking público (HU-48, pedido del profesor del 19-nov):** `/ranking` muestra solo el podio (1.º, 2.º y 3.º) de cada nivel, con logo, equipo y videojuego, **sin notas** ni puestos 4 en adelante; `GET /teams/final-score/by-n/:n` ya no los envía (back ARK-306). El ranking completo con notas queda en `/tiebreaker` del Administrador.
- **Desempate (HU-47, decisión del profesor del 19-nov; reemplaza P-05):** siempre **gana el primer grupo inscrito** (`fecha_registro` del equipo), sea del mismo profesor o de profesores distintos. Si la fecha coincide, va primero el equipo de id menor. Los profesores ya no eligen y no hay empates pendientes ni resolución manual (back ARK-304, front ARK-305).
- Las decisiones guardadas antes (`TieBreakDecision`) se conservan como historial, pero ya no cambian el orden. `/tiebreaker` del administrador queda en solo lectura.
- **No hay podio «Externos»** (decisión de Allison del 16-nov; reemplaza la del 7-nov). HU-38 (ARK-219 / ARK-220) armó un grupo «Externos» con podio propio; ARK-272 (back) y ARK-273 (front) lo quitaron de `GET /ranking`, de los ganadores, de los desempates, de `/tiebreaker` y de la pestaña de `/ranking`. Todo equipo compite en su nivel (N0 a N4). Quien no es de Uninorte ni de un colegio se registra como presentador externo (HU-39) y no se califica.

## 5. Asignación de jurados
| Regla | Valor | Ref. |
|---|---|---|
| Grupos por jurado | **Máx. 3** (parámetro configurable). En manual solo **advierte** | HU-07, HU-08 |
| Jurados por grupo | 3 (la automática asigna 3) | P-10 |
| Nivel | Todos los grupos de un jurado del **mismo nivel** (automática lo exige; manual advierte) | HU-07 |
| Colegios (N0) | Solo los califican jurados **senior (= profesores)**. Los junior siguen **bloqueados** | P-08 |
| Senior | **Solo profesores.** Todos los demás jurados son junior | P-07 |
| Suplentes | No reciben carga en la automática: entran solo como reemplazo | HU-07, HU-09 |
| Asignaciones fijas | La automática respeta las asignaciones manuales marcadas como fijas | P-21 |
| Conflicto de interés | La automática no asigna a un profesor equipos de NRC que él dicta (excepto colegios); la manual **advierte** | HU-07, HU-08 |
| Un senior por equipo | La automática intenta incluir al menos un senior/profesor por equipo universitario y avisa cuántos quedaron sin uno | HU-07 |
| Edición | Todo se asigna sobre la **edición activa** (hoy la automática usa la de id más alto: se corrige) | HU-07, BG-18 |
| Qué bloquea / qué advierte | **Bloquean** (integridad): asignación duplicada, usuario que no es jurado/profesor, nivel no legible, junior en colegios, equipo de otra edición. **Advierten** (negocio): límite de 3 grupos, niveles, menos de 3 jurados en un grupo | HU-08 |

Detalle: [jurados](jurados.md).

## 6. Edición (feria) y datos
- Cada edición tiene estado activa / inactiva / archivada. Semestre se guarda como número: 10 primer semestre, 20 intersemestral, 30 segundo.
- La edición de trabajo es siempre la `ACTIVE` y **la decide el servidor**. Solo se escribe sobre la activa; las anteriores son historial de solo lectura. Ver [ediciones](ediciones.md).

## 7. Otras reglas vigentes
- **Likes:** sin video/fotos/logo, tope de 10; con logo pero sin video ni fotos, tope de 20. Dar y quitar like nunca baja de 0; único por usuario.
- **Sesión:** acceso 15 min y refresco 7 días por defecto (en prod dependen de variables); el front renueva 5 min antes de vencer, es decir cada 10 min con el token de 15 (HU-05).
- **Inscripciones:** el flag `registrationsOpen` (por defecto `false`) en la configuración del evento; el Administrador siempre pasa.
- **Fechas del evento en certificados:** variables `EVENT_DATE_TEXT`, `EVENT_TIME_TEXT`, `EVENT_PLACE_TEXT`.
- Reglas del borrador de evaluación: guardado automático en el servidor (P-22, HU-18).
- Exportaciones: se quedan en Excel como están (P-06); el panel del profesor exporta **lo filtrado**.

## 8. Decisiones del flujo por edición (resumen)
(1) crear y activar edición con su configuración; (2) cargar NRC; (3) abrir inscripciones; (4) armar jurados externos; (5) cerrar inscripciones el 22; (6) asignación automática con validaciones; (7) escarapelas el 25; (8) feria el 26 con check-in QR y alta de último momento; (9) la siguiente edición repite el flujo.

Reglas aún abiertas y decisiones con fecha: [decisiones-abiertas](decisiones-abiertas.md).
