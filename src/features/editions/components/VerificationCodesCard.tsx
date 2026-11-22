import type React from "react";
import EventSetupCard from "@/features/editions/components/EventSetupCard";
import { useVerificationCodesSetting } from "@/features/editions/hooks/useVerificationCodesSetting";
import {
  VERIFICATION_CODES_CARD_TITLE,
  VERIFICATION_CODES_HINT,
  VERIFICATION_CODES_SUBTITLE,
  verificationCodesChangeMessage,
} from "@/features/editions/lib/verificationCodes";

/**
 * HU-50 (ARK-311): interruptor global del código de verificación (HU-19). Encendido por defecto;
 * apagado, los jurados califican cualquier equipo sin digitar el código.
 */
const VerificationCodesCard: React.FC = () => {
  const { setting, loadError, reload, save } = useVerificationCodesSetting();

  if (!setting) {
    return (
      <EventSetupCard
        value={false}
        title={VERIFICATION_CODES_CARD_TITLE}
        subtitle={VERIFICATION_CODES_SUBTITLE}
        disabled
      >
        {loadError ? (
          <p className="text-sm text-destructive" role="alert">
            {loadError}{" "}
            <button type="button" className="underline cursor-pointer" onClick={() => void reload()}>
              Reintentar
            </button>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Cargando…</p>
        )}
      </EventSetupCard>
    );
  }

  const lastChange = verificationCodesChangeMessage(setting);

  return (
    <EventSetupCard
      value={setting.verificationCodesEnabled}
      title={VERIFICATION_CODES_CARD_TITLE}
      subtitle={VERIFICATION_CODES_SUBTITLE}
      save={save}
      hint={VERIFICATION_CODES_HINT}
      confirm={(enabled) =>
        enabled
          ? null
          : {
              title: "¿Dejar de exigir el código de verificación?",
              action: "Dejar de exigirlo",
              description:
                "Los jurados podrán calificar cualquier equipo de la edición activa sin digitar su código. Las verificaciones hechas no se borran y puedes volver a encenderlo cuando quieras.",
            }
      }
    >
      {lastChange && <p className="text-xs text-muted-foreground">{lastChange}</p>}
    </EventSetupCard>
  );
};

export default VerificationCodesCard;
