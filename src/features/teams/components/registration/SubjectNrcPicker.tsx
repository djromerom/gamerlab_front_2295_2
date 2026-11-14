import { forwardRef, useId } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  markedSubjectIds,
  nrcOptionText,
  subjectIdOf,
  type NrcOption,
  type SubjectInfo,
} from "@/features/teams/lib/nrcSubjects";
import { blockedReason, COMBINATION_HINT, subjectFamilies } from "@/features/teams/lib/subjectRules";

interface SubjectNrcPickerProps {
  options: NrcOption[];
  subjects: SubjectInfo[];
  /** Códigos de NRC elegidos (uno por materia). */
  value: string[];
  onChange: (codes: string[]) => void;
  /** Materias marcadas sin NRC todavía. */
  pending: string[];
  onPendingChange: (subjectIds: string[]) => void;
  invalid?: boolean;
}

/**
 * Paso «Inscripción de Miembros», propuesta A del documento «Selector de NRC de Arkad»
 * (HU-31, ARK-193): las materias van como botones y cada materia marcada abre un desplegable
 * con sus NRC y el profesor de cada uno. Un solo NRC por materia; una o más materias.
 * Las materias que no se pueden combinar con las marcadas quedan deshabilitadas (ARK-193).
 */
const SubjectNrcPicker = forwardRef<HTMLButtonElement, SubjectNrcPickerProps>(function SubjectNrcPicker(
  { options, subjects, value, onChange, pending, onPendingChange, invalid },
  firstChipRef,
) {
  const labelId = useId();
  const baseId = useId();
  const subjectByCode = new Map(options.map((option) => [String(option.code), subjectIdOf(option)]));
  const marked = markedSubjectIds(subjects, options, value, pending);
  const markedSubjects = subjects.filter((subject) => marked.includes(subject.id));
  const families = subjectFamilies(options);
  const someBlocked = subjects.some(
    (subject) => !marked.includes(subject.id) && blockedReason(markedSubjects, subject, families),
  );

  const toggle = (subjectId: string) => {
    if (marked.includes(subjectId)) {
      onChange(value.filter((code) => subjectByCode.get(String(code)) !== subjectId));
      onPendingChange(pending.filter((id) => id !== subjectId));
    } else {
      onPendingChange([...pending, subjectId]);
    }
  };

  const pick = (subjectId: string, code: string) => {
    onChange([...value.filter((selected) => subjectByCode.get(String(selected)) !== subjectId), code]);
  };

  return (
    <div className="grid gap-2" role="group" aria-labelledby={labelId}>
      <span id={labelId} className="text-sm font-medium">
        ¿Por qué materias participa?
      </span>

      <div className="flex flex-wrap gap-1.5">
        {subjects.map((subject, index) => {
          const on = marked.includes(subject.id);
          const blocked = on ? null : blockedReason(markedSubjects, subject, families);
          return (
            <button
              key={subject.id}
              ref={index === 0 ? firstChipRef : undefined}
              type="button"
              title={blocked ?? subject.name}
              aria-pressed={on}
              aria-disabled={blocked ? true : undefined}
              aria-invalid={invalid && !on ? true : undefined}
              onClick={() => !blocked && toggle(subject.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors outline-none",
                "focus-visible:ring-[3px] focus-visible:ring-[#B3C7FF]/60",
                on
                  ? "cursor-pointer border-[#8a70ff] bg-[#8a70ff] font-semibold text-white"
                  : blocked
                    ? "cursor-not-allowed border-white/10 bg-input/10 text-muted-foreground opacity-50 line-through"
                    : "cursor-pointer border-white/25 bg-input/30 hover:bg-input/60",
                invalid && !on && marked.length === 0 && "border-destructive",
              )}
            >
              {subject.abrevName}
            </button>
          );
        })}
      </div>

      {someBlocked && <p className="text-muted-foreground text-xs">{COMBINATION_HINT}</p>}

      {marked.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          Si el proyecto es de varias materias (como en tercer semestre), márcalas todas.
        </p>
      ) : (
        marked.map((subjectId) => {
          const subject = subjects.find((s) => s.id === subjectId)!;
          const current = value.find((code) => subjectByCode.get(String(code)) === subjectId);
          const triggerId = `${baseId}-${subjectId}`;
          return (
            <div key={subjectId} className="grid gap-1">
              <label htmlFor={triggerId} className="text-sm font-medium">
                NRC de {subject.name}
              </label>
              <Select value={current ?? ""} onValueChange={(code) => pick(subjectId, code)}>
                <SelectTrigger
                  id={triggerId}
                  className="w-full"
                  aria-invalid={invalid && !current ? true : undefined}
                >
                  <SelectValue placeholder="Selecciona el NRC" />
                </SelectTrigger>
                <SelectContent>
                  {options
                    .filter((option) => subjectIdOf(option) === subjectId)
                    .map((option) => (
                      <SelectItem key={String(option.code)} value={String(option.code)}>
                        {nrcOptionText(option)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          );
        })
      )}
    </div>
  );
});

export default SubjectNrcPicker;
