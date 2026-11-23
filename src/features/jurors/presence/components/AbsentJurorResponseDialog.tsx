import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  AbsentJurorResponseError,
  fetchAbsentJurorHistory,
  recordAbsentJurorResponse,
  type AbsentJurorHistory,
  type AbsentJurorResult,
} from "@/features/jurors/presence/api/absentJurorResponses";

const absentResponseLabels: Record<AbsentJurorResult, string> = {
  ON_THE_WAY: "Viene en camino",
  CANNOT_ATTEND: "No podrá asistir",
  NO_RESPONSE: "Sin respuesta",
};

/** HU-44 (ARK-294): qué hace cada respuesta, para que el administrador elija sabiendo el efecto. */
const absentResponseHelp: Record<AbsentJurorResult, string> = {
  ON_THE_WAY: "Sigue en la lista de los que faltan por llegar. Solo queda como nota.",
  CANNOT_ATTEND:
    "Pasa a «No vendrán» y Contingencia propone suplentes para sus grupos de inmediato. No se le quitan los grupos; si llega, vuelve a la normalidad.",
  NO_RESPONSE: "Sigue en la lista de los que faltan por llegar. Solo queda como nota.",
};

const formatBogotaTime = (value: string) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Bogota",
  }).format(new Date(value));

interface AbsentJurorResponseDialogProps {
  juror: { jurorId: string; name: string };
  onClose: () => void;
  /** Se llama después de guardar (o si el jurado ya llegó) para recargar la alerta. */
  onSaved: () => Promise<void> | void;
}

/** HU-13: registrar lo que se sabe de un jurado que no ha llegado, con su historial. */
export function AbsentJurorResponseDialog({ juror, onClose, onSaved }: AbsentJurorResponseDialogProps) {
  const [history, setHistory] = useState<AbsentJurorHistory | null>(null);
  const [result, setResult] = useState<AbsentJurorResult>("ON_THE_WAY");
  const [estimatedArrival, setEstimatedArrival] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetchAbsentJurorHistory(juror.jurorId)
      .then((loaded) => { if (active) setHistory(loaded); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "No se pudo cargar el historial."); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [juror.jurorId]);

  const close = () => {
    if (!isSaving) onClose();
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setIsSaving(true);
    try {
      const recorded = await recordAbsentJurorResponse({
        jurorId: juror.jurorId,
        result,
        ...(result === "ON_THE_WAY" && estimatedArrival
          ? { estimatedArrivalAt: `${estimatedArrival}:00-05:00` }
          : {}),
      });
      setHistory((current) => ({
        edition: current?.edition ?? { id: 0, title: "" },
        juror: current?.juror ?? { id: juror.jurorId, name: juror.name, category: "Sin categoría" },
        data: [recorded, ...(current?.data ?? [])],
      }));
      setSaved(true);
      // HU-44: el jurado puede cambiar de bloque («Faltan por llegar» ↔ «No vendrán»).
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la respuesta.");
      if (err instanceof AbsentJurorResponseError && err.status === 409) {
        await onSaved();
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true"
      aria-label={`Registrar respuesta de ${juror.name}`}>
      <form onSubmit={save} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-background p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Respuesta sobre jurado ausente</h2>
            <p className="text-sm text-muted-foreground">{juror.name}</p>
          </div>
          <button type="button" onClick={close} className="text-sm">Cerrar</button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando historial...</p>
        ) : (
          <>
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-medium">Resultado</legend>
              {(Object.keys(absentResponseLabels) as AbsentJurorResult[]).map((option) => (
                <label key={option} className="flex items-start gap-2 rounded-md border p-3 text-sm">
                  <input type="radio" name="absent-result" value={option} checked={result === option}
                    onChange={() => setResult(option)} className="mt-1" />
                  <span>
                    <span className="block">{absentResponseLabels[option]}</span>
                    <span className="block text-xs text-muted-foreground">{absentResponseHelp[option]}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            {result === "ON_THE_WAY" && (
              <label className="mt-4 block text-sm">Hora estimada (opcional)
                <Input type="datetime-local" value={estimatedArrival}
                  onChange={(event) => setEstimatedArrival(event.target.value)} />
              </label>
            )}

            {result === "CANNOT_ATTEND" && (
              <div className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                Después de registrarla, cubre sus grupos desde la{" "}
                <Link to="/contingencia-suplentes" className="font-medium underline underline-offset-2">
                  contingencia con suplentes
                </Link>
                .
              </div>
            )}

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            {saved && <p className="mt-3 text-sm text-green-600">Respuesta registrada.</p>}
            <div className="mt-4 flex justify-end">
              <button type="submit" disabled={isSaving}
                className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50">
                {isSaving ? "Guardando..." : "Registrar respuesta"}
              </button>
            </div>

            <section className="mt-6 border-t pt-4">
              <h3 className="mb-2 text-sm font-medium">Historial</h3>
              {(history?.data.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">Sin respuestas registradas</p>
              ) : (
                <ul className="space-y-2">
                  {history?.data.map((item) => (
                    <li key={item.id} className="rounded-md border p-3 text-sm">
                      <div className="font-medium">{absentResponseLabels[item.result]}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatBogotaTime(item.recordedAt)} · {item.recordedBy.name}
                      </div>
                      {item.estimatedArrivalAt && (
                        <div className="mt-1 text-xs">
                          Llegada estimada: {formatBogotaTime(item.estimatedArrivalAt)}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </form>
    </div>
  );
}
