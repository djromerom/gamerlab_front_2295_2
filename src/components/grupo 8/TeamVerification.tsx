import { useState, type FormEvent, type ReactNode } from "react";
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
  className?: string;
}

/**
 * Campo donde el jurado digita el código de verificación que el estudiante ve en su panel (HU-19).
 */
export function TeamVerificationForm({
  teamId,
  teamName,
  onVerified,
  className,
}: TeamVerificationFormProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // 429: demasiados intentos fallidos; el backend indica en el mensaje cuánto esperar.
      if (err instanceof TeamVerificationError && err.status === 429) {
        setIsLocked(true);
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
            onChange={(e) => setCode(e.target.value.toUpperCase())}
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
        {error && (
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
  const { isLoading, isVerified, markVerified } = useTeamVerification([teamId]);

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
      teamId={teamId!}
      teamName={teamName}
      onVerified={markVerified}
    />
  );
}
