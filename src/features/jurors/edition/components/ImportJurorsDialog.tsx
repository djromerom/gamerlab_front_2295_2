import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, FileDown, Loader2, Mail, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { saveBlobAsFile } from "@/features/jurors/assignment/api/jurorsExport";
import {
  IMPORT_RESULT_LABEL,
  MAX_IMPORT_ROWS,
  downloadJurorTemplate,
  importFileProblem,
  importJurorsFromExcel,
  type JurorImportReport,
  type JurorImportResultCode,
} from "@/features/jurors/edition/api/jurorEdition";
import {
  minutesToSendEmails,
  reportFileName,
  reportToCsv,
  rowDetail,
  rowTypeLabel,
  sortRowsErrorsFirst,
} from "@/features/jurors/edition/lib/importReport";

interface ImportJurorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Título de la edición activa, para decir dónde quedan los jurados */
  editionTitle?: string;
  /** Se llama con el informe para recargar la lista */
  onImported: (report: JurorImportReport) => void;
}

const resultVariant: Record<JurorImportResultCode, "success" | "secondary" | "destructive"> = {
  CREATED: "success",
  CONFIRMED: "success",
  ALREADY_CONFIRMED: "secondary",
  ERROR: "destructive",
};

const plural = (n: number, singular: string, pluralForm = `${singular}s`) =>
  `${n} ${n === 1 ? singular : pluralForm}`;

export const ImportJurorsDialog: React.FC<ImportJurorsDialogProps> = ({
  open,
  onOpenChange,
  editionTitle,
  onImported,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<JurorImportReport | null>(null);

  const reset = () => {
    setFile(null);
    setError(null);
    setReport(null);
  };

  useEffect(() => {
    if (open) reset();
  }, [open]);

  const rows = useMemo(() => (report ? sortRowsErrorsFirst(report.rows) : []), [report]);

  // Mientras sube el archivo no se cierra: el informe se perdería
  const close = (next: boolean) => {
    if (!next && importing) return;
    onOpenChange(next);
  };

  const pickFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] ?? null;
    setError(picked ? importFileProblem(picked) : null);
    setFile(picked);
  };

  const getTemplate = async () => {
    setDownloadingTemplate(true);
    setError(null);
    try {
      await downloadJurorTemplate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo descargar la plantilla.");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const submit = async () => {
    if (!file || importFileProblem(file)) return;
    setImporting(true);
    setError(null);
    try {
      const result = await importJurorsFromExcel(file);
      setReport(result);
      onImported(result);
    } catch (err) {
      // 400, 404 y 413: no se importó nada; el back manda el motivo en español
      setError(err instanceof Error ? err.message : "No se pudo importar el archivo.");
    } finally {
      setImporting(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([reportToCsv(report.rows)], { type: "text/csv;charset=utf-8" });
    saveBlobAsFile(blob, reportFileName());
  };

  const fileProblem = file ? importFileProblem(file) : null;
  const summary = report?.summary;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar jurados desde Excel</DialogTitle>
          <DialogDescription>
            {report
              ? `Resultado de la importación en ${report.edition.title}.`
              : `Suba la plantilla con los jurados que confirmaron. Quedan Confirmados en ${
                  editionTitle ?? "la edición activa"
                } y se crean las cuentas que no existan.`}
          </DialogDescription>
        </DialogHeader>

        {!report && (
          <div className="space-y-4">
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>
                Columnas: Nombres, Apellidos, Correo y Tipo (Oficial o Suplente; si está vacío queda
                Oficial). Hasta {MAX_IMPORT_ROWS} filas y 2 MB.
              </li>
              <li>Un correo repetido en el archivo cuenta solo la primera vez.</li>
              <li>
                Si el jurado ya estaba Confirmado no se cambia su tipo; si estaba Pendiente o Declinó,
                queda Confirmado con el tipo del Excel.
              </li>
              <li>
                Las cuentas nuevas son de jurado Junior y reciben el correo para crear la contraseña. Las
                cuentas sin verificar reciben otra vez el correo de verificación.
              </li>
              <li>
                Una cuenta con otro rol (por ejemplo, Estudiante) o desactivada queda con error en su
                fila; las demás filas se importan igual.
              </li>
              <li>Importar de nuevo el mismo archivo no duplica a nadie.</li>
            </ul>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getTemplate}
              disabled={downloadingTemplate}
            >
              {downloadingTemplate ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              Descargar plantilla
            </Button>

            <div className="space-y-2">
              <Label htmlFor="import-jurors-file">Archivo de Excel (.xlsx)</Label>
              <Input
                id="import-jurors-file"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={pickFile}
                disabled={importing}
              />
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
            <p>{error}</p>
          </div>
        )}

        {report && summary && (
          <div className="space-y-4">
            <ul aria-label="Resumen" className="flex flex-wrap gap-2 text-sm">
              <li className="rounded-md border border-border px-2 py-1">
                {plural(summary.total, "fila")}
              </li>
              <li className="rounded-md border border-border px-2 py-1">
                {plural(summary.created, "creado")}
              </li>
              <li className="rounded-md border border-border px-2 py-1">
                {plural(summary.confirmed, "confirmado")}
              </li>
              <li className="rounded-md border border-border px-2 py-1">
                {summary.alreadyConfirmed} ya estaba{summary.alreadyConfirmed !== 1 ? "n" : ""}
              </li>
              <li
                className={`rounded-md border px-2 py-1 ${
                  summary.errors > 0 ? "border-destructive text-destructive" : "border-border"
                }`}
              >
                {summary.errors} con error
              </li>
            </ul>

            {summary.emailsQueued > 0 && (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  {plural(summary.emailsQueued, "correo")} en cola: salen uno cada pocos segundos y
                  pueden tardar unos {plural(minutesToSendEmails(summary.emailsQueued), "minuto")} en
                  llegar todos. Si alguno no llega, reenvíelo desde Personal → Jurados.
                </AlertDescription>
              </Alert>
            )}

            {summary.errors > 0 && (
              <p className="text-sm text-muted-foreground">
                Corrija en el Excel las filas con error y vuelva a importarlo: los que ya entraron no
                se duplican.
              </p>
            )}

            <div className="max-h-[45vh] overflow-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Fila</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.row}>
                      <TableCell>{row.row}</TableCell>
                      <TableCell>
                        {`${row.firstName} ${row.lastName}`.trim() || "—"}
                      </TableCell>
                      <TableCell className="break-all">{row.email || "—"}</TableCell>
                      <TableCell>{rowTypeLabel(row)}</TableCell>
                      <TableCell>
                        <Badge variant={resultVariant[row.result]}>
                          {IMPORT_RESULT_LABEL[row.result]}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`whitespace-normal ${
                          row.result === "ERROR" ? "text-destructive" : "text-muted-foreground"
                        }`}
                      >
                        {rowDetail(row)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {report ? (
            <>
              <Button type="button" variant="outline" onClick={downloadReport}>
                <Download className="h-4 w-4 mr-2" />
                Descargar informe
              </Button>
              <Button type="button" variant="outline" onClick={reset}>
                Importar otro archivo
              </Button>
              <Button type="button" onClick={() => close(false)}>
                Cerrar
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => close(false)} disabled={importing}>
                Cancelar
              </Button>
              <Button type="button" onClick={submit} disabled={!file || !!fileProblem || importing}>
                {importing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Importar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
