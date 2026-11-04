# ARK-83 - Seguimiento por hora de evaluaciones

## Cambios incluidos

- Reemplaza el panel existente de seguimiento con la vista horaria de HU-21.
- Consulta el avance acumulado de evaluaciones por grupo en las horas 8:00, 9:00,
  10:00, 11:00 y 12:00.
- Muestra jurados asignados, jurados presentes, evaluaciones recibidas y
  evaluaciones que cuentan.
- Permite filtrar por nivel, fecha y texto, y ordenar los grupos.
- Actualiza la información automáticamente cada 10 segundos.
- Conserva la última respuesta válida si falla una actualización posterior.
- Hace disponible la ruta para Administrador y Profesor.
- El Profesor accede solo en modo lectura.

## Dependencias

Este frontend depende del endpoint implementado por el backend ARK-82:

```text
GET /evaluation-tracking
```

La edición configurada como `ACTIVE` debe existir en la base de datos.

La API debe tener configurados:

- Permiso `ViewEvaluationTracking`.
- Acceso para Administrador y Profesor.
- Rol Profesor con acceso al servicio correspondiente.

La variable `VITE_ENDPOINT_BACKEND` debe apuntar al backend desplegado.

Ejemplo:

```env
VITE_ENDPOINT_BACKEND=https://api.arkad-test.example
```

## Endpoint utilizado

```text
GET /evaluation-tracking
GET /evaluation-tracking?level=N2
GET /evaluation-tracking?date=2026-11-01
GET /evaluation-tracking?level=N2&date=2026-11-01
```

Filtros admitidos por el backend:

- `level`: `N0`, `N1`, `N2`, `N3` o `N4`.
- `date`: fecha en formato `YYYY-MM-DD`.

Las solicitudes usan la cookie de sesión del usuario y
`credentials: include`.

## Despliegue

1. Desplegar primero el backend ARK-82 y confirmar que `/evaluation-tracking`
   responde para usuarios autorizados.
2. Aplicar o confirmar la migración/permisos correspondientes en la base de
   datos objetivo.
3. Configurar una edición con estado `ACTIVE`.
4. Desplegar el frontend ARK-83.
5. Verificar que `VITE_ENDPOINT_BACKEND` apunta al backend objetivo.
6. Confirmar que el frontend es servido por HTTPS.

Comandos estándar del frontend:

```bash
npm ci
npm run build
```

## Prueba de humo

### Administrador

1. Iniciar sesión como Administrador.
2. Abrir `Panel de Seguimiento` desde el menú Personal.
3. Verificar que se muestran los grupos de la edición activa.
4. Confirmar las columnas de asignados, presentes, recibidas, cuentan y horas
   acumuladas.
5. Probar búsqueda por nombre, código o videojuego.
6. Filtrar por nivel.
7. Cambiar la fecha y validar que se solicitan los cortes correspondientes.
8. Cambiar el orden y confirmar que los grupos con menor avance aparecen
   primero.
9. Esperar al menos 10 segundos y validar la actualización automática.
10. Confirmar que no existen acciones de crear, editar o eliminar en la vista.

### Profesor

1. Iniciar sesión con un usuario Profesor autorizado.
2. Abrir `Seguimiento > Avance por hora`.
3. Confirmar que ve los mismos datos agregados que el Administrador.
4. Confirmar que la vista es de solo lectura.

Un Profesor sin permiso debe recibir respuesta `403`. Staff, Estudiante y Jurado
no deben tener acceso a esta ruta.

## Resaltado de las 11:00

El backend devuelve `belowMinimumAt11` para indicar si el grupo tenía menos de
tres evaluaciones al corte acumulado de las 11:00.

En el frontend:

- La fila se resalta cuando el corte corresponde al día seleccionado y ya pasó
  o pasó la hora 11:00 en Bogotá.
- Las fechas históricas muestran el estado calculado por el backend.
- No deben resaltarse todas las filas simplemente por tener menos de tres
  evaluaciones en el total actual; el resaltado depende de `belowMinimumAt11`.

## Comportamiento ante fallos

Si falla el backend durante la actualización:

- Se mantiene visible la última información válida cargada.
- Aparece una advertencia indicando que se conservan datos anteriores.
- Se continúa intentando actualizar cada 10 segundos.

Si la API responde 404 porque no hay edición activa, aparece el mensaje
`No hay una feria activa` hasta que exista una edición con estado `ACTIVE`.
