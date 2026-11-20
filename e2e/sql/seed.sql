-- ARK-42 (TA-06): datos propios de las pruebas funcionales. SOLO Arkad-test.
-- Se ejecuta con psql; db.ts antepone `\set pwhash '<hash bcrypt>'`.
-- Todo lleva prefijo e2e- (ids de usuario, nombres de equipo/videojuego) y se borra con cleanup.sql.
-- Crea 2 jurados (A: 4 equipos, B: 1 equipo), 5 dueños de equipo, 5 equipos con su videojuego e
-- integrante, las asignaciones jurado-equipo y la fila jurado_edicion de cada jurado.
BEGIN;

DO $$
DECLARE
  edition int;
BEGIN
  IF current_database() <> 'arkad_db' THEN
    RAISE EXCEPTION 'e2e seed: la base es %, solo se permite arkad_db (Arkad-test)', current_database();
  END IF;
  SELECT id_edicion INTO edition FROM ediciones WHERE estado = 'ACTIVE' ORDER BY id_edicion DESC LIMIT 1;
  IF edition IS NULL THEN
    RAISE EXCEPTION 'e2e seed: no hay edición activa';
  END IF;
  IF EXISTS (SELECT 1 FROM usuarios WHERE id_usuario LIKE 'e2e-%') THEN
    RAISE EXCEPTION 'e2e seed: ya hay usuarios e2e-. Otra corrida está en curso o quedaron restos: ejecuta primero npm run e2e:cleanup';
  END IF;
  IF EXISTS (SELECT 1 FROM equipos WHERE nombre_equipo LIKE 'e2e-%' OR codigo_equipo LIKE 'E2E-%') THEN
    RAISE EXCEPTION 'e2e seed: ya hay equipos e2e-. Ejecuta primero npm run e2e:cleanup';
  END IF;
  IF EXISTS (SELECT 1 FROM equipos WHERE id_edicion = edition
             AND codigo_verificacion IN ('E2EAAA','E2EBBB','E2ECCC','E2EDDD','E2EEEE')) THEN
    RAISE EXCEPTION 'e2e seed: un código de verificación E2E* ya está en uso en la edición %', edition;
  END IF;
END $$;

-- Evaluaciones abiertas: si estaban cerradas, se abren y se guarda el valor para que cleanup lo restaure.
CREATE TABLE IF NOT EXISTS e2e_estado (clave text PRIMARY KEY, valor text NOT NULL);

INSERT INTO e2e_estado (clave, valor)
SELECT 'evaluaciones_abiertas', c.evaluaciones_abiertas::text
FROM configuracion_evento c
WHERE c.id_edicion = (SELECT id_edicion FROM ediciones WHERE estado = 'ACTIVE' ORDER BY id_edicion DESC LIMIT 1)
  AND c.evaluaciones_abiertas = false
ON CONFLICT (clave) DO NOTHING;

UPDATE configuracion_evento
SET evaluaciones_abiertas = true, actualizado_en = now()
WHERE id_edicion = (SELECT id_edicion FROM ediciones WHERE estado = 'ACTIVE' ORDER BY id_edicion DESC LIMIT 1)
  AND evaluaciones_abiertas = false;

-- Usuarios: 2 jurados que inician sesión con contraseña y 5 dueños de equipo (no inician sesión).
INSERT INTO usuarios
  (id_usuario, correo, id_estado_confirmacion, activo, id_rol, creado_en, actualizado_en,
   "firstName", "lastName", contrasena, metodo_auth, categoria_jurado, tipo_jurado)
VALUES
  ('e2e-jurado-a', 'e2e-jurado-a@prueba.invalid', 1, true, 4, now(), now(), 'E2E', 'Jurado A', :'pwhash', 'PASSWORD', 'JUNIOR', 'OFFICIAL'),
  ('e2e-jurado-b', 'e2e-jurado-b@prueba.invalid', 1, true, 4, now(), now(), 'E2E', 'Jurado B', :'pwhash', 'PASSWORD', 'JUNIOR', 'OFFICIAL');

INSERT INTO usuarios
  (id_usuario, correo, id_estado_confirmacion, activo, id_rol, creado_en, actualizado_en, "firstName", "lastName")
SELECT 'e2e-owner-' || n, 'e2e-owner-' || n || '@prueba.invalid', 1, true, 2, now(), now(), 'E2E', 'Dueño ' || n
FROM generate_series(1, 5) AS n;

-- Jurados confirmados en la edición activa (no es obligatorio para calificar; así se parecen a uno real).
INSERT INTO jurado_edicion (id_usuario, id_edicion, estado, tipo, creado_en, actualizado_en)
SELECT j, (SELECT id_edicion FROM ediciones WHERE estado = 'ACTIVE' ORDER BY id_edicion DESC LIMIT 1),
       'CONFIRMED', 'OFFICIAL', now(), now()
FROM (VALUES ('e2e-jurado-a'), ('e2e-jurado-b')) AS t(j);

-- Equipos 1..5 en la edición activa. Código de verificación válido (alfabeto sin 0, O, 1, I).
INSERT INTO equipos
  (nombre_equipo, fecha_registro, id_usuario, id_edicion, activo, externo, codigo_equipo, codigo_verificacion)
SELECT 'e2e-equipo-' || n, now(), 'e2e-owner-' || n,
       (SELECT id_edicion FROM ediciones WHERE estado = 'ACTIVE' ORDER BY id_edicion DESC LIMIT 1),
       true, false, 'E2E-T' || n,
       (ARRAY['E2EAAA','E2EBBB','E2ECCC','E2EDDD','E2EEEE'])[n]
FROM generate_series(1, 5) AS n;

INSERT INTO videojuegos (nombre, descripcion, fecha_registro, id_estado_videojuego, id_equipo, activo)
SELECT 'e2e-juego-' || right(e.nombre_equipo, 1), 'Videojuego de prueba funcional ARK-42', now(), 1, e.id_equipo, true
FROM equipos e WHERE e.nombre_equipo LIKE 'e2e-equipo-%';

INSERT INTO integrante (nombre, apellido, correo, codigo_estudiantil, id_equipo, id_edicion, activo, actualizado_en, creado_en)
SELECT 'E2E', 'Integrante ' || right(e.nombre_equipo, 1), 'e2e-miembro-' || right(e.nombre_equipo, 1) || '@prueba.invalid',
       'E2E' || right(e.nombre_equipo, 1), e.id_equipo, e.id_edicion, true, now(), now()
FROM equipos e WHERE e.nombre_equipo LIKE 'e2e-equipo-%';

-- Asignaciones: equipos 1-4 al jurado A, equipo 5 al jurado B. ("A" = equipos, "B" = usuarios)
INSERT INTO "_JurorTeamAssignment" ("A", "B")
SELECT e.id_equipo,
       CASE WHEN e.nombre_equipo = 'e2e-equipo-5' THEN 'e2e-jurado-b' ELSE 'e2e-jurado-a' END
FROM equipos e WHERE e.nombre_equipo LIKE 'e2e-equipo-%';

COMMIT;

SELECT 'sembrado' AS resultado,
       (SELECT count(*) FROM usuarios WHERE id_usuario LIKE 'e2e-%') AS usuarios,
       (SELECT count(*) FROM equipos WHERE nombre_equipo LIKE 'e2e-%') AS equipos,
       (SELECT count(*) FROM videojuegos WHERE nombre LIKE 'e2e-%') AS videojuegos,
       (SELECT count(*) FROM "_JurorTeamAssignment" a JOIN equipos e ON e.id_equipo = a."A" WHERE e.nombre_equipo LIKE 'e2e-%') AS asignaciones;
