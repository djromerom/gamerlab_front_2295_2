import { apiFetch } from "@/lib/api";
import type React from "react";
import LayoutApplication from "@/layouts/LayoutApplication";
import { PendingGradesGrid } from "@/features/grading/components/PendingGradesGrid";
import { useEffect, useState } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import {
  gradedGamesUrl,
  toGradedCard,
  type GradedGameApi,
} from "@/features/grading/lib/gradedGames";

interface teamIsSchool {
  isSchool: boolean;
}

interface PaginatedGames {
  data: GradedGameApi[];
  metadata: {
    totalItems: number;
    itemsOnCurrentPage: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
}

const SchoolGradesPage: React.FC = () => {
  const breadcrumbs = [
    { label: "Calificados", href: "/colegios-evaluados" },
  ];
  const [gamesData, setGamesData] = useState<PaginatedGames | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });

  // Para búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GradedGameApi[] | null>(null);

  const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;

  const fetchGames = async (page: number, limit: number) => {
    setIsPageLoading(true);
    setError(null);

    try {
      const res = await apiFetch(
        gradedGamesUrl(API_BASE_URL, page, limit),
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
          errorMsg = errorBody.message || errorMsg;
        } catch (e) {
          /* ignore */
        }
        throw new Error(errorMsg);
      }

      // [MODIFICADO]: Se eliminó el filtro nrc === "9999" que excluía los equipos universitarios.
      // Ahora se muestran todos los equipos evaluados, incluyendo universitarios.
      const dataRespond: PaginatedGames = await res.json();

      // Si la página actual está vacía pero no es la primera, retroceder
      if (dataRespond.data.length === 0 && page > 1) {
        return fetchGames(page - 1, limit);
      }

      setGamesData(dataRespond);
    } catch (err: any) {
      setError(
        err.message || "Ocurrió un error desconocido al cargar los juegos calificados."
      );
      setGamesData(null);
    } finally {
      setIsPageLoading(false);
    }
  };

  // Búsqueda remota
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setSearchResults(null);
      fetchGames(pagination.page, pagination.limit);
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      const res = await apiFetch(
        `${API_BASE_URL}/graded-games/search?q=${encodeURIComponent(query)}`,

        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) throw new Error("Error al buscar juegos calificados");
      const data = await res.json();
      setSearchResults(data.data || []);
    } catch (err: any) {
      setError(err.message || "Error al buscar juegos calificados");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      fetchGames(pagination.page, pagination.limit);
    }
    // eslint-disable-next-line
  }, [pagination.page, pagination.limit]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  // Mapeo para el grid
  const gamesToShow = searchResults !== null
    ? searchResults.map(toGradedCard)
    : gamesData?.data.map(toGradedCard) || [];

    
  return (
    <LayoutApplication breadcrumbs={breadcrumbs}>
      {isPageLoading ? (
        <LoadingScreen text="Cargando juegos calificados..." />
      ) : (
        <>
          {error && !gamesData && error !== "Las evaluaciones no están habilitadas en este momento." && (
            <div
              className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
              role="alert"
            >
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          <PendingGradesGrid
            games={gamesToShow}
            showComments={true}
            showTotalScore={true}
            onSearch={handleSearch}
            isSearching={isSearching}
            searchQuery={searchQuery}
            key={`page-${gamesData?.metadata?.currentPage || 1}`}
            page="/colegios-evaluados"
          />


          {/* Solo muestra paginación si NO estás en búsqueda */}
          {!searchResults && (gamesData?.metadata?.totalPages ?? 0) > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6 py-6">
              <button
                className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 disabled:opacity-50 cursor-pointer"
                onClick={() => handlePageChange(gamesData!.metadata!.currentPage - 1)}
                disabled={gamesData?.metadata?.currentPage === 1}
              >
                Anterior
              </button>
              <span className="font-medium">
                Página {gamesData?.metadata?.currentPage} de {gamesData?.metadata?.totalPages}
              </span>
              <button
                className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 disabled:opacity-50 cursor-pointer"
                onClick={() => handlePageChange(gamesData!.metadata!.currentPage + 1)}
                disabled={gamesData?.metadata?.currentPage === gamesData?.metadata?.totalPages}
              >
                Siguiente
              </button>
            </div>
          )}
          {!isPageLoading &&
            !error &&
            gamesToShow.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                {searchQuery.trim()
                  ? `No se encontraron resultados para "${searchQuery}"`
                  : "No se encontraron juegos calificados."
                }
              </div>
            )}
          {error && !gamesData && (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow text-center max-w-md w-full">
                <svg
                  className="mx-auto mb-2 w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" />
                </svg>
                <span className="font-semibold block mb-1">¡Atención!</span>
                <span>{error}</span>
              </div>
            </div>
          )}
        </>
      )}
    </LayoutApplication>
  );
};

export default SchoolGradesPage;