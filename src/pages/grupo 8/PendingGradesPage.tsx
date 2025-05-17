import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import { PendingGamesGrid } from "@/components/grupo 8/PendingGradesGrid";
import { useEffect, useState } from "react";

// Tipo para los datos del videojuego
interface VideogameDetails {
  videogameId: number;
  videogameName: string;
  logoUrl: string;
  teamName: string;
  members: { fullName: string }[];
  nrc: string | null;
  subject: string | null;
  description: string | null;
  isEvaluated: boolean; // Nuevo campo
}

interface Metadata {
  totalItems: number;
  itemsOnCurrentPage: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

const PendingGradesPage: React.FC = () => {
  const breadcrumbs = [
    { label: "Pendientes por calificar", href: "/pendientes-calificar" },
  ];
  const [videogames, setVideogames] = useState<VideogameDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [jurorId] = useState<string | null>(null); // Nuevo estado
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    const fetchVideogames = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${
            import.meta.env.ENDPOINT_BACKEND
          }/pending-games?page=${page}&limit=${limit}`,
          {
            method: "GET",
            credentials: "include", // Asegúrate de incluir las cookies o el token
          }
        );
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        setVideogames(data.data);
        setMetadata(data.metadata);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchVideogames();
  }, [page]);

  // Filtrar solo los juegos que no han sido calificados

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {loading ? (
        <div className="flex justify-center items-center h-screen text-black dark:text-white ">
          <p>Cargando juegos pendientes...</p>
        </div>
      ) : (
        <PendingGamesGrid
          games={videogames.map((videogame) => ({
            id: videogame.videogameId,
            nombre: videogame.videogameName,
            equipo: videogame.teamName,
            materia: videogame.subject || "Sin materia",
            nrc: videogame.nrc || "Sin NRC",
            participantes: videogame.members.map((member) => member.fullName),
            imagen: videogame.logoUrl,
            descripcion: videogame.description || "Sin descripción", // Incluye la descripción
            isEvaluated: videogame.isEvaluated, // Pasa el valor de isEvaluated
          }))}
          jurorId={jurorId ?? undefined} // Convierte null a undefined
        />
      )}
      {/* Controles de paginación */}
      {metadata && (
        <div className="flex justify-center items-center gap-4 mt-6 py-6">
          <button
            className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={metadata.currentPage === 1}
          >
            Anterior
          </button>
          <span>
            Página {metadata.currentPage} de {metadata.totalPages}
          </span>
          <button
            className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700"
            onClick={() => setPage((p) => Math.min(metadata.totalPages, p + 1))}
            disabled={metadata.currentPage === metadata.totalPages}
          >
            Siguiente
          </button>
        </div>
      )}
    </LayoutAplication>
  );
};

export default PendingGradesPage;
