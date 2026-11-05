import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Info,
  Loader2,
  Lock,
  Search,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import LayoutAplication from "@/layouts/LayoutAplication";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditionJurorsTable } from "@/components/admin/juror-edition/EditionJurorsTable";
import { EnrollJurorDialog } from "@/components/admin/juror-edition/EnrollJurorDialog";
import { fetchEditions, type Edition, type EditionStatus } from "@/fetchs/editions";
import {
  JurorEditionError,
  MAX_STATUS_ITEMS,
  TYPE_LABEL,
  fetchEditionJurors,
  importPreviousJurors,
  pendingToDecline,
  updateJurorStatuses,
  type EditionJurorItem,
  type EditionJurorsList,
  type JurorEditionListStatus,
  type JurorEditionStatus,
  type JurorEditionType,
  type StatusRowError,
} from "@/fetchs/jurorEdition";

type StatusTab = JurorEditionListStatus | "ALL";

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "PENDING", label: "Pendientes" },
  { value: "CONFIRMED", label: "Confirmados" },
  { value: "DECLINED", label: "Declinaron" },
  { value: "AUTOMATIC", label: "Profesores con NRC" },
];

const EDITION_STATUS_LABEL: Record<EditionStatus, string> = {
  ACTIVE: "Activa",
  INACTIVE: "Inactiva",
  ARCHIVED: "Archivada",
};

const PAGE_SIZES = [20, 50, 100];
const SEARCH_DELAY_MS = 300;

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

const jurorsLabel = (n: number) => `${n} jurado${n !== 1 ? "s" : ""}`;

const selectClass = "h-10 rounded-md border border-input bg-background px-2 text-sm";

