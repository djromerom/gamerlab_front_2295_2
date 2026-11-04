import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_MAX_TEAMS_PER_JUROR,
  MAX_TEAMS_PER_JUROR_LIMIT,
  confirmAutomaticAssignment,
  isPlanOutdated,
  previewAutomaticAssignment,
  type AutoAssignmentConfirmResult,
  type AutoAssignmentPreview,
  type EvaluatorKind,
  type AutoJurorCategory,
  type PlannedTeam,
} from "@/fetchs/automaticAssignment";
import { groupAlerts, type AlertSeverity } from "./automaticAssignmentAlerts";

const SEVERITY_STYLES: Record<AlertSeverity, { box: string; icon: typeof Info }> = {
  danger: { box: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400", icon: AlertCircle },
  data: { box: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400", icon: AlertCircle },
  warning: { box: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400", icon: AlertTriangle },
  info: { box: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400", icon: Info },
};

/** Grupos con muchas alertas se muestran plegados para no tapar el resto. */
const OPEN_GROUP_MAX_ALERTS = 5;

type TeamFilter = "all" | "alerts" | "new";
type DetailView = "teams" | "jurors";

function evaluatorLabel(kind: EvaluatorKind, category: AutoJurorCategory): string {
  if (kind === "PROFESSOR") return "Profesor";
  if (category === "SENIOR") return "Senior";
  if (category === "JUNIOR") return "Junior";
  return "Sin categoría";
}

interface AutomaticAssignmentModalProps {
  onClose: () => void;
  /** Se llama después de guardar: el padre refresca sus datos y cierra el modal. */
  onConfirmed: (result: AutoAssignmentConfirmResult) => void | Promise<void>;
}

export function AutomaticAssignmentModal({ onClose, onConfirmed }: AutomaticAssignmentModalProps) {
  const [preview, setPreview] = useState<AutoAssignmentPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [outdatedNotice, setOutdatedNotice] = useState<string | null>(null);

  // `usedLimit` es el valor con el que se calculó la vista previa: confirm debe enviar el mismo
  const [usedLimit, setUsedLimit] = useState<number | undefined>(undefined);
  const [limitInput, setLimitInput] = useState(String(DEFAULT_MAX_TEAMS_PER_JUROR));
  const [limitError, setLimitError] = useState<string | null>(null);

  const [detailView, setDetailView] = useState<DetailView>("teams");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  // Evita que una respuesta vieja pise a una más nueva (p. ej. al recalcular dos veces seguidas)
  const requestIdRef = useRef(0);

  const loadPreview = useCallback(async (limit?: number) => {
    const requestId = ++requestIdRef.current;
    setIsLoadingPreview(true);
    setPreviewError(null);
    setSaveError(null);
    try {
      const data = await previewAutomaticAssignment(limit);
      if (requestId !== requestIdRef.current) return;
      setPreview(data);
      setUsedLimit(limit);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setPreview(null);
      setPreviewError(
        error instanceof Error ? error.message : "No se pudo generar la vista previa.",
      );
    } finally {
      if (requestId === requestIdRef.current) setIsLoadingPreview(false);
    }
  }, []);

  useEffect(() => {
    void loadPreview();
    return () => {
      // Al cerrar, cualquier respuesta pendiente se descarta
      requestIdRef.current += 1;
    };
  }, [loadPreview]);

  const isBusy = isLoadingPreview || isSaving;

  const handleClose = useCallback(() => {
    if (isSaving) return;
    onClose();
  }, [isSaving, onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  const effectiveLimit = usedLimit ?? DEFAULT_MAX_TEAMS_PER_JUROR;
  const limitChanged = limitInput.trim() !== String(effectiveLimit);

  const recalculate = () => {
    const value = Number(limitInput);
    if (!Number.isInteger(value) || value < 1 || value > MAX_TEAMS_PER_JUROR_LIMIT) {
      setLimitError(`Escribe un número entero entre 1 y ${MAX_TEAMS_PER_JUROR_LIMIT}.`);
      return;
    }
    setLimitError(null);
    setOutdatedNotice(null);
    // Con el valor por defecto no se envía el campo, como pide el contrato
    void loadPreview(value === DEFAULT_MAX_TEAMS_PER_JUROR ? undefined : value);
  };

  const confirm = async () => {
    if (!preview) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const result = await confirmAutomaticAssignment(preview.assignments, usedLimit);
      toast.success(result.message || "Asignación automática guardada.");
      await onConfirmed(result);
    } catch (error) {
      if (isPlanOutdated(error)) {
        const message = (error as Error).message;
        setOutdatedNotice(message);
        toast.warning(message);
        setIsSaving(false);
        await loadPreview(usedLimit);
        return;
      }
      const message =
        error instanceof Error ? error.message : "No se pudo guardar la asignación automática.";
      setSaveError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const alertGroups = useMemo(() => groupAlerts(preview?.alerts ?? []), [preview]);

  const alertCodesByTeam = useMemo(() => {
    const map = new Map<number, Set<string>>();
    for (const alert of preview?.alerts ?? []) {
      if (alert.teamId === undefined) continue;
      if (!map.has(alert.teamId)) map.set(alert.teamId, new Set());
      map.get(alert.teamId)!.add(alert.code);
    }
    return map;
  }, [preview]);

  const levelLabel = useCallback(
    (level: number | null) => {
      if (level === null) return "Sin nivel";
      return preview?.levels.find((item) => item.level === level)?.label ?? `Nivel ${level}`;
    },
    [preview],
  );

  const visibleTeams = useMemo(() => {
    const teams = preview?.teams ?? [];
    return teams.filter((team) => {
      if (levelFilter !== "all" && String(team.level) !== levelFilter) return false;
      if (teamFilter === "alerts") return alertCodesByTeam.has(team.id);
      if (teamFilter === "new") return team.jurors.some((juror) => !juror.fixed);
      return true;
    });
  }, [preview, teamFilter, levelFilter, alertCodesByTeam]);

  const visibleJurors = useMemo(() => {
    const jurors = preview?.jurors ?? [];
    return jurors.filter(
      (juror) => levelFilter === "all" || String(juror.level) === levelFilter,
    );
  }, [preview, levelFilter]);

  const newAssignments = preview?.summary.newAssignments ?? 0;
  const canConfirm = Boolean(preview) && newAssignments > 0 && !isBusy && !limitChanged;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auto-assignment-title"
    >
      <div className="w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 md:px-6">
          <div className="min-w-0">
            <h2 id="auto-assignment-title" className="text-lg md:text-xl font-medium flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
              Asignación automática de jurados
            </h2>
            <p className="text-sm text-muted-foreground">
              Vista previa: todavía no se guardó nada. Revisa la distribución y las alertas antes de confirmar.
            </p>
            {preview && (
              <p className="text-xs text-muted-foreground mt-1">
                Edición <span className="font-medium text-foreground">{preview.edition.title}</span>
                {" · "}hasta {preview.limits.jurorsPerTeam} jurados por grupo
                {" · "}hasta {preview.limits.maxTeamsPerJuror} grupos por jurado, del mismo nivel
                {preview.backupJurorsExcluded > 0 && (
                  <>
                    {" · "}
                    {preview.backupJurorsExcluded === 1
                      ? "1 remanente queda de reserva"
                      : `${preview.backupJurorsExcluded} remanentes quedan de reserva`}
                  </>
                )}
              </p>
            )}
          </div>

          <button
            onClick={handleClose}
            disabled={isSaving}
            className="rounded-xl border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-all p-2 flex items-center justify-center disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {/* Límite de grupos por jurado */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Máximo de grupos por jurado</span>
              <input
                type="number"
                min={1}
                max={MAX_TEAMS_PER_JUROR_LIMIT}
                value={limitInput}
                onChange={(event) => setLimitInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") recalculate();
                }}
                disabled={isBusy}
                className="w-32 rounded-md border border-border bg-card px-3 py-2 text-sm disabled:opacity-50"
              />
            </label>
            <button
              onClick={recalculate}
              disabled={isBusy}
              className="flex items-center justify-center gap-2 rounded-md border bg-card hover:bg-accent text-foreground px-4 py-2 text-sm disabled:opacity-50 w-fit"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingPreview ? "animate-spin" : ""}`} />
              Recalcular vista previa
            </button>
            {limitChanged && !limitError && (
              <span className="text-xs text-amber-700 dark:text-amber-400">
                Recalcula la vista previa para usar el nuevo límite antes de confirmar.
              </span>
            )}
            {limitError && <span className="text-xs text-red-500">{limitError}</span>}
          </div>

          {outdatedNotice && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 p-3 text-sm flex gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p>{outdatedNotice}</p>
                <p className="text-xs mt-1">
                  Se generó una vista previa nueva con los datos actuales. Revísala y confirma otra vez.
                </p>
              </div>
            </div>
          )}

          {saveError && (
            <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 p-3 text-sm flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{saveError}</p>
            </div>
          )}

          {isLoadingPreview && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">Calculando la asignación…</span>
            </div>
          )}

          {!isLoadingPreview && previewError && (
            <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400 space-y-3">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{previewError}</p>
              </div>
              <button
                onClick={() => void loadPreview(usedLimit)}
                className="flex items-center gap-2 rounded-md border border-border bg-card hover:bg-accent text-foreground px-3 py-1.5 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Intentar de nuevo
              </button>
            </div>
          )}

          {!isLoadingPreview && preview && (
            <>
              {newAssignments === 0 && (
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400 p-3 text-sm flex gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>No hay asignaciones nuevas por hacer.</p>
                </div>
              )}

              {/* Resumen */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <SummaryCard label="Asignaciones nuevas" value={preview.summary.newAssignments} accent />
                <SummaryCard
                  label="Grupos completos"
                  value={`${preview.summary.completeTeams} / ${preview.summary.teams}`}
                />
                <SummaryCard label="Grupos incompletos" value={preview.summary.incompleteTeams} warn={preview.summary.incompleteTeams > 0} />
                <SummaryCard label="Grupos sin senior" value={preview.summary.teamsWithoutSenior} warn={preview.summary.teamsWithoutSenior > 0} />
                <SummaryCard
                  label="Jurados con grupos nuevos"
                  value={`${preview.summary.jurorsWithNewTeams} / ${preview.summary.availableJurors}`}
                />
              </div>

              {/* Alertas */}
              <section aria-label="Alertas" className="space-y-2">
                <h3 className="text-sm font-medium">
                  Alertas ({preview.alerts.length})
                </h3>
                {alertGroups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin alertas: la distribución cumple todas las reglas.</p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Las alertas no impiden confirmar: revísalas y decide.
                    </p>
                    {alertGroups.map((group) => {
                      const style = SEVERITY_STYLES[group.severity];
                      const Icon = style.icon;
                      return (
                        <details
                          key={group.code}
                          open={group.alerts.length <= OPEN_GROUP_MAX_ALERTS}
                          className={`rounded-xl border p-3 text-sm ${style.box}`}
                        >
                          <summary className="cursor-pointer flex items-center gap-2 font-medium">
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span>{group.title}</span>
                            <span className="ml-auto text-xs rounded-full border border-current px-2 py-0.5">
                              {group.alerts.length}
                            </span>
                          </summary>
                          {group.hint && <p className="text-xs mt-2 opacity-90">{group.hint}</p>}
                          <ul className="mt-2 space-y-1 list-disc pl-5 text-foreground/90">
                            {group.alerts.map((alert, index) => (
                              <li key={`${group.code}-${alert.teamId ?? alert.jurorId ?? index}-${index}`}>
                                {alert.message}
                              </li>
                            ))}
                          </ul>
                        </details>
                      );
                    })}
                  </>
                )}
              </section>

              {/* Cobertura por nivel */}
              {preview.levels.length > 0 && (
                <section aria-label="Cobertura por nivel" className="space-y-2">
                  <h3 className="text-sm font-medium">Cobertura por nivel</h3>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-muted-foreground text-xs">
                        <tr>
                          <th className="text-left font-medium px-3 py-2">Nivel</th>
                          <th className="text-right font-medium px-3 py-2">Grupos</th>
                          <th className="text-right font-medium px-3 py-2">Completos</th>
                          <th className="text-right font-medium px-3 py-2">Cupos sin cubrir</th>
                          <th className="text-right font-medium px-3 py-2">Sin senior</th>
                          <th className="text-right font-medium px-3 py-2">Jurados</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.levels.map((level) => (
                          <tr key={level.level} className="border-t border-border">
                            <td className="px-3 py-2">{level.label}</td>
                            <td className="px-3 py-2 text-right">{level.teams}</td>
                            <td className="px-3 py-2 text-right">{level.completeTeams}</td>
                            <td className={`px-3 py-2 text-right ${level.missingSlots > 0 ? "text-amber-600 font-medium" : ""}`}>
                              {level.missingSlots}
                            </td>
                            <td className={`px-3 py-2 text-right ${level.teamsWithoutSenior > 0 ? "text-amber-600 font-medium" : ""}`}>
                              {level.teamsWithoutSenior}
                            </td>
                            <td className="px-3 py-2 text-right">{level.jurors}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Detalle */}
              <section aria-label="Detalle" className="space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="inline-flex rounded-lg border border-border p-0.5 w-fit" role="tablist">
                    <TabButton active={detailView === "teams"} onClick={() => setDetailView("teams")}>
                      Por grupo ({preview.teams.length})
                    </TabButton>
                    <TabButton active={detailView === "jurors"} onClick={() => setDetailView("jurors")}>
                      Por jurado ({preview.jurors.length})
                    </TabButton>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {detailView === "teams" && (
                      <select
                        aria-label="Filtrar grupos"
                        value={teamFilter}
                        onChange={(event) => setTeamFilter(event.target.value as TeamFilter)}
                        className="rounded-md border border-border bg-card px-2 py-1.5 text-xs"
                      >
                        <option value="all">Todos los grupos</option>
                        <option value="alerts">Solo con alertas</option>
                        <option value="new">Solo con jurados nuevos</option>
                      </select>
                    )}
                    <select
                      aria-label="Filtrar por nivel"
                      value={levelFilter}
                      onChange={(event) => setLevelFilter(event.target.value)}
                      className="rounded-md border border-border bg-card px-2 py-1.5 text-xs"
                    >
                      <option value="all">Todos los niveles</option>
                      {preview.levels.map((level) => (
                        <option key={level.level} value={String(level.level)}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {detailView === "teams" ? (
                  visibleTeams.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No hay grupos con este filtro.</p>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {visibleTeams.map((team) => (
                        <TeamCard
                          key={team.id}
                          team={team}
                          levelLabel={levelLabel(team.level)}
                          jurorsPerTeam={preview.limits.jurorsPerTeam}
                          alertCodes={alertCodesByTeam.get(team.id)}
                        />
                      ))}
                    </div>
                  )
                ) : visibleJurors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {preview.jurors.length === 0
                      ? "Ningún jurado puede recibir grupos nuevos. Revisa las alertas (jurados sin categoría o con niveles mezclados)."
                      : "No hay jurados con este filtro."}
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-muted-foreground text-xs">
                        <tr>
                          <th className="text-left font-medium px-3 py-2">Jurado</th>
                          <th className="text-left font-medium px-3 py-2">Tipo</th>
                          <th className="text-left font-medium px-3 py-2">Nivel</th>
                          <th className="text-right font-medium px-3 py-2">Grupos (antes → después)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleJurors.map((juror) => {
                          const gained = juror.teamsAfter - juror.teamsBefore;
                          return (
                            <tr key={juror.id} className="border-t border-border">
                              <td className="px-3 py-2">{juror.name || "Sin nombre"}</td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {evaluatorLabel(juror.kind, juror.jurorCategory)}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {juror.level === null ? "Sin grupos" : levelLabel(juror.level)}
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap">
                                {juror.teamsBefore} → {juror.teamsAfter}
                                {gained > 0 && (
                                  <span className="ml-2 text-xs rounded-full px-2 py-0.5 bg-green-500/10 text-green-600 border border-green-500/20">
                                    +{gained}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Pie */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 border-t border-border px-4 py-3 md:px-6">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="rounded-md border bg-card hover:bg-accent text-foreground px-4 py-2 text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => void confirm()}
            disabled={!canConfirm}
            className="flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving
              ? "Guardando…"
              : newAssignments > 0
                ? `Confirmar ${newAssignments} ${newAssignments === 1 ? "asignación" : "asignaciones"}`
                : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent = false,
  warn = false,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        accent ? "border-primary/30 bg-primary/5" : warn ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-card"
      }`}
    >
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`text-xl font-semibold mt-0.5 ${warn ? "text-amber-600" : ""}`}>{value}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function TeamCard({
  team,
  levelLabel,
  jurorsPerTeam,
  alertCodes,
}: {
  team: PlannedTeam;
  levelLabel: string;
  jurorsPerTeam: number;
  alertCodes?: Set<string>;
}) {
  const withoutSenior = alertCodes?.has("TEAM_WITHOUT_SENIOR") ?? false;

  return (
    <div className="rounded-xl border border-border bg-card p-3" data-testid={`auto-team-${team.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">
            {team.teamCode} · {team.teamName}
          </div>
          <div className="text-xs text-muted-foreground">{levelLabel}</div>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
              team.complete
                ? "border-green-500/20 bg-green-500/10 text-green-600"
                : "border-amber-500/30 bg-amber-500/10 text-amber-600"
            }`}
          >
            {team.jurors.length}/{jurorsPerTeam} jurados
          </span>
          {withoutSenior && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 font-semibold">
              Sin senior
            </span>
          )}
        </div>
      </div>

      {team.jurors.length === 0 ? (
        <p className="text-xs text-muted-foreground mt-2">Este grupo queda sin jurados.</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {team.jurors.map((juror) => (
            <li
              key={juror.id}
              className={`text-xs rounded-lg border px-2 py-1 ${
                juror.fixed
                  ? "border-border bg-muted/40 text-muted-foreground"
                  : "border-green-500/40 bg-green-500/10 text-foreground"
              }`}
            >
              <span className="font-medium">{juror.name || "Sin nombre"}</span>
              <span className="opacity-75"> · {evaluatorLabel(juror.kind, juror.jurorCategory)}</span>
              <span
                className={`ml-1.5 text-[10px] font-semibold ${juror.fixed ? "" : "text-green-600 dark:text-green-400"}`}
              >
                {juror.fixed ? "Ya asignado" : "Nuevo"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
