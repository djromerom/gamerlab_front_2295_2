// SubjetsPage.tsx
"use client";

import LayoutAplication from "@/layouts/LayoutAplication";
import { SubjectsTable, Data } from "@/components/grupo 9/SubjectsTable"; // Adjust path if needed
import { useState, useEffect } from "react";

// Define a more specific interface if possible, including 'active'

const SubjetsPage = () => {
  const [data, setData] = useState<Data | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_ENDPOINT = `${import.meta.env.VITE_ENDPOINT_BACKEND}/subjects`;
  const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;
  const TABLE_RESOURCE_NAME = "subjects";

  useEffect(() => {
    const fetchMateria = async () => {
      setIsPageLoading(true);
      setError(null);
      setData(null);

      try {
        const res = await fetch(API_ENDPOINT, {
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

        // Expecting an array where each object has an 'active' boolean property
        const dataRespond = await res.json(); // Use the more specific type

        setData({
          // Optional: Update title to reflect filtering
          titulo: "Materias",
          nombreTabla: TABLE_RESOURCE_NAME,
          nombreColumnas: {
            // Define columns to DISPLAY.
            // 'active' is used for filtering above, but doesn't need to be shown here unless desired.
            name: "Nombre",
            code: "Código",
            semester: "Semestre",
            // active: "Estado", // <-- Uncomment this line if you WANT to display the 'Active' status column
          },
          // Pass the FILTERED array to the table
          filas: dataRespond.data,
          primaryKey: "id", // Ensure 'id' exists in your RowData
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
  }, []); // Empty dependency array

  const breadcrumbs = [{ label: "Materias", href: "/materias" }]; // Maybe change label to "Materias Activas"

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {/* Error display */}
      {error && !data && (
        <div
          className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
          role="alert"
        >
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {/* Tabla component receives already filtered data */}
      <SubjectsTable
        data={data}
        apiBaseUrl={API_BASE_URL}
        isDataLoading={isPageLoading}
      />

      {/* No results message (will show if activeRows is empty) */}
      {!isPageLoading && !error && data && data.filas.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          No se encontraron materias activas. {/* Optional: Update message */}
        </div>
      )}
    </LayoutAplication>
  );
};

export default SubjetsPage;
