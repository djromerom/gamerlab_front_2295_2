import { toast } from "sonner";

export default function downloadGradingTemplate() {
    // Descargar plantilla GLOBAL: ignorar filtros
    toast(`Preparando plantilla de calificaciones global...`);

    const endpoint = `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/download-grading-template-all`;

    fetch(endpoint, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => {
        toast.dismiss();
        if (!response.ok) {
          throw new Error('Error al descargar plantilla');
        }
        return response.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Plantilla_Evaluación_Docente_FeriaGamer.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Plantilla descargada. Completa las notas y súbela de vuelta.');
      })
      .catch((error) => {
        toast.error(`Error al descargar plantilla: ${error.message || 'No se pudo completar la descarga'}`);
      })
};