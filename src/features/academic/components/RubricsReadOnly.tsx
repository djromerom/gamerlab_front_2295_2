import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFetch } from "@/hooks/useFetch";
import {
  RUBRICS_EMPTY_MESSAGE,
  RUBRICS_ERROR_MESSAGE,
  RUBRICS_LIMIT,
  type Rubric,
} from "@/features/academic/lib/rubrics";

/**
 * HU-53 (ARK-325): jurados y profesores consultan las rúbricas (criterios de calificación activos) en solo
 * lectura: nombre, descripción y peso, en la misma tabla del Administrador. No hay acciones de escritura ni criterios inactivos; la
 * vista del Administrador sigue en CriterionTable.
 */
export function RubricsReadOnly() {
  const customFetch = useFetch();
  const [rubrics, setRubrics] = useState<Rubric[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    setRubrics(null);
    try {
      const res = await customFetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/criteria?page=1&limit=${RUBRICS_LIMIT}`,
        { method: "GET" },
      );
      // Sesión vencida: apiFetch cierra la sesión y la ruta protegida lleva al login.
      if (res.status === 401) return;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { data?: Rubric[] };
      setRubrics((body.data ?? []).filter((rubric) => rubric.isActive));
    } catch {
      setError(true);
    }
  }, [customFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const colSpan = 3;

  // Misma tabla que ve el Administrador en «Criterios de Calificación», sin «Agregar» ni el menú ⋮.
  return (
    <div className="md:bg-background text-foreground min-h-screen p-4">
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-xl font-medium">Criterios de Evaluación</h1>
      </div>

      <Card className="rounded-lg bg-card">
        <div className="overflow-hidden">
          <Table className="table-fixed">
            <TableHeader className="bg-card border-b border-border">
              <TableRow>
                <TableHead className="w-[36%] md:w-[30%]">Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-[56px] md:w-[96px]">Peso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {error ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="h-24 text-center whitespace-normal">
                    <div role="alert" className="flex flex-col items-center gap-3">
                      <p className="text-destructive">{RUBRICS_ERROR_MESSAGE}</p>
                      <Button type="button" variant="outline" className="cursor-pointer" onClick={() => void load()}>
                        Reintentar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rubrics === null ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="h-24 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span>Cargando...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rubrics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="h-24 text-center whitespace-normal">
                    {RUBRICS_EMPTY_MESSAGE}
                  </TableCell>
                </TableRow>
              ) : (
                rubrics.map((rubric) => (
                  <TableRow key={rubric.id}>
                    <TableCell className="whitespace-normal break-normal hyphens-auto align-top">{rubric.name}</TableCell>
                    <TableCell className="whitespace-normal break-normal hyphens-auto align-top">
                      {rubric.description || "-"}
                    </TableCell>
                    <TableCell className="align-top">{rubric.weight || "0"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

export default RubricsReadOnly;
