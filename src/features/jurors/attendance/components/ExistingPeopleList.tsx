import { Link } from "react-router-dom";
import { CheckCircle2, Clock, Info, Loader2, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatArrival } from "@/features/jurors/attendance/api/jurorAttendance";
import type { ExistingPerson } from "@/features/jurors/attendance/api/walkInJurors";
import type { CheckInState } from "@/features/jurors/attendance/hooks/useWalkInJuror";
import { enrollHint, existingPersonAction, isProfessor } from "@/features/jurors/attendance/lib/walkInJuror";

interface ExistingPeopleListProps {
  people: ExistingPerson[];
  checkIns: Record<string, CheckInState>;
  onCheckIn: (person: ExistingPerson) => void;
  /** true = el correo es de esa persona; false = solo se parece el nombre. */
  sameEmail: boolean;
}

interface PersonActionProps {
  person: ExistingPerson;
  state?: CheckInState;
  onCheckIn: () => void;
  sameEmail: boolean;
}

function PersonAction({ person, state, onCheckIn, sameEmail }: PersonActionProps) {
  if (state?.status === "done") {
    return (
      <p role="status" className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          {state.already ? "Ya tenía llegada" : "Llegada registrada"} a las {formatArrival(state.checkedInAt)}
          <span className="block text-xs">Conserva su tipo y sus grupos.</span>
        </span>
      </p>
    );
  }

  switch (existingPersonAction(person)) {
    case "CHECK_IN":
      return (
        <div className="space-y-1.5">
          <Button size="sm" onClick={onCheckIn} disabled={state?.status === "saving"}>
            {state?.status === "saving" ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            ) : (
              <UserCheck className="mr-2 size-4" aria-hidden />
            )}
            Marcar llegada
          </Button>
          <p className="text-xs text-muted-foreground">Es jurado de la edición: conserva su tipo y sus grupos.</p>
          {state?.status === "error" && (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          )}
        </div>
      );
    case "ALREADY_ARRIVED":
      return (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Ya llegó a las {formatArrival(person.checkedInAt)}
            <span className="block text-xs">No hay nada que hacer.</span>
          </span>
        </p>
      );
    case "ENROLL":
      return (
        <p className="text-sm text-muted-foreground">
          {isProfessor(person) &&
            (sameEmail ? "Es profesor: no se crea como jurado. " : "Si es esta persona, es profesor y no se crea como jurado. ")}
          {enrollHint(person)}{" "}
          <Link to="/jurados-edicion" className="font-medium text-primary underline-offset-4 hover:underline">
            Ir a Jurados de la edición
          </Link>
        </p>
      );
    default:
      return (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          Su cuenta es de {person.role.toLowerCase()}: no se puede usar para un jurado.
        </p>
      );
  }
}

/** Personas que ya existen (correo repetido o nombre parecido), con lo que se puede hacer con cada una. */
export function ExistingPeopleList({ people, checkIns, onCheckIn, sameEmail }: ExistingPeopleListProps) {
  return (
    <ul aria-label="Personas que ya existen" className="space-y-2">
      {people.map((person) => (
        <li key={person.id} className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{person.name}</span>
            <Badge variant="outline">{person.role}</Badge>
            {!person.isActive && <Badge variant="warning">Inactivo</Badge>}
          </div>
          <PersonAction
            person={person}
            state={checkIns[person.id]}
            onCheckIn={() => onCheckIn(person)}
            sameEmail={sameEmail}
          />
        </li>
      ))}
    </ul>
  );
}