const EditionJurorsPage: React.FC = () => {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [editionId, setEditionId] = useState<number | undefined>(undefined);
  const [statusTab, setStatusTab] = useState<StatusTab>("ALL");
  const [typeFilter, setTypeFilter] = useState<JurorEditionType | "">("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZES[0]);

  const [list, setList] = useState<EditionJurorsList | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const requestId = useRef(0);

  // La selección guarda la fila completa: sobrevive al cambio de página y sirve para contar Pendientes
  const [selected, setSelected] = useState<Map<string, EditionJurorItem>>(new Map());
  const [confirmType, setConfirmType] = useState<JurorEditionType | "">("");
  const [rowErrors, setRowErrors] = useState<Map<string, StatusRowError>>(new Map());
  const [saving, setSaving] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [declineCount, setDeclineCount] = useState<number | null>(null);
  const [countingPending, setCountingPending] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);

  const edition = list?.edition;
  const writable = edition?.writable ?? false;

  useEffect(() => {
    fetchEditions()
      .then(setEditions)
      .catch(() => setEditions([])); // sin la lista queda la edición activa por defecto
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const loadJurors = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setListError(null);
    try {
      const result = await fetchEditionJurors({
        editionId,
        status: statusTab === "ALL" ? undefined : statusTab,
        type: typeFilter || undefined,
        search: debouncedSearch,
        page,
        limit,
      });
      if (id !== requestId.current) return;
      setList(result);
    } catch (err) {
      if (id !== requestId.current) return;
      setList(null);
      const noActiveEdition = err instanceof JurorEditionError && err.status === 404 && !editionId;
      setListError(
        noActiveEdition
          ? "No hay una edición activa. Elija una edición en el selector."
          : errorMessage(err, "No se pudo cargar la lista de jurados."),
      );
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [editionId, statusTab, typeFilter, debouncedSearch, page, limit]);

  useEffect(() => {
    loadJurors();
  }, [loadJurors]);

  const clearSelection = () => {
    setSelected(new Map());
    setRowErrors(new Map());
  };

  const changeEdition = (value: string) => {
    setEditionId(value ? Number(value) : undefined);
    setPage(1);
    clearSelection();
  };

  const toggleOne = (juror: EditionJurorItem) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(juror.jurorId)) next.delete(juror.jurorId);
      else next.set(juror.jurorId, juror);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    const pageJurors = (list?.data ?? []).filter((j) => j.status !== "AUTOMATIC");
    setSelected((prev) => {
      const next = new Map(prev);
      pageJurors.forEach((j) => (checked ? next.set(j.jurorId, j) : next.delete(j.jurorId)));
      return next;
    });
  };

  const applyStatus = async (status: JurorEditionStatus, declineRemaining = false) => {
    if (!edition) return;
    if (selected.size > MAX_STATUS_ITEMS) {
      toast.error("Demasiados jurados seleccionados", {
        description: `Se pueden actualizar hasta ${MAX_STATUS_ITEMS} a la vez.`,
      });
      return;
    }
    const type = status === "CONFIRMED" && confirmType ? confirmType : undefined;
    setSaving(true);
    try {
      const result = await updateJurorStatuses({
        editionId: edition.id,
        ...(declineRemaining ? { declineRemaining: true } : {}),
        items: [...selected.keys()].map((jurorId) => ({ jurorId, status, ...(type ? { type } : {}) })),
      });
      const failed = result.results.filter((r) => !r.ok);
      const updated = result.results.length - failed.length;
      toast.success(`${jurorsLabel(updated)} actualizado${updated !== 1 ? "s" : ""}`, {
        description: declineRemaining
          ? `${jurorsLabel(result.declined)} pendiente${result.declined !== 1 ? "s" : ""} pasaron a Declinó.`
          : undefined,
      });
      if (failed.length) {
        toast.warning(`${jurorsLabel(failed.length)} no se pudieron actualizar`, {
          description: "Están resaltados en la tabla con el motivo.",
        });
      }
      // Quedan seleccionados solo los que fallaron, para corregirlos
      setRowErrors(new Map(failed.map((r) => [r.jurorId, r.error ?? "NOT_ENROLLED"])));
      setSelected((prev) => new Map([...prev].filter(([id]) => failed.some((r) => r.jurorId === id))));
      loadJurors();
    } catch (err) {
      toast.error("Error", { description: errorMessage(err, "No se pudieron actualizar los jurados.") });
    } finally {
      setSaving(false);
    }
  };

  // N = Pendientes de la edición sin búsqueda ni tipo − seleccionados que hoy están Pendientes
  const askConfirmAndDecline = async () => {
    if (!edition) return;
    setCountingPending(true);
    try {
      const all = await fetchEditionJurors({ editionId: edition.id, limit: 1 });
      setDeclineCount(pendingToDecline(all.counts.PENDING, [...selected.values()]));
    } catch (err) {
      toast.error("Error", { description: errorMessage(err, "No se pudo contar los pendientes.") });
    } finally {
      setCountingPending(false);
    }
  };

  const handleImport = async () => {
    if (!edition) return;
    setImportOpen(false);
    setImporting(true);
    try {
      const result = await importPreviousJurors(edition.id);
      toast.success(
        `Se agregaron ${jurorsLabel(result.created)} como pendientes (${result.skipped} ya estaban)`,
        {
          description: result.fallback
            ? "La edición anterior no tenía lista: se trajeron todos los jurados activos."
            : undefined,
        },
      );
      loadJurors();
    } catch (err) {
      toast.error("Error", { description: errorMessage(err, "No se pudieron traer los jurados.") });
    } finally {
      setImporting(false);
    }
  };

  const handleEnrolled = (juror: EditionJurorItem) => {
    toast.success("Jurado inscrito", {
      description: `${juror.firstName} ${juror.lastName} quedó Confirmado en esta edición.`,
    });
    loadJurors();
  };

  const counts = list?.counts;
  const tabCount = (tab: StatusTab) =>
    !counts
      ? null
      : tab === "ALL"
        ? counts.PENDING + counts.CONFIRMED + counts.DECLINED + counts.AUTOMATIC
        : counts[tab];
  const metadata = list?.metadata;
  const busy = saving || countingPending;

  return (
    <LayoutAplication breadcrumbs={[{ label: "Jurados de la edición", href: "/jurados-edicion" }]}>
      <div className="p-6 w-full space-y-6">
        {/* Título, edición y acciones */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-xl font-medium">Jurados de la edición</h1>
            <p className="text-sm text-muted-foreground">
              Quién participa como jurado en cada edición: Pendiente, Confirmado o Declinó.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="shrink-0" aria-hidden>Edición</span>
              <select
                aria-label="Edición"
                value={editionId ?? ""}
                onChange={(e) => changeEdition(e.target.value)}
                className={selectClass}
              >
                <option value="">Edición activa</option>
                {editions.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} · {EDITION_STATUS_LABEL[e.status] ?? e.status}
                  </option>
                ))}
              </select>
            </div>
            {writable && (
              <>
                <Button
                  variant="outline"
                  className="bg-card hover:bg-accent text-foreground h-10"
                  onClick={() => setImportOpen(true)}
                  disabled={importing}
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Traer de la edición anterior
                </Button>
                <Button className="h-10" onClick={() => setEnrollOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Inscribir por correo
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Textos de ayuda (criterio de aceptación HU-25) */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Antes de empezar</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 space-y-1">
              <li>Cargue primero los NRC de la edición: los profesores con NRC activo quedan como jurados automáticamente.</li>
              <li>Los profesores senior sin NRC en esta edición se inscriben por correo.</li>
              <li>Solo los jurados confirmados y los profesores con NRC tendrán escarapela, check-in y asignación.</li>
              <li>Si un jurado no tiene cuenta, créelo en Personal → Jurados y luego inscríbalo aquí.</li>
            </ul>
          </AlertDescription>
        </Alert>

        {edition && !writable && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertTitle>Edición de solo lectura</AlertTitle>
            <AlertDescription>
              {edition.title} está archivada o ya terminó: se puede consultar su lista, pero no modificarla.
            </AlertDescription>
          </Alert>
        )}

        {/* Filtros */}
        <div className="flex flex-col gap-3">
          <div role="tablist" aria-label="Estado" className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => {
              const count = tabCount(tab.value);
              return (
                <Button
                  key={tab.value}
                  role="tab"
                  aria-selected={statusTab === tab.value}
                  variant={statusTab === tab.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setStatusTab(tab.value);
                    setPage(1);
                  }}
                >
                  {tab.label}
                  {count !== null && <span className="ml-1 opacity-80">({count})</span>}
                </Button>
              );
            })}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative sm:max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Buscar por nombre o correo"
                placeholder="Buscar por nombre o correo"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <select
              aria-label="Tipo"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as JurorEditionType | "");
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">Oficiales y suplentes</option>
              {(Object.keys(TYPE_LABEL) as JurorEditionType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Acciones sobre la selección */}
        {writable && selected.size > 0 && (
          <div className="flex flex-col xl:flex-row xl:items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <span className="text-sm">
              {selected.size} seleccionado{selected.size !== 1 ? "s" : ""}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Tipo al confirmar"
                value={confirmType}
                onChange={(e) => setConfirmType(e.target.value as JurorEditionType | "")}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="">Conservar tipo</option>
                {(Object.keys(TYPE_LABEL) as JurorEditionType[]).map((t) => (
                  <option key={t} value={t}>
                    Como {TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
              <Button size="sm" onClick={() => applyStatus("CONFIRMED")} disabled={busy}>
                Confirmar
              </Button>
              <Button size="sm" variant="outline" onClick={() => applyStatus("DECLINED")} disabled={busy}>
                Declinar
              </Button>
              <Button size="sm" variant="outline" onClick={() => applyStatus("PENDING")} disabled={busy}>
                Volver a pendiente
              </Button>
              <Button size="sm" variant="secondary" onClick={askConfirmAndDecline} disabled={busy}>
                {countingPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar seleccionados y declinar el resto
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSelection} disabled={busy}>
                Quitar selección
              </Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Cargando jurados...</span>
          </div>
        )}

        {!loading && listError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-destructive">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">{listError}</p>
          </div>
        )}

        {!loading && list && (
          <>
            <EditionJurorsTable
              jurors={list.data}
              selectedIds={new Set(selected.keys())}
              onToggle={toggleOne}
              onToggleAll={toggleAll}
              rowErrors={rowErrors}
              writable={writable}
            />
            {metadata && metadata.totalItems > 0 && (
              <div className="flex flex-wrap justify-between items-center gap-3 text-sm">
                <label className="flex items-center gap-2">
                  Filas por página
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {PAGE_SIZES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-center gap-3">
                  <span>
                    Página {metadata.currentPage} de {metadata.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Página anterior"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={metadata.currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Página siguiente"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={metadata.currentPage >= metadata.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        <EnrollJurorDialog
          open={enrollOpen}
          onOpenChange={setEnrollOpen}
          editionId={edition?.id}
          onEnrolled={handleEnrolled}
        />

        <AlertDialog open={importOpen} onOpenChange={setImportOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Traer jurados de la edición anterior?</AlertDialogTitle>
              <AlertDialogDescription>
                Se agregarán como pendientes los jurados de la edición anterior. Los que ya están en
                esta edición no se duplican.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleImport}>Traer jurados</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={declineCount !== null}
          onOpenChange={(open) => !open && setDeclineCount(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmar y declinar el resto?</AlertDialogTitle>
              <AlertDialogDescription>
                Se confirmarán {jurorsLabel(selected.size)} y se declinarán {jurorsLabel(declineCount ?? 0)}{" "}
                pendiente{declineCount !== 1 ? "s" : ""}, también los de otras páginas o que el filtro
                oculta. ¿Continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setDeclineCount(null);
                  applyStatus("CONFIRMED", true);
                }}
              >
                Continuar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </LayoutAplication>
  );
};

export default EditionJurorsPage;
