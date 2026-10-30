import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Edition } from "@/fetchs/editions";
import { useFetch } from "@/hooks/useFetch";

interface PaginationMetadata {
  totalItems: number;
  itemsOnCurrentPage: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

interface UseTeacherDashboardProps {
  itemsPerPage?: number;
  search?: string;
  searchType?: "student" | "team";
  sortBy?: "student" | "team";
  sortOrder?: "asc" | "desc";
}

export function useTeacherDashboard({ itemsPerPage = 25, search = "", searchType = "student", sortBy = "team", sortOrder = "asc" }: UseTeacherDashboardProps = {}) {
  const customFetch = useFetch();
  const [availableFairs, setAvailableFairs] = useState<Edition[]>([]);
  const [allNRCs, setAllNRCs] = useState<any[]>([]);
  // Empty edition means all fairs. Empty NRC means all NRCs in the selected scope.
  const [selectedFair, setSelectedFairState] = useState("");
  const [selectedNRC, setSelectedNRCState] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [projects, setProjects] = useState<any[]>([]);
  const [paginationMetadata, setPaginationMetadata] = useState<PaginationMetadata>({
    totalItems: 0, itemsOnCurrentPage: 0, currentPage: 1, itemsPerPage, totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptionsRetryVersion, setFilterOptionsRetryVersion] = useState(0);

  const setSelectedNRC = useCallback((nrcId: string) => {
    setSelectedNRCState(nrcId);
    setCurrentPage(1);
  }, []);

  const setSelectedFair = useCallback((editionId: string) => {
    setSelectedFairState(editionId);
    setSelectedNRCState("");
    setCurrentPage(1);
  }, []);

  const validEditionIds = useMemo(
    () => new Set(availableFairs.map((edition) => String(edition.id))),
    [availableFairs],
  );

  const availableNRCs = useMemo(
    () => {
      const scopedNRCs = allNRCs.filter((nrc) => {
        const nrcEditionId = String(nrc.editionId);
        return (
          validEditionIds.has(nrcEditionId) &&
          (!selectedFair || nrcEditionId === selectedFair)
        );
      });

      return scopedNRCs;
    },
    [allNRCs, selectedFair, validEditionIds],
  );

  const selectedEdition = availableFairs.find(
    (edition) => String(edition.id) === selectedFair,
  );

  useEffect(() => {
    let cancelled = false;
    const loadFilterOptions = async () => {
      setInitialLoading(true);
      setError(null);
      try {
        const response = await customFetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/grading-games/filter-options`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
        if (!response.ok) throw new Error(`Error ${response.status} al cargar ferias y NRC del profesor`);
        const result = await response.json();
        const editions = Array.isArray(result?.editions) ? result.editions : [];
        const rawNrcs = Array.isArray(result?.nrcs) ? result.nrcs : [];
        const nrcsByEditionAndId = new Map<string, any>();
        rawNrcs.forEach((nrc: any) => {
          const key = `${nrc.editionId}:${nrc.id}`;
          if (!nrcsByEditionAndId.has(key)) nrcsByEditionAndId.set(key, nrc);
        });
        if (cancelled) return;

        setAvailableFairs(
          [...editions].sort(
            (a, b) => b.year - a.year || b.semester - a.semester,
          ),
        );
        setAllNRCs([...nrcsByEditionAndId.values()]);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Error al cargar ferias y NRCs";
        setError(message);
        toast.error(message);
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };

    loadFilterOptions();
    return () => {
      cancelled = true;
    };
  }, [customFetch, filterOptionsRetryVersion]);

  const loadProjects = useCallback(
    async (signal: AbortSignal) => {
      setIsLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams({ page: String(currentPage), limit: String(itemsPerPage) });
        if (selectedFair) query.set("editionId", selectedFair);
        if (selectedNRC) query.set("nrcId", selectedNRC);
        if (search.trim()) query.set(searchType, search.trim());
        query.set("sortBy", sortBy);
        query.set("sortOrder", sortOrder);
        const response = await customFetch(
          `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/grading-games?${query}`,
          { method: "GET", headers: { "Content-Type": "application/json" }, signal },
        );
        if (!response.ok) {
          let detail = response.statusText;
          try {
            const body = await response.json();
            if (typeof body?.message === "string") detail = body.message;
            else if (Array.isArray(body?.message)) detail = body.message.join(", ");
          } catch { /* Some errors do not include a JSON body. */ }
          throw new Error(`Error ${response.status}: ${detail}`);
        }
        const result = await response.json();
        if (signal.aborted) return;
        setProjects(Array.isArray(result.data) ? result.data : []);
        setPaginationMetadata(result.metadata ?? {
          totalItems: 0, itemsOnCurrentPage: 0, currentPage, itemsPerPage, totalPages: 0,
        });
      } catch (err) {
        if (signal.aborted) return;
        const message =
          err instanceof Error ? err.message : "Error al cargar proyectos";
        setError(message);
        toast.error(message);
      } finally {
        if (!signal.aborted) setIsLoading(false);
      }
    },
    [customFetch, currentPage, itemsPerPage, search, searchType, selectedFair, selectedNRC, sortBy, sortOrder],
  );

  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, searchType, sortBy, sortOrder]);

  const reloadProjects = useCallback(() => {
    setRefreshVersion((version) => version + 1);
  }, []);

  const retryLoad = useCallback(() => {
    setError(null);
    setFilterOptionsRetryVersion((version) => version + 1);
    reloadProjects();
  }, [reloadProjects]);

  useEffect(() => {
    if (initialLoading) return;
    const controller = new AbortController();
    loadProjects(controller.signal);
    return () => controller.abort();
  }, [initialLoading, loadProjects, refreshVersion]);

  const teams = useMemo(
    () =>
      projects.map((project: any) => ({
        teamCode: project.teamCode || "-",
        nrc: project.nrc ?? null,
        teamName: project.team || "-",
        integrantes: project.integrantes
          ? String(project.integrantes).split(",").map((name: string) => name.trim())
          : [],
        videogame: project.videogame || "-",
        calificacionFeria: project.calificacionFeria ?? null,
        calificacionDocente: project.calificacionDocente ?? null,
        videogameId: project.videogameId ?? null,
        editionId: project.editionId ?? null,
        editionLabel: (() => {
          const edition = availableFairs.find((item) => String(item.id) === String(project.editionId));
          if (!edition) return project.editionId == null ? "-" : `Edición ${project.editionId}`;
          const semester = edition.semester === 10 ? 1 : edition.semester === 30 ? 2 : edition.semester;
          return `${edition.year} - S${semester}`;
        })(),
        nrcId: project.nrcId ?? null,
        canEdit: project.canEdit === true,
        source: project.source === "historical" ? "historical" as const : "current" as const,
        _rows: [project],
      })),
    [projects, availableFairs],
  );

  const noStudents = !initialLoading && !isLoading && teams.length === 0;
  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((page) => page - 1);
  };
  const handleNextPage = () => {
    if (currentPage < paginationMetadata.totalPages) {
      setCurrentPage((page) => page + 1);
    }
  };

  return {
    selectedNRC,
    setSelectedNRC,
    selectedFair,
    setSelectedFair,
    selectedEdition,
    currentPage,
    setCurrentPage,
    paginationMetadata,
    availableNRCs,
    availableFairs,
    isLoading,
    initialLoading,
    error,
    setError,
    noStudents,
    teams,
    handlePreviousPage,
    handleNextPage,
    reloadProjects,
    retryLoad,
  };
}
