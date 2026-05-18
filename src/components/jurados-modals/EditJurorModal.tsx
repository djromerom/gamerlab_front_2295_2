import { X } from "lucide-react";
import type { JurorType, JurorCategory, Jurado } from "@/types/jurados";

interface EditJurorFormState {
  firstName: string;
  lastName: string;
  email: string;
  jurorCategory: "" | JurorCategory;
  tipo: "" | JurorType;
}

interface EditJurorModalProps {
  editingJuror: Jurado;
  form: EditJurorFormState;
  onFormChange: (updater: (prev: EditJurorFormState) => EditJurorFormState) => void;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function EditJurorModal({
  editingJuror,
  form,
  onFormChange,
  isSubmitting,
  onClose,
  onSubmit,
}: EditJurorModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-background shadow-xl">
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-2 md:px-8 md:pt-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
              Editar Jurado
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mt-2 max-w-xl">
              Modifique los datos del jurado. El correo electrónico no se puede editar.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-all p-2 flex items-center justify-center"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-6 md:px-8 md:pb-8">
          <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-y-5 gap-x-5 mt-4 items-center">
            <label className="text-foreground text-sm md:text-base font-medium">
              Nombres
            </label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  firstName: e.target.value,
                }))
              }
              className="h-11 md:h-12 rounded-xl border border-border bg-card px-4 text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/30"
            />

            <label className="text-foreground text-sm md:text-base font-medium">
              Apellidos
            </label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  lastName: e.target.value,
                }))
              }
              className="h-11 md:h-12 rounded-xl border border-border bg-card px-4 text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/30"
            />

            <label className="text-foreground text-sm md:text-base font-medium leading-tight">
              Correo electrónico
            </label>
            <input
              type="email"
              value={form.email}
              disabled
              className="h-11 md:h-12 rounded-xl border border-border bg-card px-4 text-sm md:text-base text-muted-foreground outline-none opacity-80"
            />

            <label className="text-foreground text-sm md:text-base font-medium leading-tight">
              Categoría
            </label>
            <select
              value={form.jurorCategory}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  jurorCategory: e.target.value as "" | JurorCategory,
                }))
              }
              className="h-11 md:h-12 rounded-xl border border-border bg-card px-4 text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Selecciona una categoría</option>
              <option value="JUNIOR">Junior</option>
              <option value="SENIOR">Senior</option>
            </select>

            <label className="text-foreground text-sm md:text-base font-medium leading-tight">
              Tipo operativo
            </label>
            <select
              value={form.tipo}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  tipo: e.target.value as "" | JurorType,
                }))
              }
              className="h-11 md:h-12 rounded-xl border border-border bg-card px-4 text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Selecciona un tipo</option>
              <option value="OFFICIAL">Oficial</option>
              <option value="BACKUP">Remanente</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={onClose}
              className="h-11 px-5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-sm md:text-base font-semibold"
            >
              Cancelar
            </button>

            <button
              onClick={() => void onSubmit()}
              disabled={isSubmitting}
              className="h-11 px-5 rounded-xl bg-[#b7c6f7] hover:opacity-90 text-[#1b1b1b] text-sm md:text-base font-semibold disabled:opacity-50"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
