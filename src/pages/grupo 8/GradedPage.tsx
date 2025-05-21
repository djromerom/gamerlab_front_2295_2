import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import { PendingGamesGrid } from "@/components/grupo 8/PendingGradesGrid";
import { useEffect, useState } from "react";
import LoadingScreen from "@/components/grupo 5/LoadingScreen";

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
  totalScore: number;
  comments: string;
}

interface PaginatedGames {
  data: VideogameDetails[];
  metadata: {
    totalItems: number;
    itemsOnCurrentPage: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
}

const GradedPage: React.FC = () => {
  const [gamesData, setGamesData] = useState<PaginatedGames | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [refreshFlag] = useState(false);

  const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;

  const fetchGames = async (page: number, limit: number) => {
    setIsPageLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE_URL}/graded-games?page=${page}&limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        let errorMsg = `Error ${res.status}: Failed to fetch graded games`;
        try {
          const errorBody = await res.json();
          errorMsg = `Error ${res.status}: ${errorBody.message || errorMsg}`;
        } catch (e) {
          /* ignore */
        }
        throw new Error(errorMsg);
      }

      const dataRespond: PaginatedGames = await res.json();

      // Si la página actual está vacía pero no es la primera, retroceder
      if (dataRespond.data.length === 0 && page > 1) {
        return fetchGames(page - 1, limit);
      }

      setGamesData(dataRespond);
    } catch (err: any) {
      console.error("Error fetching graded games:", err);
      setError(
        err.message || "Ocurrió un error desconocido al cargar los juegos calificados."
      );
      setGamesData(null);
    } finally {
      setIsPageLoading(false);
    }
  };



  useEffect(() => {
    fetchGames(pagination.page, pagination.limit);
  }, [pagination.page, pagination.limit, refreshFlag]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };


  const breadcrumbs = [{ label: "Calificados", href: "/calificados" }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {isPageLoading ? (
        <LoadingScreen text="Cargando juegos calificados..." />
      ) : (
        <>
          {error && !gamesData && (
            <div
              className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
              role="alert"
            >
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          {gamesData && (
            <>
              <PendingGamesGrid
                games={gamesData.data.map((videogame) => ({
                  id: videogame.videogameId,
                  nombre: videogame.videogameName,
                  equipo: videogame.teamName,
                  materia: videogame.subject || "Sin materia",
                  nrc: videogame.nrc || "Sin NRC",
                  participantes: videogame.members.map((member) => member.fullName),
                  imagen: videogame.logoUrl,
                  descripcion: videogame.description || "Sin descripción",
                  isEvaluated: videogame.isEvaluated,
                  totalScore: videogame.totalScore,
                  comments: videogame.comments,
                }))}
                showTotalScore={true}
                showComments={true}
                key={`page-${gamesData.metadata.currentPage}`}
              />

              {/* Controles de paginación */}
              {gamesData.metadata.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6 py-6">
                  <button
                    className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 disabled:opacity-50 cursor-pointer"
                    onClick={() => handlePageChange(gamesData.metadata.currentPage - 1)}
                    disabled={gamesData.metadata.currentPage === 1}
                  >
                    Anterior
                  </button>
                  <span className="font-medium">
                    Página {gamesData.metadata.currentPage} de {gamesData.metadata.totalPages}
                  </span>
                  <button
                    className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 disabled:opacity-50 cursor-pointer"
                    onClick={() => handlePageChange(gamesData.metadata.currentPage + 1)}
                    disabled={gamesData.metadata.currentPage === gamesData.metadata.totalPages}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
          {!isPageLoading &&
            !error &&
            gamesData &&
            gamesData.data.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No se encontraron juegos calificados.
              </div>
            )}
        </>
      )}
    </LayoutAplication>
  );
};

export default GradedPage;