"use client";

import LayoutAplication from "@/layouts/LayoutAplication";
import { ProfessorsTable } from "@/components/grupo 9/professorsTable";
import { useState, useEffect, useCallback } from "react";

export interface ProfessorRowData {
  id: string;
  name: string;
  email: string;
  confirmationStatusId: Number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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

export const ProfessorsPage: React.FC = () => {
  const [professors, setProfessors] = useState<ProfessorRowData[] | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const API_ENDPOINT = "http://localhost:3000/professors";
  const API_BASE_URL = "http://localhost:3000";

  const fetchProfessorsData = useCallback(async (page: number, limit: number) => {
    setIsPageLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_ENDPOINT}?page=${page}&limit=${limit}`, {
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

      const dataRespond: PaginatedResult<ProfessorRowData> = await res.json();

      setProfessors(dataRespond.data);
      setTotalPages(dataRespond.metadata.totalPages);
      setTotalItems(dataRespond.metadata.totalItems);

      if (page > dataRespond.metadata.totalPages && dataRespond.metadata.totalPages > 0) {
        setCurrentPage(dataRespond.metadata.totalPages);
      } else if (dataRespond.data.length === 0 && page > 1 && dataRespond.metadata.totalItems > 0) {
        setCurrentPage(page - 1);
      } else if (dataRespond.metadata.totalItems === 0) {
        setCurrentPage(1);
      }

    } catch (err: any) {
      console.error("Error fetching professors:", err);
      setError(
        err.message ||
        "Ocurrió un error desconocido al cargar los profesores."
      );
      setProfessors(null);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setIsPageLoading(false);
    }
  }, [API_ENDPOINT]);

  useEffect(() => {
    fetchProfessorsData(currentPage, rowsPerPage);
  }, [currentPage, rowsPerPage, fetchProfessorsData]);

  const handleDataMutation = useCallback(() => {
    fetchProfessorsData(currentPage, rowsPerPage);
  }, [currentPage, rowsPerPage, fetchProfessorsData]);

  const handleProfessorUpdate = (updatedProfessor: ProfessorRowData) => {
    setProfessors(prevProfs =>
      prevProfs ? prevProfs.map(p => (p.id === updatedProfessor.id ? updatedProfessor : p)) : null
    );
  };

  const handleSetRowsPerPage = (newRows: number) => {
    setRowsPerPage(newRows);
    setCurrentPage(1);
  };

  const breadcrumbs = [{ label: "Profesores", href: "/professors" }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {error && !isPageLoading && (!professors || professors.length === 0) && (
        <div
          className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
          role="alert"
        >
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      <ProfessorsTable
        professors={professors}
        apiBaseUrl={API_BASE_URL}
        isDataLoading={isPageLoading}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={handleSetRowsPerPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onDataChange={handleDataMutation}
        onProfessorUpdate={handleProfessorUpdate}
      />

      {!isPageLoading && !error && professors && professors.length === 0 && totalItems === 0 && (
        <div className="p-4 text-center text-gray-500">
          No se encontraron profesores activos.
        </div>
      )}
    </LayoutAplication>
  );
};
