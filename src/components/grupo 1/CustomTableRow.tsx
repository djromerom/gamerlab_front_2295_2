// CustomTableRowBeta.tsx
"use client";

import { useState } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useGlobalState } from "@/fetchs/grupo 1/GlobalStateContext"; // Ajusta la ruta
import { toast } from "sonner";

interface CustomTableRowProps {
  title: string; // Seguirá siendo "Reporte General" o similar
  description: string;
}

// Asumimos que este componente solo se usa para UNA fila en DownloadReport.tsx
// que representa el "Reporte General (con filtros aplicados)"
export const CustomTableRowBeta = ({ title, description }: CustomTableRowProps) => {
  const { filtroMateria, filtroNRC } = useGlobalState();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    const BASE_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";
    let endpointUrl = `${BASE_URL}/reports/exportExcel`; // Ajusta si tu módulo es diferente
    const queryParams = new URLSearchParams();

    // Aplicar filtros si están activos (no son "Todas" o "Todos")
    if (filtroMateria && filtroMateria !== "Todas") {
      queryParams.append("materia", filtroMateria);
    }
    if (filtroNRC && filtroNRC !== "Todos") {
      queryParams.append("nrc", filtroNRC); // El backend espera nrc como number, pero URLSearchParams lo envía como string. NestJS suele manejarlo.
    }

    const queryString = queryParams.toString();
    if (queryString) {
      endpointUrl += `?${queryString}`;
    }

    console.log("Descargando Excel con filtros desde:", endpointUrl);

    try {
      const response = await fetch(endpointUrl, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        let errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || JSON.stringify(errorData) || errorMessage;
        } catch (e) { /* No era JSON */ }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const filename = "reporte_videojuegos.xlsx"; // Nombre fijo del backend

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Reporte descargado exitosamente como ${filename}.`);

    } catch (err: any) {
      console.error("Error al descargar el archivo Excel:", err);
      toast.error(`Error al descargar el reporte: ${err.message || "Error desconocido"}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPdf = async () => {
    toast.info("Descarga de PDF no implementada todavía.");
    // Implementar lógica similar cuando el endpoint de PDF esté listo
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{title}</TableCell>
      <TableCell>{description}</TableCell>
      <TableCell> {/* Columna de Acciones */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label={`Descargar ${title} en Excel`}
            onClick={handleDownloadExcel}
            disabled={isDownloading}
            className="cursor-pointer"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            Excel
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            aria-label={`Descargar ${title} en PDF`}
            onClick={handleDownloadPdf}
            disabled={true} // Deshabilitar hasta que esté implementado
            className="cursor-pointer"
          >
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};