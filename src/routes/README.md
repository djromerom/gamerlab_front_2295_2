# Guía para Colaboradores - Proyecto GamerLab Frontend

Esta guía explica cómo contribuir al proyecto y mantener una estructura organizada para facilitar el trabajo en equipo.

---

## 🧠 ¿Cómo funciona el flujo de desarrollo?

El proyecto sigue una arquitectura basada en **módulos y componentes**. Cada sección o funcionalidad tiene su propia carpeta dentro de `src/pages/`, y puede tener componentes internos propios o usar los componentes generales de `components/ui/`.

### 🔁 Flujo general:

1. Cada **página principal** vive en `src/pages/NombreDelModulo/index.tsx`.
2. Si esa página necesita varios elementos visuales, crea una subcarpeta `components/` dentro del mismo módulo.
3. Las rutas de navegación se configuran en `src/routes/index.tsx`.
4. Si necesitas lógica global, usa el `AuthContext` o crea uno nuevo en `context/`.

---

## 🗂 Estructura de Carpetas Clave (`src/`)

| Carpeta          | Propósito                                                 |
| ---------------- | --------------------------------------------------------- |
| `pages/`         | Vistas principales. Cada módulo tiene su propia carpeta.  |
| `components/ui/` | Componentes reutilizables (botones, inputs, tablas, etc). |
| `context/`       | Contextos globales como autenticación.                    |
| `hooks/`         | Hooks personalizados reutilizables.                       |
| `layout/`        | Sidebar, navbar, layout general de la app.                |
| `lib/`           | Funciones utilitarias.                                    |
| `routes/`        | Configuración de rutas de la app.                         |
| `types/`         | Definiciones de tipos TypeScript.                         |

---

## ➕ Agregar o editar páginas

### ➕ Crear una nueva página (módulo)

1. Crea una nueva carpeta dentro de `src/pages/`:

   ```
   src/pages/NuevoModulo/
     index.tsx
     components/ (si necesitas componentes locales)
   ```

2. Agrega la ruta en `src/routes/index.tsx`:

   ```tsx
   import NuevoModulo from "../pages/NuevoModulo";

   const routes = [
     // ...otras rutas
     { path: "/nuevo", element: <NuevoModulo /> },
   ];
   ```

### 📝 Editar una página existente

1. Ve a `src/pages/NombreDelModulo/index.tsx`.
2. Si necesitas agregar botones, inputs, formularios u otros elementos visuales:
   - Revisa si existe una carpeta `components/` dentro del módulo.
   - Si no, puedes crearla y colocar ahí tus componentes.
   - Para estilos globales o reutilizables, revisa `components/ui/`.

---

## ✅ Buenas prácticas

- Usa `components/ui/` para cosas reutilizables.
- Si tu componente solo se usa en una página, guárdalo en `pages/NOMBRE/components/`.
- Usa contextos para manejar datos globales (como usuario logueado).
- Los hooks reutilizables van en `hooks/`.
- No olvides agregar tu ruta si creas un nuevo módulo.

---

## 🚫 Evita...

- Crear carpetas fuera de `src/` sin razón.
- Duplicar componentes existentes.
- Escribir código directamente en `App.tsx`.

---

Cualquier duda, pregunta o propuesta de mejora, no dudes en comentarme.
