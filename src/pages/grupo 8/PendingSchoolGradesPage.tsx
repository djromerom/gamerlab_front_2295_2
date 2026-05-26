import LoadingScreen from "@/components/grupo 5/LoadingScreen";
import { PendingGamesGrid } from "@/components/grupo 8/PendingGradesGrid";
import { Button } from "@/components/ui/button";
import LayoutAplication from "@/layouts/LayoutAplication";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

// Interfaz para los resultados de búsqueda (estructura diferente del backend)
interface SearchResultItem {
  id: number;
  nombre: string;
  equipo: string;
  materia: string;
  nrc: string;
  participantes: string[];
  imagen?: string;
  descripcion: string;
  isEvaluated: boolean;
}

interface SearchResults {
  data: SearchResultItem[];
}

const PendingSchoolGradesPage: React.FC = () => {
  const breadcrumbs = [
    { label: "Pendientes por calificar", href: "/colegios-calificar" },
  ];
  const [gamesData, setGamesData] = useState<PaginatedGames | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [refreshFlag] = useState(false);

  // Para selección múltiple de juegos para calificación en lote
  const [selectedGameIds, setSelectedGameIds] = useState<Set<number>>(
    new Set(),
  );
  const navigate = useNavigate();

  // Para búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[] | null>(
    null,
  );

  const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;

  const fetchGames = async (page: number, limit: number) => {
    setIsPageLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE_URL}/pending-games?page=${page}&limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!res.ok) {
        let errorMsg = `Error ${res.status}: Failed to fetch pending games`;
        try {
          const errorBody = await res.json();
          errorMsg = errorBody.message || errorMsg;
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
      setError(
        err.message ||
          "Ocurrió un error desconocido al cargar los juegos pendientes.",
      );
      setGamesData(null);
    } finally {
      setIsPageLoading(false);
    }
  };

  // Alterna la selección de un juego para calificación en lote
  const toggleGameSelection = (gameId: number) => {
    setSelectedGameIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(gameId)) {
        newSet.delete(gameId);
      } else {
        newSet.add(gameId);
      }
      return newSet;
    });
  };

  // Navega a la página de calificación masiva con los juegos seleccionados
  const handleBatchCalificar = () => {
    const selectedGames = gamesToShow.filter((game) =>
      selectedGameIds.has(game.id),
    );
    navigate("/calificar-lote", { state: { games: selectedGames } });
  };

  // Búsqueda remota - URL CORREGIDA
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
      // URL CORREGIDA: usar pending-games/search en lugar de search-games
      const res = await fetch(
        `${API_BASE_URL}/pending-games/search?q=${encodeURIComponent(query)}`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!res.ok) {
        let errorMsg = `Error ${res.status}: Failed to search games`;
        try {
          const errorBody = await res.json();
          errorMsg = `Error ${res.status}: ${errorBody.message || errorMsg}`;
        } catch (e) {
          /* ignore */
        }
        throw new Error(errorMsg);
      }

      const data: SearchResults = await res.json();
      setSearchResults(data.data || []);
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || "Error al buscar juegos");
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
  }, [pagination.page, pagination.limit, refreshFlag]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  // Mapeo para el grid - SIMPLIFICADO
  const gamesToShow =
    searchResults !== null
      ? searchResults.map((game) => ({
          id: game.id,
          nombre: game.nombre,
          equipo: game.equipo,
          materia: game.materia,
          nrc: game.nrc,
          participantes: game.participantes,
          imagen: game.imagen,
          descripcion: game.descripcion,
          isEvaluated: game.isEvaluated,
        }))
      : gamesData?.data.map((videogame) => ({
          id: videogame.videogameId,
          nombre: videogame.videogameName,
          equipo: videogame.teamName,
          materia: videogame.subject || "Sin materia",
          nrc: videogame.nrc || "Sin NRC",
          participantes: videogame.members.map((member) => member.fullName),
          imagen: videogame.logoUrl,
          descripcion: videogame.description || "Sin descripción",
          isEvaluated: videogame.isEvaluated,
        })) || [];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {isPageLoading ? (
        <LoadingScreen text="Cargando juegos pendientes por calificar..." />
      ) : (
        <>
          {error &&
            !gamesData &&
            error !==
              "Las evaluaciones no están habilitadas en este momento." && (
              <div
                className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
                role="alert"
              >
                <span className="font-medium">Error:</span> {error}
              </div>
            )}
          <PendingGamesGrid
            games={gamesToShow}
            showComments={false}
            showTotalScore={false}
            onSearch={handleSearch}
            isSearching={isSearching}
            searchQuery={searchQuery}
            key={`page-${gamesData?.metadata.currentPage || 1}`}
            page="/colegios-calificar"
            selectedGameIds={selectedGameIds}
            onToggleSelection={toggleGameSelection}
          />

          {/* Botón para calificar múltiples juegos seleccionados */}
          {selectedGameIds.size > 0 && (
            <div className="flex justify-center mt-4 mb-2">
              <Button
                onClick={handleBatchCalificar}
                className="bg-[var(--selected)] hover:bg-[var(--selected-hover)] text-[var(--selected-foreground)] px-6 py-2 rounded-md shadow-lg cursor-pointer"
              >
                Calificar seleccionados ({selectedGameIds.size})
              </Button>
            </div>
          )}

          {/* Solo muestra paginación si NO estás en búsqueda */}
          {!searchResults &&
            gamesData?.metadata?.totalPages &&
            gamesData.metadata.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6 py-6">
                <button
                  className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 disabled:opacity-50 cursor-pointer"
                  onClick={() =>
                    handlePageChange(gamesData!.metadata!.currentPage - 1)
                  }
                  disabled={gamesData?.metadata?.currentPage === 1}
                >
                  Anterior
                </button>
                <span className="font-medium">
                  Página {gamesData?.metadata?.currentPage} de{" "}
                  {gamesData?.metadata?.totalPages}
                </span>
                <button
                  className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 disabled:opacity-50 cursor-pointer"
                  onClick={() =>
                    handlePageChange(gamesData!.metadata!.currentPage + 1)
                  }
                  disabled={
                    gamesData?.metadata?.currentPage ===
                    gamesData?.metadata?.totalPages
                  }
                >
                  Siguiente
                </button>
              </div>
            )}
          {!isPageLoading && !error && gamesToShow.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              {searchQuery.trim()
                ? `No se encontraron resultados para "${searchQuery}"`
                : "No se encontraron juegos pendientes por calificar."}
            </div>
          )}
          {/* {error && !gamesData && (
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
          )} */}
        </>
      )}
    </LayoutAplication>
  );
};

export default PendingSchoolGradesPage;
