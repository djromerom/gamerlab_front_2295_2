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

        if (dataRespond.data.length === 0 && page === 1) {
          
          setTeamsData(null);
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
