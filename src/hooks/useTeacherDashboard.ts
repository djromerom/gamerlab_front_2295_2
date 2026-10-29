import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { fetchEditions, type Edition } from "@/fetchs/editions";
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
  sortBy?: "student" | "team";
  sortOrder?: "asc" | "desc";
}

export function useTeacherDashboard({
  itemsPerPage = 20,
  sortBy,
  sortOrder = "asc",
}: UseTeacherDashboardProps = {}) {
  const customFetch = useFetch();
  const [availableFairs, setAvailableFairs] = useState<Edition[]>([]);
  const [allNRCs, setAllNRCs] = useState<any[]>([]);
  // Empty edition means all fairs. Empty NRC means all NRCs in the selected scope.
  const [selectedFair, setSelectedFairState] = useState("");
  const [selectedNRC, setSelectedNRCState] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setSelectedNRC = useCallback((nrcId: string) => {
    setSelectedNRCState(nrcId);
    setCurrentPage(1);
  }, []);

  const setSelectedFair = useCallback((editionId: string) => {
    setSelectedFairState(editionId);
    setSelectedNRCState("");
    setCurrentPage(1);
    setAllProjects([]);
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

      if (selectedFair) return scopedNRCs;

      // En "Todas las Ferias", un solo filtro por código cubre todas sus ediciones.
      const uniqueByCode = new Map<string, any>();
      scopedNRCs.forEach((nrc) => {
        const code = String(nrc.code);
        if (!uniqueByCode.has(code)) uniqueByCode.set(code, nrc);
      });
      return Array.from(uniqueByCode.values());
    },
    [allNRCs, selectedFair, validEditionIds],
  );

  // Para consultar proyectos se conservan todos los NRC/edición, aunque el filtro
  // visual de "Todas las Ferias" agrupe los botones por código.
  const reportNRCs = useMemo(
    () =>
      allNRCs.filter((nrc) => {
        const editionId = String(nrc.editionId);
        return (
          validEditionIds.has(editionId) &&
          (!selectedFair || editionId === selectedFair)
        );
      }),
    [allNRCs, selectedFair, validEditionIds],
  );

  const selectedEdition = availableFairs.find(
    (edition) => String(edition.id) === selectedFair,
  );
  const projectsForFilters = useMemo(
    () =>
      selectedNRC
        ? allProjects.filter((project) =>
            selectedFair
              ? String(project.nrcId) === selectedNRC
              : String(project.nrc) === selectedNRC,
          )
        : allProjects,
    [allProjects, selectedFair, selectedNRC],
  );

  const paginationMetadata = useMemo<PaginationMetadata>(() => {
    const totalItems = projectsForFilters.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    return {
      totalItems,
      itemsOnCurrentPage: Math.min(
        itemsPerPage,
        Math.max(0, totalItems - (currentPage - 1) * itemsPerPage),
      ),
      currentPage,
      itemsPerPage,
      totalPages,
    };
  }, [projectsForFilters.length, currentPage, itemsPerPage]);

  useEffect(() => {
    let cancelled = false;
    const loadFilterOptions = async () => {
      setInitialLoading(true);
      setError(null);
      try {
        const [editions, nrcResponse] = await Promise.all([
          fetchEditions(),
          customFetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/nrcs/select-options`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }),
        ]);
        if (!nrcResponse.ok) {
          throw new Error(`Error ${nrcResponse.status} al cargar NRCs`);
        }

        const nrcBody = await nrcResponse.json();
        const nrcs = Array.isArray(nrcBody)
          ? nrcBody
          : Array.isArray(nrcBody?.data)
            ? nrcBody.data
            : [];
        if (cancelled) return;

        setAvailableFairs(
          [...editions].sort(
            (a, b) => b.year - a.year || b.semester - a.semester,
          ),
        );
        setAllNRCs(nrcs);
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
  }, [customFetch]);

  const fetchReportPage = useCallback(
    async (
      nrcId: string,
      editionId: string,
      page: number,
      signal: AbortSignal,
    ) => {
      const query = new URLSearchParams({
        editionId,
        page: String(page),
        limit: String(itemsPerPage),
      });
      const response = await customFetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/nrc-report/by-id/${encodeURIComponent(nrcId)}?${query}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal,
        },
      );
      if (response.status === 404) return { data: [], metadata: null };
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      const rows = Array.isArray(result.data) ? result.data : [];
      return {
        data: rows.filter(
          (row: any) =>
            String(row.editionId) === editionId && String(row.nrcId) === nrcId,
        ),
        metadata: result.metadata ?? null,
      };
    },
    [customFetch, itemsPerPage],
  );

  const loadProjects = useCallback(
    async (signal: AbortSignal) => {
      const selectedEditionNRCs = reportNRCs;
      if (selectedEditionNRCs.length === 0) {
        setAllProjects([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        // Request the first page for each NRC to learn how many pages it has.
        const firstPages = await Promise.all(
          selectedEditionNRCs.map(async (nrc) => {
            const editionId = String(nrc.editionId);
            const nrcId = String(nrc.id);
            const result = await fetchReportPage(nrcId, editionId, 1, signal);
            return { editionId, nrcId, result };
          }),
        );

        // Complete every NRC report before applying the shared client pagination.
        const reportRows = await Promise.all(
          firstPages.map(async ({ editionId, nrcId, result }) => {
            const totalPages = Math.max(1, Number(result.metadata?.totalPages) || 1);
            const remainingPages = await Promise.all(
              Array.from({ length: totalPages - 1 }, (_, index) =>
                fetchReportPage(nrcId, editionId, index + 2, signal),
              ),
            );
            return [result.data, ...remainingPages.map((page) => page.data)].flat();
          }),
        );

        if (signal.aborted) return;
        const uniqueRows = new Map<string, any>();
        reportRows.flat().forEach((row: any) => {
          const key = `${row.editionId}:${row.nrcId}:${row.teamCode ?? row.videogameId}`;
          if (!uniqueRows.has(key)) uniqueRows.set(key, row);
        });
        setAllProjects(Array.from(uniqueRows.values()));
      } catch (err) {
        if (signal.aborted) return;
        const message =
          err instanceof Error ? err.message : "Error al cargar proyectos";
        setAllProjects([]);
        setError(message);
        toast.error(message);
      } finally {
        if (!signal.aborted) setIsLoading(false);
      }
    },
    [reportNRCs, fetchReportPage],
  );

  const [refreshVersion, setRefreshVersion] = useState(0);

  const reloadProjects = useCallback(() => {
    setRefreshVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    if (initialLoading) return;
    const controller = new AbortController();
    loadProjects(controller.signal);
    return () => controller.abort();
  }, [initialLoading, loadProjects, refreshVersion]);

  const orderedProjects = useMemo(() => {
    if (!sortBy) return projectsForFilters;

    const getSortKey = (project: any) => {
      if (sortBy === "team") return String(project.team ?? "");

      const members = Array.isArray(project.integrantes)
        ? project.integrantes
        : String(project.integrantes ?? "").split(",");
      return String(members[0] ?? "").trim();
    };

    return [...projectsForFilters].sort((a, b) => {
      const comparison = getSortKey(a).localeCompare(getSortKey(b), "es", {
        sensitivity: "base",
      });
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [projectsForFilters, sortBy, sortOrder]);

  const pageProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return orderedProjects.slice(start, start + itemsPerPage);
  }, [orderedProjects, currentPage, itemsPerPage]);

  const teams = useMemo(
    () =>
      pageProjects.map((project: any) => ({
        teamCode: project.teamCode || "-",
        nrc: project.nrc || "-",
        teamName: project.team || "-",
        integrantes: project.integrantes
          ? String(project.integrantes).split(",").map((name: string) => name.trim())
          : [],
        videogame: project.videogame || "-",
        calificacionFeria: project.calificacionFeria ?? null,
        calificacionDocente: project.calificacionDocente ?? null,
        videogameId: project.videogameId ?? null,
        _rows: [project],
      })),
    [pageProjects],
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
  };
}
