"use client";

import LayoutAplication from "@/layouts/LayoutAplication";
import { SubjectsTable } from "@/components/grupo 9/SubjectsTable";
import { useState, useEffect } from "react";
import LoadingScreen from "@/components/grupo 5/LoadingScreen";

interface Subject {
  id: number;
  name: string;
  code: string;
  semester: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  abrevName: string;
}

interface PaginatedSubjects {
  data: Subject[];
  metadata: {
    totalItems: number;
    itemsOnCurrentPage: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
}

const SubjectsPage = () => {
  const [subjectsData, setSubjectsData] = useState<PaginatedSubjects | null>(
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

  const fetchSubjects = async (page: number, limit: number) => {
    setIsPageLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE_URL}/subjects?page=${page}&limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        let errorMsg = `Error ${res.status}: Failed to fetch subjects`;
        try {
          const errorBody = await res.json();
          errorMsg = `Error ${res.status}: ${errorBody.message || errorMsg}`;
        } catch (e) {
          /* ignore */
        }
        throw new Error(errorMsg);
      }

      const dataRespond: PaginatedSubjects = await res.json();

      // Si la página actual está vacía pero no es la primera, retroceder
      if (dataRespond.data.length === 0 && page > 1) {
        return fetchSubjects(page - 1, limit);
      }

      setSubjectsData(dataRespond);
    } catch (err: any) {
      console.error("Error fetching subjects:", err);
      setError(
        err.message || "Ocurrió un error desconocido al cargar las materias."
      );
      setSubjectsData(null);
    } finally {
      setIsPageLoading(false);
    }
  };

  const refreshData = () => {
    setRefreshFlag((prev) => !prev);
  };

  useEffect(() => {
    fetchSubjects(pagination.page, pagination.limit);
  }, [pagination.page, pagination.limit, refreshFlag]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination({ page: 1, limit });
  };

  const breadcrumbs = [{ label: "Materias", href: "/materias" }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {isPageLoading ? (
        <LoadingScreen text="Cargando materias..." />
      ) : (
        <>
          {error && !subjectsData && (
            <div
              className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
              role="alert"
            >
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          {subjectsData && (
            <SubjectsTable
              subjects={subjectsData.data}
              pagination={subjectsData.metadata}
              apiBaseUrl={API_BASE_URL}
              isDataLoading={isPageLoading}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              refreshData={refreshData}
            />
          )}
          {!isPageLoading &&
            !error &&
            subjectsData &&
            subjectsData.data.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No se encontraron materias activas.
              </div>
            )}
        </>
      )}
    </LayoutAplication>
  );
};

export default SubjectsPage;
