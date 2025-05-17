// SubjetsPage.tsx
"use client";

import LayoutAplication from "@/layouts/LayoutAplication";
import {
  SubjectsTable,
  Data as SubjectsTableDataProps, // Renamed to avoid conflict if Data is used elsewhere
  RowData as SubjectRow,         // Alias for clarity
} from "@/components/grupo 9/SubjectsTable"; // Adjust path if needed
import { useState, useEffect, useCallback } from "react";

// Define a more specific interface if possible, including 'active'
interface SubjectRowData extends SubjectRow { // Extend the RowData from SubjectsTable
  id: number | string;
  name: string;
  code: string;
  semester: number;
  isActive: boolean;
}

// From your DTOs for backend response structure
export interface PaginatedResult<T> {
  data: T[];
  metadata: {
    totalItems: number;
    itemsOnCurrentPage: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
}

const SubjetsPage = () => {
  const [subjectsItems, setSubjectsItems] = useState<SubjectRowData[] | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); // Default 10 as requested
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const API_ENDPOINT = "http://localhost:3000/subjects";
  const API_BASE_URL = "http://localhost:3000";
  const TABLE_RESOURCE_NAME = "subjects";

  const fetchMateria = useCallback(async (page: number, limit: number) => {
    setIsPageLoading(true);
    setError(null);
    // setSubjectsItems(null); // Optional: Clear previous items for a full loading state

    try {
      const res = await fetch(`${API_ENDPOINT}?page=${page}&limit=${limit}`, {
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

      const responseData: PaginatedResult<SubjectRowData> = await res.json();

      setSubjectsItems(responseData.data);
      setTotalPages(responseData.metadata.totalPages);
      setTotalItems(responseData.metadata.totalItems);
      // setCurrentPage(responseData.metadata.currentPage); // Already managed

      // Adjust current page if it's out of bounds after data change
      if (page > responseData.metadata.totalPages && responseData.metadata.totalPages > 0) {
        setCurrentPage(responseData.metadata.totalPages); // Will trigger refetch via useEffect
      } else if (responseData.data.length === 0 && page > 1 && responseData.metadata.totalItems > 0) {
        // If current page becomes empty and it's not the first page, go to previous
        setCurrentPage(page - 1); // Will trigger refetch via useEffect
      } else if (responseData.metadata.totalItems === 0) {
        setCurrentPage(1); // Reset to page 1 if no items
      }

    } catch (err: any) {
      console.error("Error fetching subjects:", err);
      setError(
        err.message || "Ocurrió un error desconocido al cargar las materias."
      );
      setSubjectsItems(null);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setIsPageLoading(false);
    }
  }, [API_ENDPOINT]); // Add dependencies if they are used inside and can change

  useEffect(() => {
    fetchMateria(currentPage, rowsPerPage);
  }, [currentPage, rowsPerPage, fetchMateria]);

  const handleDataMutation = useCallback(() => {
    // Refetch current page data
    fetchMateria(currentPage, rowsPerPage);
  }, [currentPage, rowsPerPage, fetchMateria]);

  const handleSubjectUpdate = (updatedSubject: SubjectRowData) => {
    setSubjectsItems(prevItems =>
      prevItems ? prevItems.map(item => (item.id === updatedSubject.id ? updatedSubject : item)) : null
    );
  };

  const handleSetRowsPerPage = (newSize: number) => {
    setRowsPerPage(newSize);
    setCurrentPage(1); // Reset to first page
  };

  const breadcrumbs = [{ label: "Materias", href: "/materias" }];

  const tablePropsForChild: SubjectsTableDataProps | null = subjectsItems ? {
    titulo: "Materias",
    nombreTabla: TABLE_RESOURCE_NAME,
    nombreColumnas: {
      name: "Nombre",
      code: "Código",
      semester: "Semestre",
    },
    filas: subjectsItems,
    primaryKey: "id",
  } : null;


  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {error && !isPageLoading && (!subjectsItems || subjectsItems.length === 0) && (
        <div
          className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
          role="alert"
        >
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      <SubjectsTable
        data={tablePropsForChild}
        apiBaseUrl={API_BASE_URL}
        isDataLoading={isPageLoading}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={handleSetRowsPerPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onDataChange={handleDataMutation}
        onRowUpdate={handleSubjectUpdate} // Changed from onActionPerformed and onNrcUpdate
      />

      {!isPageLoading && !error && subjectsItems && subjectsItems.length === 0 && totalItems === 0 && (
        <div className="p-4 text-center text-gray-500">
          No se encontraron materias.
        </div>
      )}
    </LayoutAplication>
  );
};

export default SubjetsPage;
