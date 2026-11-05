import {
  Users,
  UserPlus,
  Download,
  MoreVertical,
  X,
} from "lucide-react";
import type {
  Jurado,
  JurorType,
  JurorCategory,
} from "@/types/jurados";
import {
  getInitials,
  formatDate,
  getJurorTypeLabel,
  getJurorCategoryLabel,
} from "@/types/jurados";

interface JuradosListModalProps {
  juradosFiltrados: Jurado[];
  jurorSearch: string;
  onJurorSearchChange: (value: string) => void;
  openJurorMenuId: string | null;
  onOpenJurorMenuIdChange: (id: string | null) => void;
  isSubmitting: boolean;
  onClose: () => void;
  onExport: () => void;
  onOpenCreateJuror: () => void;
  onEditJuror: (jurado: Jurado) => void;
  onResendConfirmation: (email: string) => void;
  onSendJuradoCert: (jurado: Jurado) => void;
  onRemoveTeamsFromJuror: (jurorId: string, jurorName: string) => void;
  onToggleJurorType: (jurado: Jurado) => void;
  onDeleteJuror: (jurorId: string, jurorName: string) => void;
}

export function JuradosListModal({
  juradosFiltrados,
  jurorSearch,
  onJurorSearchChange,
  openJurorMenuId,
  onOpenJurorMenuIdChange,
  isSubmitting,
  onClose,
  onExport,
  onOpenCreateJuror,
  onEditJuror,
  onResendConfirmation,
  onSendJuradoCert,
  onRemoveTeamsFromJuror,
  onToggleJurorType,
  onDeleteJuror,
}: JuradosListModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 md:px-6">
          <div>
            <h2 className="text-lg md:text-xl font-medium">
              Lista de Jurados
            </h2>
            <p className="text-sm text-muted-foreground">
              Gestión completa de jurados registrados
            </p>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenJurorMenuIdChange(null);
            }}
            className="rounded-xl border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-all p-2 flex items-center justify-center"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 md:p-6">
          <div className="flex gap-2 md:gap-3 mb-6">
            <div className="flex-1 min-w-0 relative">
              <input
                type="text"
                value={jurorSearch}
                onChange={(e) => onJurorSearchChange(e.target.value)}
                placeholder="Buscar jurado por nombre o correo"
                className="w-full h-11 md:h-12 rounded-xl border border-border bg-card px-4 text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <button
              onClick={onExport}
              disabled={isSubmitting}
              className="h-11 md:h-12 w-11 md:w-12 flex-shrink-0 rounded-xl border border-border bg-card hover:bg-accent flex items-center justify-center disabled:opacity-50"
              title="Descargar"
            >
              <Download className="w-5 h-5" />
            </button>

            <button
              onClick={onOpenCreateJuror}
              disabled={isSubmitting}
              className="h-11 md:h-12 px-3 md:px-4 flex-shrink-0 rounded-xl border border-border bg-card hover:bg-accent flex items-center justify-center gap-2 disabled:opacity-50"
              title="Agregar jurado"
            >
              <UserPlus className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Registrar</span>
            </button>
          </div>

          <div className="max-h-[58vh] overflow-y-auto space-y-3 pr-1">
            {juradosFiltrados.map((jurado) => (
              <div
                key={jurado.id}
                className="relative rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full border-2 border-border flex items-center justify-center bg-muted text-sm font-medium flex-shrink-0">
                    {getInitials(jurado.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{jurado.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {jurado.email}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Último ingreso: {formatDate(jurado.lastSignInAt)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Estado confirmación: {(jurado.confirmationStatusId === 1) ? "CONFIRMADO" : "PENDIENTE"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Tipo: {getJurorTypeLabel(jurado.tipo)} · Categoría: {getJurorCategoryLabel(jurado.jurorCategory)}
                    </div>

                    {!jurado.jurorCategory && (
                      <div className="mt-2 rounded-lg border border-yellow-500/30 px-3 py-2 text-xs text-yellow-600">
                        Este jurado no puede asignarse hasta tener categoría JUNIOR/SENIOR.
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-border p-3">
                        <div className="text-xs text-muted-foreground mb-1">
                          Evaluados
                        </div>
                        <div className="text-lg font-medium">
                          {jurado.evaluatedCount}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 break-words">
                          {jurado.evaluatedGameNames.length > 0
                            ? jurado.evaluatedGameNames.join(", ")
                            : "Sin videojuegos evaluados"}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border p-3">
                        <div className="text-xs text-muted-foreground mb-1">
                          Pendientes
                        </div>
                        <div className="text-lg font-medium">
                          {jurado.unevaluatedCount}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 break-words">
                          {jurado.unevaluatedGameNames.length > 0
                            ? jurado.unevaluatedGameNames.join(", ")
                            : "Sin pendientes"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() =>
                        onOpenJurorMenuIdChange(
                          openJurorMenuId === jurado.id ? null : jurado.id
                        )
                      }
                      className="h-10 w-10 rounded-xl border border-border hover:bg-accent flex items-center justify-center"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {openJurorMenuId === jurado.id && (
                      <div className="absolute right-0 top-12 z-20 w-56 rounded-2xl border border-border bg-background shadow-xl p-2">
                        <button
                          onClick={() => onEditJuror(jurado)}
                          className="w-full text-left rounded-xl px-3 py-3 hover:bg-accent text-sm"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => void onResendConfirmation(jurado.email)}
                          className="w-full text-left rounded-xl px-3 py-3 hover:bg-accent text-sm"
                        >
                          Reenviar correo de confirmación
                        </button>

                        <button
                          onClick={() => void onSendJuradoCert(jurado)}
                          className="w-full text-left rounded-xl px-3 py-3 hover:bg-accent text-sm"
                        >
                          Enviar certificado de jurado
                        </button>

                        <button
                          onClick={() =>
                            void onRemoveTeamsFromJuror(jurado.id, jurado.name)
                          }
                          className="w-full text-left rounded-xl px-3 py-3 hover:bg-accent text-sm"
                        >
                          Quitar equipos
                        </button>

                        <button
                          onClick={() => void onToggleJurorType(jurado)}
                          className="w-full text-left rounded-xl px-3 py-3 hover:bg-accent text-sm"
                        >
                          {jurado.tipo === "OFFICIAL"
                            ? "Marcar como suplente"
                            : "Marcar como oficial"}
                        </button>

                        <button
                          onClick={() =>
                            void onDeleteJuror(jurado.id, jurado.name)
                          }
                          className="w-full text-left rounded-xl px-3 py-3 hover:bg-accent text-sm text-red-500"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {juradosFiltrados.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                No se encontraron jurados con ese filtro.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
