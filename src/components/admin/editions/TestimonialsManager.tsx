import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, X, MessageSquareQuote, Loader2 } from "lucide-react";
import {
  fetchTestimonials,
  createTestimonial,
  deleteTestimonial,
  type Testimonial,
} from "@/fetchs/editions";

const ExpandableQuote: React.FC<{ text: string }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 150;

  return (
    <div className="mb-2">
      <p
        className={`text-sm italic text-gray-300 ${
          !expanded && isLong ? "line-clamp-4" : ""
        }`}
      >
        "{text}"
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-[#AC7CFF] hover:underline mt-1 font-medium"
        >
          {expanded ? "Leer menos" : "Leer más"}
        </button>
      )}
    </div>
  );
};

interface TestimonialsManagerProps {
  editionId: number;
}

export const TestimonialsManager: React.FC<TestimonialsManagerProps> = ({ editionId }) => {
  
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState({ name: "", role: "", quote: "" });

  // Cargar testimonios al montar
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingList(true);
      try {
        const data = await fetchTestimonials(editionId);
        if (!cancelled) setTestimonials(data);
      } catch (err: any) {
        if (!cancelled) {
          toast.error("Error al cargar testimonios", { description: err?.message ?? "Ocurrió un error inesperado." });
        }
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [editionId]);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.role.trim() || !form.quote.trim()) {
      toast.error("Campos requeridos", { description: "Nombre, rol y testimonio son obligatorios." });
      return;
    }

    try {
      setAdding(true);
      const created = await createTestimonial(editionId, {
        name: form.name.trim(),
        role: form.role.trim(),
        quote: form.quote.trim(),
      });
      setTestimonials(prev => [...prev, created]);
      setForm({ name: "", role: "", quote: "" });
      toast.success("Testimonio guardado", { description: "El testimonio se agregó correctamente." });
    } catch (err: any) {
      toast.error("Error al agregar testimonio", { description: err?.message ?? "Ocurrió un error inesperado." });
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (testimonial: Testimonial) => {
    setDeletingId(testimonial.id);
    try {
      await deleteTestimonial(editionId, testimonial.id);
      setTestimonials(prev => prev.filter(t => t.id !== testimonial.id));
      toast.success("Testimonio eliminado");
    } catch (err: any) {
      toast.error("Error al eliminar", { description: err?.message ?? "Ocurrió un error inesperado." });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Lista de testimonios */}
      <div className="space-y-3">
        <p className="text-sm text-gray-400">
          Los testimonios se muestran en el historial de la edición.
        </p>

        {loadingList ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Cargando testimonios...</span>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-sm text-gray-500 italic p-4 text-center border border-dashed border-gray-800 rounded-lg">
            No hay testimonios agregados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testimonials.map(t => (
              <div
                key={t.id}
                className="bg-[#060312] p-4 rounded-lg border border-gray-800 relative group"
              >
                <button
                  onClick={() => handleRemove(t)}
                  disabled={deletingId === t.id}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-50"
                  title="Eliminar testimonio"
                >
                  {deletingId === t.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
                <div className="flex items-start gap-3 pr-8">
                  <MessageSquareQuote className="w-5 h-5 text-[#AC7CFF] mt-1 shrink-0" />
                  <div>
                    <ExpandableQuote text={t.quote} />
                    <p className="font-bold text-sm text-white">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulario de nuevo testimonio */}
      <div className="pt-6 border-t border-gray-800">
        <h4 className="text-sm font-medium mb-4">Agregar Nuevo Testimonio</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="t-name">Nombre</Label>
              <Input
                id="t-name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ej. Carlos Rodríguez"
                className="bg-[#060312] border-gray-700 min-h-[44px]"
                disabled={adding}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-role">Rol / Semestre</Label>
              <Input
                id="t-role"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                placeholder="Ej. Participante - 4to Semestre"
                className="bg-[#060312] border-gray-700 min-h-[44px]"
                disabled={adding}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-quote">Testimonio</Label>
            <Textarea
              id="t-quote"
              value={form.quote}
              onChange={e => setForm({ ...form, quote: e.target.value })}
              placeholder="Escribe el testimonio aquí..."
              className="bg-[#060312] border-gray-700 min-h-[80px]"
              disabled={adding}
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={adding}
            className="w-full md:w-auto bg-[#AC7CFF]/10 text-[#AC7CFF] hover:bg-[#AC7CFF]/20 border border-[#AC7CFF]/30 min-h-[44px]"
          >
            {adding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Testimonio
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
