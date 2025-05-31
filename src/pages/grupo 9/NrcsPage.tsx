"use client";

import LayoutAplication from "@/layouts/LayoutAplication";
import { NrcsTable } from "@/components/grupo 9/NrcsTable";
import { useState, useEffect } from "react";
import LoadingScreen from "@/components/grupo 5/LoadingScreen";

interface Nrc {
  id: number;
  code: string;
  professorId: string;
  subjectId: number;
  professor: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
  };
  subject: {
    id: number;
    name: string;
    code: string;
    isActive: boolean;
    semester: number;
  };
  members: any[];
  createdAt: string;
  updatedAt: string;
}

interface PaginatedNrcs {
  data: Nrc[];
  metadata: {
    totalItems: number;
    itemsOnCurrentPage: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
}

const NrcsPage = () => {
  const [nrcsData, setNrcsData] = useState<PaginatedNrcs | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  });
  const [refreshFlag, setRefreshFlag] = useState(false);

  const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;

  const fetchNrcs = async (page: number, limit: number) => {
    setIsPageLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE_URL}/nrcs?page=${page}&limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        let errorMsg = `Error ${res.status}: Failed to fetch NRCs`;
        try {
          const errorBody = await res.json();
          errorMsg = `Error ${res.status}: ${errorBody.message || errorMsg}`;
        } catch (e) {
          /* ignore */
        }
        throw new Error(errorMsg);
      }

      const dataRespond: PaginatedNrcs = await res.json();

      // Si la página actual está vacía pero no es la primera, retroceder
      if (dataRespond.data.length === 0 && page > 1) {
        return fetchNrcs(page - 1, limit);
      }

      setNrcsData(dataRespond);
    } catch (err: any) {
      console.error("Error fetching NRCs:", err);
      setError(
        err.message || "Ocurrió un error desconocido al cargar los NRCs."
      );
      setNrcsData(null);
    } finally {
      setIsPageLoading(false);
    }
  };

  const refreshData = () => {
    setRefreshFlag((prev) => !prev);
  };

  useEffect(() => {
    fetchNrcs(pagination.page, pagination.limit);
  }, [pagination.page, pagination.limit, refreshFlag]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination({ page: 1, limit });
  };

  const breadcrumbs = [{ label: "NRC's", href: "/nrcs" }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {isPageLoading ? (
        <LoadingScreen text="Cargando NRCs..." />
      ) : (
        <>
          {error && !nrcsData && (
            <div
              className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
              role="alert"
            >
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          {nrcsData && (
            <NrcsTable
              nrcs={nrcsData.data}
              pagination={nrcsData.metadata}
              apiBaseUrl={API_BASE_URL}
              isDataLoading={isPageLoading}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              refreshData={refreshData}
            />
          )}
          {!isPageLoading &&
            !error &&
            nrcsData &&
            nrcsData.data.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No se encontraron NRC's activos.
              </div>
            )}
        </>
      )}
    </LayoutAplication>
  );
};

export default NrcsPage;
