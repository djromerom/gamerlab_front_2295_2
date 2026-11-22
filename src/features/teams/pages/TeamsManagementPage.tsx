"use client";


import { apiFetch } from "@/lib/api";
import LayoutApplication from "@/layouts/LayoutApplication";
import { TeamsManagementTable } from "@/features/teams/components/TeamsManagementTable";
import { useState, useEffect, useCallback, useRef } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import { PaginatedTeams, TeamConfirmationStatusResponse } from "@/features/teams/lib/teamsUtils";
import type { TeamRowData } from "@/features/teams/lib/teamsUtils";
import { EditionStudentsPanel } from "@/features/teams/components/EditionStudentsPanel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { fetchEditions, type Edition, type EditionStatus } from "@/api/editions";
import { teamsUrl, type ListEdition, type TeamOrigin } from "@/features/teams/api/editionStudents";
import { TEAMS_SEARCH_DEBOUNCE_MS, type TeamOriginFilter } from "@/features/teams/lib/teamsListFilters";

const EDITION_STATUS_LABEL: Record<EditionStatus, string> = {
  ACTIVE: "Activa",
  INACTIVE: "Inactiva",
  ARCHIVED: "Archivada",
};

type View = "teams" | "students";

const TeamsManagementPage = () => {
  const [allTeams, setAllTeams] = useState<TeamRowData[]>([]);
  const [teamsData, setTeamsData] = useState<PaginatedTeams | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [internalIsLoading, setInternalIsLoading] = useState(false);

  // BG-53 (ARK-254): la búsqueda y el origen se mandan al back. `searchInput` es lo que se escribe;
  // `filters.search` es lo que se pidió, después del debounce.
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<{ search: string; origin?: TeamOrigin }>({ search: "" });
  // Solo se pinta la respuesta de la última petición (la búsqueda dispara varias seguidas)
  const lastRequestRef = useRef(0);

  const [emailConfirmMap, setEmailConfirmMap] = useState<Record<number, TeamConfirmationStatusResponse | null>>({});

  // ARK-129 (HU-26): edición elegida (undefined = la activa) y la que respondió el back
  const [editions, setEditions] = useState<Edition[]>([]);
  const [editionId, setEditionId] = useState<number | undefined>(undefined);
  const [edition, setEdition] = useState<ListEdition | null>(null);
  const [view, setView] = useState<View>("teams");
  const readOnly = edition?.readOnly ?? false;

  useEffect(() => {
    fetchEditions()
      .then(setEditions)
      .catch(() => setEditions([])); // sin la lista queda la edición activa por defecto
  }, []);

  const API_ENDPOINT = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;

  const statusEmailLeader = useCallback(async (email: string): Promise<TeamConfirmationStatusResponse> => {
    if (internalIsLoading) {
      return {
        confirmationStatus: {
          id: 0,
          status: "No consultado",
          createdAt: "",
          updatedAt: "",
          isActive: false,
        },
      };
    } // prevent multiple petitions
    setInternalIsLoading(true);
    try {
      const res = await apiFetch(`${API_ENDPOINT}/teams/leader/${encodeURIComponent(email)}/status`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `Error ${res.status} al consultar estado`);
      }

      const json = await res.json();

      if (json && typeof json.confirmationStatus === "object" && typeof json.confirmationStatus.id === "number") {
        const cs = json.confirmationStatus;
        const mapped: TeamConfirmationStatusResponse = {
          confirmationStatus: {
            id: Number(cs.id),
            status: String(cs.status),
            createdAt: String(cs.createdAt ?? cs.created_at ?? ""),
            updatedAt: String(cs.updatedAt ?? cs.updated_at ?? ""),
            isActive: Boolean(cs.isActive ?? cs.is_active ?? false),
          },
        };
        return mapped;
      }

      throw new Error("Respuesta inesperada del servidor");
    } catch (e: any) {
      return {
        confirmationStatus: {
          id: 0,
          status: "No consultado",
          createdAt: "",
          updatedAt: "",
          isActive: false,
        },
      };
    } finally {
      setInternalIsLoading(false);
    }
  }, [API_ENDPOINT]);

  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      const teams = teamsData?.data ?? [];
      if (!teams.length) return;
      for (const team of teams) {
        const id = team.id_equipo;
        if (Object.prototype.hasOwnProperty.call(emailConfirmMap, id)) continue;

        const primaryEmail = team.integrantes?.[0]?.correo;
        if (!primaryEmail) {
          setEmailConfirmMap((p) => ({ ...p, [id]: null }));
          continue;
        }

        try {
          const status = await statusEmailLeader(primaryEmail);
          if (!mounted) return;
          setEmailConfirmMap((p) => ({ ...p, [id]: status ?? null }));
        } catch {
          if (!mounted) return;
          setEmailConfirmMap((p) => ({ ...p, [id]: null }));
        }
      }
    };
    loadAll();
    return () => {
      mounted = false;
    };
  }, [teamsData?.data, statusEmailLeader]); 

  // Agregar este mapper fuera de fetchTeams para reutilizar
  const mapApiTeamToTeamRow = (t: any): TeamRowData => {
    const members = Array.isArray(t.members) ? t.members : [];

    const integrantes = members.map((m: any) => ({
      id_integrante: m.id,
      nombre: m.firstName ?? m.nombre ?? "",
      apellido: m.lastName ?? m.apellido ?? "",
      correo: m.email ?? m.correo ?? "",
      codigo_estudiantil: m.studentCode ?? m.codigo_estudiantil ?? "",
      id_equipo: m.teamId ?? t.id ?? 0,
      activo: m.isActive ?? m.activo ?? true,
      creado_en: m.createdAt ?? m.creado_en ?? new Date().toISOString(),
      actualizado_en: m.updatedAt ?? m.actualizado_en ?? new Date().toISOString(),
      nrcs: Array.isArray(m.nrcs)
        ? m.nrcs.map((n: any) => ({
            id_nrc: n.id,
            codigo: n.code,
            id_materia: n.subjectId ?? (n.subject && n.subject.id),
            id_profesor: n.professorId,
            subject: n.subject,
          }))
        : [],
    }));

    const vg = t.videogame ?? t.videojuego ?? {};

    let nrc_info = undefined;
    let materia_info = undefined;
    const firstNrc = integrantes?.[0]?.nrcs?.[0];
    if (firstNrc) {
      nrc_info = {
        id_nrc: firstNrc.id_nrc,
        codigo: firstNrc.codigo,
        id_materia: firstNrc.id_materia,
        id_profesor: firstNrc.id_profesor,
      } as any;

      if (firstNrc.subject) {
        materia_info = {
          id_materia: firstNrc.subject.id,
          nombre: firstNrc.subject.name,
          codigo: firstNrc.subject.code,
          semestre: firstNrc.subject.semester,
        } as any;
      }
    }

    return {
      id_equipo: t.id,
      teamCode: t.teamCode,
      nombre_equipo: t.teamName ?? t.nombre_equipo ?? "",
      fecha_registro: t.registrationDate ?? t.fecha_registro ?? new Date().toISOString(),
      id_usuario: t.userId ?? t.id_usuario ?? "",
      id_edicion: t.editionId ?? t.id_edicion ?? 0,
      activo: t.isActive ?? t.activo ?? true,
      integrantes,
      videojuego: {
        id_videojuego: vg?.id ?? vg?.id_videojuego ?? 0,
        nombre: vg?.name ?? vg?.nombre ?? "",
        descripcion: vg?.description ?? vg?.descripcion ?? "",
        logo_url: vg?.logoUrl ?? vg?.logo_url ?? "",
        fecha_registro: vg?.registrationDate ?? vg?.fecha_registro ?? new Date().toISOString(),
        id_estado_videojuego: vg?.videogameStatusId ?? vg?.id_estado_videojuego ?? 2,
        id_equipo: vg?.teamId ?? t.id,
        activo: vg?.isActive ?? vg?.activo ?? true,
        video_demo_url: vg?.videoUrl ?? vg?.video_demo_url ?? "",
        additionalImages: vg?.additionalImages ?? [],
      },
      nrc_info,
      materia_info,
      isExternal: (t as any).isExternal,
      notGradable: t.notGradable === true,
      // HU-50: un back anterior no lo envía y el código se sigue exigiendo
      verificationRequired: t.verificationRequired !== false,
      team_nrc_global_id: (t as any).teamNrcGlobal ?? (t as any).team_nrc_global_id,
    } as TeamRowData;
  };

  const fetchAllTeams = async () => {
    try {
      const res = await apiFetch(
        teamsUrl(API_ENDPOINT, { editionId }),
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        throw new Error(`Error ${res.status}: Failed to fetch all teams`);
      }
      const apiResponse = await res.json();

      // Normalizar respuesta a TeamRowData[]
      let mapped: TeamRowData[] = [];
      if (Array.isArray(apiResponse)) {
        mapped = apiResponse.map(mapApiTeamToTeamRow);
      } else if (apiResponse && Array.isArray(apiResponse.data)) {
        mapped = apiResponse.data.map(mapApiTeamToTeamRow);
      } else {
        mapped = [];
      }

      setAllTeams(mapped);
      return mapped;

    } catch (err: any) {
      console.error("Error fetching all teams:", err);
      setAllTeams([]);
      return null;
    }
  };

  const fetchTeams = async (page: number, limit: number) => {
    const requestId = ++lastRequestRef.current;
    const isStale = () => requestId !== lastRequestRef.current;
    setIsPageLoading(true);
    setError(null);

    try {
      const res = await apiFetch(
        teamsUrl(API_ENDPOINT, { page, limit, editionId, search: filters.search, origin: filters.origin }),
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (isStale()) return;


      if (!res.ok) {
        if (res.status === 404) {
          setTeamsData(null);
          return;
        }

        let errorMsg = `Error ${res.status}: Failed to fetch teams`;
        try {
          const errorBody = await res.json();
          errorMsg = `Error ${res.status}: ${errorBody.message || errorMsg}`;
        } catch (e) {
        }
        throw new Error(errorMsg);
      }

      const apiResponse = await res.json();
      if (isStale()) return;
      setEdition(apiResponse?.edition ?? null);

      let dataRespond: PaginatedTeams;

      if (Array.isArray(apiResponse)) {
        const mapped = apiResponse.map(mapApiTeamToTeamRow);
        dataRespond = {
          data: mapped,
          metadata: {
            totalItems: mapped.length,
            itemsOnCurrentPage: mapped.length,
            currentPage: page,
            itemsPerPage: limit,
            totalPages: Math.ceil(mapped.length / limit),
          },
        };
      } else if (apiResponse && Array.isArray(apiResponse.data)) {
        const mapped = apiResponse.data.map(mapApiTeamToTeamRow);
        const md = apiResponse.metaData ?? apiResponse.metadata ?? {};
        dataRespond = {
          data: mapped,
          metadata: {
            totalItems: md?.totalItems ?? md?.total_items ?? mapped.length,
            itemsOnCurrentPage: md?.itemsOnCurrentPage ?? md?.items_on_current_page ?? mapped.length,
            currentPage: md?.currentPage ?? md?.current_page ?? page,
            itemsPerPage: md?.itemsPerPage ?? md?.items_per_page ?? limit,
            totalPages: md?.totalPages ?? md?.total_pages ?? Math.max(1, Math.ceil((md?.totalItems ?? mapped.length) / limit)),
          },
        };
      } else {
        dataRespond = {
          data: [],
          metadata: {
            totalItems: 0,
            itemsOnCurrentPage: 0,
            currentPage: page,
            itemsPerPage: limit,
            totalPages: 0,
          },
        };
      }

      if (
        dataRespond.data.length === 0 &&
        page > 1 &&
        dataRespond.metadata.totalItems > 0
      ) {
        return fetchTeams(page - 1, limit);
      }

      setTeamsData(dataRespond);
    } catch (err: any) {
      if (isStale()) return;
      console.error("Error fetching teams:", err);
      setError(
        err.message || "An unknown error occurred while loading the teams."
      );
      setTeamsData(null);
    } finally {
      if (!isStale()) setIsPageLoading(false);
    }
  };

  const refreshData = () => {
    setRefreshFlag((prev) => !prev);
  };

  useEffect(() => {
    fetchTeams(pagination.page, pagination.limit);
  }, [pagination.page, pagination.limit, refreshFlag, editionId, filters]);

  // Los contadores (Todos / Uninorte / Externos) son de la edición completa: no dependen de la
  // página, la búsqueda ni el origen.
  useEffect(() => {
    fetchAllTeams();
  }, [refreshFlag, editionId]);

  // BG-53: la búsqueda va al back después de una pausa al escribir y vuelve a la página 1
  useEffect(() => {
    const term = searchInput.trim();
    if (term === filters.search) return;
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: term }));
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, TEAMS_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search]);

  const changeOrigin = (origin: TeamOriginFilter) => {
    setFilters((prev) => ({ ...prev, origin: origin === "all" ? undefined : origin }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const hasFilters = filters.search !== "" || filters.origin !== undefined;

  const changeEdition = (value: string) => {
    setEditionId(value ? Number(value) : undefined);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination({ page: 1, limit: newLimit });
  };

  const breadcrumbs = [{ label: "Equipos Inscritos", href: "/equipos-inscritos" }];

  const header = (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex rounded-md p-1 bg-muted/10 gap-1" role="tablist" aria-label="Vista">
          <Button
            size="sm"
            role="tab"
            aria-selected={view === "teams"}
            variant={view === "teams" ? "default" : "ghost"}
            onClick={() => setView("teams")}
          >
            Equipos
          </Button>
          <Button
            size="sm"
            role="tab"
            aria-selected={view === "students"}
            variant={view === "students" ? "default" : "ghost"}
            onClick={() => setView("students")}
          >
            Estudiantes
          </Button>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="shrink-0">Edición</span>
          <select
            aria-label="Edición"
            value={editionId ?? ""}
            onChange={(e) => changeEdition(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-2 text-sm max-w-[260px]"
          >
            <option value="">Edición activa</option>
            {editions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} · {EDITION_STATUS_LABEL[e.status] ?? e.status}
              </option>
            ))}
          </select>
        </label>
      </div>
      {readOnly && edition && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>Edición de solo lectura</AlertTitle>
          <AlertDescription>
            {edition.title} no es la edición activa: se puede consultar como historial, pero no se agregan, editan ni
            eliminan equipos.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  return (
    <LayoutApplication breadcrumbs={breadcrumbs}>
      {isPageLoading && !teamsData ? (
        <LoadingScreen text="Cargando equipos inscritos..." />
      ) : (
        <>
          {error && !teamsData && (
            <div
              className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
              role="alert"
            >
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          {view === "students" && (
            <div className="md:bg-background text-foreground min-h-screen p-4">
              <div className="flex flex-col gap-4 mb-6 px-4">
                <h1 className="text-lg md:text-xl font-medium">Equipos Inscritos</h1>
                {header}
              </div>
              <EditionStudentsPanel editionId={editionId} />
            </div>
          )}

          {view === "teams" && teamsData && (
            <TeamsManagementTable
              teams={teamsData.data}
              paginationMeta={teamsData.metadata}
              apiBaseUrl={API_ENDPOINT}
              isDataLoading={isPageLoading}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              refreshData={refreshData}
              allTeams={allTeams}
              readOnly={readOnly}
              headerSlot={header}
              searchTerm={searchInput}
              onSearchTermChange={setSearchInput}
              originFilter={filters.origin ?? "all"}
              onOriginFilterChange={changeOrigin}
              statusEmailLeader={(email: string) => {
                const team = teamsData.data.find(t => t.integrantes?.[0]?.correo === email);
                return team ? emailConfirmMap[team.id_equipo] ?? null : null;
              }}
            />
          )}

          {/* Con búsqueda u origen la tabla ya dice que no hay coincidencias */}
          {view === "teams" && !isPageLoading && !error && (!hasFilters || !teamsData) && ((teamsData?.metadata?.totalItems ?? teamsData?.data?.length ?? 0) === 0) && (
            <div className="p-4 text-center text-gray-500">
              No se encontraron equipos inscritos.
            </div>
          )}
        </>
      )}
    </LayoutApplication>
  );
};

export default TeamsManagementPage;