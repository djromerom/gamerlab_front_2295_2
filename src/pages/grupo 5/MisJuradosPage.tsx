import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LayoutAplication from "@/layouts/LayoutAplication";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";
import LoadingScreen from "@/components/grupo 5/LoadingScreen";

interface JuradoInfo {
  id: string;
  name: string;
  jurorCategory: string | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function extractJuradosFromRaw(rawTeam: any): JuradoInfo[] {
  const rawAssigned: any[] =
    rawTeam.juradosAsignados ??
    rawTeam.jurados ??
    rawTeam.assignedJurors ??
    rawTeam.jurors ??
    rawTeam.assigned_jurors ??
    [];

  if (!Array.isArray(rawAssigned) || rawAssigned.length === 0) return [];

  return rawAssigned.map((raw: any) => {
    const name = raw.nombre ?? raw.name ?? raw.fullName ?? raw.email ?? "Jurado";
    const category: string | null =
      raw.jurorCategory ?? raw.categoria_jurado ?? raw.categoria ?? null;
    const categoryLabel =
      category === "JUNIOR" ? "Junior" : category === "SENIOR" ? "Senior" : null;

    return {
      id: String(raw.id ?? raw.jurorId ?? raw.email ?? Math.random()),
      name,
      jurorCategory: categoryLabel,
    };
  });
}

export default function MisJuradosPage() {
  const { user } = useAuth();
  const [jurados, setJurados] = useState<JuradoInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const controller = new AbortController();
    const base = import.meta.env.VITE_ENDPOINT_BACKEND;

    const fetchJurados = async () => {
      try {
        // 1. Obtener el equipo del estudiante para conseguir su ID
        const teamsRes = await fetch(`${base}/teams`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });
        if (!teamsRes.ok) return;

        const teamsData = await teamsRes.json();
        const teamsArray: any[] = Array.isArray(teamsData)
          ? teamsData
          : (teamsData?.data ?? []);

        const myTeam = teamsArray.find(
          (t: any) => String(t.userId) === String(user.id)
        );
        if (!myTeam) return;

        // 2. Intentar obtener jurados desde evaluation-tracking
        const trackRes = await fetch(`${base}/juror/evaluation-tracking`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        if (trackRes.ok) {
          const trackData = await trackRes.json();
          const allTeams: any[] = Array.isArray(trackData)
            ? trackData
            : (trackData?.data ?? trackData?.teams ?? []);

          const matchedTeam = allTeams.find(
            (t: any) =>
              Number(t.id ?? t.teamId ?? t.id_equipo) === Number(myTeam.id)
          );

          if (matchedTeam) {
            setJurados(extractJuradosFromRaw(matchedTeam));
            return;
          }
        }

        // 3. Fallback: extraer del objeto de /teams si el backend los incluye
        setJurados(extractJuradosFromRaw(myTeam));
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error al obtener jurados asignados:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJurados();
    return () => controller.abort();
  }, [user?.id]);

  const breadcrumbs = [{ label: "Mis Jurados", href: "/mis-jurados" }];

  if (loading) {
    return <LoadingScreen text="Cargando jurados asignados..." />;
  }

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <Card className="w-full shadow-sm border">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl font-medium text-foreground flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mis Jurados
            </CardTitle>
            <CardDescription className="text-sm text-foreground/50">
              Jurados asignados para evaluar a tu equipo.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {jurados.length === 0 ? (
              <p className="text-sm text-foreground/60">
                Aún no tienes jurados asignados a tu equipo.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {jurados.map((jurado) => (
                  <div
                    key={jurado.id}
                    className="flex items-center gap-3 rounded-xl border border-border p-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                      {getInitials(jurado.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{jurado.name}</div>
                      {jurado.jurorCategory && (
                        <div className="text-xs text-foreground/50 mt-0.5">
                          {jurado.jurorCategory}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutAplication>
  );
}
