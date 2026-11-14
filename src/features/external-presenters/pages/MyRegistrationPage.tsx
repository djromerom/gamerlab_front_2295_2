import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, Award, Loader2, MailCheck, Presentation } from "lucide-react";
import LayoutAplication from "@/layouts/LayoutAplication";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExternalPresenterError,
  fetchMyExternalPresenter,
  type MyExternalPresenter,
} from "@/features/external-presenters/api/externalPresenters";
import { formatSentAt, fullName } from "@/features/external-presenters/lib/externalPresenters";

type State =
  | { kind: "loading" }
  | { kind: "ready"; registration: MyExternalPresenter }
  | { kind: "not-registered" }
  | { kind: "error"; message: string };

/**
 * HU-33: panel del presentador externo. Solo consulta `GET /external-presenters/me`:
 * cualquier otra ruta del back le responde 403. El certificado no se descarga aquí;
 * lo envía el administrador por correo.
 */
const MyRegistrationPage: React.FC = () => {
  const [state, setState] = useState<State>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      setState({ kind: "ready", registration: await fetchMyExternalPresenter() });
    } catch (err) {
      if (err instanceof ExternalPresenterError && err.status === 404) {
        setState({ kind: "not-registered" });
      } else {
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "No se pudo cargar tu registro.",
        });
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <LayoutAplication breadcrumbs={[{ label: "Mi registro", href: "/mi-registro" }]}>
      <main className="mx-auto w-full max-w-2xl px-4 pb-10 space-y-6">
        <h1 className="text-lg md:text-xl font-medium">Mi registro en la feria</h1>

        {state.kind === "loading" && (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Cargando tu registro...</span>
          </div>
        )}

        {state.kind === "not-registered" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No tienes un registro activo</AlertTitle>
            <AlertDescription>
              No estás registrado como presentador en la feria. Si crees que es un error, escribe a la
              organización de la feria.
            </AlertDescription>
          </Alert>
        )}

        {state.kind === "error" && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-destructive">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">{state.message}</p>
            <Button variant="outline" size="sm" onClick={load}>
              Reintentar
            </Button>
          </div>
        )}

        {state.kind === "ready" && <Registration registration={state.registration} />}
      </main>
    </LayoutAplication>
  );
};

const Registration: React.FC<{ registration: MyExternalPresenter }> = ({ registration }) => {
  const sentAt = registration.certificateSentAt;
  return (
    <>
      <Card className="py-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Presentation className="h-5 w-5" aria-hidden />
            {fullName(registration)}
          </CardTitle>
          <CardDescription>Presentador externo · {registration.edition.title}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-6">
            <dt className="text-muted-foreground">Correo</dt>
            <dd>{registration.email}</dd>
            <dt className="text-muted-foreground">Organización</dt>
            <dd>{registration.organization ?? "Sin organización"}</dd>
            <dt className="text-muted-foreground">Presentación</dt>
            <dd>{registration.presentationTitle ?? "Sin título registrado"}</dd>
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Si algún dato está mal, pídele a la organización de la feria que lo corrija: así saldrá en
            tu certificado.
          </p>
        </CardContent>
      </Card>

      <Alert>
        {sentAt ? <MailCheck className="h-4 w-4" /> : <Award className="h-4 w-4" />}
        <AlertTitle>Certificado de asistencia</AlertTitle>
        <AlertDescription>
          {sentAt ? (
            <>
              {/* La hora ya termina en «p. m.»: la segunda frase va aparte para no duplicar el punto */}
              <p>Te enviamos el certificado al correo el {formatSentAt(sentAt)}</p>
              <p>Si no lo ves, revisa la carpeta de spam.</p>
            </>
          ) : (
            "Recibirás tu certificado por correo cuando la organización lo envíe."
          )}
        </AlertDescription>
      </Alert>
    </>
  );
};

export default MyRegistrationPage;
