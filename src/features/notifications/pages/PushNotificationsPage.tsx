import { useEffect, useState } from "react";
import { Bell, BellOff, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import LayoutApplication from "@/layouts/LayoutApplication";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPushPublicKey,
  getPushStatus,
  sendArrivalReminder,
  sendPendingEvaluationsNotice,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/features/notifications/api/pushNotifications";
import {
  base64UrlToUint8Array,
  getPushSubscription,
  NEEDS_INSTALL_MESSAGE,
  pushAvailability,
  UNSUPPORTED_MESSAGE,
} from "@/features/notifications/lib/pushNotifications";

export default function PushNotificationsPage() {
  const { userRole } = useAuth();
  const isAdmin = userRole === "Administrador";
  const canSubscribe = userRole === "Jurado" || userRole === "Profesor" || isAdmin;
  const [subscribed, setSubscribed] = useState(false);
  const [deviceCount, setDeviceCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  // En iPhone o iPad sin la app instalada (o en un navegador sin push) se avisa de una vez, sin error técnico
  const [availability] = useState(pushAvailability);
  const canUsePush = availability === "supported";

  const syncSubscription = async () => {
    // null sin pushManager (Safari sin la app instalada): ya no lanza
    const browserSubscription = await getPushSubscription();
    setSubscribed(Boolean(browserSubscription));

    const [status, publicKey] = await Promise.all([getPushStatus(), getPushPublicKey()]);
    setDeviceCount(status.devices);

    if (browserSubscription && publicKey.enabled && publicKey.publicKey) {
      await subscribeToPush(browserSubscription.toJSON());
    }
  };

  useEffect(() => {
    if (!canSubscribe) return;
    const syncAfterChange = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_SUBSCRIPTION_CHANGED") {
        void syncSubscription().catch((reason: Error) => setError(reason.message));
      }
    };
    navigator.serviceWorker?.addEventListener("message", syncAfterChange);
    syncSubscription()
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
    return () => navigator.serviceWorker?.removeEventListener("message", syncAfterChange);
  }, [canSubscribe]);

  const activate = async () => {
    setError("");
    setMessage("");
    if (!canUsePush) return;

    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Debes permitir las notificaciones en el navegador.");
        return;
      }

      const publicKey = await getPushPublicKey();
      if (!publicKey.enabled || !publicKey.publicKey) {
        setError("Las notificaciones no están configuradas");
        return;
      }
      await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToUint8Array(publicKey.publicKey),
        });
      }
      const result = await subscribeToPush(subscription.toJSON());
      setSubscribed(true);
      setDeviceCount(result.devices);
      setMessage("Notificaciones activadas en este dispositivo.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudieron activar las notificaciones");
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async () => {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const subscription = await getPushSubscription();
      if (subscription) {
        await unsubscribeFromPush(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setSubscribed(false);
      setDeviceCount((current) => Math.max(0, current - 1));
      setMessage("Notificaciones desactivadas en este dispositivo.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudieron desactivar las notificaciones");
    } finally {
      setBusy(false);
    }
  };

  const send = async (kind: "arrival" | "pending") => {
    if (sending) return;
    setError("");
    setMessage("");
    setSending(true);
    try {
      const result = kind === "arrival"
          ? await sendArrivalReminder()
          : await sendPendingEvaluationsNotice();
      setMessage(`Aviso enviado a ${result.totals.sent} dispositivo(s).`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo enviar el aviso");
    } finally {
      setSending(false);
    }
  };

  return (
    <LayoutApplication breadcrumbs={[{ label: "Notificaciones", href: "/notificaciones" }]}>
      <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
        <h1 className="text-2xl font-semibold">Notificaciones</h1>

        {canSubscribe && (
          <section className="rounded-lg border p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-medium">Avisos en este dispositivo</h2>
                <p className="text-sm text-muted-foreground">
                  {loading ? "Consultando..." : subscribed ? "Activadas" : "Desactivadas"}
                  {!loading && deviceCount > 0 ? ` · ${deviceCount} dispositivo(s) activo(s)` : ""}
                </p>
              </div>
              {subscribed
                ? <Bell className="text-primary" />
                : <BellOff className="text-muted-foreground" />}
            </div>
            {canUsePush || subscribed ? (
              <Button className="mt-4" onClick={subscribed ? deactivate : activate} disabled={loading || busy}>
                {busy ? "Procesando..." : subscribed ? "Desactivar" : "Activar notificaciones"}
              </Button>
            ) : (
              <div className="mt-4 flex gap-3 rounded-md border border-primary/30 bg-primary/5 p-4 text-sm" role="note">
                <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div className="space-y-2">
                  <p>{availability === "needsInstall" ? NEEDS_INSTALL_MESSAGE : UNSUPPORTED_MESSAGE}</p>
                  {availability === "needsInstall" && userRole === "Jurado" && (
                    <Link to="/instalar-app" className="font-medium text-primary underline underline-offset-4">
                      Ver la guía para instalar la app
                    </Link>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {isAdmin && (
          <section className="space-y-4 rounded-lg border p-5">
            <h2 className="font-medium">Enviar avisos</h2>
            <p className="text-sm text-muted-foreground">
              Envía recordatorios automáticos a los dispositivos suscritos.
            </p>
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => send("arrival")} disabled={sending}>
                Recordar llegada
              </Button>
              <Button variant="outline" onClick={() => send("pending")} disabled={sending}>
                Equipos pendientes
              </Button>
            </div>
          </section>
        )}

        {message && <p className="text-sm text-emerald-600" role="status">{message}</p>}
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      </main>
    </LayoutApplication>
  );
}
