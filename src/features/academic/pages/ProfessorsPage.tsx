"use client";


import { apiFetch } from "@/lib/api";
import LayoutAplication from "@/layouts/LayoutAplication";
import { ProfessorsTable } from "@/features/academic/components/ProfessorsTable";
import { useState, useEffect } from "react";
import LoadingScreen from "@/components/grupo 5/LoadingScreen";

// Interface for a single professor (can be enhanced if more fields come from API)
export interface ProfessorRowData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  confirmationStatusId: number;
  isActive: boolean;
  createdAt?: string; // Optional, adjust if always present
  updatedAt?: string; // Optional, adjust if always present
}

// Interface for the paginated response from the API
export interface PaginatedProfessors {
  data: ProfessorRowData[];
  metadata: {
    totalItems: number;
    itemsOnCurrentPage: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
}

export const ProfessorsPage: React.FC = () => {
  const [professorsData, setProfessorsData] =
    useState<PaginatedProfessors | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20, // Default items per page
  });
  const [refreshFlag, setRefreshFlag] = useState(false);

  const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;
  const PROFESSORS_API_ENDPOINT = `${API_BASE_URL}/professors`;

  const fetchProfessors = async (page: number, limit: number) => {
    setIsPageLoading(true);
    setError(null);

    try {
      const res = await apiFetch(
        `${PROFESSORS_API_ENDPOINT}?page=${page}&limit=${limit}`, // Added includeInactive=true to get all, filtering is in table
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        let errorMsg = `Error ${res.status}: Failed to fetch professors`;
        try {
          const errorBody = await res.json();
          errorMsg = `Error ${res.status}: ${errorBody.message || errorMsg}`;
        } catch (e) {
          /* ignore */
        }
        throw new Error(errorMsg);
      }

      const dataRespond: PaginatedProfessors = await res.json();

      // If the current page is empty (e.g., after deleting the last item)
      // and it's not the first page, fetch the previous page.
      if (
        dataRespond.data.length === 0 &&
        page > 1 &&
        dataRespond.metadata.totalItems > 0
      ) {
        // Check totalItems to prevent infinite loop if backend returns 0 items always
        return fetchProfessors(page - 1, limit);
      }

      setProfessorsData(dataRespond);
    } catch (err: any) {
      console.error("Error fetching professors:", err);
      setError(
        err.message || "Ocurrió un error desconocido al cargar los profesores."
      );
      setProfessorsData(null); // Clear data on error
    } finally {
      setIsPageLoading(false);
    }
  };

  // Function to trigger a data refresh
  const refreshData = () => {
    setRefreshFlag((prev) => !prev); // Toggle flag to re-trigger useEffect
  };

  useEffect(() => {
    fetchProfessors(pagination.page, pagination.limit);
  }, [pagination.page, pagination.limit, refreshFlag]); // Re-fetch when page, limit, or refreshFlag changes

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    // Reset to page 1 when limit changes to avoid being on an invalid page
    setPagination({ page: 1, limit: newLimit });
  };

  const breadcrumbs = [{ label: "Profesores", href: "/profesores" }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {isPageLoading && !professorsData ? ( // Show full page loader only on initial load or when data is completely absent
        <LoadingScreen text="Cargando profesores..." />
      ) : (
        <>
          {error && !professorsData && (
            <div
              className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
              role="alert"
            >
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          {professorsData && (
            <ProfessorsTable
              professors={professorsData.data} // Pass only the data array for the current page
              paginationMeta={professorsData.metadata} // Pass pagination metadata
              apiBaseUrl={API_BASE_URL}
              isDataLoading={isPageLoading} // To show loader in table while fetching new page data
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              refreshData={refreshData} // Pass the refresh function
            />
          )}

          {/* Message for no professors found if fetch was successful but returned empty overall */}
          {!isPageLoading &&
            !error &&
            professorsData &&
            professorsData.metadata.totalItems === 0 && (
              <div className="p-4 text-center text-gray-500">
                No se encontraron profesores.
              </div>
            )}
        </>
      )}
    </LayoutAplication>
  );
};

export default ProfessorsPage;
