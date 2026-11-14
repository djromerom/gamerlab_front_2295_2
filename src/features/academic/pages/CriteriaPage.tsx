"use client";


import { apiFetch } from "@/lib/api";
import LayoutAplication from "@/layouts/LayoutAplication";
import { CriterionTable } from "@/features/academic/components/CriterionTable";
import { useState, useEffect } from "react";
import LoadingScreen from "@/components/grupo 5/LoadingScreen";

interface CriterionRowData {
  id: number;
  name: string;
  description?: string;
  weight?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginatedCriteria {
  data: CriterionRowData[];
  metadata: {
    totalItems: number;
    itemsOnCurrentPage: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
    totalWeight: number; // Nuevo campo
  };
}

const CriteriaPage = () => {
  const [criteriaData, setCriteriaData] = useState<PaginatedCriteria | null>(
    null
  );
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  });
  const [refreshFlag, setRefreshFlag] = useState(false);

  const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;

  const fetchCriteria = async (page: number, limit: number) => {
    setIsPageLoading(true);
    setError(null);

    try {
      const res = await apiFetch(
        `${API_BASE_URL}/criteria?page=${page}&limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        let errorMsg = `Error ${res.status}: Failed to fetch criteria`;
        try {
          const errorBody = await res.json();
          errorMsg = `Error ${res.status}: ${errorBody.message || errorMsg}`;
        } catch (e) {
          /* ignore */
        }
        throw new Error(errorMsg);
      }

      const dataRespond: PaginatedCriteria = await res.json();

      // Si la página actual está vacía pero no es la primera, retroceder
      if (dataRespond.data.length === 0 && page > 1) {
        return fetchCriteria(page - 1, limit);
      }

      setCriteriaData(dataRespond);
    } catch (err: any) {
      console.error("Error fetching criteria:", err);
      setError(
        err.message || "Ocurrió un error desconocido al cargar los criterios."
      );
      setCriteriaData(null);
    } finally {
      setIsPageLoading(false);
    }
  };
  const refreshData = () => {
    setRefreshFlag((prev) => !prev);
  };

  useEffect(() => {
    fetchCriteria(pagination.page, pagination.limit);
  }, [pagination.page, pagination.limit, refreshFlag]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination({ page: 1, limit });
  };

  const breadcrumbs = [{ label: "Criterios", href: "/criterios" }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {isPageLoading ? (
        <LoadingScreen text="Cargando criterios de calificación..." />
      ) : (
        <>
          {error && !criteriaData && (
            <div
              className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
              role="alert"
            >
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          {criteriaData && (
            <CriterionTable
              criteria={criteriaData.data}
              pagination={criteriaData.metadata}
              apiBaseUrl={API_BASE_URL}
              isDataLoading={isPageLoading}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              refreshData={refreshData}
            />
          )}
          {!isPageLoading &&
            !error &&
            criteriaData &&
            criteriaData.data.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No se encontraron criterios activos.
              </div>
            )}
        </>
      )}
    </LayoutAplication>
  );
};

export default CriteriaPage;
