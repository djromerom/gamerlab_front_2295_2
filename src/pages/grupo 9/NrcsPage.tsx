"use client";

import LayoutAplication from "@/layouts/LayoutAplication";
import { NrcsTable, Data as NrcsTableData, RowData as NrcRowData } from "@/components/grupo 9/NrcsTable";
import { useState, useEffect, useCallback } from "react";

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

const NrcsPage = () => {
  const [nrcsItems, setNrcsItems] = useState<NrcRowData[] | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); // Default to 10
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const API_ENDPOINT = "http://localhost:3000/nrcs";
  const API_BASE_URL = "http://localhost:3000";
  const TABLE_RESOURCE_NAME = "nrcs";

  const fetchNrcsData = useCallback(async (page: number, limit: number) => {
    setIsPageLoading(true);
    setError(null);
    // setNrcsItems(null); // Clear previous items only if you want a full loader, or keep for smoother pagination

    try {
      const res = await fetch(`${API_ENDPOINT}?page=${page}&limit=${limit}`, { // No includeInactive
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        let errorMsg = `Error ${res.status}: Failed to fetch NRCs`;
        try {
          const errorBody = await res.json();
          errorMsg = `Error ${res.status}: ${errorBody.message || errorMsg}`;
        } catch (e) { /* ignore */ }
        throw new Error(errorMsg);
      }

      const dataRespond: PaginatedResult<NrcRowData> = await res.json();

      setNrcsItems(dataRespond.data);
      setTotalPages(dataRespond.metadata.totalPages);
      setTotalItems(dataRespond.metadata.totalItems);

      // Adjust current page if it's out of bounds after data change
      if (page > dataRespond.metadata.totalPages && dataRespond.metadata.totalPages > 0) {
        setCurrentPage(dataRespond.metadata.totalPages);
      } else if (dataRespond.data.length === 0 && page > 1 && dataRespond.metadata.totalItems > 0) {
        // If current page becomes empty and it's not the first page, go to previous
        setCurrentPage(page - 1);
      } else if (dataRespond.metadata.totalItems === 0) {
        setCurrentPage(1); // Reset to page 1 if no items
      }

    } catch (err: any) {
      console.error("Error fetching NRCs:", err);
      setError(
        err.message || "Ocurrió un error desconocido al cargar los NRCs."
      );
      setNrcsItems(null);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setIsPageLoading(false);
    }
  }, [API_ENDPOINT]);

  useEffect(() => {
    fetchNrcsData(currentPage, rowsPerPage);
  }, [currentPage, rowsPerPage, fetchNrcsData]);

  const handleDataMutation = useCallback(() => {
    // Refetch current page data
    fetchNrcsData(currentPage, rowsPerPage);
  }, [currentPage, rowsPerPage, fetchNrcsData]);

  const handleNrcUpdate = (updatedNrc: NrcRowData) => {
    setNrcsItems(prevItems =>
      prevItems ? prevItems.map(item => (item.id === updatedNrc.id ? updatedNrc : item)) : null
    );
  };

  const handleSetRowsPerPage = (newRows: number) => {
    setRowsPerPage(newRows);
    setCurrentPage(1); // Reset to page 1 when rows per page changes
  };

  const breadcrumbs = [{ label: "NRC's", href: "/nrcs" }];

  const tableDataForChild: NrcsTableData | null = nrcsItems ? {
    title: "NRC'S",
    TableName: TABLE_RESOURCE_NAME,
    columns: {
      code: "Código",
      "subject.name": "Nombre de la Materia",
      "professor.name": "Profesor",
    },
    rows: nrcsItems,
  } : null;

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {error && !isPageLoading && (!nrcsItems || nrcsItems.length === 0) && (
        <div
          className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
          role="alert"
        >
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      <NrcsTable
        data={tableDataForChild}
        apiBaseUrl={API_BASE_URL}
        isDataLoading={isPageLoading}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={handleSetRowsPerPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onDataChange={handleDataMutation}
        onNrcUpdate={handleNrcUpdate}
      />
      {!isPageLoading && !error && nrcsItems && nrcsItems.length === 0 && totalItems === 0 && (
        <div className="p-4 text-center text-gray-500">
          No se encontraron NRC's activos.
        </div>
      )}
    </LayoutAplication>
  );
};

export default NrcsPage;
