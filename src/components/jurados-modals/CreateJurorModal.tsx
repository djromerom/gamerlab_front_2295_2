import { X } from "lucide-react";
import type { JurorType, JurorCategory } from "@/types/jurados";

interface CreateJurorFormState {
  firstName: string;
  lastName: string;
  email: string;
  jurorCategory: "" | JurorCategory;
  tipo: "" | JurorType;
}

interface CreateJurorModalProps {
  form: CreateJurorFormState;
  onFormChange: (updater: (prev: CreateJurorFormState) => CreateJurorFormState) => void;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function CreateJurorModal({
  form,
  onFormChange,
  isSubmitting,
  onClose,
  onSubmit,
}: CreateJurorModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-background shadow-xl">
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-2 md:px-8 md:pt-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
              Agregar Nuevo Jurado
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mt-2">
              Complete todos los datos del nuevo jurado. La categoría y el tipo son obligatorios.
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
          <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-y-5 gap-x-5 mt-4 items-center">
            <label className="text-foreground text-sm md:text-base font-medium">
              Nombres *
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
              Apellidos *
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
              Correo electrónico *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              className="h-11 md:h-12 rounded-xl border border-border bg-card px-4 text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/30"
            />

            <label className="text-foreground text-sm md:text-base font-medium leading-tight">
              Categoría *
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
              Tipo operativo *
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
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
