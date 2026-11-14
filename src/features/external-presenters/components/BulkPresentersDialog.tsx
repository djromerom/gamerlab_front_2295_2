import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_BULK_PRESENTERS,
  createExternalPresentersBulk,
  type BulkResult,
} from "@/features/external-presenters/api/externalPresenters";
import { BULK_COLUMNS, fullName, parsePresentersTable } from "@/features/external-presenters/lib/externalPresenters";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se llama si se registró al menos uno, para recargar la lista */
  onRegistered: () => void;
}

const EXAMPLE = "ana@empresa.com;Ana;Pérez;Estudio Indie Caribe;Diseño de niveles";

// FileReader en vez de file.text(): funciona en todos los navegadores y en jsdom
const readFileText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "utf-8");
  });

export const BulkPresentersDialog: React.FC<Props> = ({ open, onOpenChange, onRegistered }) => {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkResult | null>(null);

  useEffect(() => {
    if (open) {
      setText("");
      setError(null);
      setResult(null);
    }
  }, [open]);

  const parsed = useMemo(() => parsePresentersTable(text), [text]);
  const withErrors = parsed.rows.filter((row) => row.errors.length > 0).length;
  const canSubmit = parsed.rows.length > 0 && withErrors === 0 && !parsed.tooMany && !submitting;

  const loadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // permite volver a elegir el mismo archivo
    if (!file) return;
    setError(null);
    try {
      setText(await readFileText(file));
    } catch {
      setError("No se pudo leer el archivo.");
    }
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await createExternalPresentersBulk(parsed.rows.map((row) => row.input));
      setResult(response);
      if (response.successful.length > 0) onRegistered();
    } catch (err) {
      // 400: alguna fila tiene formato inválido y el back no registró ninguna
      setError(err instanceof Error ? err.message : "No se pudieron registrar los presentadores.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar varios presentadores</DialogTitle>
          <DialogDescription>
            Pega una tabla de Excel o sube un CSV con las columnas: {BULK_COLUMNS.join(", ")}. La
            organización y el título son opcionales. Máximo {MAX_BULK_PRESENTERS} por carga.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
              {result.message}
            </p>
            {result.successful.length > 0 && (
              <div>
                <p className="text-sm font-medium">Registrados</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {result.successful.map((p) => (
                    <li key={p.id}>
                      {fullName(p)} · {p.email}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.failed.length > 0 && (
              <div role="alert">
                <p className="text-sm font-medium text-destructive">No se registraron</p>
                <ul className="list-disc pl-5 text-sm">
                  {result.failed.map((f, i) => (
                    <li key={`${f.email}-${i}`}>
                      <span className="font-medium">{f.email}</span>: {f.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setResult(null)}>
                Cargar otra lista
              </Button>
              <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="bulk-presenters-text">Presentadores</Label>
                <Button asChild variant="outline" size="sm">
                  <label className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" aria-hidden />
                    Subir CSV
                    <input
                      type="file"
                      accept=".csv,.txt,text/csv,text/plain"
                      className="sr-only"
                      aria-label="Subir archivo CSV"
                      onChange={loadFile}
                    />
                  </label>
                </Button>
              </div>
              <Textarea
                id="bulk-presenters-text"
                rows={6}
                placeholder={EXAMPLE}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Una persona por línea. Si exportas el CSV desde Excel, guárdalo como «CSV UTF-8» para
                conservar las tildes. Una primera fila de encabezados se ignora.
              </p>
            </div>

            {parsed.tooMany && (
              <p role="alert" className="text-sm text-destructive">
                Hay {parsed.rows.length} filas: se pueden cargar como máximo {MAX_BULK_PRESENTERS} a la vez.
              </p>
            )}

            {parsed.rows.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm">
                  {parsed.rows.length} fila{parsed.rows.length !== 1 ? "s" : ""}
                  {withErrors > 0 && (
                    <span className="text-destructive">
                      {" "}
                      · {withErrors} con errores: corrígelas antes de registrar
                    </span>
                  )}
                </p>
                <div className="max-h-64 overflow-auto rounded-md border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="px-2 py-1">Línea</th>
                        <th className="px-2 py-1">Correo</th>
                        <th className="px-2 py-1">Nombre</th>
                        <th className="px-2 py-1">Organización</th>
                        <th className="px-2 py-1">Título</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.map((row) => (
                        <React.Fragment key={row.line}>
                          <tr className={row.errors.length ? "bg-destructive/10" : undefined}>
                            <td className="px-2 py-1">{row.line}</td>
                            <td className="px-2 py-1">{row.input.email}</td>
                            <td className="px-2 py-1">{fullName(row.input)}</td>
                            <td className="px-2 py-1">{row.input.organization ?? "—"}</td>
                            <td className="px-2 py-1">{row.input.presentationTitle ?? "—"}</td>
                          </tr>
                          {row.errors.length > 0 && (
                            <tr className="bg-destructive/10">
                              <td />
                              <td colSpan={4} className="px-2 pb-1 text-destructive">
                                <AlertCircle className="inline h-3 w-3 mr-1" aria-hidden />
                                Línea {row.line}: {row.errors.join(". ")}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={submit} disabled={!canSubmit}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Registrar {parsed.rows.length > 0 ? parsed.rows.length : ""}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
