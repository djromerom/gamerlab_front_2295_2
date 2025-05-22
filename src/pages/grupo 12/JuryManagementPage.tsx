"use client";

import LayoutAplication from "@/layouts/LayoutAplication";
import { JuryManagementTable } from "../../components/grupo 12/JuryManagementTable"; // Adjust path if needed
import { useState, useEffect, useCallback } from "react";
import LoadingScreen from "@/components/grupo 5/LoadingScreen";
import {
  formatDate,
  mapConfirmationStatus,
} from "../../components/grupo 12/utils"; // Adjust path if needed
import { Jurado, Data } from "../../components/grupo 12/utils";

const JuryManagementPage = () => {
  const [data, setData] = useState<Data | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const API_ENDPOINT = `${import.meta.env.VITE_ENDPOINT_BACKEND}/juror`;
  const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;
  const TABLE_RESOURCE_NAME = "juror";

  const fetchJurados = useCallback(async () => {
    setIsPageLoading(true);
    setError(null);
    setData(null);

    try {
      const includeInactive = false;
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
      const response = await res.json(); // Use the more specific type
      console.log("DATA", response.data);
      const transformedJurors: Jurado[] = response.data.map(
        (jurado: any): Jurado => ({
          ...jurado,
          confirmationStatusId: mapConfirmationStatus(
            jurado.confirmationStatusId
          ),
          lastSignInAt: formatDate(jurado.lastSignInAt),
        })
      );
      setTotalRows(response.metadata.totalItems);
      setTotalPages(response.metadata.totalPages);
      console.log("Response", response);
      setData({
        // Optional: Update title to reflect filtering
        titulo: "Jurados",
        nombreTabla: TABLE_RESOURCE_NAME,
        nombreColumnas: {
          id: "ID",
          firstName: "Nombre",
          lastName: "Apellido",
          email: "Correo",
          confirmationStatusId: "Estado",
          lastSignInAt: "Última conexión",
          evaluatedCount: "Juegos revisados",
          unevaluatedCount: "Juegos pendientes",
        },
        // Pass the FILTERED array to the table
        filas: transformedJurors,
        primaryKey: "id", // Ensure 'id' exists in your RowData
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
  }, [limit, page]);

  useEffect(() => {
    fetchJurados();
  }, [fetchJurados]); // Empty dependency array

  const refresh = async () => {
    await fetchJurados(); // devuelve la promesa para que el hijo haga await
  };

  const breadcrumbs = [{ label: "Jurados", href: "/jurados" }];
  console.log("Página actual:", page);
  console.log("Total ROWS", totalRows);

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {isPageLoading ? (
        <LoadingScreen text="Cargando jurados..." />
      ) : (
        <>
          {/* Error display */}
          {error && !data && (
            <div
              className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
              role="alert"
            >
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          {data && (
            <JuryManagementTable
              data={data}
              totalRows={totalRows}
              totalPages={totalPages}
              page={page}
              limit={limit}
              isLoading={isPageLoading}
              setIsLoading={setIsPageLoading}
              onPageChange={setPage}
              onLimitChange={setLimit}
              apiBaseUrl={API_BASE_URL}
              onRefresh={refresh}
            />
          )}

          {/* No results message (will show if activeRows is empty) */}
          {!isPageLoading && !error && data && data.filas.length === 0 && (
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
