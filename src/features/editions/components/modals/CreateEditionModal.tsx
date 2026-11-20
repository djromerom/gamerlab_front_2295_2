import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createEdition, buildISODateTime } from "@/api/editions";
import { SEMESTER_OPTIONS } from "@/lib/semesterLabel";

interface CreateEditionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

const emptyForm = {
  year: "",
  semester: "10",
  title: "",
  startsAtDate: "",
  startsAtTime: "",
  endsAtTime: "",
  description: "",
  description2: "",
  alt: "",
};

export const CreateEditionModal: React.FC<CreateEditionModalProps> = ({
  open,
  onOpenChange,
  onCreated,
}) => {
    const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación cliente
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

      await createEdition({
        year: Number(formData.year),
        semester: Number(formData.semester),
        title: formData.title.trim(),
        startsAt,
        endsAt,
        description: formData.description.trim() || undefined,
        description2: formData.description2.trim() || undefined,
        alt: formData.alt.trim() || undefined,
      });

      toast.success("Edición creada", { description: `"${formData.title}" fue creada exitosamente.` });

      onOpenChange(false);
      onCreated?.();
      setFormData(emptyForm);
    } catch (err: any) {
      toast.error("Error al crear edición", { description: err?.message ?? "Ocurrió un error inesperado." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plus className="w-5 h-5 text-[#AC7CFF]" />
            Nueva Edición
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-year">Año <span className="text-destructive">*</span></Label>
              <Input
                id="new-year"
                name="year"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                value={formData.year}
                onChange={handleChange}
                placeholder="2025"
                className="bg-background border-border focus-visible:ring-[#AC7CFF] min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-semester">Semestre</Label>
              <select
                id="new-semester"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="flex h-[44px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AC7CFF]"
              >
                {SEMESTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-title">Título <span className="text-destructive">*</span></Label>
            <Input
              id="new-title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Feria Gamer 2025-1"
              className="bg-background border-border focus-visible:ring-[#AC7CFF] min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-date">Fecha del Evento <span className="text-destructive">*</span></Label>
              <Input
                id="new-date"
                name="startsAtDate"
                type="date"
                value={formData.startsAtDate}
                onChange={handleChange}
                className="bg-background border-border focus-visible:ring-[#AC7CFF] min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-start">Hora Inicio <span className="text-destructive">*</span></Label>
              <Input
                id="new-start"
                name="startsAtTime"
                type="time"
                value={formData.startsAtTime}
                onChange={handleChange}
                className="bg-background border-border focus-visible:ring-[#AC7CFF] min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-end">Hora Fin <span className="text-destructive">*</span></Label>
              <Input
                id="new-end"
                name="endsAtTime"
                type="time"
                value={formData.endsAtTime}
                onChange={handleChange}
                className="bg-background border-border focus-visible:ring-[#AC7CFF] min-h-[44px]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-desc">Descripción</Label>
            <Textarea
              id="new-desc"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Texto principal que aparece en el landing…"
              className="bg-background border-border min-h-[90px] focus-visible:ring-[#AC7CFF]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-desc2">
              Descripción Extendida <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <Textarea
              id="new-desc2"
              name="description2"
              value={formData.description2}
              onChange={handleChange}
              className="bg-background border-border min-h-[70px] focus-visible:ring-[#AC7CFF]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-alt">Alt text de la Foto Principal</Label>
            <Input
              id="new-alt"
              name="alt"
              value={formData.alt}
              onChange={handleChange}
              placeholder="Descripción corta para accesibilidad"
              className="bg-background border-border focus-visible:ring-[#AC7CFF] min-h-[44px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#AC7CFF] hover:bg-[#8A5CD6] text-black font-semibold min-h-[44px]"
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              {loading ? "Creando..." : "Crear Edición"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
