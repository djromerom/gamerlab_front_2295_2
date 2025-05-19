import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import { PendingGamesGrid } from "@/components/grupo 8/PendingGradesGrid";
import { useEffect, useState } from "react";
import LoadingScreen from "@/components/grupo 5/LoadingScreen"; // Importamos el componente LoadingScreen

interface VideogameDetails {
  videogameId: number;
  videogameName: string;
  logoUrl: string;
  teamName: string;
  members: { fullName: string }[];
  nrc: string | null;
  subject: string | null;
  description: string | null;
  isEvaluated: boolean;
}

const PendingGradesPage: React.FC = () => {
  const breadcrumbs = [
    { label: "Pendientes por calificar", href: "/pendientes-calificar" },
  ];
  const [allGames, setAllGames] = useState<VideogameDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchVideogames = async () => {
      try {
        const response = await fetch(
          "${import.meta.env.ENDPOINT_BACKEND}/pending-games",
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) throw new Error("Error fetching games");

        const { data } = await response.json();
        // Forzar nueva referencia del array para actualizar el componente
        setAllGames([...data]); // <--- Cambio clave aquí
        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
      }
    };

    fetchVideogames();
  }, []);

  // Cálculos de paginación (optimizados)
  const totalPages = Math.ceil(allGames.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleGames = allGames.slice(startIndex, startIndex + itemsPerPage);

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {/* Pantalla de carga */}
      {loading ? (
        <LoadingScreen text="Cargando juegos pendientes por calificar..." />
      ) : (
        <>
          <PendingGamesGrid
            games={visibleGames.map((videogame) => ({
              id: videogame.videogameId,
              nombre: videogame.videogameName,
              equipo: videogame.teamName,
              materia: videogame.subject || "Sin materia",
              nrc: videogame.nrc || "Sin NRC",
              participantes: videogame.members.map((member) => member.fullName),
              imagen: videogame.logoUrl,
              descripcion: videogame.description || "Sin descripción",
              isEvaluated: videogame.isEvaluated,
            }))}
            showComments={false} // Mostrar comentarios en el modal
            showTotalScore={false}
            key={`page-${currentPage}`} // <--- Forzar re-renderizado
          />

          {/* Controles de paginación con feedback visual */}
          {allGames.length > 0 && (
            <div className="flex justify-center items-center gap-4 mt-6 py-6">
              <button
                className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 disabled:opacity-50 cursor-pointer"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span className="font-medium">
                Página {currentPage} de {totalPages}
              </span>
              <button
                className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 disabled:opacity-50 cursor-pointer"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </LayoutAplication>
  );
};

export default PendingGradesPage;
