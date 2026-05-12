import { toast } from "sonner";

export default function exportToExcel(){
    // Exportar de forma GLOBAL: ignorar filtros de Materia/NRC
    toast(`Preparando exportación global (todos los NRCs)...`);

    const endpoint = `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/download-grading-report-grouped?final=true`;

    fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
    })
    .then((response) => {
        toast.dismiss();
        if (!response.ok) {
          throw new Error('Error al exportar a Excel');
        }
        return response.blob();
    })
    .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_Calificaciones_FeriaGamer_${new Date().toISOString().slice(0,10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success(`Reporte global exportado correctamente`);
    })
    .catch((error) => {
        toast.error(`Error al descargar plantilla: ${error.message || 'No se pudo completar la descarga'}`);
    })
};