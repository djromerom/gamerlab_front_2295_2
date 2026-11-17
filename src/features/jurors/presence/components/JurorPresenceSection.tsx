import { useEffect, useState, type FormEvent } from "react";
import { Settings2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useJurorPresenceList, type PresenceTab } from "@/features/jurors/presence/hooks/useJurorPresenceList";
import {
  INDICATOR_LABEL,
  SETTINGS_RANGES,
  changedSettings,
  fetchPresenceSettings,
  nextPromptLabel,
  updatePresenceSettings,
  validatePresenceSettings,
  type PresenceIndicator,
  type PresenceSettings,
} from "@/features/jurors/presence/api/jurorPresence";
import { formatBogotaDateTime } from "@/lib/bogotaDateTime";

const TABS: Array<{ value: PresenceTab; label: string }> = [
  { value: "ANY", label: "Con alguna alerta" },
  { value: "PRESENCE_UNCONFIRMED", label: "Presencia sin confirmar" },
  { value: "POSSIBLE_LEFT", label: "Posible salida" },
  { value: "ALL", label: "Todos los que llegaron" },
];

const EMPTY_MESSAGE: Record<PresenceTab, string> = {
  ANY: "Ningún jurado tiene alertas de presencia.",
  PRESENCE_UNCONFIRMED: "Ningún jurado tiene la presencia sin confirmar.",
  POSSIBLE_LEFT: "Ningún jurado aparece como posible salida.",
  ALL: "Todavía no ha llegado ningún jurado.",
};

const INDICATOR_STYLE: Record<PresenceIndicator, string> = {
  PRESENCE_UNCONFIRMED: "border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  POSSIBLE_LEFT: "border-red-500/50 bg-red-500/15 text-red-700 dark:text-red-300",
};

const SETTING_FIELDS = Object.keys(SETTINGS_RANGES) as (keyof PresenceSettings)[];

type SettingsDraft = Record<keyof PresenceSettings, string>;

function toDraft(settings: PresenceSettings): SettingsDraft {
  return {
    promptEveryMinutes: String(settings.promptEveryMinutes),
    responseWindowMinutes: String(settings.responseWindowMinutes),
    inactivityMinutes: String(settings.inactivityMinutes),
  };
}

function fromDraft(draft: SettingsDraft): PresenceSettings {
  return {
    promptEveryMinutes: Number(draft.promptEveryMinutes),
    responseWindowMinutes: Number(draft.responseWindowMinutes),
    inactivityMinutes: Number(draft.inactivityMinutes),
  };
}

function PresenceSettingsDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [original, setOriginal] = useState<PresenceSettings | null>(null);
  const [draft, setDraft] = useState<SettingsDraft | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Cada vez que se abre, parte de los valores guardados en el servidor.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setOriginal(null);
    setDraft(null);
    setErrors([]);
    setLoadError(null);
    fetchPresenceSettings()
      .then((result) => {
        if (cancelled) return;
        setOriginal(result.settings);
        setDraft(toDraft(result.settings));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "No se pudieron cargar los parámetros.");
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft || !original) return;
    const edited = fromDraft(draft);
    const invalid = validatePresenceSettings(edited);
    setErrors(invalid);
    if (invalid.length > 0) return;
    const changes = changedSettings(original, edited);
    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await updatePresenceSettings(changes);
      onSaved();
      onClose();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "No se pudieron guardar los parámetros."]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !saving && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Parámetros de presencia</DialogTitle>
          <DialogDescription>Valen para la edición activa. Los tiempos están en minutos.</DialogDescription>
        </DialogHeader>
        {loadError ? (
          <p role="alert" className="text-sm text-red-600">{loadError}</p>
        ) : !draft ? (
          <p className="text-sm text-muted-foreground">Cargando parámetros...</p>
        ) : (
          <form onSubmit={save} className="grid gap-4" noValidate>
            {SETTING_FIELDS.map((field) => {
              const { min, max, label } = SETTINGS_RANGES[field];
              return (
                <label key={field} className="grid gap-1 text-sm">
                  {label}
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={min}
                    max={max}
                    step={1}
                    required
                    value={draft[field]}
                    onChange={(event) => setDraft({ ...draft, [field]: event.target.value })}
                  />
                  <span className="text-xs text-muted-foreground">Entre {min} y {max} minutos.</span>
                </label>
              );
            })}
            {errors.length > 0 && (
              <ul role="alert" className="list-disc space-y-1 pl-5 text-sm text-red-600">
                {errors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar parámetros"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * HU-23 en el panel de seguimiento (solo Administrador): jurados que llegaron con sus
 * indicadores "Presencia sin confirmar" y "Posible salida". Son solo avisos: no cambian grupos.
 */
export function JurorPresenceSection({ canConfigure = true }: { canConfigure?: boolean }) {
  const { tab, setTab, result, error, loading, reload } = useJurorPresenceList();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const rows = result?.data ?? [];

  return (
    <section aria-labelledby="juror-presence-title" className="mb-6 rounded-lg border p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="juror-presence-title" className="font-semibold">Presencia de los jurados</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Solo son indicadores: no mueven ni quitan grupos. Si hace falta, suma un suplente.
          </p>
        </div>
        {canConfigure && (
          <button type="button" onClick={() => setSettingsOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-md border bg-card px-4 text-sm hover:bg-accent">
            <Settings2 className="size-4" /> Parámetros de presencia
          </button>
        )}
      </div>

      {result && (
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span><strong>{result.totals.checkedIn}</strong> llegaron</span>
          <span><strong>{result.totals.presenceUnconfirmed}</strong> presencia sin confirmar</span>
          <span><strong>{result.totals.possibleLeft}</strong> posible salida</span>
          <span><strong>{result.totals.withAnyIndicator}</strong> con alguna alerta</span>
          <span className="text-muted-foreground">
            Pregunta cada {result.settings.promptEveryMinutes} min · {result.settings.responseWindowMinutes} min para responder · {result.settings.inactivityMinutes} min sin evaluar
          </span>
        </div>
      )}

      {result && !result.evaluationsOpen && (
        <p className="mb-3 rounded-md border border-blue-500/40 bg-blue-500/10 p-3 text-sm">
          Las evaluaciones están cerradas: no se pregunta a los jurados ni se marca a nadie.
        </p>
      )}

      <div role="tablist" aria-label="Filtrar por indicador" className="mb-3 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button key={item.value} type="button" role="tab" aria-selected={tab === item.value}
            onClick={() => setTab(item.value)}
            className={`h-8 rounded-full border px-3 text-xs ${tab === item.value ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}>
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">
          {error.message}{result ? " Se mantiene la última información disponible." : ""}
        </p>
      )}

      {loading && !result ? (
        <p className="p-4 text-center text-sm text-muted-foreground">Cargando presencia...</p>
      ) : !result ? null : rows.length === 0 ? (
        <p className="p-4 text-center text-sm text-muted-foreground">{EMPTY_MESSAGE[tab]}</p>
      ) : (
        <div className="max-h-96 overflow-auto rounded-md border">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="sticky top-0 bg-muted">
              <tr className="text-left">
                <th scope="col" className="p-2">Jurado</th>
                <th scope="col" className="p-2">Llegada</th>
                <th scope="col" className="p-2">Último «Sigo aquí»</th>
                <th scope="col" className="p-2">Última evaluación</th>
                <th scope="col" className="p-2">Próxima pregunta</th>
                <th scope="col" className="p-2">Indicadores</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((juror) => (
                <tr key={juror.jurorId} className="border-t align-top">
                  <td className="p-2">
                    <div className="font-medium">{juror.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {juror.category}{juror.isProfessor ? " · Profesor" : ""}
                    </div>
                  </td>
                  <td className="p-2">{formatBogotaDateTime(juror.checkedInAt, result.serverTime)}</td>
                  <td className="p-2">{juror.lastConfirmedAt ? formatBogotaDateTime(juror.lastConfirmedAt, result.serverTime) : "Sin responder"}</td>
                  <td className="p-2">{juror.lastActivityAt ? formatBogotaDateTime(juror.lastActivityAt, result.serverTime) : "Ninguna"}</td>
                  <td className="p-2">{nextPromptLabel(juror.nextPromptAt, result)}</td>
                  <td className="p-2">
                    {juror.indicators.length === 0 ? (
                      <span className="text-muted-foreground">Sin alertas</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {juror.indicators.map((indicator) => (
                          <span key={indicator} className={`rounded-full border px-2 py-0.5 text-xs font-medium ${INDICATOR_STYLE[indicator]}`}>
                            {INDICATOR_LABEL[indicator]}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canConfigure && (
        <PresenceSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} onSaved={() => void reload()} />
      )}
    </section>
  );
}
