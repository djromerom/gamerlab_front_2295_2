import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  FileSpreadsheet,
  Info,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  Pencil,
  Trash2,
  Upload,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalPresenterFormDialog } from "@/components/admin/external-presenters/ExternalPresenterFormDialog";
import { BulkPresentersDialog } from "@/components/admin/external-presenters/BulkPresentersDialog";
import { fetchEditions, type Edition, type EditionStatus } from "@/fetchs/editions";
import {
  downloadExternalPresentersExport,
  fetchExternalPresenters,
  removeExternalPresenter,
  sendAllExternalPresenterCertificates,
  sendExternalPresenterCertificate,
  type ExternalPresenter,
  type ExternalPresentersList,
  type SendAllResult,
} from "@/fetchs/externalPresenters";
import { formatSentAt, fullName } from "@/lib/externalPresenters";

type Filter = "ALL" | "NOT_ACTIVATED" | "NO_CERTIFICATE";

const FILTERS: { value: Filter; label: string; matches: (p: ExternalPresenter) => boolean }[] = [
  { value: "ALL", label: "Todos", matches: () => true },
  { value: "NOT_ACTIVATED", label: "Sin activar", matches: (p) => p.lastSignInAt === null },
  { value: "NO_CERTIFICATE", label: "Sin certificado", matches: (p) => p.certificateSentAt === null },
];

const EDITION_STATUS_LABEL: Record<EditionStatus, string> = {
  ACTIVE: "Activa",
  INACTIVE: "Inactiva",
  ARCHIVED: "Archivada",
};

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

const presentersLabel = (n: number) => `${n} presentador${n !== 1 ? "es" : ""}`;

