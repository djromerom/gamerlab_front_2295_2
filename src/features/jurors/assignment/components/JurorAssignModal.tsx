import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  UserPlus,
  X,
} from "lucide-react";
import type {
  Jurado,
  Team,
} from "@/features/jurors/types/jurors";
import {
  getInitials,
  formatDate,
  getJurorTypeLabel,
  getJurorCategoryLabel,
  isColegioTeam,
} from "@/features/jurors/types/jurors";
import { searchJurors } from "@/features/jurors/assignment/lib/jurorsListFilter";

interface JuradoAssignModalProps {
  selectedTeam: Team;
  juradosDisponiblesParaModal: Jurado[];
  reassignContext: {
    teamId: number;
    currentJurorId: string;
    currentJurorName: string;
  } | null;
  isSubmitting: boolean;
  /** Mensaje del back cuando la asignación se bloquea (p. ej. equipo de otra edición, ARK-131). */
  errorMessage?: string | null;
  onClose: () => void;
  onAssign: (teamId: number, jurado: Jurado) => void;
  onReassign: (teamId: number, currentJurorId: string, newJuror: Jurado) => void;
}

export function JurorAssignModal({
  selectedTeam,
  juradosDisponiblesParaModal,
  reassignContext,
  isSubmitting,
  errorMessage = null,
  onClose,
  onAssign,
  onReassign,
}: JuradoAssignModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const juradosVisibles = useMemo(
    () => searchJurors(juradosDisponiblesParaModal, search),
    [juradosDisponiblesParaModal, search],
  );

  // Con mouse se puede escribir de una vez; en el celular no, para que el teclado no tape la lista al abrir
  useEffect(() => {
    if (window.matchMedia?.("(pointer: fine)").matches) searchRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-4 md:px-6">
          <div>
            <h2 className="text-lg md:text-xl font-medium">
              {reassignContext ? "Reasignar Jurado" : "Asignar Jurado"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Equipo: {selectedTeam.name} · Videojuego: {selectedTeam.game}
            </p>
            {reassignContext && (
              <p className="text-xs text-muted-foreground mt-1">
                Reemplazando a: {reassignContext.currentJurorName}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-all p-2 flex items-center justify-center"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 md:px-6 md:pb-6">
          <div className="mt-4 md:mt-6 mb-4 rounded-xl border border-border bg-card p-4">
            <div className="text-sm font-medium">{selectedTeam.name}</div>
            <div className="text-sm text-muted-foreground">
              {selectedTeam.jurados.length}/{selectedTeam.requiredJurados} jurados asignados
            </div>
            {!reassignContext &&
              selectedTeam.jurados.length >= selectedTeam.requiredJurados && (
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-500">
                  El equipo ya tiene los jurados requeridos: el que elijas quedará
                  como jurado adicional.
                </div>
              )}
            {isColegioTeam(selectedTeam) && (
              <div className="mt-2 text-xs text-blue-500">
                Equipo de colegio: los jurados Junior no aparecerán como opción disponible.
              </div>
            )}
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-4 whitespace-pre-line rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {errorMessage}
            </div>
          )}

          {juradosDisponiblesParaModal.length > 0 && (
            // Al bajar por la lista, la búsqueda queda arriba a la vista
            <div className="sticky top-0 z-10 -mx-1 mb-3 bg-background px-1 py-1">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  ref={searchRef}
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o correo"
                  aria-label="Buscar jurado por nombre o correo"
                  className="w-full h-11 rounded-xl border border-border bg-card pl-9 pr-4 text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          )}

          <div className="space-y-3">
            {juradosVisibles.map((jurado) => (
              <div
                key={jurado.id}
                className="rounded-xl border border-border bg-card p-4 flex items-start gap-3"
              >
                <div className="w-11 h-11 rounded-full border-2 border-border flex items-center justify-center bg-muted text-sm font-medium flex-shrink-0">
                  {getInitials(jurado.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{jurado.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {jurado.email}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Tipo: {getJurorTypeLabel(jurado.tipo)} · Categoría: {getJurorCategoryLabel(jurado.jurorCategory)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Último ingreso: {formatDate(jurado.lastSignInAt)}
                  </div>
                </div>

                <button
                  onClick={() =>
                    reassignContext
                      ? void onReassign(
                        selectedTeam.id,
                        reassignContext.currentJurorId,
                        jurado
                      )
                      : void onAssign(selectedTeam.id, jurado)
                  }
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 text-sm disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  {reassignContext ? "Reasignar" : "Asignar"}
                </button>
              </div>
            ))}

            {juradosDisponiblesParaModal.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                No hay jurados disponibles para asignar. Recuerda que deben tener categoría JUNIOR/SENIOR.
              </div>
            )}

            {juradosDisponiblesParaModal.length > 0 && juradosVisibles.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground break-words">
                Ningún jurado disponible coincide con «{search.trim()}».
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
