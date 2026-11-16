import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MIN_EVALUATIONS_LIMITS,
  fetchContingencySettings,
  updateContingencySettings,
  type ContingencySettings,
} from "@/features/jurors/contingency/api/contingency";
import { validateMinimum } from "@/features/jurors/contingency/lib/contingency";

interface ContingencySettingsCardProps {
  /** Se llama al cargar y al guardar, para que la vista conozca la hora de control y recargue. */
  onChange: (settings: ContingencySettings, saved: boolean) => void;
}

/** Parámetro de HU-14: mínimo de evaluaciones por grupo. Las horas siguen en el cronograma. */
export function ContingencySettingsCard({ onChange }: ContingencySettingsCardProps) {
  const [settings, setSettings] = useState<ContingencySettings | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetchContingencySettings()
      .then((result) => {
        if (!active) return;
        setSettings(result);
        setValue(String(result.minEvaluationsPerTeam));
        onChange(result, false);
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : "No se pudieron cargar los parámetros."));
    return () => {
      active = false;
    };
    // Solo al montar: onChange cambia en cada render del padre
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaved(false);
    const invalid = validateMinimum(value, MIN_EVALUATIONS_LIMITS);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const result = await updateContingencySettings(Number(value));
      setSettings(result);
      setValue(String(result.minEvaluationsPerTeam));
      setSaved(true);
      onChange(result, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el mínimo de evaluaciones.");
    } finally {
      setIsSaving(false);
    }
  };

  const schedule = settings?.cronograma;
  const unchanged = settings !== null && value === String(settings.minEvaluationsPerTeam);

  return (
    <section aria-labelledby="contingency-settings-title" className="rounded-lg border bg-card p-4">
      <h2 id="contingency-settings-title" className="flex items-center gap-2 text-sm font-semibold">
        <Settings2 className="size-4" /> Parámetros
      </h2>
      {/* noValidate: el aviso propio (en español y con el rango) reemplaza al del navegador */}
      <form onSubmit={save} noValidate className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          Mínimo de evaluaciones por grupo
          <Input
            type="number"
            inputMode="numeric"
            min={MIN_EVALUATIONS_LIMITS.min}
            max={MIN_EVALUATIONS_LIMITS.max}
            step={1}
            value={value}
            disabled={settings === null}
            onChange={(event) => {
              setValue(event.target.value);
              setSaved(false);
            }}
            className="mt-1 w-28"
          />
        </label>
        <Button type="submit" variant="outline" disabled={isSaving || settings === null || unchanged}>
          {isSaving ? "Guardando..." : "Guardar"}
        </Button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">
        Define qué grupos quedan en riesgo y cuántos suplentes se sugieren. No cambia la nota: solo cuentan
        las 3 primeras evaluaciones.
      </p>
      {schedule?.controlTime && (
        <p className="mt-2 text-xs text-muted-foreground">
          Hora de control: <strong>{schedule.controlTime}</strong>
          {schedule.alertTime ? ` · alerta ${schedule.alertTime}` : ""}. Las horas se cambian en el{" "}
          <Link to="/realtime-tracking-panel" className="underline underline-offset-2 hover:text-foreground">
            Panel de Seguimiento
          </Link>
          .
        </p>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-2 text-sm text-green-600">Mínimo guardado.</p>}
    </section>
  );
}
