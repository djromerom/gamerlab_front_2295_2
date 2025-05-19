"use client";

import LayoutAplication from "@/layouts/LayoutAplication";
import { CriterionTable } from "@/components/grupo 9/CriterionTable";
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
  };
}

const CriteriaPage = () => {
  const [criteriaData, setCriteriaData] = useState<PaginatedCriteria | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
  });
  const [refreshFlag, setRefreshFlag] = useState(false); // Nueva bandera de refresco

  const API_BASE_URL = `http://localhost:3000`;

  const fetchCriteria = async (page: number, limit: number) => {
    setIsPageLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/criteria?page=${page}&limit=${limit}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

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

  // Función para forzar el refresco de datos
  const refreshData = () => {
    setRefreshFlag(prev => !prev);
  };

  useEffect(() => {
    fetchCriteria(pagination.page, pagination.limit);
  }, [pagination.page, pagination.limit, refreshFlag]); // Añadimos refreshFlag como dependencia

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination({ page: 1, limit });
  };

  const breadcrumbs = [{ label: "Criterios", href: "/criteria" }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {isPageLoading ? (
        <LoadingScreen text="Cargando criterios de calificación..." />
      ) : (
        <>
          {/* Error display */}
          {error && !criteriaData && (
            <div
              className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
              role="alert"
            >
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          {/* Tabla de criterios */}
          {criteriaData && (
            <CriterionTable
              criteria={criteriaData.data}
              pagination={criteriaData.metadata}
              apiBaseUrl={API_BASE_URL}
              isDataLoading={isPageLoading}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              refreshData={refreshData} // Pasamos la función de refresco
            />
          )}

          {/* No results message */}
          {!isPageLoading && !error && criteriaData && criteriaData.data.length === 0 && (
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