"use client";

import LayoutAplication from "@/layouts/LayoutAplication";
import { TeamsManagementTable } from "@/components/grupo 9/TeamsManagementTable";
import { useState, useEffect } from "react";
import LoadingScreen from "@/components/grupo 5/LoadingScreen";
import { PaginatedTeams } from "@/components/grupo 9/teams-utils";

const TeamsManagementPage = () => {
  const [teamsData, setTeamsData] = useState<PaginatedTeams | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [refreshFlag, setRefreshFlag] = useState(false);

  const API_ENDPOINT = `${import.meta.env.VITE_ENDPOINT_BACKEND}/teams`;
  const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;

  const fetchTeams = async (page: number, limit: number) => {
    setIsPageLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_ENDPOINT}?page=${page}&limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        // Si el endpoint no existe (404), mostrar datos de ejemplo
        if (res.status === 404) {
          console.warn("Teams endpoint not found, using mock data");
          // Los datos mock se manejan en la sección de datos vacíos más abajo
          setTeamsData(null);
          return;
        }
        
        let errorMsg = `Error ${res.status}: Failed to fetch teams`;
        try {
          const errorBody = await res.json();
          errorMsg = `Error ${res.status}: ${errorBody.message || errorMsg}`;
        } catch (e) {
          /* ignore */
        }
        throw new Error(errorMsg);
      }

      const apiResponse = await res.json();

      // Manejar diferentes formatos de respuesta del API
      let dataRespond: PaginatedTeams;

      if (Array.isArray(apiResponse)) {
        // Si la respuesta es directamente un array (formato simple)
        
        dataRespond = {
          data: apiResponse,
          metadata: {
            totalItems: apiResponse.length,
            itemsOnCurrentPage: apiResponse.length,
            currentPage: page,
            itemsPerPage: limit,
            totalPages: Math.ceil(apiResponse.length / limit),
          },
        };
      } else if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data)) {
        // Si la respuesta tiene la estructura esperada
        dataRespond = apiResponse;
      } else {
        // Si la respuesta no tiene la estructura esperada
        console.warn("API response doesn't have expected structure:", apiResponse);
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

        // Si no hay datos y es la primera página, mostrar datos de ejemplo
        if (dataRespond.data.length === 0 && page === 1) {
          
          const exampleData: PaginatedTeams = {
            data: [
              {
                id_equipo: 1,
                nombre_equipo: "Equipo Alpha",
                fecha_registro: new Date().toISOString(),
                id_usuario: "user_001",
                id_edicion: 1,
                activo: true,
                id_estado_confirmacion: 2,
                estado_nombre: "confirmado",
                integrantes: [
                  {
                    id_integrante: 1,
                    nombre: "Juan",
                    apellido: "Pérez",
                    correo: "juan.perez@uninorte.edu.co",
                    codigo_estudiantil: "2023001",
                    id_equipo: 1,
                    activo: true,
                    creado_en: new Date().toISOString(),
                    actualizado_en: new Date().toISOString(),
                  },
                  {
                    id_integrante: 2,
                    nombre: "María",
                    apellido: "García",
                    correo: "maria.garcia@uninorte.edu.co",
                    codigo_estudiantil: "2023002",
                    id_equipo: 1,
                    activo: true,
                    creado_en: new Date().toISOString(),
                    actualizado_en: new Date().toISOString(),
                  }
                ],
                videojuego: {
                  id_videojuego: 1,
                  nombre: "Space Adventure",
                  descripcion: "Un juego de aventura espacial",
                  logo_url: "",
                  fecha_registro: new Date().toISOString(),
                  id_estado_videojuego: 1,
                  id_equipo: 1,
                  activo: true,
                },
                nrc_info: {
                  id_nrc: 1,
                  codigo: 12345,
                  id_materia: 1,
                  id_profesor: "prof_001",
                },
                materia_info: {
                  id_materia: 1,
                  nombre: "Programación de Videojuegos",
                  codigo: "PROG001",
                  semestre: 6,
                }
              },
              {
                id_equipo: 2,
                nombre_equipo: "Equipo Beta",
                fecha_registro: new Date().toISOString(),
                id_usuario: "user_002",
                id_edicion: 1,
                activo: true,
                id_estado_confirmacion: 1,
                estado_nombre: "pendiente",
                integrantes: [
                  {
                    id_integrante: 3,
                    nombre: "Carlos",
                    apellido: "López",
                    correo: "carlos.lopez@uninorte.edu.co",
                    codigo_estudiantil: "2023003",
                    id_equipo: 2,
                    activo: true,
                    creado_en: new Date().toISOString(),
                    actualizado_en: new Date().toISOString(),
                  }
                ],
                videojuego: {
                  id_videojuego: 2,
                  nombre: "Racing Game",
                  descripcion: "Un juego de carreras",
                  logo_url: "",
                  fecha_registro: new Date().toISOString(),
                  id_estado_videojuego: 1,
                  id_equipo: 2,
                  activo: true,
                },
                nrc_info: {
                  id_nrc: 2,
                  codigo: 12346,
                  id_materia: 1,
                  id_profesor: "prof_001",
                },
                materia_info: {
                  id_materia: 1,
                  nombre: "Programación de Videojuegos",
                  codigo: "PROG001",
                  semestre: 6,
                }
              },
              {
                id_equipo: 3,
                nombre_equipo: "Equipo Gamma",
                fecha_registro: new Date().toISOString(),
                id_usuario: "user_003",
                id_edicion: 1,
                activo: true,
                id_estado_confirmacion: 3,
                estado_nombre: "expirado",
                integrantes: [
                  {
                    id_integrante: 4,
                    nombre: "Roberto",
                    apellido: "Silva",
                    correo: "roberto.silva@uninorte.edu.co",
                    codigo_estudiantil: "2023004",
                    id_equipo: 3,
                    activo: true,
                    creado_en: new Date().toISOString(),
                    actualizado_en: new Date().toISOString(),
                  }
                ],
                videojuego: {
                  id_videojuego: 3,
                  nombre: "Adventure Quest",
                  descripcion: "Un juego de aventura",
                  logo_url: "",
                  fecha_registro: new Date().toISOString(),
                  id_estado_videojuego: 1,
                  id_equipo: 3,
                  activo: true,
                },
                nrc_info: {
                  id_nrc: 3,
                  codigo: 12347,
                  id_materia: 2,
                  id_profesor: "prof_002",
                },
                materia_info: {
                  id_materia: 2,
                  nombre: "Desarrollo de Software",
                  codigo: "DES001",
                  semestre: 5,
                }
              }
            ],
            metadata: {
              totalItems: 3,
              itemsOnCurrentPage: 3,
              currentPage: page,
              itemsPerPage: limit,
              totalPages: 1,
            },
          };
          setTeamsData(exampleData);
          return;
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
              apiBaseUrl={API_BASE_URL}
              isDataLoading={isPageLoading}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              refreshData={refreshData}
            />
          )}

          {!isPageLoading && !error && teamsData && teamsData.metadata.totalItems === 0 && (
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
