"use client";

import LayoutAplication from "@/layouts/LayoutAplication";
import { CriterionTable } from "@/components/grupo 9/CriterionTable"; // Ajusta la ruta según tu estructura
import { useState, useEffect } from "react";

interface CriterionRowData {
  id: number;
  name: string;
  description?: string;
  weight?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CriteriaPage = () => {
  const [criteria, setCriteria] = useState<CriterionRowData[] | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_ENDPOINT = "http://localhost:3000/criteria";
  const API_BASE_URL = "http://localhost:3000";

  useEffect(() => {
    const fetchCriteria = async () => {
      setIsPageLoading(true);
      setError(null);
      setCriteria(null);

      try {
        const res = await fetch(API_ENDPOINT, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          let errorMsg = `Error ${res.status}: Failed to fetch criteria`;
          try {
            const errorBody = await res.json();
            errorMsg = `Error ${res.status}: ${errorBody.message || errorMsg}`;
          } catch (e) {
            /* ignore */
          }
          throw new Error(errorMsg);
        }

        const dataRespond: CriterionRowData[] = await res.json();

        if (!Array.isArray(dataRespond)) {
          throw new Error("La respuesta de la API no es un array válido.");
        }

        // Filtramos solo los criterios activos
        const activeCriteria = dataRespond.filter(
          (criterion) => criterion.isActive === true
        );

        setCriteria(activeCriteria);
      } catch (err: any) {
        console.error("Error fetching criteria:", err);
        setError(
          err.message || "Ocurrió un error desconocido al cargar los criterios."
        );
        setCriteria(null);
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchCriteria();
  }, []);

  const breadcrumbs = [{ label: "Criterios", href: "/criteria" }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {/* Error display */}
      {error && !criteria && (
        <div
          className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
          role="alert"
        >
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {/* Tabla de criterios */}
      <CriterionTable
        criteria={criteria}
        apiBaseUrl={API_BASE_URL}
        isDataLoading={isPageLoading}
      />

      {/* No results message */}
      {!isPageLoading && !error && criteria && criteria.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          No se encontraron criterios activos.
        </div>
      )}
    </LayoutAplication>
  );
};

export default CriteriaPage;
