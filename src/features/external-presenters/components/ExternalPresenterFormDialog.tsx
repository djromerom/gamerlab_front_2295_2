import React, { useEffect, useState, type FormEvent } from "react";
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
  createExternalPresenter,
  updateExternalPresenter,
  type ExternalPresenter,
} from "@/features/external-presenters/api/externalPresenters";
import {
  MAX_EMAIL,
  MAX_NAME,
  MAX_ORGANIZATION,
  MAX_PRESENTATION_TITLE,
  optionalText,
  validatePresenter,
  type PresenterErrors,
  type PresenterField,
} from "@/features/external-presenters/lib/externalPresenters";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Con un presentador, el diálogo edita; sin él, registra uno nuevo. */
  presenter?: ExternalPresenter | null;
  onSaved: (presenter: ExternalPresenter, mode: "create" | "edit") => void;
}

type Values = Record<PresenterField, string>;

const EMPTY: Values = {
  email: "",
  confirmEmail: "",
  firstName: "",
  lastName: "",
  organization: "",
  presentationTitle: "",
};

const valuesOf = (p?: ExternalPresenter | null): Values =>
  p
    ? {
        ...EMPTY,
        firstName: p.firstName,
        lastName: p.lastName,
        organization: p.organization ?? "",
        presentationTitle: p.presentationTitle ?? "",
      }
    : EMPTY;

// HU-32: el correo repetido se escribe a mano, no se pega ni se arrastra
const blockPaste = (event: React.ClipboardEvent | React.DragEvent) => event.preventDefault();

export const ExternalPresenterFormDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  presenter,
  onSaved,
}) => {
  const editing = Boolean(presenter);
  const [values, setValues] = useState<Values>(valuesOf(presenter));
  const [errors, setErrors] = useState<PresenterErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(valuesOf(presenter));
      setErrors({});
      setServerError(null);
    }
  }, [open, presenter]);

  const set = (field: PresenterField) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validatePresenter(
      editing ? { ...values, email: undefined, confirmEmail: undefined } : values,
    );
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setServerError(null);
    try {
      const saved = presenter
        ? await updateExternalPresenter(presenter.id, {
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            // null borra el dato en el back; un texto vacío no lo cambiaría
            organization: values.organization.trim() || null,
            presentationTitle: values.presentationTitle.trim() || null,
          })
        : await createExternalPresenter({
            email: values.email.trim(),
            confirmEmail: values.confirmEmail.trim(),
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            organization: optionalText(values.organization),
            presentationTitle: optionalText(values.presentationTitle),
          });
      onSaved(saved, editing ? "edit" : "create");
      onOpenChange(false);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "No se pudo guardar el presentador.");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (field: PresenterField) =>
    errors[field] ? (
      <p id={`presenter-${field}-error`} className="text-xs text-destructive">
        {errors[field]}
      </p>
    ) : null;

  const a11y = (field: PresenterField) => ({
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field] ? `presenter-${field}-error` : undefined,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar presentador externo" : "Registrar presentador externo"}</DialogTitle>
          <DialogDescription>
            {editing
              ? `${presenter?.email}. El correo no se puede cambiar.`
              : "Queda registrado en la edición activa y recibe un correo para activar su cuenta. No se califica: solo recibe el certificado de asistencia."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit} noValidate>
          {!editing && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="presenter-email">Correo</Label>
                <Input
                  id="presenter-email"
                  type="email"
                  autoComplete="off"
                  maxLength={MAX_EMAIL}
                  value={values.email}
                  onChange={set("email")}
                  {...a11y("email")}
                />
                {fieldError("email")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="presenter-confirm-email">Repite el correo</Label>
                <Input
                  id="presenter-confirm-email"
                  type="email"
                  autoComplete="off"
                  maxLength={MAX_EMAIL}
                  value={values.confirmEmail}
                  onChange={set("confirmEmail")}
                  onPaste={blockPaste}
                  onDrop={blockPaste}
                  {...a11y("confirmEmail")}
                />
                {fieldError("confirmEmail") ?? (
                  <p className="text-xs text-muted-foreground">Escríbelo de nuevo: no se puede pegar.</p>
                )}
              </div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="presenter-first-name">Nombre</Label>
              <Input
                id="presenter-first-name"
                maxLength={MAX_NAME}
                value={values.firstName}
                onChange={set("firstName")}
                {...a11y("firstName")}
              />
              {fieldError("firstName")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="presenter-last-name">Apellido</Label>
              <Input
                id="presenter-last-name"
                maxLength={MAX_NAME}
                value={values.lastName}
                onChange={set("lastName")}
                {...a11y("lastName")}
              />
              {fieldError("lastName")}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="presenter-organization">Organización (opcional)</Label>
            <Input
              id="presenter-organization"
              maxLength={MAX_ORGANIZATION}
              placeholder="Empresa, estudio o institución"
              value={values.organization}
              onChange={set("organization")}
              {...a11y("organization")}
            />
            {fieldError("organization")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="presenter-title">Título de la presentación (opcional)</Label>
            <Input
              id="presenter-title"
              maxLength={MAX_PRESENTATION_TITLE}
              value={values.presentationTitle}
              onChange={set("presentationTitle")}
              {...a11y("presentationTitle")}
            />
            {fieldError("presentationTitle") ?? (
              <p className="text-xs text-muted-foreground">La organización y el título salen en el certificado.</p>
            )}
          </div>
          {serverError && (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Guardar" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
