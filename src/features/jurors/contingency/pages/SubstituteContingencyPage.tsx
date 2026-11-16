import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCheck, ChevronRight, Info, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { AppSidebar } from "@/layouts/AppSidebar";
import { PanelBackground } from "@/components/background/PanelBackground";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AssignmentWarningsDialog } from "@/features/jurors/assignment/components/AssignmentWarningsDialog";
import { useAssignmentWarnings } from "@/features/jurors/assignment/hooks/useAssignmentWarnings";
import {
  ContingencyError,
  acceptSubstituteSuggestions,
  fetchContingencySuggestions,
  rejectSubstituteSuggestion,
  type ContingencySettings,
  type GroupSuggestion,
  type SubstitutePair,
  type SuggestionsResult,
} from "@/features/jurors/contingency/api/contingency";
import { ContingencyGroupCard } from "@/features/jurors/contingency/components/ContingencyGroupCard";
import { ContingencySettingsCard } from "@/features/jurors/contingency/components/ContingencySettingsCard";
import { ChooseSubstituteDialog } from "@/features/jurors/contingency/components/ChooseSubstituteDialog";
import { RejectSuggestionDialog } from "@/features/jurors/contingency/components/RejectSuggestionDialog";
import {
  allSuggestedPairs,
  describeAcceptError,
  groupSuggestedPairs,
  phaseNotice,
  plural,
} from "@/features/jurors/contingency/lib/contingency";

/** Durante la feria la vista se refresca sola (la alerta de HU-12 también lo hace). */
export const REFRESH_SECONDS = 60;

type AcceptSource = "group" | "all" | "manual";

const formatBogotaTime = (value: string) =>
  new Intl.DateTimeFormat("es-CO", { timeStyle: "medium", timeZone: "America/Bogota" }).format(new Date(value));

/**
 * HU-14 (ARK-214): contingencia con suplentes. Grupos en riesgo, sugerencia de suplentes y las
 * acciones del administrador: aceptar (un grupo o todo), rechazar y elegir otro a mano.
 */
