"use client";

import LayoutAplication from "@/layouts/LayoutAplication";
import { NrcsTable, Data } from "@/components/grupo 9/NrcsTable";
import { useState, useEffect } from "react";
import LoadingScreen from "@/components/grupo 5/LoadingScreen";

const NrcsPage = () => {
  const [data, setData] = useState<Data | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_ENDPOINT = `http://localhost:3000/nrcs`;
  const API_BASE_URL = `http://localhost:3000`;
  const TABLE_RESOURCE_NAME = "nrcs";

  useEffect(() => {
    console.log("inicio de la carga de NRC's");
    const fetchNrcs = async () => {
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
          } catch (e) {}
          throw new Error(errorMsg);
        }
        const dataRespond = await res.json();

        setData({
          title: "NRC'S",
          TableName: TABLE_RESOURCE_NAME,
          columns: {
            code: "Código",
            "subject.name": "Nombre de la Materia",
            "professor.name": "Profesor",
          },
          rows: dataRespond.data,
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
    fetchNrcs();
  }, []);

  const breadcrumbs = [{ label: "NRC's", href: "/nrcs" }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {isPageLoading ? (
              <LoadingScreen text="Cargando nrc's..." />
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

          <NrcsTable
            data={data}
            apiBaseUrl={API_BASE_URL}
            isDataLoading={isPageLoading}
          />
          {!isPageLoading && !error && data && data.rows.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No se encontraron NRC's activos.
            </div>
          )}
          </>
      )}
    </LayoutAplication>
  );
};

export default NrcsPage;
