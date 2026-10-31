import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TeamVerificationError, verifyTeamCode } from "@/fetchs/teamVerification";
import { useTeamVerification } from "@/hooks/useTeamVerification";

interface TeamVerificationFormProps {
  teamId: number;
  teamName?: string;
  onVerified: (teamId: number) => void;
  /** ISO 8601: bloqueo por intentos fallidos que el backend ya reportó para este grupo. */
  lockedUntil?: string | null;
  /** Avisa al padre de un bloqueo nuevo para que no se pierda al salir y volver al grupo. */
  onLocked?: (teamId: number, lockedUntil: string, estimated?: boolean) => void;
  /** true si `lockedUntil` es una estimación local (se muestra «Espera 10 minutos», sin hora). */
  lockEstimated?: boolean;
  className?: string;
}

const FALLBACK_LOCK_MS = 10 * 60 * 1000;

interface LockState {
  until: number; // ms epoch
  showTime: boolean; // false si el backend no informó la hora
}

const parseLock = (iso?: string | null, showTime = true): LockState | null => {
  if (!iso) return null;
  const until = new Date(iso).getTime();
  return Number.isNaN(until) || until <= Date.now() ? null : { until, showTime };
};

const formatTime = (ms: number): string => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/**
 * Campo donde el jurado digita el código de verificación que el estudiante ve en su panel (HU-19).
 */
export function TeamVerificationForm({
  teamId,
  teamName,
  onVerified,
  lockedUntil,
  onLocked,
  lockEstimated = false,
  className,
}: TeamVerificationFormProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lock, setLock] = useState<LockState | null>(() =>
    parseLock(lockedUntil, !lockEstimated),
  );
  const isLocked = lock !== null;

  useEffect(() => {
    const fromProp = parseLock(lockedUntil, !lockEstimated);
    if (fromProp) setLock(fromProp);
  }, [lockedUntil, lockEstimated]);

  // Al pasar la hora de desbloqueo el campo se habilita solo.
  useEffect(() => {
    if (!lock) return;
    const timer = setTimeout(
      () => {
        setLock(null);
        setError(null); // el mensaje del bloqueo ya no aplica
      },
      Math.max(0, lock.until - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [lock]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyEstimatedLock = () => {
    const until = Date.now() + FALLBACK_LOCK_MS;
    setLock({ until, showTime: false });
    onLocked?.(teamId, new Date(until).toISOString(), true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (normalized.length < 6) {
      setError("El código tiene al menos 6 caracteres.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await verifyTeamCode(teamId, normalized);
      toast.success(teamName ? `Grupo "${teamName}" verificado` : "Grupo verificado");
      onVerified(teamId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo verificar el código.";
      setError(message);
      // 429: demasiados intentos fallidos; se bloquea hasta la hora que informe el backend.
      if (err instanceof TeamVerificationError && err.status === 429) {
        const fromServer = parseLock(err.lockedUntil);
        if (fromServer && err.lockedUntil) {
          setLock(fromServer);
          onLocked?.(teamId, err.lockedUntil);
        } else {
          applyEstimatedLock();
        }
      } else if (
        // Backend anterior: el 5.º fallo responde 400 «Intentos restantes: 0» y el 429 llega recién en el 6.º.
        err instanceof TeamVerificationError &&
        err.status === 400 &&
        /Intentos restantes:\s*0\b/.test(err.message)
      ) {
        applyEstimatedLock();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className ?? "h-full py-6"}>
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Verificar grupo
        </CardTitle>
        <CardDescription>
          Pídele al estudiante el código de verificación que aparece en su panel
          y digítalo para habilitar la evaluación
          {teamName ? ` de ${teamName}` : ""}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 sm:items-start"
        >
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="Ej. K7M2QX"
            maxLength={8}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            disabled={isLocked || isSubmitting}
            aria-label="Código de verificación"
            className="font-mono tracking-widest uppercase sm:w-48"
          />
          <Button
            type="submit"
            disabled={isLocked || isSubmitting || code.trim() === ""}
            className="bg-[var(--selected)] hover:bg-[var(--selected-hover)] text-[var(--selected-foreground)] cursor-pointer min-w-[120px]"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Verificar"
            )}
          </Button>
        </form>
        {lock && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-500" role="alert">
            Demasiados intentos fallidos.{" "}
            {lock.showTime
              ? `Intenta de nuevo a las ${formatTime(lock.until)}`
              : "Espera 10 minutos"}
          </p>
        )}
        {error && !lock && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-500" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface TeamVerificationGateProps {
  teamId?: number;
  teamName?: string;
  children: ReactNode;
}

/**
 * Muestra `children` (el formulario de calificación) solo cuando el jurado ya verificó el grupo.
 * Se pide una vez por grupo: si ya lo verificó antes (p. ej. al retomar un borrador), no se vuelve a pedir.
 */
export function TeamVerificationGate({
  teamId,
  teamName,
  children,
}: TeamVerificationGateProps) {
  const { isLoading, isVerified, markVerified, getLockedUntil, isLockEstimated, markLocked } =
    useTeamVerification([teamId]);

  if (isVerified(teamId)) return <>{children}</>;

  if (isLoading) {
    return (
      <Card className="h-full py-6">
        <CardContent className="flex justify-center items-center gap-2 h-full min-h-[160px]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm text-muted-foreground">
            Verificando grupo...
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <TeamVerificationForm
      key={teamId}
      teamId={teamId!}
      teamName={teamName}
      onVerified={markVerified}
      lockedUntil={getLockedUntil(teamId)}
      lockEstimated={isLockEstimated(teamId)}
      onLocked={markLocked}
    />
  );
}
