"use client";

import LayoutAplication from "@/layouts/LayoutAplication";
import { JuryManagementTable, Data } from "./tabla2"; // Adjust path if needed
import { useState, useEffect } from "react";
import LoadingScreen from "@/components/grupo 5/LoadingScreen"; // Importamos el componente LoadingScreen

// Define an interface for the raw juror data from the API for better type safety
interface RawJurorData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  confirmationStatusId: number;
  lastSignInAt: string; // ISO date string
  evaluatedCount: number;
  evaluatedGameNames: string[];
  unevaluatedCount: number;
  unevaluatedGameNames: string[];
  // Add any other properties that might come from the API
}

// Define an interface for the transformed juror data that will be used in the table
// This should align with what `Data` and `JuryManagementTable` expect for `filas`
interface TransformedJurorData {
  id: string;
  name: string; // Combined firstName and lastName
  email: string;
  confirmationStatusId: string; // Transformed to "Aceptado", "Pendiente", etc.
  lastSignInAt: string; // Formatted date string
  _count: number; // Derived from evaluatedCount
  // Include original fields if they are still needed by the table or other logic
  // For example, if you spread the original jurado object:
  // firstName: string;
  // lastName: string;
  // evaluatedCount: number;
}

const JuryManagementPage = () => {
  // It's good practice to type `Data` more specifically if its structure is known.
  // For `filas`, it would be TransformedJurorData[]
  const [data, setData] = useState<Data | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_ENDPOINT = `${import.meta.env.VITE_ENDPOINT_BACKEND}/juror`;
  const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;
  const TABLE_RESOURCE_NAME = "juror";

  useEffect(() => {
    const fetchJurados = async () => {
      setIsPageLoading(true);
      setError(null);
      setData(null);

      try {
        const includeInactive = false;
        const res = await fetch(
          `${API_ENDPOINT}?includeInactive=${includeInactive}&limit=50&page=1`,
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

        const dataRespond: { data: RawJurorData[]; metadata: any } =
          await res.json();

        // Transform the data for the table
        // Using .map is cleaner and creates new objects, preventing accidental modification of raw data elsewhere.
        const transformedFilas: TransformedJurorData[] = dataRespond.data.map(
          (jurado: RawJurorData) => {
            let statusString: string;
            switch (jurado.confirmationStatusId) {
              case 1:
                statusString = "Aceptado";
                break;
              case 2:
                statusString = "Pendiente";
                break;
              default:
                statusString = "Expirado";
            }

            const formattedLastSignInAt = new Date(
              jurado.lastSignInAt
            ).toLocaleString("es-ES", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });

            return {
              // Spreading jurado first allows keeping all original fields if needed,
              // then override/add specific ones.
              // ...jurado, // Uncomment if you need all original fields in `filas` items

              // Explicitly map fields needed by the table as per `nombreColumnas`
              id: jurado.id,
              name: `${jurado.firstName} ${jurado.lastName}`, // Create full name
              email: jurado.email,
              confirmationStatusId: statusString, // Use the transformed string
              lastSignInAt: formattedLastSignInAt, // Use the formatted date
              _count: jurado.evaluatedCount, // Correctly assign evaluatedCount to _count
            };
          }
        );

        setData({
          titulo: "Jurados",
          nombreTabla: TABLE_RESOURCE_NAME,
          nombreColumnas: {
            id: "ID",
            name: "Nombre",
            email: "Correo",
            confirmationStatusId: "Estado",
            lastSignInAt: "Última actualización",
            _count: "Juegos revisados",
          },
          filas: transformedFilas, // Pass the transformed array
          primaryKey: "id",
        });
      } catch (err: any) {
        console.error("Error fetching jurors:", err);
        setError(
          err.message || "An unknown error occurred while loading the jurors."
        );
        setData(null);
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchJurados();
  }, []); // Empty dependency array

  const breadcrumbs = [{ label: "Jurados", href: "/jurados" }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {isPageLoading ? (
        <LoadingScreen text="Cargando jurados..." />
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

          <JuryManagementTable
            data={data}
            apiBaseUrl={API_BASE_URL}
            isDataLoading={isPageLoading}
          />

          {!isPageLoading && !error && data && data.filas.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No se encontraron jurados.
            </div>
          )}
        </>
      )}
    </LayoutAplication>
  );
};

export default JuryManagementPage;
