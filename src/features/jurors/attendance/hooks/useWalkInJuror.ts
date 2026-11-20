import { useEffect, useState } from "react";
import { checkInJurorManually } from "@/features/jurors/attendance/api/jurorCheckIn";
import {
  CREATE_FAILED_MESSAGE,
  WalkInJurorError,
  createWalkInJuror,
  resendJurorAccountEmail,
  type ExistingPerson,
  type WalkInJurorCreated,
} from "@/features/jurors/attendance/api/walkInJurors";
import {
  splitFieldErrors,
  validateWalkInForm,
  type WalkInField,
  type WalkInFormErrors,
} from "@/features/jurors/attendance/lib/walkInJuror";

export type WalkInStep = "form" | "existing" | "similar" | "created";

/** Resultado de «Marcar llegada» sobre una persona que ya existía. */
export type CheckInState =
  | { status: "saving" }
  | { status: "done"; checkedInAt: string; already: boolean }
  | { status: "error"; message: string };

const EMPTY_FORM: Record<WalkInField, string> = { firstName: "", lastName: "", email: "" };
const NO_ERRORS: WalkInFormErrors = { fields: {}, general: [] };

/**
 * Alta de un jurado del día (HU-24, CU-24). Cada vez que se abre parte de cero. Un 409 de correo
 * repetido o de nombres parecidos no crea nada: pasa al paso que muestra a esas personas, desde
 * donde se marca su llegada (HU-11) o se confirma que no es ninguna (`confirmSimilar`).
 */
export function useWalkInJuror(open: boolean, onChanged: () => void) {
  const [step, setStep] = useState<WalkInStep>("form");
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<WalkInFormErrors>(NO_ERRORS);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [people, setPeople] = useState<ExistingPerson[]>([]);
  const [created, setCreated] = useState<WalkInJurorCreated | null>(null);
  const [checkIns, setCheckIns] = useState<Record<string, CheckInState>>({});
  const [resend, setResend] = useState<"idle" | "sending" | "sent" | string>("idle");

  useEffect(() => {
    if (!open) return;
    setStep("form");
    setValues(EMPTY_FORM);
    setErrors(NO_ERRORS);
    setNotice(null);
    setPeople([]);
    setCreated(null);
    setCheckIns({});
    setResend("idle");
  }, [open]);

  const setValue = (field: WalkInField, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, fields: { ...e.fields, [field]: undefined } }));
  };

  const submit = async (confirmSimilar = false) => {
    const fields = validateWalkInForm(values);
    if (Object.keys(fields).length > 0) {
      setErrors({ fields, general: [] });
      setStep("form");
      return;
    }
    setSubmitting(true);
    setErrors(NO_ERRORS);
    try {
      const saved = await createWalkInJuror({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        ...(confirmSimilar && { confirmSimilar: true }),
      });
      setCreated(saved);
      setStep("created");
      onChanged();
    } catch (err) {
      if (err instanceof WalkInJurorError && err.code === "EMAIL_ALREADY_EXISTS" && err.details.existing) {
        setNotice(err.message);
        setPeople([err.details.existing]);
        setStep("existing");
      } else if (err instanceof WalkInJurorError && err.code === "SIMILAR_PEOPLE" && err.details.matches?.length) {
        setNotice(err.message);
        setPeople(err.details.matches);
        setStep("similar");
      } else if (err instanceof WalkInJurorError && err.status === 400 && err.details.messages?.length) {
        setErrors(splitFieldErrors(err.details.messages));
        setStep("form");
      } else {
        setErrors({ fields: {}, general: [err instanceof WalkInJurorError ? err.message : CREATE_FAILED_MESSAGE] });
        setStep("form");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const checkIn = async (person: ExistingPerson) => {
    setCheckIns((c) => ({ ...c, [person.id]: { status: "saving" } }));
    try {
      const result = await checkInJurorManually(person.id);
      setCheckIns((c) => ({
        ...c,
        [person.id]: { status: "done", checkedInAt: result.checkedInAt, already: result.status === "ALREADY_CHECKED_IN" },
      }));
      onChanged();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo registrar la llegada";
      setCheckIns((c) => ({ ...c, [person.id]: { status: "error", message } }));
    }
  };

  const resendEmail = async () => {
    if (!created) return;
    setResend("sending");
    try {
      await resendJurorAccountEmail(created.juror.email);
      setResend("sent");
    } catch (err) {
      setResend(err instanceof Error ? err.message : "No se pudo reenviar el correo.");
    }
  };

  return {
    step,
    backToForm: () => setStep("form"),
    values,
    setValue,
    errors,
    submitting,
    submit: () => void submit(false),
    createAnyway: () => void submit(true),
    notice,
    people,
    created,
    checkIns,
    checkIn: (person: ExistingPerson) => void checkIn(person),
    resend,
    resendEmail: () => void resendEmail(),
  };
}
