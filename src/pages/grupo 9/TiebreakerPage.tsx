"use client";
import { useState, useEffect } from "react";
import { useFetch } from "@/hooks/useFetch";
import LayoutAplication from "@/layouts/LayoutAplication";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast, Toaster } from "sonner";
import { ArrowUpDown, Save, X } from "lucide-react";

interface Team {
  id: number;
  teamName: string;
  teamCode: string;
  gameName: string;
  averageScore: number;
  position: number;
  semester: string;
  tiebreakerScore?: number;
}

export default function TiebreakerPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSemester, setActiveSemester] = useState<string>("all");
  const customFetch = useFetch();

  const getSemesterFromTeamCode = (teamCode?: string): string | null => {
    if (!teamCode) return null;
    const match = teamCode.match(/^[Nn](\d+)/);
    return match ? match[1] : null;
  };

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const response = await customFetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/reports/videojuegoData`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        const formattedTeams: Team[] = data.map((item: any) => ({
          id: item.id,
          teamName: item.nombre,
          teamCode: item.codigoEquipo || "",
          gameName: item.nombre,
          averageScore: parseFloat(item.promedio) || 0,
          position: 0, // Se asignará por semestre
          semester: getSemesterFromTeamCode(item.codigoEquipo) || "0",
          tiebreakerScore: item.tiebreakerScore || 999,
        }));

        setTeams(formattedTeams);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Error al cargar los equipos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const filteredTeams = teams.filter((team) => {
    if (activeSemester === "all") return true;
    if (activeSemester === "colegio") {
      return !team.semester || team.semester === "0";
    }
    return team.semester === activeSemester;
  });

  // Ordenar y asignar posiciones por semestre
  const teamsWithPositions = filteredTeams
    .sort((a, b) => {
      // Ordenar por promedio descendente
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      }
      // Si tienen el mismo promedio, ordenar por tiebreaker ascendente (menor es mejor)
      return (a.tiebreakerScore || 0) - (b.tiebreakerScore || 0);
    })
    .map((team, index) => ({
      ...team,
      position: index + 1,
    }));

  const handleTiebreakerChange = (teamId: number, value: string) => {
    const numValue = parseInt(value) || 999;
    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamId ? { ...team, tiebreakerScore: numValue } : team
      )
    );
  };

  const ignoreEntireTie = async (tiedTeamIds: number[]) => {
    try {
      // Primero actualizar el estado local
      setTeams((prev) =>
        prev.map((team) =>
          tiedTeamIds.includes(team.id) ? { ...team, tiebreakerScore: 999 } : team
        )
      );

      // Actualizar cada equipo individualmente
      const updatePromises = tiedTeamIds.map(id =>
        customFetch(
          `${import.meta.env.VITE_ENDPOINT_BACKEND}/teams/${id}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tiebreakerScore: 999 }),
          }
        )
      );

      const responses = await Promise.all(updatePromises);
      const allSuccessful = responses.every(r => r.ok);

      if (allSuccessful) {
        toast.success("Empate ignorado");
        await fetchTeams();
      } else {
        toast.error("Error al ignorar el empate");
        fetchTeams();
      }
    } catch (error) {
      console.error("Error ignoring entire tie:", error);
      toast.error("Error de conexión");
      fetchTeams();
    }
  };

  const saveTiebreakers = async () => {
    setSaving(true);
    try {
      // Actualizar cada equipo individualmente
      const updatePromises = teams.map((team) =>
        customFetch(
          `${import.meta.env.VITE_ENDPOINT_BACKEND}/teams/${team.id}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tiebreakerScore: team.tiebreakerScore || 999 }),
          }
        )
      );

      const responses = await Promise.all(updatePromises);
      const allSuccessful = responses.every(r => r.ok);

      if (allSuccessful) {
        toast.success("Puntuaciones de desempate guardadas exitosamente");
        fetchTeams();
      } else {
        toast.error("Error al guardar las puntuaciones");
      }
    } catch (error) {
      console.error("Error saving tiebreakers:", error);
      toast.error("Error de conexión al guardar");
    } finally {
      setSaving(false);
    }
  };

  // Agrupar equipos con el mismo promedio
  const groupedByScore = teamsWithPositions.reduce((acc, team) => {
    const score = team.averageScore.toFixed(2);
    if (!acc[score]) {
      acc[score] = [];
    }
    acc[score].push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  const tiedGroups = Object.entries(groupedByScore).filter(
    ([_, teams]) => teams.length > 1
  );

  // Si el filtro es "all", solo mostrar grupos empatados
  const displayTeams = activeSemester === "all" ? [] : teamsWithPositions;

  return (
    <LayoutAplication
      breadcrumbs={[
        { label: "Inicio", href: "/inicio" },
        { label: "Tiebreaker", href: "/tiebreaker" },
      ]}
    >
      <Toaster richColors />
      {loading ? (
        <div className="flex items-center justify-center py-12 px-6">
          <p className="text-muted-foreground">Cargando equipos...</p>
        </div>
      ) : (
        <div className="space-y-6 px-6 py-4">
          {/* Header con botón de guardar */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Gestión de Desempates</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Asigna puntuaciones de desempate para equipos con el mismo promedio
              </p>
            </div>
            <Button onClick={saveTiebreakers} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>

          {/* Filtros de semestre */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeSemester === "all" ? "default" : "outline"}
              onClick={() => setActiveSemester("all")}
              size="sm"
            >
              Todos
            </Button>
            {[1, 2, 3, 4].map((sem) => (
              <Button
                key={sem}
                variant={activeSemester === sem.toString() ? "default" : "outline"}
                onClick={() => setActiveSemester(sem.toString())}
                size="sm"
              >
                Semestre {sem}
              </Button>
            ))}
            <Button
              variant={activeSemester === "colegio" ? "default" : "outline"}
              onClick={() => setActiveSemester("colegio")}
              size="sm"
            >
              Colegios
            </Button>
          </div>

          {/* Equipos Empatados */}
          {tiedGroups.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5" />
                <h3 className="text-lg font-semibold">
                  Equipos Empatados ({tiedGroups.length} {tiedGroups.length === 1 ? 'grupo' : 'grupos'})
                </h3>
              </div>
              
              {tiedGroups.map(([score, tiedTeams]) => (
                <div key={score} className="border rounded-lg p-4 bg-muted/30 relative">
                  <div className="flex items-center justify-between mb-3 pb-3 border-b">
                    <h4 className="font-semibold">Promedio: {score}</h4>
                    <span className="text-sm text-muted-foreground">
                      {tiedTeams.length} {tiedTeams.length === 1 ? 'equipo' : 'equipos'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {tiedTeams.map((team) => (
                      <div
                        key={team.id}
                        className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 p-3 rounded bg-background border"
                      >
                        <div>
                          <p className="font-medium">{team.gameName}</p>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs mr-1">
                              {team.teamCode}
                            </span>
                            {team.teamName}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`tiebreaker-${team.id}`} className="text-sm">
                            Puntuación de desempate
                          </Label>
                          <Input
                            id={`tiebreaker-${team.id}`}
                            type="text"
                            value={team.tiebreakerScore || 999}
                            onChange={(e) =>
                              handleTiebreakerChange(team.id, e.target.value)
                            }
                            className="h-9"
                            placeholder="999"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => ignoreEntireTie(tiedTeams.map(t => t.id))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Ignorar empate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Todos los Equipos */}
          {displayTeams.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Todos los Equipos ({displayTeams.length})
              </h3>
              <div className="space-y-2">
                {displayTeams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center gap-4 p-3 rounded border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex-shrink-0">
                      #{team.position}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{team.gameName}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs mr-1">
                          {team.teamCode}
                        </span>
                        {team.teamName}
                      </p>
                    </div>
                    <div className="text-right text-sm flex-shrink-0">
                      <p>
                        <span className="text-muted-foreground">Promedio:</span>{" "}
                        <span className="font-semibold">{team.averageScore.toFixed(2)}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Desempate: {team.tiebreakerScore || 999}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </LayoutAplication>
  );
}
