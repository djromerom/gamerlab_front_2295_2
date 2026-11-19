interface ProjectsEmptyStateProps {
  /** Hay proyectos, pero la búsqueda o el filtro de tipo no deja ninguno */
  filtering: boolean;
  /** Texto cuando no hay ningún proyecto */
  emptyText: string;
}

/**
 * BG-66 (ARK-266): mensaje de las listas públicas de proyectos cuando no hay nada que mostrar. Antes `/equipos`
 * quedaba en blanco y `/ediciones-pasadas/:id/juegos` decía «No se encontraron proyectos que coincidan con la
 * búsqueda» sin que se hubiera buscado.
 */
export function ProjectsEmptyState({ filtering, emptyText }: ProjectsEmptyStateProps) {
  return (
    <div role="status" className="text-center p-12 border border-dashed border-gray-800 rounded-xl mt-8">
      <p className="text-gray-400 text-lg">
        {filtering ? "No se encontraron proyectos que coincidan con la búsqueda o el filtro." : emptyText}
      </p>
    </div>
  );
}
