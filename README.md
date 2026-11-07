# ARKAD · Frontend

Interfaz web de **ARKAD**, la plataforma de la feria de videojuegos de la Universidad del Norte: registro de equipos y videojuegos, galería pública, evaluación por jurados, ranking y paneles de administración, profesores, staff y estudiantes. Este repositorio es el frontend; la API vive en [`gamerlab_back_2295_2`](https://github.com/djromerom/gamerlab_back_2295_2).

## Documentación

Toda la documentación del proyecto está en [`docs/arkad/`](docs/arkad/README.md) (la misma carpeta se publica en el repositorio del backend).

| Soy… | Empiezo por |
|---|---|
| Frontend | [03-frontend](docs/arkad/03-frontend/README.md): rutas y pantallas, estado de sesión, consumo de API, deuda técnica |
| Backend | [02-backend](docs/arkad/02-backend/README.md) y [reglas de negocio](docs/arkad/01-negocio/reglas-de-negocio.md) |
| DevOps | [04-devops](docs/arkad/04-devops/README.md): pipeline, variables, runbooks |
| Scrum Master | [05-scrum-y-proceso](docs/arkad/05-scrum-y-proceso/jira-y-flujo-de-trabajo.md) y [checklist de traspaso](docs/arkad/05-scrum-y-proceso/checklist-traspaso-v5.md) |
| Recién llegado | [Qué es ARKAD](docs/arkad/00-inicio-rapido/que-es-arkad.md), [arquitectura](docs/arkad/00-inicio-rapido/arquitectura-general.md) y [onboarding por rol](docs/arkad/00-inicio-rapido/onboarding-por-rol.md) |

## Stack

React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · React Router 7 · React Hook Form + Zod · Vitest. Se sirve con nginx en contenedor.

## Cómo correrlo

Requisitos: Node.js 22 y el [backend](https://github.com/djromerom/gamerlab_back_2295_2) corriendo (por defecto en `http://localhost:3000`).

```bash
npm ci
cp .env.example .env     # completa las variables (ver abajo)
npm run dev              # servidor de desarrollo con recarga en caliente
```

### Variables de entorno

Todo lo que empieza por `VITE_` queda dentro del JavaScript público que descarga el navegador: **aquí nunca va un secreto**. `.env.example` explica cada variable (para qué sirve, si es obligatoria, de dónde sale su valor y cómo rotarla).

| Variable | Uso |
|---|---|
| `VITE_ENDPOINT_BACKEND` | URL base de la API. Obligatoria (local: `http://localhost:3000`) |
| `VITE_SITE_KEY` | Clave pública de reCAPTCHA v3 del registro de equipos |
| `VITE_MAINTENANCE_*`, `VITE_SUPABASE_*` | Opcionales o heredadas; ver [deuda técnica](docs/arkad/03-frontend/deuda-tecnica.md) |

En test y producción no hay `.env`: el pipeline inyecta solo `VITE_ENDPOINT_BACKEND` y `VITE_SITE_KEY` al construir la imagen (`Dockerfile`, `Dockerfile.prod`). Los valores reales se piden al equipo, no están en el repositorio.

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Comprueba tipos y construye en `dist/` |
| `npm run preview` | Sirve el build local |
| `npm test` / `npm run test:watch` | Pruebas con Vitest (una vez / en vivo) |
| `npm run test:ci` | Las mismas pruebas con el reporte de CI |
| `npm run lint` | ESLint (todavía no bloquea el CI) |
| `npm run check:env` | Verifica que `.env.example` documente todas las variables usadas |

## Estructura

`src/` agrupa el código en `pages/` (pantallas), `components/`, `layouts/`, `routes/`, `contexts/` (sesión), `hooks/`, `fetchs/` (llamadas a la API), `lib/`, `types/` y `data/`. El detalle y los puntos de entrada están en [estructura del proyecto](docs/arkad/03-frontend/estructura-del-proyecto.md).

## Contribuir

- Las ramas siguen [`BRANCHING.md`](BRANCHING.md): `feat|fix|docs|chore/ARK-NN-descripcion-corta`, creadas desde **`dev-deploy`**, con PR a `dev-deploy` y merge **squash**. `dev-deploy` se promueve a `main` con un merge commit.
- Todo PR necesita revisión y el workflow **Test-front** en verde (`npm run test:ci`).
- Si un cambio altera una pantalla, una ruta o el consumo de la API, actualiza el archivo correspondiente en [`docs/arkad/`](docs/arkad/README.md) y su [changelog](docs/arkad/06-referencia/changelog-documentacion.md) en el mismo PR. Guía completa: [guía de contribución](docs/arkad/03-frontend/guia-de-contribucion.md).

## CI/CD

| Workflow | Cuándo | Qué hace |
|---|---|---|
| `test-front.yml` | PR a `dev-deploy` y `main` | Pruebas (bloqueante), lint y `check:env` (avisos) |
| `deploy-front.yml` | Push a `dev-deploy` (test) y `main` (producción) | Construye la imagen y la despliega; ver [pipeline](docs/arkad/04-devops/pipeline-y-despliegue.md) |
