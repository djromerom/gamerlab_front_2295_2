import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageSquareHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchJurorSurveyStatus, type JurorSurveyStatus } from "@/fetchs/jurorSurvey";
import { JurorSurveyDialog } from "@/components/juror-survey/JurorSurveyDialog";
import { hasJurorSurveyCheck as hasSurveyCheck } from "@/lib/jurorSurvey";

interface JurorSurveyAccessProps {
  /** Cambiarlo (> 0) vuelve a consultar y abre la encuesta si está disponible (envío en lote). */
  checkSignal?: number;
  className?: string;
}

/**
 * HU-17 (ARK-184): acceso «Responder encuesta» en el panel del jurado.
 * Se muestra mientras `GET /juror-survey/status` diga `available: true`; si el jurado omite
 * la encuesta sigue aquí. Si la consulta falla no se muestra nada (no estorba al jurado).
 */
export function JurorSurveyAccess({ checkSignal = 0, className }: JurorSurveyAccessProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<JurorSurveyStatus | null>(null);
  const [answered, setAnswered] = useState(false);
  const [open, setOpen] = useState(false);
  const autoOpen = useRef(hasSurveyCheck(location.state));

  // El aviso de "acabo de enviar" se consume una vez: recargar la página no reabre la encuesta.
  useEffect(() => {
    if (!hasSurveyCheck(location.state)) return;
    const rest = { ...(location.state as Record<string, unknown>) };
    delete rest.jurorSurveyCheck;
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: Object.keys(rest).length > 0 ? rest : null,
    });
  }, [location, navigate]);

  const check = useCallback(async () => {
    try {
      const next = await fetchJurorSurveyStatus();
      setStatus(next);
      if (next.available && autoOpen.current) setOpen(true);
    } catch {
      setStatus(null);
    } finally {
      autoOpen.current = false;
    }
  }, []);

  useEffect(() => {
    if (checkSignal > 0) autoOpen.current = true;
    void check();
  }, [check, checkSignal]);

  const showAccess = Boolean(status?.available) && !answered;

  return (
    <>
      {showAccess && (
        <section
          aria-label="Encuesta de experiencia"
          className={cn(
            "flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between",
            className,
          )}
        >
          <div className="flex items-start gap-3">
            <MessageSquareHeart className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="font-medium">¿Cómo fue tu experiencia como jurado?</p>
              <p className="text-sm text-muted-foreground">
                Ya enviaste las evaluaciones de tus grupos. Responde la encuesta de 6 preguntas; toma menos de un
                minuto.
              </p>
            </div>
          </div>
          <Button className="shrink-0" onClick={() => setOpen(true)}>
            Responder encuesta
          </Button>
        </section>
      )}
      <JurorSurveyDialog
        open={open}
        onOpenChange={setOpen}
        onAnswered={() => setAnswered(true)}
        onUnavailable={() => void check()}
      />
    </>
  );
}

export default JurorSurveyAccess;
