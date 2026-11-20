import { AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WalkInField, WalkInFormErrors } from "@/features/jurors/attendance/lib/walkInJuror";

interface WalkInJurorFormProps {
  values: Record<WalkInField, string>;
  errors: WalkInFormErrors;
  submitting: boolean;
  onChange: (field: WalkInField, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const FIELDS: { field: WalkInField; label: string; type: string; autoComplete: string; maxLength: number }[] = [
  { field: "firstName", label: "Nombre", type: "text", autoComplete: "given-name", maxLength: 100 },
  { field: "lastName", label: "Apellido", type: "text", autoComplete: "family-name", maxLength: 100 },
  { field: "email", label: "Correo", type: "email", autoComplete: "email", maxLength: 150 },
];

/** Solo nombre, apellido y correo. La categoría y el tipo son fijos: Junior · Suplente. */
export function WalkInJurorForm({ values, errors, submitting, onChange, onSubmit, onCancel }: WalkInJurorFormProps) {
  return (
    <form
      className="flex min-h-0 flex-1 flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-0.5">
        {FIELDS.map(({ field, label, type, autoComplete, maxLength }) => {
          const error = errors.fields[field];
          return (
            <div key={field} className="space-y-1.5">
              <Label htmlFor={`walk-in-${field}`}>{label}</Label>
              <Input
                id={`walk-in-${field}`}
                type={type}
                value={values[field]}
                autoComplete={autoComplete}
                maxLength={maxLength}
                onChange={(event) => onChange(field, event.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `walk-in-${field}-error` : undefined}
                className="text-base"
                disabled={submitting}
              />
              {error && (
                <p id={`walk-in-${field}-error`} className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
          );
        })}

        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Entra como</span>
            <Badge variant="secondary">Junior · Suplente</Badge>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Queda confirmado en la edición activa, con su llegada registrada a tu nombre y marcado como «alta del día». No
            tiene escarapela ni QR.
          </p>
        </div>

        {errors.general.map((message) => (
          <p key={message} role="alert" className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-2.5 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
            {message}
          </p>
        ))}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />}
          {submitting ? "Creando..." : "Crear y registrar llegada"}
        </Button>
      </DialogFooter>
    </form>
  );
}
