"use client";

import LayoutAplication from "@/layouts/LayoutAplication";
import { ProfessorsTable } from "@/components/grupo 9/professorsTable"; // Ajusta la ruta según tu estructura
import { useState, useEffect } from "react";

interface ProfessorRowData {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProfessorsPage = () => {
  const [professors, setProfessors] = useState<ProfessorRowData[] | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_ENDPOINT = "http://localhost:3000/professors";
  const API_BASE_URL = "http://localhost:3000";

  useEffect(() => {
    const fetchProfessors = async () => {
      setIsPageLoading(true);
      setError(null);
      setProfessors(null);

      try {
        const res = await fetch(API_ENDPOINT, {
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
            /* ignore */
          }
          throw new Error(errorMsg);
        }

        const dataRespond: ProfessorRowData[] = await res.json();

        if (!Array.isArray(dataRespond)) {
          throw new Error("La respuesta de la API no es un array válido.");
        }

        // Filtramos solo los profesores activos
        const activeProfessors = dataRespond.filter(
          (professor) => professor.isActive === true
        );

        setProfessors(activeProfessors);
      } catch (err: any) {
        console.error("Error fetching professors:", err);
        setError(
          err.message ||
            "Ocurrió un error desconocido al cargar los profesores."
        );
        setProfessors(null);
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchProfessors();
  }, []);

  const breadcrumbs = [{ label: "Profesores", href: "/professors" }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {/* Error display */}
      {error && !professors && (
        <div
          className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
          role="alert"
        >
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {/* Tabla de profesores */}
      <ProfessorsTable
        professors={professors}
        apiBaseUrl={API_BASE_URL}
        isDataLoading={isPageLoading}
      />

      {/* No results message */}
      {!isPageLoading && !error && professors && professors.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          No se encontraron profesores activos.
        </div>
      )}
    </LayoutAplication>
  );
};

export default ProfessorsPage;
