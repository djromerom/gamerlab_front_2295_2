// SubjetsPage.tsx
"use client";

import LayoutAplication from "@/layouts/LayoutAplication";
import { SubjectsTable, Data } from "@/components/grupo 9/SubjectsTable"; // Adjust path if needed
import { useState, useEffect } from "react";
import LoadingScreen from "@/components/grupo 5/LoadingScreen"; // Importamos el componente LoadingScreen

// Assuming your backend for subjects also uses a similar PaginationQueryDto
// and returns a PaginatedResult structure like { data: Subject[], metadata: {...} }

const SubjetsPage = () => {
  const [data, setData] = useState<Data | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set a very large limit to fetch all active Subjects.
  const FETCH_ALL_LIMIT = 10000; // Or a more reasonable "max" like 1000

  // Modify API_ENDPOINT to include the limit and ensure only active items are fetched
  // Assuming your /subjects endpoint also supports 'limit' and 'includeInactive'
  const API_ENDPOINT = `${
    import.meta.env.VITE_ENDPOINT_BACKEND
  }/subjects?limit=${FETCH_ALL_LIMIT}&includeInactive=false`;
  const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;
  const TABLE_RESOURCE_NAME = "subjects";

  useEffect(() => {
    const fetchMateria = async () => {
      setIsPageLoading(true);
      setError(null);
      setData(null);

      try {
        const res = await fetch(API_ENDPOINT, {
          // Use the updated API_ENDPOINT
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

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

        const dataRespond = await res.json(); // This should be PaginatedResult<Subject>

        // Ensure the response has the expected structure
        if (!dataRespond || !dataRespond.data) {
          throw new Error(
            "Invalid data structure received from API for subjects."
          );
        }

        setData({
          titulo: "Materias", // "titulo" instead of "title" as per your SubjectsTable Data interface
          nombreTabla: TABLE_RESOURCE_NAME,
          nombreColumnas: {
            name: "Nombre",
            code: "Código",
            semester: "Semestre",
          },
          filas: dataRespond.data, // Use the 'data' array from the paginated response
          primaryKey: "id",
        });
      } catch (err: any) {
        console.error("Error fetching subjects:", err);
        setError(
          err.message || "Ocurrió un error desconocido al cargar las materias."
        );
        setData(null);
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchMateria();
  }, []); // API_ENDPOINT is static, so no need for it in dependencies

  const breadcrumbs = [{ label: "Materias", href: "/materias" }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {isPageLoading ? (
        <LoadingScreen text="Cargando materias..." />
      ) : (
        <>
          {error && !data && (
            <div
              className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
              role="alert"
            >
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          <SubjectsTable
            data={data}
            apiBaseUrl={API_BASE_URL}
            isDataLoading={isPageLoading && data === null} // Consistent loading prop
          />

          {!isPageLoading && !error && data && data.filas.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No se encontraron materias activas.
            </div>
          )}
        </>
      )}
    </LayoutAplication>
  );
};

export default SubjetsPage;
