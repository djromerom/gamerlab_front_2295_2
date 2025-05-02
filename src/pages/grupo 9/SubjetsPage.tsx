import LayoutAplication from "@/layouts/LayoutAplication"; // Adjust path
import { Tabla, Data } from "@/components/grupo 9/Table"; // Adjust path
import { useState, useEffect } from "react";

const SubjetsPage = () => {
  const [data, setData] = useState<Data | null>(null); // Start as null
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state

  const API_ENDPOINT = "http://localhost:3000/subjects";
  const API_BASE_URL = "http://localhost:3000"; // Just the base
  const TABLE_RESOURCE_NAME = "subjects"; // Resource name

  useEffect(() => {
    const fetchMateria = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(API_ENDPOINT, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" }, // Optional for GET
        });

        if (!res.ok) {
          throw new Error(`Error ${res.status}: Failed to fetch subjects`);
        }
        const dataRespond = await res.json();

        setData({
          titulo: "Materias",
          nombreTabla: "subjects", // Keep this as 'subjects' to match API route
          nombreColumnas: {
            // Use keys that MATCH the properties in dataRespond objects
            name: "Nombre", // Use 'name' as the key
            code: "Código", // Use 'code' as the key
            semester: "Semestre", // Use 'semester' as the key
            // You could add 'active: "Activo"' if you want to display it
          },
          filas: dataRespond, // This data has 'id', 'name', 'code', 'semester'
          primaryKey: "id", // SET primaryKey to 'id' to match the data
        });
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMateria(); // No need for .catch here as it's handled inside
  }, []); // Empty dependency array ensures fetch runs once on mount

  const breadcrumbs = [{ label: "Materias", href: "/materias" }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {isLoading && <div>Loading subjects...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}
      {/* Render Tabla only when data is loaded and there's no error */}
      {!isLoading && !error && data && (
        <Tabla data={data} apiBaseUrl={API_BASE_URL} />
      )}
      {/* Optional: Handle case where data loaded but is empty */}
      {!isLoading && !error && data && data.filas.length === 0 && (
        <div>No subjects found.</div>
      )}
    </LayoutAplication>
  );
};

export default SubjetsPage;
