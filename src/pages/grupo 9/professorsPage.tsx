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
  confirmationStatusId: number; // Changed from Number to number
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const ProfessorsPage: React.FC = () => {
  const [professors, setProfessors] = useState<ProfessorRowData[] | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure these URLs are correct for your environment
  const API_ENDPOINT = `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors`;
  const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;

  useEffect(() => {
    const fetchProfessors = async () => {
      setIsPageLoading(true);
      setError(null);
      // Set professors to null initially on fetch, or keep previous data?
      // Setting to null to ensure loader for table doesn't show stale data if fetch fails.
      // setProfessors(null); // This is already done before this component by the table

      try {
        const res = await fetch(API_ENDPOINT, {
          method: "GET",
          credentials: "include", // Be mindful of CORS if frontend and backend are on different origins
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

        const dataRespond = await res.json();

        // Assuming the API returns { data: ProfessorRowData[] }
        // If the structure is different, adjust dataRespond.data accordingly
        setProfessors(dataRespond.data || dataRespond); // Handle if data is directly the array
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
  }, []); // API_ENDPOINT can be added to dependency array if it can change, but it's a const here.

  const breadcrumbs = [{ label: "Profesores", href: "/professors" }]; // Adjust href as needed

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {isPageLoading ? (
        <LoadingScreen text="Cargando profesores..." />
      ) : (
        <>
          {error &&
            !professors && ( // Show error only if there are no professors loaded
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
            // isDataLoading is managed internally by ProfessorsTable for its own operations,
            // and page-level loading is handled by isPageLoading here.
            // So, we don't pass isPageLoading to isDataLoading directly.
            // The ProfessorsTable's isDataLoading prop is for when the table itself might be refetching
            // due to an external trigger, which is not the case here as data is passed via props.
            // The internal loader in ProfessorsTable will be active during CRUD operations.
            isDataLoading={isPageLoading && professors === null} // Show table's own loader if page is loading and no data yet
          />

          {/* Message for no active professors if fetch was successful but returned empty */}
          {!error &&
            professors &&
            professors.filter((p) => p.isActive).length === 0 &&
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
