-- ARK-42 (TA-06): borra TODO lo que sembró seed.sql o generaron las pruebas (prefijo e2e-) y
-- restaura configuracion_evento.evaluaciones_abiertas. Idempotente: sin datos, termina sin error.
-- Una sola transacción: si algo falla no se borra nada. Imprime las filas borradas por tabla (NOTICE).
BEGIN;

DO $$
DECLARE
  n int;
  total_users int;
BEGIN
  IF current_database() <> 'arkad_db' THEN
    RAISE EXCEPTION 'e2e cleanup: la base es %, solo se permite arkad_db (Arkad-test)', current_database();
  END IF;

  CREATE TEMP TABLE e2e_u ON COMMIT DROP AS
    SELECT id_usuario FROM usuarios WHERE id_usuario LIKE 'e2e-%';
  CREATE TEMP TABLE e2e_t ON COMMIT DROP AS
    SELECT id_equipo FROM equipos
    WHERE nombre_equipo LIKE 'e2e-%' OR codigo_equipo LIKE 'E2E-%'
       OR id_usuario IN (SELECT id_usuario FROM e2e_u);
  CREATE TEMP TABLE e2e_v ON COMMIT DROP AS
    SELECT id_videojuego FROM videojuegos WHERE id_equipo IN (SELECT id_equipo FROM e2e_t);

  -- Tope de seguridad: el seed crea 7 usuarios e2e-. Si hay muchos más, algo está mal: no borrar.
  SELECT count(*) INTO total_users FROM e2e_u;
  IF total_users > 7 THEN
    RAISE EXCEPTION 'e2e cleanup: % usuarios e2e- (se esperaban 7 como máximo). Revisar a mano', total_users;
  END IF;
  IF (SELECT count(*) FROM e2e_t) > 5 THEN
    RAISE EXCEPTION 'e2e cleanup: % equipos e2e- (se esperaban 5 como máximo). Revisar a mano', (SELECT count(*) FROM e2e_t);
  END IF;

  DELETE FROM detalle_evaluacion WHERE id_evaluacion IN
    (SELECT id_evaluacion FROM evaluacion
     WHERE id_jurado IN (SELECT id_usuario FROM e2e_u) OR id_videojuego IN (SELECT id_videojuego FROM e2e_v));
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'detalle_evaluacion: %', n;

  DELETE FROM evaluacion
   WHERE id_jurado IN (SELECT id_usuario FROM e2e_u) OR id_videojuego IN (SELECT id_videojuego FROM e2e_v);
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'evaluacion: %', n;

  DELETE FROM borrador_evaluacion
   WHERE id_jurado IN (SELECT id_usuario FROM e2e_u) OR id_videojuego IN (SELECT id_videojuego FROM e2e_v);
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'borrador_evaluacion: %', n;

  DELETE FROM evaluation_idempotency WHERE juror_id IN (SELECT id_usuario FROM e2e_u);
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'evaluation_idempotency: %', n;

  DELETE FROM registro_verificacion_equipo
   WHERE id_usuario IN (SELECT id_usuario FROM e2e_u) OR id_equipo IN (SELECT id_equipo FROM e2e_t);
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'registro_verificacion_equipo: %', n;

  DELETE FROM verificacion_equipo
   WHERE id_jurado IN (SELECT id_usuario FROM e2e_u) OR id_equipo IN (SELECT id_equipo FROM e2e_t);
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'verificacion_equipo: %', n;

  -- Tablas que las pruebas casi nunca llenan, pero tienen clave foránea hacia lo que se borra.
  DELETE FROM respuesta_encuesta_jurado WHERE id_jurado IN (SELECT id_usuario FROM e2e_u);
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'respuesta_encuesta_jurado: %', n;
  DELETE FROM refresh_token WHERE user_id IN (SELECT id_usuario FROM e2e_u);
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'refresh_token: %', n;
  DELETE FROM asistencia_jurado
   WHERE id_usuario IN (SELECT id_usuario FROM e2e_u) OR registrado_por IN (SELECT id_usuario FROM e2e_u);
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'asistencia_jurado: %', n;
  DELETE FROM escarapelas_jurado WHERE id_usuario IN (SELECT id_usuario FROM e2e_u);
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'escarapelas_jurado: %', n;
  DELETE FROM suscripcion_push WHERE id_usuario IN (SELECT id_usuario FROM e2e_u);
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'suscripcion_push: %', n;
  DELETE FROM videogame_likes
   WHERE user_id IN (SELECT id_usuario FROM e2e_u) OR id_videojuego IN (SELECT id_videojuego FROM e2e_v);
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'videogame_likes: %', n;
  DELETE FROM juego_destacado WHERE id_videojuego IN (SELECT id_videojuego FROM e2e_v);
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'juego_destacado: %', n;
  DELETE FROM resultado_ranking
   WHERE id_videojuego IN (SELECT id_videojuego FROM e2e_v) OR id_equipo IN (SELECT id_equipo FROM e2e_t);
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'resultado_ranking: %', n;

  DELETE FROM "_JurorTeamAssignment"
   WHERE "A" IN (SELECT id_equipo FROM e2e_t) OR "B" IN (SELECT id_usuario FROM e2e_u);
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE '_JurorTeamAssignment: %', n;
  DELETE FROM jurado_edicion WHERE id_usuario IN (SELECT id_usuario FROM e2e_u);
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'jurado_edicion: %', n;
  DELETE FROM videojuegos WHERE id_videojuego IN (SELECT id_videojuego FROM e2e_v);
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'videojuegos: %', n;
  DELETE FROM integrante WHERE id_equipo IN (SELECT id_equipo FROM e2e_t);
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'integrante: %', n;
  DELETE FROM equipos WHERE id_equipo IN (SELECT id_equipo FROM e2e_t);
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'equipos: %', n;
  DELETE FROM usuarios WHERE id_usuario IN (SELECT id_usuario FROM e2e_u);
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'usuarios: %', n;

  -- Restaurar evaluaciones_abiertas solo si el seed la había cambiado.
  IF to_regclass('public.e2e_estado') IS NOT NULL THEN
    UPDATE configuracion_evento
       SET evaluaciones_abiertas = (SELECT valor::boolean FROM e2e_estado WHERE clave = 'evaluaciones_abiertas'),
           actualizado_en = now()
     WHERE id_edicion = (SELECT id_edicion FROM ediciones WHERE estado = 'ACTIVE' ORDER BY id_edicion DESC LIMIT 1)
       AND EXISTS (SELECT 1 FROM e2e_estado WHERE clave = 'evaluaciones_abiertas');
    GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'evaluaciones_abiertas restauradas: %', n;
    DROP TABLE e2e_estado;
  END IF;
END $$;

COMMIT;
