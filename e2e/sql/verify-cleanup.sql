-- ARK-42: cuenta lo que queda con prefijo e2e-. Tras cleanup.sql todo debe ser 0 y e2e_estado no debe existir.
BEGIN READ ONLY;
SELECT
  (SELECT count(*) FROM usuarios WHERE id_usuario LIKE 'e2e-%') AS usuarios,
  (SELECT count(*) FROM equipos WHERE nombre_equipo LIKE 'e2e-%' OR codigo_equipo LIKE 'E2E-%') AS equipos,
  (SELECT count(*) FROM videojuegos WHERE nombre LIKE 'e2e-%') AS videojuegos,
  (SELECT count(*) FROM evaluacion WHERE id_jurado LIKE 'e2e-%') AS evaluaciones,
  (SELECT count(*) FROM borrador_evaluacion WHERE id_jurado LIKE 'e2e-%') AS borradores,
  (SELECT count(*) FROM evaluation_idempotency WHERE juror_id LIKE 'e2e-%') AS idempotencia,
  (SELECT count(*) FROM refresh_token WHERE user_id LIKE 'e2e-%') AS refresh_tokens,
  (to_regclass('public.e2e_estado') IS NOT NULL) AS e2e_estado_existe;
ROLLBACK;