const ExternalPresentersPage: React.FC = () => {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [editionId, setEditionId] = useState<number | undefined>(undefined);
  const [filter, setFilter] = useState<Filter>("ALL");

  const [list, setList] = useState<ExternalPresentersList | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const requestId = useRef(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExternalPresenter | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [removing, setRemoving] = useState<ExternalPresenter | null>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [sendAllOpen, setSendAllOpen] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [sendAllResult, setSendAllResult] = useState<SendAllResult | null>(null);
  const [exporting, setExporting] = useState(false);

  const edition = list?.edition ?? null;
  const writable = Boolean(edition && !edition.readOnly);
  const presenters = list?.presenters ?? [];
  const visible = presenters.filter(FILTERS.find((f) => f.value === filter)!.matches);
  const busy = sendingAll || sendingId !== null;

  useEffect(() => {
    fetchEditions()
      .then(setEditions)
      .catch(() => setEditions([])); // sin la lista queda la edición activa por defecto
  }, []);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setListError(null);
    try {
      const result = await fetchExternalPresenters(editionId);
      if (id === requestId.current) setList(result);
    } catch (err) {
      if (id !== requestId.current) return;
      setList(null);
      setListError(errorMessage(err, "No se pudo cargar la lista de presentadores."));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [editionId]);

  useEffect(() => {
    load();
  }, [load]);

  // Cambia una fila sin volver a pedir toda la lista
  const replace = (updated: Partial<ExternalPresenter> & { id: number }) =>
    setList((prev) =>
      prev
        ? { ...prev, presenters: prev.presenters.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)) }
        : prev,
    );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (presenter: ExternalPresenter) => {
    setEditing(presenter);
    setFormOpen(true);
  };

  const handleSaved = (presenter: ExternalPresenter, mode: "create" | "edit") => {
    if (mode === "edit") {
      replace(presenter);
      toast.success("Cambios guardados", { description: fullName(presenter) });
      return;
    }
    toast.success("Presentador registrado", {
      description: `${fullName(presenter)} recibirá un correo para activar su cuenta.`,
    });
    load();
  };

  const handleRemove = async () => {
    if (!removing) return;
    const target = removing;
    setRemoving(null);
    try {
      await removeExternalPresenter(target.id);
      setList((prev) =>
        prev ? { ...prev, presenters: prev.presenters.filter((p) => p.id !== target.id) } : prev,
      );
      toast.success("Presentador quitado de la edición", { description: fullName(target) });
    } catch (err) {
      toast.error("Error", { description: errorMessage(err, "No se pudo quitar al presentador.") });
    }
  };

  const sendCertificate = async (presenter: ExternalPresenter) => {
    setSendingId(presenter.id);
    try {
      const result = await sendExternalPresenterCertificate(presenter.id);
      replace({ id: presenter.id, certificateSentAt: result.certificateSentAt });
      toast.success("Certificado enviado", { description: `Se envió a ${result.email}.` });
    } catch (err) {
      toast.error("Error", { description: errorMessage(err, "No se pudo enviar el certificado.") });
    } finally {
      setSendingId(null);
    }
  };

  const sendAll = async () => {
    setSendAllOpen(false);
    setSendingAll(true);
    setSendAllResult(null);
    try {
      const result = await sendAllExternalPresenterCertificates();
      setSendAllResult(result);
      if (result.failed.length) toast.warning(result.message);
      else toast.success(result.message);
      load(); // trae las fechas de envío nuevas
    } catch (err) {
      toast.error("Error", { description: errorMessage(err, "No se pudieron enviar los certificados.") });
    } finally {
      setSendingAll(false);
    }
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      await downloadExternalPresentersExport(editionId);
    } catch (err) {
      toast.error("Error", { description: errorMessage(err, "No se pudo exportar la lista.") });
    } finally {
      setExporting(false);
    }
  };

  return (
    <LayoutAplication breadcrumbs={[{ label: "Presentadores externos", href: "/presentadores-externos" }]}>
      <div className="p-6 w-full space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-xl font-medium">Presentadores externos</h1>
            <p className="text-sm text-muted-foreground">
              Personas invitadas que presentan en la feria. No se califican: solo reciben el certificado
              de asistencia por correo.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="shrink-0" aria-hidden>
              Edición
            </span>
            <select
              aria-label="Edición"
              value={editionId ?? ""}
              onChange={(e) => {
                setEditionId(e.target.value ? Number(e.target.value) : undefined);
                setSendAllResult(null);
              }}
              className="h-10 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">Edición activa</option>
              {editions.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} · {EDITION_STATUS_LABEL[e.status] ?? e.status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {writable && (
            <>
              <Button onClick={openCreate} disabled={busy}>
                <UserPlus className="h-4 w-4 mr-2" />
                Registrar presentador
              </Button>
              <Button variant="outline" onClick={() => setBulkOpen(true)} disabled={busy}>
                <Upload className="h-4 w-4 mr-2" />
                Registrar varios
              </Button>
              <Button
                variant="outline"
                onClick={() => setSendAllOpen(true)}
                disabled={busy || presenters.length === 0}
              >
                {sendingAll ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                {sendingAll ? "Enviando certificados..." : "Enviar certificado a todos"}
              </Button>
            </>
          )}
          {edition && (
            <Button
              variant="outline"
              onClick={exportExcel}
              disabled={exporting || presenters.length === 0}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              Exportar a Excel
            </Button>
          )}
        </div>

        {sendingAll && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Generando y enviando certificados</AlertTitle>
            <AlertDescription>Cada certificado tarda unos segundos. No cierres esta pantalla.</AlertDescription>
          </Alert>
        )}

        {sendAllResult && sendAllResult.failed.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{sendAllResult.message}</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4">
                {sendAllResult.failed.map((f) => (
                  <li key={f.id}>
                    {f.email}: {f.error}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {edition && edition.readOnly && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertTitle>Edición de solo lectura</AlertTitle>
            <AlertDescription>
              {edition.title} no es la edición activa: se puede consultar y exportar su lista, pero no
              registrar, editar, quitar ni enviar certificados.
            </AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Cargando presentadores...</span>
          </div>
        )}

        {!loading && listError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-destructive">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">{listError}</p>
            <Button variant="outline" size="sm" onClick={load}>
              Reintentar
            </Button>
          </div>
        )}

        {!loading && list && !edition && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No hay una edición activa</AlertTitle>
            <AlertDescription>
              Activa una edición en Gestión General → Ediciones para registrar presentadores, o elige
              una edición anterior en el selector para consultarla.
            </AlertDescription>
          </Alert>
        )}

        {!loading && edition && (
          <>
            <div role="tablist" aria-label="Filtro" className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <Button
                  key={f.value}
                  role="tab"
                  aria-selected={filter === f.value}
                  variant={filter === f.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                  <span className="ml-1 opacity-80">({presenters.filter(f.matches).length})</span>
                </Button>
              ))}
            </div>

            {visible.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {presenters.length === 0
                  ? "Todavía no hay presentadores externos en esta edición."
                  : "Ningún presentador cumple este filtro."}
              </p>
            ) : (
              <div className="rounded-md border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Presentador</TableHead>
                      <TableHead>Organización</TableHead>
                      <TableHead>Presentación</TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead>Certificado</TableHead>
                      {writable && <TableHead className="text-right">Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((p) => {
                      const name = fullName(p);
                      const sending = sendingId === p.id;
                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="font-medium">{name}</div>
                            <div className="text-xs text-muted-foreground">{p.email}</div>
                          </TableCell>
                          <TableCell>{p.organization ?? "—"}</TableCell>
                          <TableCell className="max-w-xs whitespace-normal">{p.presentationTitle ?? "—"}</TableCell>
                          <TableCell>
                            {p.lastSignInAt === null ? (
                              <Badge variant="outline">Pendiente de activar</Badge>
                            ) : (
                              <Badge variant="secondary">Activa</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {p.certificateSentAt ? (
                              <span className="flex items-center gap-1">
                                <MailCheck className="h-3 w-3 text-emerald-500" aria-hidden />
                                Enviado el {formatSentAt(p.certificateSentAt)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Sin enviar</span>
                            )}
                          </TableCell>
                          {writable && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => sendCertificate(p)}
                                  disabled={busy}
                                  aria-label={`${p.certificateSentAt ? "Reenviar" : "Enviar"} certificado a ${name}`}
                                >
                                  {sending ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <Mail className="h-4 w-4 mr-1" />
                                  )}
                                  {sending ? "Enviando..." : p.certificateSentAt ? "Reenviar" : "Enviar certificado"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEdit(p)}
                                  disabled={busy}
                                  aria-label={`Editar a ${name}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setRemoving(p)}
                                  disabled={busy}
                                  aria-label={`Quitar a ${name}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}

        <ExternalPresenterFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          presenter={editing}
          onSaved={handleSaved}
        />

        <BulkPresentersDialog open={bulkOpen} onOpenChange={setBulkOpen} onRegistered={load} />

        <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Quitar a {removing ? fullName(removing) : ""}?</AlertDialogTitle>
              <AlertDialogDescription>
                Deja de estar en esta edición y no recibirá su certificado. Su cuenta se conserva: se
                puede volver a registrar con el mismo correo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemove}>Quitar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={sendAllOpen} onOpenChange={setSendAllOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Enviar el certificado a todos?</AlertDialogTitle>
              <AlertDialogDescription>
                Se enviará por correo a {presentersLabel(presenters.length)} de {edition?.title}, también a
                quienes ya lo recibieron. Puede tardar unos segundos por persona.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={sendAll}>Enviar a todos</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </LayoutAplication>
  );
};

export default ExternalPresentersPage;
