import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, X, Pencil, Save, GraduationCap, Loader2, Check } from "lucide-react";
import {
  fetchEducationalFocuses,
  createEducationalFocus,
  updateEducationalFocus,
  deleteEducationalFocus,
  type EducationalFocus,
} from "@/api/editions";

interface EducationalFocusesManagerProps {
  editionId: number;
}

export const EducationalFocusesManager: React.FC<EducationalFocusesManagerProps> = ({ editionId }) => {
  
  const [focuses, setFocuses] = useState<EducationalFocus[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  // ID del focus que se está editando inline, null si ninguno
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; description: string }>({ title: "", description: "" });

  // Formulario para nuevo focus
  const [newForm, setNewForm] = useState({ title: "", description: "" });

  // Cargar enfoques al montar
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingList(true);
      try {
        const data = await fetchEducationalFocuses(editionId);
        if (!cancelled) setFocuses(data);
      } catch (err: any) {
        if (!cancelled) {
          toast.error("Error al cargar enfoques", { description: err?.message ?? "Ocurrió un error inesperado." });
        }
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [editionId]);

  const handleAdd = async () => {
    if (!newForm.title.trim()) {
      toast.error("Título requerido", { description: "El título del enfoque es obligatorio." });
      return;
    }
    try {
      setAdding(true);
      const created = await createEducationalFocus(editionId, {
        title: newForm.title.trim(),
        description: newForm.description.trim() || undefined,
      });
      setFocuses(prev => [...prev, created]);
      setNewForm({ title: "", description: "" });
      toast.success("Enfoque agregado", { description: `"${created.title}" fue agregado correctamente.` });
    } catch (err: any) {
      toast.error("Error al agregar enfoque", { description: err?.message ?? "Ocurrió un error inesperado." });
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (focus: EducationalFocus) => {
    setEditingId(focus.id);
    setEditForm({ title: focus.title, description: focus.description ?? "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: "", description: "" });
  };

  const handleSaveEdit = async (id: number) => {
    if (!editForm.title.trim()) {
      toast.error("Título requerido", { description: "El título no puede estar vacío." });
      return;
    }
    try {
      setSavingId(id);
      const updated = await updateEducationalFocus(editionId, id, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
      });
      setFocuses(prev => prev.map(f => f.id === id ? updated : f));
      setEditingId(null);
      toast.success("Enfoque actualizado");
    } catch (err: any) {
      toast.error("Error al actualizar enfoque", { description: err?.message ?? "Ocurrió un error inesperado." });
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (focus: EducationalFocus) => {
    setDeletingId(focus.id);
    try {
      await deleteEducationalFocus(editionId, focus.id);
      setFocuses(prev => prev.filter(f => f.id !== focus.id));
      toast.success("Enfoque eliminado");
    } catch (err: any) {
      toast.error("Error al eliminar enfoque", { description: err?.message ?? "Ocurrió un error inesperado." });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">
        Los enfoques educativos describen las áreas temáticas que se trabajaron en la edición.
      </p>

      {/* Lista de enfoques */}
      {loadingList ? (
        <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Cargando enfoques...</span>
        </div>
      ) : focuses.length === 0 ? (
        <div className="text-sm text-gray-500 italic p-4 text-center border border-dashed border-gray-800 rounded-lg">
          No hay enfoques educativos agregados.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {focuses.map(focus => (
            <div
              key={focus.id}
              className="bg-[#060312] rounded-lg border border-gray-800 p-4 group"
            >
              {editingId === focus.id ? (
                /* Modo edición inline */
                <div className="space-y-3">
                  <Input
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="Título del enfoque"
                    className="bg-background border-gray-700 min-h-[40px] text-sm"
                    disabled={savingId === focus.id}
                    autoFocus
                  />
                  <Textarea
                    value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Descripción (opcional)"
                    className="bg-background border-gray-700 min-h-[60px] text-sm"
                    disabled={savingId === focus.id}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(focus.id)}
                      disabled={savingId === focus.id}
                      className="bg-[#AC7CFF] hover:bg-[#8A5CD6] text-black min-h-[36px]"
                    >
                      {savingId === focus.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : (
                        <Check className="w-3.5 h-3.5 mr-1" />
                      )}
                      Guardar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelEdit}
                      disabled={savingId === focus.id}
                      className="text-muted-foreground min-h-[36px]"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                /* Modo lectura */
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-[#AC7CFF] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white">{focus.title}</p>
                    {focus.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{focus.description}</p>
                    )}
                  </div>
                  {/* Acciones — aparecen en hover */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => startEdit(focus)}
                      disabled={deletingId === focus.id}
                      className="p-1.5 text-gray-400 hover:text-[#AC7CFF] hover:bg-[#AC7CFF]/10 rounded transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(focus)}
                      disabled={deletingId === focus.id}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center disabled:opacity-50"
                      title="Eliminar"
                    >
                      {deletingId === focus.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formulario agregar nuevo */}
      <div className="pt-4 border-t border-gray-800 space-y-3">
        <h4 className="text-sm font-medium">Agregar Nuevo Enfoque</h4>
        <div className="space-y-2">
          <Label htmlFor="ef-title">Título <span className="text-destructive">*</span></Label>
          <Input
            id="ef-title"
            value={newForm.title}
            onChange={e => setNewForm({ ...newForm, title: e.target.value })}
            placeholder="Ej. Diseño de experiencias interactivas"
            className="bg-[#060312] border-gray-700 min-h-[44px]"
            disabled={adding}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ef-desc">
            Descripción <span className="text-muted-foreground text-xs">(opcional)</span>
          </Label>
          <Textarea
            id="ef-desc"
            value={newForm.description}
            onChange={e => setNewForm({ ...newForm, description: e.target.value })}
            placeholder="Breve descripción del enfoque educativo..."
            className="bg-[#060312] border-gray-700 min-h-[70px]"
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
              Agregar Enfoque
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
