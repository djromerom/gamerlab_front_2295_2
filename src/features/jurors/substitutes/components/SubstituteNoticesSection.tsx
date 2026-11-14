import { formatBogotaTime } from "@/features/jurors/presence/api/jurorPresence";
import {
  EMAIL_STATUS_LABEL,
  type NoticeEmailStatus,
} from "@/features/jurors/substitutes/api/substituteNotices";
import { useUnreadSubstituteNotices } from "@/features/jurors/substitutes/hooks/useUnreadSubstituteNotices";
import { groupsLabel } from "@/features/jurors/substitutes/lib/substituteGuide";

const EMAIL_STYLE: Record<NoticeEmailStatus, string> = {
  PENDING: "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  SENT: "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  FAILED: "border-red-500/50 bg-red-500/15 text-red-700 dark:text-red-300",
  SKIPPED: "border-muted-foreground/40 bg-muted text-muted-foreground",
};

/**
 * Panel de seguimiento (Administrador): suplentes a los que se les asignaron grupos y aún no han
 * leído el aviso (HU-22, A1). Si el correo falló, el aviso en la plataforma sigue activo.
 */
export function SubstituteNoticesSection() {
  const { result, error, loading } = useUnreadSubstituteNotices();
  const rows = result?.data ?? [];

  return (
    <section aria-labelledby="substitute-notices-title" className="mb-4 rounded-md border p-4">
      <div className="mb-3">
        <h2 id="substitute-notices-title" className="font-semibold">Avisos a suplentes sin leer</h2>
        <p className="text-sm text-muted-foreground">
          Suplentes a los que se les asignaron grupos y todavía no marcan el aviso como leído.
        </p>
      </div>

      {error && (
        <p role="alert" className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">
          {error.message}{result ? " Se mantiene la última información disponible." : ""}
        </p>
      )}

      {loading && !result ? (
        <p className="p-4 text-center text-sm text-muted-foreground">Cargando avisos...</p>
      ) : !result ? null : rows.length === 0 ? (
        <p className="p-4 text-center text-sm text-muted-foreground">Todos los suplentes leyeron sus avisos.</p>
      ) : (
        <>
          <p className="mb-3 text-sm">
            <strong>{result.totals.unread}</strong> avisos sin leer de <strong>{result.totals.jurors}</strong> suplentes
          </p>
          <div className="max-h-80 overflow-auto rounded-md border">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr className="text-left">
                  <th scope="col" className="p-2">Suplente</th>
                  <th scope="col" className="p-2">Asignado</th>
                  <th scope="col" className="p-2">Grupos</th>
                  <th scope="col" className="p-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.noticeId} className="border-t align-top">
                    <td className="p-2 font-medium">{row.name}</td>
                    <td className="p-2">{formatBogotaTime(row.createdAt)}</td>
                    <td className="p-2">{groupsLabel(row.teamCount)}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        <span className="rounded-full border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                          Aviso sin leer
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${EMAIL_STYLE[row.emailStatus]}`}
                          title={row.emailStatus === "FAILED" ? "El aviso en la plataforma sigue activo." : undefined}
                        >
                          {EMAIL_STATUS_LABEL[row.emailStatus]}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
