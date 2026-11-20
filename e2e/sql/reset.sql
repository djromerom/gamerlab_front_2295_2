-- ARK-42: deja a los jurados e2e- como recién sembrados, SIN recrear usuarios ni equipos.
-- Se ejecuta antes de cada prueba para que ninguna dependa del estado que dejó la anterior.
-- Borra lo que generan las pruebas (evaluaciones, borradores, verificaciones, sesiones) y repone las
-- asignaciones jurado-equipo. Solo toca filas e2e-; misma guarda de base que seed.sql y cleanup.sql.
BEGIN;

DO $$
DECLARE
  n int;
BEGIN
  IF current_database() <> 'arkad_db' THEN
    RAISE EXCEPTION 'e2e reset: la base es %, solo se permite arkad_db (Arkad-test)', current_database();
  END IF;
  IF (SELECT count(*) FROM usuarios WHERE id_usuario LIKE 'e2e-%') <> 7 THEN
    RAISE EXCEPTION 'e2e reset: no están los 7 usuarios e2e- sembrados (¿falta el seed?)';
  END IF;

  CREATE TEMP TABLE e2e_t ON COMMIT DROP AS
    SELECT id_equipo, nombre_equipo FROM equipos WHERE nombre_equipo LIKE 'e2e-%';
  CREATE TEMP TABLE e2e_v ON COMMIT DROP AS
    SELECT id_videojuego FROM videojuegos WHERE id_equipo IN (SELECT id_equipo FROM e2e_t);

  DELETE FROM detalle_evaluacion WHERE id_evaluacion IN
    (SELECT id_evaluacion FROM evaluacion
     WHERE id_jurado LIKE 'e2e-%' OR id_videojuego IN (SELECT id_videojuego FROM e2e_v));
  DELETE FROM evaluacion WHERE id_jurado LIKE 'e2e-%' OR id_videojuego IN (SELECT id_videojuego FROM e2e_v);
  DELETE FROM borrador_evaluacion WHERE id_jurado LIKE 'e2e-%' OR id_videojuego IN (SELECT id_videojuego FROM e2e_v);
  DELETE FROM evaluation_idempotency WHERE juror_id LIKE 'e2e-%';
  DELETE FROM registro_verificacion_equipo WHERE id_usuario LIKE 'e2e-%' OR id_equipo IN (SELECT id_equipo FROM e2e_t);
  DELETE FROM verificacion_equipo WHERE id_jurado LIKE 'e2e-%' OR id_equipo IN (SELECT id_equipo FROM e2e_t);
  DELETE FROM respuesta_encuesta_jurado WHERE id_jurado LIKE 'e2e-%';
  DELETE FROM refresh_token WHERE user_id LIKE 'e2e-%';

  -- Asignaciones: equipos 1-4 al jurado A, equipo 5 al jurado B (como seed.sql).
  DELETE FROM "_JurorTeamAssignment" WHERE "A" IN (SELECT id_equipo FROM e2e_t);
  INSERT INTO "_JurorTeamAssignment" ("A", "B")
    SELECT id_equipo, CASE WHEN nombre_equipo = 'e2e-equipo-5' THEN 'e2e-jurado-b' ELSE 'e2e-jurado-a' END
    FROM e2e_t;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 5 THEN
    RAISE EXCEPTION 'e2e reset: se esperaban 5 equipos e2e-, hay %', n;
  END IF;
END $$;

COMMIT;
