import React, { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
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
  JurorEditionError,
  TYPE_LABEL,
  enrollJurorByEmail,
  type EditionJurorItem,
  type JurorEditionType,
} from "@/fetchs/jurorEdition";

interface EnrollJurorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editionId?: number;
  onEnrolled: (juror: EditionJurorItem) => void;
}

export const EnrollJurorDialog: React.FC<EnrollJurorDialogProps> = ({
  open,
  onOpenChange,
  editionId,
  onEnrolled,
}) => {
  const [email, setEmail] = useState("");
  const [type, setType] = useState<JurorEditionType>("OFFICIAL");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; noAccount: boolean } | null>(null);

  const close = (next: boolean) => {
    if (!next) {
      setEmail("");
      setType("OFFICIAL");
      setError(null);
    }
    onOpenChange(next);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const juror = await enrollJurorByEmail({ email: email.trim(), editionId, type });
      onEnrolled(juror);
      close(false);
    } catch (err) {
      // 404: no hay cuenta → se manda al alta actual de jurado; 400 y 409 traen su motivo
      const noAccount = err instanceof JurorEditionError && err.status === 404;
      setError({
        message: noAccount
          ? "No existe una cuenta con ese correo."
          : err instanceof Error
            ? err.message
            : "No se pudo inscribir al jurado.",
        noAccount,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inscribir jurado por correo</DialogTitle>
          <DialogDescription>
            Para un jurado con cuenta que no estuvo en la edición anterior o un profesor senior sin
            NRC en esta edición. Queda inscrito como Confirmado.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="enroll-email">Correo</Label>
            <Input
              id="enroll-email"
              type="email"
              required
              placeholder="Correo de un jurado o de un profesor senior"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="enroll-type">Tipo</Label>
            <select
              id="enroll-type"
              value={type}
              onChange={(e) => setType(e.target.value as JurorEditionType)}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              {(Object.keys(TYPE_LABEL) as JurorEditionType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <div role="alert" className="space-y-2 text-sm text-destructive">
              <p>{error.message}</p>
              {error.noAccount && (
                <Button asChild variant="outline" size="sm">
                  <Link to="/jurados">Crear el jurado en Personal → Jurados</Link>
                </Button>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Inscribir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
