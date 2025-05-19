// ProfessorsPage.tsx
"use client";

import LayoutAplication from "@/layouts/LayoutAplication";
import { ProfessorsTable } from "@/components/grupo 9/professorsTable"; // Adjust the path according to your structure
import { useState, useEffect } from "react";
import LoadingScreen from "@/components/grupo 5/LoadingScreen";

export interface ProfessorRowData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  confirmationStatusId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const ProfessorsPage: React.FC = () => {
  const [professors, setProfessors] = useState<ProfessorRowData[] | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set a very large limit to fetch all active Professors.
  const FETCH_ALL_LIMIT = 10000; // Or a more reasonable "max" like 1000

  // Ensure these URLs are correct for your environment
  // Modify API_ENDPOINT to include the limit and ensure only active items are fetched
  // Assuming your /professors endpoint also supports 'limit' and 'includeInactive'
  const API_ENDPOINT = `http://localhost:3000/professors?limit=${FETCH_ALL_LIMIT}&includeInactive=false`;
  const API_BASE_URL = `http://localhost:3000`;

  useEffect(() => {
    const fetchProfessors = async () => {
      setIsPageLoading(true);
      setError(null);
      setProfessors(null); // Clear previous data on new fetch

      try {
        const res = await fetch(API_ENDPOINT, {
          // Use the updated API_ENDPOINT
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          let errorMsg = `Error ${res.status}: Failed to fetch professors`;
          try {
            const errorBody = await res.json();
            errorMsg = `Error ${res.status}: ${errorBody.message || errorMsg}`;
          } catch (e) {
            // Ignore if error body is not JSON or empty
          }
          throw new Error(errorMsg);
        }

        const dataRespond = await res.json(); // This should be PaginatedResult<ProfessorRowData>

        // Ensure the response has the expected structure
        if (!dataRespond || !dataRespond.data) {
          throw new Error(
            "Invalid data structure received from API for professors."
          );
        }

        // The ProfessorsTable expects 'professors' to be a direct array of ProfessorRowData
        setProfessors(dataRespond.data); // Use the 'data' array from the paginated response
      } catch (err: any) {
        console.error("Error fetching professors:", err);
        setError(
          err.message ||
            "Ocurrió un error desconocido al cargar los profesores."
        );
        setProfessors(null); // Ensure professors is null on error
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchProfessors();
  }, []); // API_ENDPOINT is static, so no need for it in dependencies

  const breadcrumbs = [{ label: "Profesores", href: "/professors" }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {isPageLoading ? (
        <LoadingScreen text="Cargando profesores..." />
      ) : (
        <>
          {error && !professors && (
            <div
              className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
              role="alert"
            >
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          <ProfessorsTable
            professors={professors}
            apiBaseUrl={API_BASE_URL}
            isDataLoading={isPageLoading && professors === null}
          />

          {!error &&
            professors &&
            professors.filter((p) => p.isActive).length === 0 && // This filter is fine if professors array contains all (active+inactive) and table filters
            !isPageLoading && (
              <div className="p-4 text-center text-gray-500">
                No se encontraron profesores activos.
              </div>
            )}
        </>
      )}
    </LayoutAplication>
  );
};

export default ProfessorsPage;
