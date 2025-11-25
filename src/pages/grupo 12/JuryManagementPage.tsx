"use client";

import LayoutAplication from "@/layouts/LayoutAplication";
import { JuryManagementTable } from "../../components/grupo 12/JuryManagementTable"; // Adjust path if needed
import { useState, useEffect } from "react";
import LoadingScreen from "@/components/grupo 5/LoadingScreen";
import {
  formatDate,
  mapConfirmationStatus,
} from "../../components/grupo 12/utils"; // Adjust path if needed
import { JurorRowData, PaginatedJurors } from "../../components/grupo 12/utils";

const JuryManagementPage = () => {
  // const [data, setData] = useState<Data | null>(null);
  const [jurorsData, setJurorsData] = useState<PaginatedJurors | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10, // Default items per page
  });
  const [refreshFlag, setRefreshFlag] = useState(false);

  const API_ENDPOINT = `${import.meta.env.VITE_ENDPOINT_BACKEND}/juror`;
  const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;

  const fetchJurors = async (page: number, limit: number) => {
    setIsPageLoading(true);
    setError(null);
    const includeInactive = false;

    try {
      const res = await fetch(
        `${API_ENDPOINT}?includeInactive=${includeInactive}&limit=${limit}&page=${page}`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        let errorMsg = `Error ${res.status}: Failed to fetch jurors`;
        try {
          const errorBody = await res.json();
          errorMsg = `Error ${res.status}: ${errorBody.message || errorMsg}`;
        } catch (e) {
          /* ignore */
        }
        throw new Error(errorMsg);
      }

      const dataRespond: PaginatedJurors = await res.json();
      

      // If the current page is empty (e.g., after deleting the last item)
      // and it's not the first page, fetch the previous page.
      if (
        dataRespond.data.length === 0 &&
        page > 1 &&
        dataRespond.metadata.totalItems > 0
      ) {
        // Check totalItems to prevent infinite loop if backend returns 0 items always
        return fetchJurors(page - 1, limit);
      }

      dataRespond.data = dataRespond.data.map(
        (jurado: any): JurorRowData => ({
          ...jurado,
          confirmationStatusId: mapConfirmationStatus(
            jurado.confirmationStatusId
          ),
          lastSignInAt: formatDate(jurado.lastSignInAt),
        })
      );

      setJurorsData(dataRespond);

    } catch (err: any) {
      console.error("Error fetching jurors:", err);
      setError(
        err.message || "An unknown error occurred while loading the jurors."
      );
      setJurorsData(null);
    } finally {
      setIsPageLoading(false);
    }
  };

  const refreshData = () => {
    setRefreshFlag((prev) => !prev); // Toggle flag to re-trigger useEffect
  };

  useEffect(() => {
    fetchJurors(pagination.page, pagination.limit);
  }, [pagination.page, pagination.limit, refreshFlag]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    // Reset to page 1 when limit changes to avoid being on an invalid page
    setPagination({ page: 1, limit: newLimit });
  };

  const breadcrumbs = [{ label: "Jurados", href: "/jurados" }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {isPageLoading && !jurorsData ? (
        <LoadingScreen text="Cargando jurados..." />
      ) : (
        <>
          {/* Error display */}
          {error && !jurorsData && (
            <div
              className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
              role="alert"
            >
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          {jurorsData && (
            <JuryManagementTable
              jurors={jurorsData.data} // Pass only the data array for the current page
              paginationMeta={jurorsData.metadata} // Pass pagination metadata
              apiBaseUrl={API_BASE_URL}
              isDataLoading={isPageLoading} // To show loader in table while fetching new page data
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              refreshData={refreshData} // Pass the refresh function
            />
          )}

          {/* No results message (will show if activeRows is empty) */}
          {!isPageLoading && !error && jurorsData && jurorsData.metadata.totalItems === 0 && (
            <div className="p-4 text-center text-gray-500">
              No se encontraron jurados. {/* Optional: Update message */}
            </div>
          )}
        </>
      )}
    </LayoutAplication>
  );
};

export default JuryManagementPage;
