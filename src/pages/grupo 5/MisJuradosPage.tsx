import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LayoutAplication from "@/layouts/LayoutAplication";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Users } from "lucide-react";
import LoadingScreen from "@/components/grupo 5/LoadingScreen";

interface JuradoInfo {
  id: string;
  name: string;
  email: string;
  status: string;
  hasEvaluated: boolean;
}

interface RawJuradoData {
  id?: string;
  nombre?: string;
  name?: string;
  correo?: string;
  email?: string;
  estado?: string;
  status?: string;
  videojuegosAsignados?: string[];
  assignedVideogames?: string[];
  videojuegosCompletos?: string[];
  completedVideogames?: string[];
}

const breadcrumbs = [
  {
    label: "Mis Jurados",
    href: "/mis-jurados",
  },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getAssignedGames(raw: RawJuradoData): string[] {
  if (Array.isArray(raw.videojuegosAsignados)) {
    return raw.videojuegosAsignados;
  }

  if (Array.isArray(raw.assignedVideogames)) {
    return raw.assignedVideogames;
  }

  return [];
}

function getCompletedGames(raw: RawJuradoData): string[] {
  if (Array.isArray(raw.videojuegosCompletos)) {
    return raw.videojuegosCompletos;
  }

  if (Array.isArray(raw.completedVideogames)) {
    return raw.completedVideogames;
  }

  return [];
}

function normalizeJurado(raw: RawJuradoData, videogameName: string): JuradoInfo {
  const completedGames = getCompletedGames(raw);

  return {
    id: String(raw.id ?? raw.correo ?? raw.email ?? crypto.randomUUID()),
    name: raw.nombre ?? raw.name ?? "Jurado sin nombre",
    email: raw.correo ?? raw.email ?? "",
    status: raw.estado ?? raw.status ?? "Sin estado",
    hasEvaluated: completedGames.includes(videogameName),
  };
}

function getTeamVideogameName(team: any): string | null {
  return (
    team?.videojuego?.nombre ??
    team?.videogame?.name ??
    team?.videogameName ??
    team?.videojuegoNombre ??
    null
  );
}

function isUserInTeam(team: any, userId: string, userEmail: string): boolean {
  const teamUserId =
    team?.userId ??
    team?.id_usuario ??
    team?.usuario?.id_usuario ??
    team?.user?.id ??
    "";

  if (userId && String(teamUserId) === String(userId)) {
    return true;
  }

  const members = team?.integrantes ?? team?.members ?? [];

  if (Array.isArray(members) && userEmail) {
    return members.some((member: any) => {
      const memberEmail = String(
        member?.correo ?? member?.email ?? "",
      ).toLowerCase();

      return memberEmail === userEmail.toLowerCase();
    });
  }

  return false;
}

export default function MisJuradosPage() {
  const { user } = useAuth() as any;

  const [jurados, setJurados] = useState<JuradoInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentGameName, setStudentGameName] = useState<string | null>(null);

  const apiBaseUrl = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;

  const userId = String(user?.id ?? user?.id_usuario ?? "");
  const userEmail = String(user?.email ?? user?.correo ?? "").toLowerCase();

  const pageDescription = useMemo(() => {
    if (studentGameName) {
      return `Jurados asignados a tu videojuego: ${studentGameName}`;
    }

    return "Jurados asignados para evaluar a tu equipo.";
  }, [studentGameName]);

  useEffect(() => {
    if (!userId && !userEmail) return;

    const controller = new AbortController();

    const fetchMisJurados = async () => {
      try {
        setLoading(true);

        const teamsRes = await fetch(`${apiBaseUrl}/teams`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        if (!teamsRes.ok) {
          setStudentGameName(null);
          setJurados([]);
          return;
        }

        const teamsData = await teamsRes.json();

        const teamsArray: any[] = Array.isArray(teamsData)
          ? teamsData
          : Array.isArray(teamsData?.data)
            ? teamsData.data
            : Array.isArray(teamsData?.items)
              ? teamsData.items
              : [];

        const myTeam = teamsArray.find((team: any) =>
          isUserInTeam(team, userId, userEmail),
        );

        if (!myTeam) {
          setStudentGameName(null);
          setJurados([]);
          return;
        }

        const myVideogameName = getTeamVideogameName(myTeam);

        if (!myVideogameName) {
          setStudentGameName(null);
          setJurados([]);
          return;
        }

        setStudentGameName(myVideogameName);

        const juradosRes = await fetch(`${apiBaseUrl}/reports/JuradosData`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          cache: "no-store",
        });

        if (!juradosRes.ok) {
          setJurados([]);
          return;
        }

        const juradosData = await juradosRes.json();

        const rawJurados: RawJuradoData[] = Array.isArray(juradosData)
          ? juradosData
          : [];

        const juradosAsignados = rawJurados
          .filter((jurado) => getAssignedGames(jurado).includes(myVideogameName))
          .map((jurado) => normalizeJurado(jurado, myVideogameName));

        setJurados(juradosAsignados);
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("Error cargando mis jurados:", error);
          setStudentGameName(null);
          setJurados([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMisJurados();

    return () => {
      controller.abort();
    };
  }, [apiBaseUrl, userId, userEmail]);

  if (loading) {
    return (
      <LayoutAplication breadcrumbs={breadcrumbs}>
        <LoadingScreen text="Cargando jurados asignados..." />
      </LayoutAplication>
    );
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
              {pageDescription}
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
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                        {getInitials(jurado.name) || "J"}
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {jurado.name}
                        </div>

                        {jurado.email && (
                          <div className="text-xs text-foreground/50 mt-0.5 truncate">
                            {jurado.email}
                          </div>
                        )}

                        {jurado.status && (
                          <div className="text-xs text-foreground/50 mt-0.5">
                            Estado: {jurado.status}
                          </div>
                        )}
                      </div>
                    </div>

                    {jurado.hasEvaluated ? (
                      <Badge className="flex items-center gap-1 bg-green-600 hover:bg-green-600 text-white">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Calificado
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Pendiente
                      </Badge>
                    )}
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