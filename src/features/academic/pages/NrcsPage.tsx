"use client";

import LayoutApplication from "@/layouts/LayoutApplication";
import { NrcsTable } from "@/features/academic/components/NrcsTable";
import { useState, useEffect } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import { useFetch } from "@/hooks/useFetch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Lock } from "lucide-react";
import { fetchEditions, type Edition, type EditionStatus } from "@/api/editions";
import type { ListEdition } from "@/features/teams/api/editionStudents";
import { NRC_ORDER_HINT, nrcsUrl } from "@/features/academic/api/nrcs";

const EDITION_STATUS_LABEL: Record<EditionStatus, string> = {
  ACTIVE: "Activa",
  INACTIVE: "Inactiva",
  ARCHIVED: "Archivada",
};

interface Nrc {
  id: number;
  code: string;
  professorId: string;
  subjectId: number;
  professor: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
  };
  subject: {
    id: number;
    name: string;
    code: string;
    isActive: boolean;
    semester: number;
  };
  members: any[];
  createdAt: string;
  updatedAt: string;
}

interface PaginatedNrcs {
  data: Nrc[];
  metadata: {
    totalItems: number;
    itemsOnCurrentPage: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
  /** ARK-136: edición del listado (con `readOnly`); `null` si no hay edición activa. */
  edition?: ListEdition | null;
}

const NrcsPage = () => {
  const [nrcsData, setNrcsData] = useState<PaginatedNrcs | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  });
  const [refreshFlag, setRefreshFlag] = useState(false);
  const customFecth = useFetch();

  // ARK-136 (BG-23): edición elegida (undefined = la activa) y la que respondió el back
  const [editions, setEditions] = useState<Edition[]>([]);
  const [editionId, setEditionId] = useState<number | undefined>(undefined);
  const edition = nrcsData?.edition ?? null;
  const readOnly = edition?.readOnly ?? false;

  useEffect(() => {
    fetchEditions()
      .then(setEditions)
      .catch(() => setEditions([])); // sin la lista queda la edición activa por defecto
  }, []);

  const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;

  const fetchNrcs = async (page: number, limit: number) => {
    setIsPageLoading(true);
    setError(null);

    try {
      const res = await customFecth(
        nrcsUrl(API_BASE_URL, { page, limit, editionId }),
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        let errorMsg = `Error ${res.status}: Failed to fetch NRCs`;
        try {
          const errorBody = await res.json();
          errorMsg = `Error ${res.status}: ${errorBody.message || errorMsg}`;
        } catch (e) {
          /* ignore */
        }
        throw new Error(errorMsg);
      }

      const dataRespond: PaginatedNrcs = await res.json();

      // Si la página actual está vacía pero no es la primera, retroceder
      if (dataRespond.data.length === 0 && page > 1) {
        return fetchNrcs(page - 1, limit);
      }

      setNrcsData(dataRespond);
    } catch (err: any) {
      console.error("Error fetching NRCs:", err);
      setError(
        err.message || "Ocurrió un error desconocido al cargar los NRCs."
      );
      setNrcsData(null);
    } finally {
      setIsPageLoading(false);
    }
  };

  const refreshData = () => {
    setRefreshFlag((prev) => !prev);
  };

  useEffect(() => {
    fetchNrcs(pagination.page, pagination.limit);
  }, [pagination.page, pagination.limit, refreshFlag, editionId]);

  const changeEdition = (value: string) => {
    setEditionId(value ? Number(value) : undefined);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination({ page: 1, limit });
  };

  const breadcrumbs = [{ label: "NRC's", href: "/nrcs" }];

  const header = (
    <div className="space-y-3 px-4 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm opacity-80">{NRC_ORDER_HINT}</p>
        <label className="flex items-center gap-2 text-sm">
          <span className="shrink-0">Edición</span>
          <select
            aria-label="Edición"
            value={editionId ?? ""}
            onChange={(e) => changeEdition(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-2 text-sm max-w-[260px]"
          >
            <option value="">Edición activa</option>
            {editions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} · {EDITION_STATUS_LABEL[e.status] ?? e.status}
              </option>
            ))}
          </select>
        </label>
      </div>
      {readOnly && edition && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>Edición de solo lectura</AlertTitle>
          <AlertDescription>
            {edition.title} no es la edición activa: sus NRC se consultan como historial, pero no se agregan,
            editan ni eliminan.
          </AlertDescription>
        </Alert>
      )}
      {!readOnly && edition && nrcsData?.metadata.totalItems === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{edition.title} todavía no tiene NRC</AlertTitle>
          <AlertDescription>
            Cada equipo debe elegir al menos un NRC: cárgalos antes de abrir las inscripciones.
          </AlertDescription>
        </Alert>
      )}
      {nrcsData && !edition && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No hay una edición activa</AlertTitle>
          <AlertDescription>Activa una edición en Ediciones para cargar sus NRC.</AlertDescription>
        </Alert>
      )}
    </div>
  );

  return (
    <LayoutApplication breadcrumbs={breadcrumbs}>
      {header}
      {isPageLoading ? (
        <LoadingScreen text="Cargando NRCs..." />
      ) : (
        <>
          {error && !nrcsData && (
            <div
              className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
              role="alert"
            >
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          {nrcsData && (
            <NrcsTable
              nrcs={nrcsData.data}
              pagination={nrcsData.metadata}
              apiBaseUrl={API_BASE_URL}
              isDataLoading={isPageLoading}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              refreshData={refreshData}
              readOnly={readOnly}
            />
          )}
        </>
      )}
    </LayoutApplication>
  );
};

export default NrcsPage;