export default function SubstituteContingencyPage() {
  const [result, setResult] = useState<SuggestionsResult | null>(null);
  const [controlTime, setControlTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState<GroupSuggestion | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [choosing, setChoosing] = useState<GroupSuggestion | null>(null);
  const [chooseError, setChooseError] = useState<string | null>(null);
  const warnings = useAssignmentWarnings();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setResult(await fetchContingencySuggestions());
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo cargar la sugerencia de suplentes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // No se refresca mientras hay una acción o un diálogo abierto: cambiaría la lista bajo el admin
  const paused = busy || rejecting !== null || choosing !== null || warnings.warnings !== null;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => {
      if (!pausedRef.current) void load();
    }, REFRESH_SECONDS * 1000);
    return () => window.clearInterval(interval);
  }, [load]);

  const accept = async (pairs: SubstitutePair[], source: AcceptSource, confirmWarnings = false): Promise<void> => {
    if (pairs.length === 0) return;
    setBusy(true);
    setActionError(null);
    setChooseError(null);
    setSuccess(null);
    try {
      const saved = await acceptSubstituteSuggestions(pairs, confirmWarnings);
      setSuccess(saved.message);
      setChoosing(null);
      await load();
    } catch (err) {
      if (warnings.askToConfirm(err, () => accept(pairs, source, true))) return;
      const message =
        err instanceof ContingencyError
          ? describeAcceptError(err, result?.grupos ?? [])
          : err instanceof Error
            ? err.message
            : "No se pudo asignar a los suplentes.";
      if (source === "manual") setChooseError(message);
      else setActionError(message);
    } finally {
      setBusy(false);
    }
  };

  const reject = async (substituteIds: string[], reason: string) => {
    if (!rejecting) return;
    setBusy(true);
    setRejectError(null);
    setSuccess(null);
    try {
      const saved = await rejectSubstituteSuggestion({ teamId: rejecting.teamId, substituteIds, reason });
      setSuccess(saved.message);
      setRejecting(null);
      await load();
    } catch (err) {
      setRejectError(err instanceof Error ? err.message : "No se pudo rechazar la sugerencia.");
    } finally {
      setBusy(false);
    }
  };

  const onSettings = (settings: ContingencySettings, saved: boolean) => {
    setControlTime(settings.cronograma?.controlTime ?? null);
    if (saved) void load();
  };

  const groups = result?.grupos ?? [];
  const pairsForAll = allSuggestedPairs(groups);
  const notice = result ? phaseNotice(result, controlTime) : null;

  return (
    <SidebarProvider>
      <PanelBackground />
      <AppSidebar />
      <SidebarInset className="max-md:bg-transparent">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1 z-20" />
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <li><Link to="/inicio" className="hover:text-foreground">Inicio</Link></li>
              <li><ChevronRight className="size-3.5" /></li>
              <li><Link to="/realtime-tracking-panel" className="hover:text-foreground">Panel de Seguimiento</Link></li>
              <li><ChevronRight className="size-3.5" /></li>
              <li className="text-foreground">Contingencia con suplentes</li>
            </ol>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 pb-10">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-medium">Contingencia con suplentes</h1>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Grupos que no alcanzan el mínimo de evaluaciones por jurados ausentes o que se retiraron, y los
                suplentes que los cubren. Aceptar solo suma: nadie pierde grupos y las evaluaciones no se tocan.
                Se actualiza cada {REFRESH_SECONDS} segundos.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => void load()} disabled={isLoading || busy}>
                <RefreshCw className={isLoading ? "animate-spin" : ""} /> Actualizar
              </Button>
              <Button
                type="button"
                onClick={() => void accept(pairsForAll, "all")}
                disabled={busy || pairsForAll.length === 0}
              >
                <CheckCheck /> Aceptar todo{pairsForAll.length > 0 ? ` (${pairsForAll.length})` : ""}
              </Button>
            </div>
          </div>

          {notice && (
            <div
              role="status"
              className={`mb-4 flex items-start gap-2 rounded-md border p-3 text-sm ${
                notice.tone === "warning" ? "border-amber-500/40 bg-amber-500/10" : "border-blue-500/40 bg-blue-500/10"
              }`}
            >
              <Info className="mt-0.5 size-4 shrink-0" /> {notice.text}
            </div>
          )}

          {loadError && (
            <div role="alert" className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">
              {loadError}
              {result ? " Se mantiene la última información disponible." : ""}
            </div>
          )}
          {actionError && (
            <div role="alert" className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">
              {actionError}
            </div>
          )}
          {success && (
            <div role="status" className="mb-4 rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
              {success}
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
            <div className="order-2 space-y-4 xl:order-1">
              {result && (
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {[
                    { label: "Grupos en riesgo", value: result.totales.gruposEnRiesgo },
                    { label: "Faltantes", value: result.totales.faltantes },
                    { label: "Sugeridos", value: result.totales.sugeridos },
                    { label: "Sin cubrir", value: result.totales.sinCubrir },
                    { label: "Suplentes disponibles", value: result.suplentesDisponibles },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border bg-card px-3 py-2">
                      <dt className="text-xs text-muted-foreground">{item.label}</dt>
                      <dd className="text-xl font-semibold">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {result && (
                <p className="text-xs text-muted-foreground">
                  {result.edicion.title} · mínimo {plural(result.minimoEvaluaciones, "evaluación", "evaluaciones")} por grupo ·{" "}
                  {result.base === "PRESENT" ? "cuentan los presentes" : "cuentan los asignados"} · actualizado a las{" "}
                  {formatBogotaTime(result.generadoEn)}
                </p>
              )}

              {result && result.totales.sinCubrir > 0 && (
                <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-600" />
                  {plural(result.totales.sinCubrir, "faltante")} no tienen suplente que los cubra. Agrega suplentes en
                  Jurados de la edición o asigna a mano en «Asignación de Jurados».
                </div>
              )}

              {isLoading && !result ? (
                <div className="rounded-lg border p-8 text-center text-muted-foreground">Cargando grupos en riesgo...</div>
              ) : result && groups.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border p-8 text-center">
                  <ShieldCheck className="size-8 text-green-600" />
                  <p className="font-medium">Ningún grupo está en riesgo</p>
                  <p className="text-sm text-muted-foreground">
                    Todos los grupos tienen al menos {plural(result.minimoEvaluaciones, "jurado")} que cuenta.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <ContingencyGroupCard
                      key={group.teamId}
                      group={group}
                      minimum={result?.minimoEvaluaciones ?? 3}
                      disabled={busy}
                      onAccept={(item) => void accept(groupSuggestedPairs(item), "group")}
                      onReject={(item) => {
                        setRejectError(null);
                        setRejecting(item);
                      }}
                      onChoose={(item) => {
                        setChooseError(null);
                        setChoosing(item);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <aside className="order-1 xl:order-2">
              <ContingencySettingsCard onChange={onSettings} />
            </aside>
          </div>
        </main>
      </SidebarInset>

      <RejectSuggestionDialog
        group={rejecting}
        isSaving={busy}
        error={rejectError}
        onConfirm={(ids, reason) => void reject(ids, reason)}
        onCancel={() => setRejecting(null)}
      />
      <ChooseSubstituteDialog
        group={choosing}
        isSaving={busy}
        error={chooseError}
        onConfirm={(substituteId) => choosing && void accept([{ teamId: choosing.teamId, substituteId }], "manual")}
        onCancel={() => setChoosing(null)}
      />
      <AssignmentWarningsDialog
        warnings={warnings.warnings}
        onContinue={warnings.continueWithWarnings}
        onCancel={warnings.cancel}
      />
    </SidebarProvider>
  );
}
