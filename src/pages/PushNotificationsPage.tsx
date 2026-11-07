import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import LayoutAplication from "@/layouts/LayoutAplication";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPushPublicKey,
  getPushStatus,
  sendArrivalReminder,
  sendPendingEvaluationsNotice,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/fetchs/pushNotifications";
import {
  base64UrlToUint8Array,
  getPushRegistration,
  isPushSupported,
  requiresInstalledPwa,
} from "@/lib/pushNotifications";

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

  const syncSubscription = async () => {
    const registration = await getPushRegistration();
    const browserSubscription = await registration?.pushManager.getSubscription();
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
    if (requiresInstalledPwa()) {
      setError("Instala ARKAD como aplicación desde Safari antes de activar las notificaciones.");
      return;
    }
    if (!isPushSupported()) {
      setError("Este navegador no es compatible con las notificaciones push.");
      return;
    }

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
      const registration = await getPushRegistration();
      const subscription = await registration?.pushManager.getSubscription();
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
    <LayoutAplication breadcrumbs={[{ label: "Notificaciones", href: "/notificaciones" }]}>
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
            <Button className="mt-4" onClick={subscribed ? deactivate : activate} disabled={loading || busy}>
              {busy ? "Procesando..." : subscribed ? "Desactivar" : "Activar notificaciones"}
            </Button>
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
    </LayoutAplication>
  );
}
