"use client";


import { apiFetch } from "@/lib/api";
import LayoutAplication from "@/layouts/LayoutAplication";
import { TeamsManagementTable } from "@/components/grupo 9/TeamsManagementTable";
import { useState, useEffect, useCallback } from "react";
import LoadingScreen from "@/components/grupo 5/LoadingScreen";
import { PaginatedTeams, TeamConfirmationStatusResponse } from "@/components/grupo 9/teams-utils";
import type { TeamRowData } from "@/components/grupo 9/teams-utils";
import { set } from "react-hook-form";

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

  const [emailConfirmMap, setEmailConfirmMap] = useState<Record<number, TeamConfirmationStatusResponse | null>>({});

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
      team_nrc_global_id: (t as any).teamNrcGlobal ?? (t as any).team_nrc_global_id,
    } as TeamRowData;
  };

  const fetchAllTeams = async () => {
    try {
      const res = await apiFetch(
        `${API_ENDPOINT}/teams`,
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
    setIsPageLoading(true);
    setError(null);

    try {
      const res = await apiFetch(
        `${API_ENDPOINT}/teams?page=${page}&limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );


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
      console.error("Error fetching teams:", err);
      setError(
        err.message || "An unknown error occurred while loading the teams."
      );
      setTeamsData(null);
    } finally {
      setIsPageLoading(false);
    }
  };

  const refreshData = () => {
    setRefreshFlag((prev) => !prev);
  };

  useEffect(() => {
    fetchTeams(pagination.page, pagination.limit);
    fetchAllTeams();
  }, [pagination.page, pagination.limit, refreshFlag]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination({ page: 1, limit: newLimit });
  };

  const breadcrumbs = [{ label: "Equipos Inscritos", href: "/equipos-inscritos" }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
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

          {teamsData && (
            <TeamsManagementTable
              teams={teamsData.data}
              paginationMeta={teamsData.metadata}
              apiBaseUrl={API_ENDPOINT}
              isDataLoading={isPageLoading}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              refreshData={refreshData}
              allTeams={allTeams}
              statusEmailLeader={(email: string) => {
                const team = teamsData.data.find(t => t.integrantes?.[0]?.correo === email);
                return team ? emailConfirmMap[team.id_equipo] ?? null : null;
              }}
            />
          )}

          {!isPageLoading && !error && ((teamsData?.metadata?.totalItems ?? teamsData?.data?.length ?? 0) === 0) && (
            <div className="p-4 text-center text-gray-500">
              No se encontraron equipos inscritos.
            </div>
          )}
        </>
      )}
    </LayoutAplication>
  );
};

export default TeamsManagementPage;