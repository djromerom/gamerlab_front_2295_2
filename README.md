# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

## Testing

Las pruebas usan **Vitest** con **Testing Library** sobre `jsdom`. Cada archivo `*.test.ts(x)` vive junto al código que prueba, dentro de `src/`.

No necesitan `.env` ni el backend levantado: `vite.config.ts` fija `VITE_ENDPOINT_BACKEND=http://api.test` para las pruebas, y las llamadas a la API (`fetch`, `apiFetch`, `useFetch`) se mockean en cada prueba. Una prueba nueva nunca debe llamar a la API real, a Supabase ni a otro servicio externo.

```bash
# Todas las pruebas
npm test

# Modo watch mientras desarrollas
npm run test:watch

# Un solo archivo o una carpeta
npx vitest run src/lib/session.test.ts
npx vitest run src/hooks

# Las pruebas cuyo nombre contenga un texto
npx vitest run -t "renueva"

# El mismo comando que corre CI (lista cada prueba)
npm run test:ci
```

### Un ejemplo por módulo

| Módulo | Ejemplo |
|---|---|
| `components/` | `src/components/CircularProgress.test.tsx` |
| `contexts/` | `src/contexts/AuthContext.test.tsx` |
| `data/` | `src/data/contributorsData.test.ts` |
| `fetchs/` | `src/fetchs/evaluationProgress.test.ts` |
| `hooks/` | `src/hooks/useTeacherDashboard.test.tsx` |
| `layouts/` | `src/layouts/LayoutAplication.test.tsx` |
| `lib/` | `src/lib/api.test.ts` |
| `pages/` | `src/pages/grupo 9/LoginPage.test.tsx` |
| `routes/` | `src/routes/RoutesConfiguration.test.tsx` |

`types/` solo tiene tipos y `assets/` y `styles/` no tienen código, así que no llevan pruebas.

### Integración continua

El workflow `.github/workflows/test-front.yml` (job `test-build`) corre en cada PR a `dev-deploy` y `main`:

1. `npm ci`
2. `npm run build`: chequeo de tipos (`tsc -b`) y build de Vite. Bloquea.
3. `npx eslint .`: todavía no bloquea por la deuda de lint actual.
4. `npm run test:ci`: bloquea. Si una prueba falla, el PR queda en rojo.

Antes de aprobar un PR, revisa en el log del paso *Run tests* que las pruebas salgan en verde y que el total no sea 0.
