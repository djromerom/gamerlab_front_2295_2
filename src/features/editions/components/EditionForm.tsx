import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save } from "lucide-react";
import {
  updateEdition,
  buildISODateTime,
  isoToDate,
  isoToTime,
  type Edition,
} from "@/api/editions";

interface EditionFormProps {
  editionId: number;
  initialData?: Edition;
  onSuccess?: () => void;
}

export const EditionForm: React.FC<EditionFormProps> = ({
  editionId,
  initialData,
  onSuccess,
}) => {
    const [loading, setLoading] = useState(false);

  const toFormData = (data?: Edition) => ({
    year: data ? String(data.year) : "",
    semester: data ? String(data.semester) : "10",
    title: data?.title ?? "",
    startsAtDate: data?.startsAt ? isoToDate(data.startsAt) : "",
    startsAtTime: data?.startsAt ? isoToTime(data.startsAt) : "",
    endsAtTime: data?.endsAt ? isoToTime(data.endsAt) : "",
    description: data?.description ?? "",
    description2: data?.description2 ?? "",
    alt: data?.alt ?? "",
  });

  const [formData, setFormData] = useState(() => toFormData(initialData));

  useEffect(() => {
    setFormData(toFormData(initialData));
  }, [initialData?.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.year || formData.year.length !== 4) {
      toast.error("Año inválido", { description: "Ingresa un año de 4 dígitos." });
      return;
    }
    if (!formData.title.trim()) {
      toast.error("Título requerido", { description: "El título no puede estar vacío." });
      return;
    }
    if (!formData.startsAtDate || !formData.startsAtTime || !formData.endsAtTime) {
      toast.error("Fechas requeridas", { description: "Ingresa fecha y horas del evento." });
      return;
    }

    try {
      setLoading(true);

      const startsAt = buildISODateTime(formData.startsAtDate, formData.startsAtTime);
      const endsAt = buildISODateTime(formData.startsAtDate, formData.endsAtTime);

      await updateEdition(editionId, {
        year: Number(formData.year),
        semester: Number(formData.semester),
        title: formData.title.trim(),
        startsAt,
        endsAt,
        description: formData.description.trim() || undefined,
        description2: formData.description2.trim() || undefined,
        alt: formData.alt.trim() || undefined,
      });

      toast.success("Información actualizada", { description: "Los datos de la edición se han guardado correctamente." });
      onSuccess?.();
    } catch (err: any) {
      toast.error("Error al guardar", { description: err?.message ?? "Ocurrió un error inesperado." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">Año</Label>
          <Input
            id="year"
            name="year"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            value={formData.year}
            onChange={handleChange}
            placeholder="2024"
            className="bg-background border-border focus-visible:ring-[#AC7CFF] min-h-[44px]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="semester">Semestre</Label>
          <select
            id="semester"
            name="semester"
            value={formData.semester}
            onChange={handleChange}
            className="flex h-[44px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AC7CFF]"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="30">30</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Título Principal</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="bg-background border-border focus-visible:ring-[#AC7CFF] min-h-[44px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startsAtDate">Fecha del Evento</Label>
          <Input
            id="startsAtDate"
            name="startsAtDate"
            type="date"
            value={formData.startsAtDate}
            onChange={handleChange}
            className="bg-background border-border focus-visible:ring-[#AC7CFF] min-h-[44px]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="startsAtTime">Hora Inicio</Label>
          <Input
            id="startsAtTime"
            name="startsAtTime"
            type="time"
            value={formData.startsAtTime}
            onChange={handleChange}
            className="bg-background border-border focus-visible:ring-[#AC7CFF] min-h-[44px]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endsAtTime">Hora Fin</Label>
          <Input
            id="endsAtTime"
            name="endsAtTime"
            type="time"
            value={formData.endsAtTime}
            onChange={handleChange}
            className="bg-background border-border focus-visible:ring-[#AC7CFF] min-h-[44px]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="bg-background border-border min-h-[100px] focus-visible:ring-[#AC7CFF]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description2">
          Descripción Extendida{" "}
          <span className="text-muted-foreground text-xs">(opcional)</span>
        </Label>
        <Textarea
          id="description2"
          name="description2"
          value={formData.description2}
          onChange={handleChange}
          className="bg-background border-border min-h-[80px] focus-visible:ring-[#AC7CFF]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="alt">Alt text de la Foto Principal</Label>
        <Input
          id="alt"
          name="alt"
          value={formData.alt}
          onChange={handleChange}
          placeholder="Descripción corta para accesibilidad"
          className="bg-background border-border focus-visible:ring-[#AC7CFF] min-h-[44px]"
        />
      </div>

      <Button
        type="submit"
        className="w-full min-h-[44px] bg-[#AC7CFF] hover:bg-[#8A5CD6] text-black font-semibold mt-4"
        disabled={loading}
      >
        <Save className="w-4 h-4 mr-2" />
        {loading ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </form>
  );
};
