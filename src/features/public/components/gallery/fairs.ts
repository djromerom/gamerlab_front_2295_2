/**
 * Ferias de la galería de la landing (ARK-233). Las fotos están en public/galeria/<id>/: <n>.jpg (1400 px) y tira/<n>.jpg
 * (360 px, para las pestañas). Cada feria se muestra con su foto de portada primero.
 */
export interface GalleryFair {
  id: string;
  titulo: string;
  periodo: string;
  /** carpeta pública de las fotos */
  ruta: string;
  /** nombres de las fotos (sin extensión), en el orden en que se muestran */
  fotos: string[];
}

function feria(id: string, titulo: string, periodo: string, total: number, portada = "MainPhoto"): GalleryFair {
  const fotos = ["MainPhoto", ...Array.from({ length: total }, (_, i) => String(i + 1))];
  return { id, titulo, periodo, ruta: `/galeria/${id}`, fotos: [portada, ...fotos.filter((n) => n !== portada)] };
}

export const FAIRS: GalleryFair[] = [
  feria("2025-10", "Feria 2025", "Primer semestre", 38, "26"),
  feria("2024-30", "Feria 2024", "Segundo semestre", 31),
];
