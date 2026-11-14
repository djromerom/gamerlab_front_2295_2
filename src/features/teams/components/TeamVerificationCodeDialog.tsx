import { useEffect, useState } from "react";
import { Copy, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  fetchTeamVerificationCode,
  regenerateTeamVerificationCode,
} from "@/features/teams/api/teamVerification";

interface TeamVerificationCodeDialogProps {
  team: { id: number; name: string; teamCode?: string } | null;
  onClose: () => void;
}

/**
 * El administrador consulta o regenera (por pérdida) el código de verificación de un equipo (HU-19).
 * Ambas acciones quedan registradas en el backend.
 */
export function TeamVerificationCodeDialog({
  team,
  onClose,
}: TeamVerificationCodeDialogProps) {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!team) return;

    let cancelled = false;
    setCode(null);
    setError(null);
    setIsLoading(true);
    fetchTeamVerificationCode(team.id)
      .then((data) => !cancelled && setCode(data.code))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setIsLoading(false));

    return () => {
      cancelled = true;
    };
  }, [team]);

  const handleRegenerate = async () => {
    if (!team) return;
    setIsRegenerating(true);
    try {
      const data = await regenerateTeamVerificationCode(team.id);
      setCode(data.code);
      setError(null);
      toast.success(`Código de "${team.name}" regenerado`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo regenerar el código");
    } finally {
      setIsRegenerating(false);
      setConfirmOpen(false);
    }
  };

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Código copiado");
    } catch {
      toast.error("No se pudo copiar el código");
    }
  };

  return (
    <>
      <Dialog open={team !== null} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Código de verificación</DialogTitle>
            <DialogDescription>
              Código que el jurado digita para calificar a{" "}
              <span className="font-medium text-foreground">
                {team?.name}
                {team?.teamCode && ` · ${team.teamCode}`}
              </span>
              . El estudiante lo ve en su panel.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3 py-4">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : error ? (
              <p className="text-sm text-red-600 dark:text-red-500 text-center">
                {error}
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-3xl tracking-widest">
                  {code ?? "—"}
                </span>
                {code && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    aria-label="Copiar código"
                    className="cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(true)}
              disabled={isLoading || isRegenerating || !!error}
              className="cursor-pointer"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerar código
            </Button>
            <Button onClick={onClose} className="cursor-pointer">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Regenerar el código?</AlertDialogTitle>
            <AlertDialogDescription>
              El código actual de {team?.name}
              {team?.teamCode && ` (${team.teamCode})`} dejará de funcionar y el
              estudiante verá el nuevo en su panel. Los jurados que ya
              verificaron este grupo no tienen que volver a digitarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRegenerating} className="cursor-pointer">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRegenerate();
              }}
              disabled={isRegenerating}
              className="cursor-pointer"
            >
              {isRegenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Regenerar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
