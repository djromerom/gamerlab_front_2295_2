// SubjetsPage.tsx
"use client";

import LayoutAplication from "@/layouts/LayoutAplication";
import {
  SubjectsTable,
  Data,
  RowData,
} from "./tabla2"; // Adjust path if needed
import { useState, useEffect } from "react";

// Define a more specific interface if possible, including 'active'
interface SubjectRowData extends RowData {
  id: number | string;
  name: string;
  code: string;
  semester: number;
  isActive: boolean; // Make sure 'active' is included and is a boolean
}

const SubjetsPage = () => {
  const [data, setData] = useState<Data | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_ENDPOINT = "http://localhost:3000/juror";
  const API_BASE_URL = "http://localhost:3000";
  const TABLE_RESOURCE_NAME = "juror";

  useEffect(() => {
      const fetchMateria = async () => {
        setIsPageLoading(true);
        setError(null);
        setData(null);

        try {
          const includeInactive = false; 
          const res = await fetch(`${API_ENDPOINT}?includeInactive=${includeInactive}&limit=50&page=1`, {
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
          for (const jurado of dataRespond.data) {
            jurado._count = jurado._count.evaluationsSubmitted;

            switch (jurado.confirmationStatusId) {
              case 1:
                jurado.confirmationStatusId = "Aceptado";
                break;
              case 2:
                jurado.confirmationStatusId = "Pendiente";
                break;
              default:
                jurado.confirmationStatusId = "Expirado";
            }

            jurado.updatedAt = new Date(jurado.updatedAt).toLocaleString("es-ES", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });
          }
          setData({
            // Optional: Update title to reflect filtering
            titulo: "Jurados",
            nombreTabla: TABLE_RESOURCE_NAME,
            nombreColumnas: {
              id: "ID",
              name: "Nombre",
              email: "Correo",
              confirmationStatusId: "Estado",
              updatedAt: "Ultima conexión",
              _count: "Juegos revisados",
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