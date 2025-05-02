// SubjetsPage.tsx
"use client"; // <- Asegúrate que esté si usas hooks

import LayoutAplication from "@/layouts/LayoutAplication";
// Ajusta la ruta si es necesario
import { Tabla, Data, RowData } from "@/components/grupo 9/SubjectsTable";
import { useState, useEffect } from "react";

const SubjetsPage = () => {
  // Tipado más específico si sabes que siempre será un array de materias
  const [data, setData] = useState<Data | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true); // Renombrado para claridad
  const [error, setError] = useState<string | null>(null);

  // URLs y nombres de recursos (sin cambios)
  const API_ENDPOINT = "http://localhost:3000/subjects";
  const API_BASE_URL = "http://localhost:3000";
  const TABLE_RESOURCE_NAME = "subjects";

  useEffect(() => {
    const fetchMateria = async () => {
      // Ya no necesitas setIsLoading(true) aquí si usas el valor inicial
      // setIsPageLoading(true); // Ya es true por defecto
      setError(null);
      setData(null); // Asegurarse de que los datos anteriores se borren al recargar

      try {
        const res = await fetch(API_ENDPOINT, {
          method: "GET",
          credentials: "include", // Revisa si realmente necesitas esto
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          // Intenta obtener un mensaje de error más específico si es posible
          let errorMsg = `Error ${res.status}: Failed to fetch subjects`;
          try {
            const errorBody = await res.json();
            errorMsg = `Error ${res.status}: ${errorBody.message || errorMsg}`;
          } catch (e) {
            /* ignora si el cuerpo no es json */
          }
          throw new Error(errorMsg);
        }
        const dataRespond: RowData[] = await res.json(); // Asumiendo que la API devuelve RowData[]

        // Validar que sea un array
        if (!Array.isArray(dataRespond)) {
          throw new Error("La respuesta de la API no es un array válido.");
        }

        setData({
          titulo: "Materias",
          nombreTabla: TABLE_RESOURCE_NAME,
          nombreColumnas: {
            // Asegúrate que coincidan con las claves de dataRespond
            name: "Nombre",
            code: "Código",
            semester: "Semestre",
            // id: 'ID', // No mostrar ID en la tabla usualmente
          },
          filas: dataRespond,
          primaryKey: "id",
        });
      } catch (err: any) {
        console.error("Error fetching subjects:", err);
        setError(
          err.message || "Ocurrió un error desconocido al cargar las materias."
        );
        setData(null); // Asegura que no haya datos si hay error
      } finally {
        setIsPageLoading(false); // <-- Solo cambia a false al final
      }
    };

    fetchMateria();
  }, []); // Dependencia vacía para ejecutar solo al montar

  const breadcrumbs = [{ label: "Materias", href: "/materias" }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {/* Mostrar error a nivel de página si ocurre durante la carga inicial */}
      {error &&
        !data && ( // Muestra el error solo si la carga falló y no hay datos
          <div
            className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
            role="alert"
          >
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

      {/* Renderiza la Tabla siempre, pasándole el estado de carga inicial */}
      {/* La tabla manejará internamente si data es null o si isPageLoading es true */}
      <Tabla
        data={data} // Pasará null inicialmente, luego el objeto Data
        apiBaseUrl={API_BASE_URL}
        isDataLoading={isPageLoading} // <-- Pasa el estado de carga de la página
      />

      {/* Ya no necesitas el mensaje de carga aquí */}
      {/* {isPageLoading && <div>Loading subjects...</div>} */}

      {/* Puedes mantener un mensaje si la carga fue exitosa pero no hay datos */}
      {!isPageLoading && !error && data && data.filas.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          No se encontraron materias.
        </div>
      )}
    </LayoutAplication>
  );
};

export default SubjetsPage;
