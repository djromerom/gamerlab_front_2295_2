// ViewTeams.tsx
"use client";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import NavBar from "@/components/grupo 5/NavBar";
import { useFetch } from "@/hooks/useFetch";

export type TeamStatus = "pendiente" | "confirmado" | "expirado";
export interface Team {
  id: number;
  gameName: string;
  teamName: string;
  image?: string;
  status: TeamStatus;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const customFetch = useFetch();

  useEffect(() => {
    async function fetchTeams() {
      setLoading(true);
      const res = await customFetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/videogames`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      const rawData = await res.json();
      interface RawTeam {
        id: number;
        name: string;
        teamName: string;
        status: string;
        logoUrl: string;
      }

      const data: Team[] = rawData.map((team: RawTeam) => ({
        id: team.id,
        gameName: team.name,
        teamName: team.teamName,
        status: team.status.toLowerCase() as TeamStatus,
        image: team.logoUrl,
      }));
      setTeams(data);
      setLoading(false);
    }
    fetchTeams();
  }, []);

  const filteredTeams = teams.filter(
    (team) =>
      team.gameName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.teamName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFilter = (value: string) => {
    setSearchQuery(value);
  };

  return (
    <main
      className="min-h-screen py-23 px-4 md:px-8 bg-black dark"
      style={{
        backgroundImage: "url('/background.webp')",
        backgroundSize: "150%",
        backgroundPosition: "center",
      }}
    >
      <NavBar />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-16 text-[#AC7CFF]">
          ¡Echa un vistazo a los equipos participantes!
        </h1>

        <Filters onFilter={handleFilter} initialFilter={searchQuery} />

        <div className="relative">
          {loading ? (
            <div className="text-center py-20 text-xl text-white animate-pulse">
              Cargando equipos...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

interface FiltersProps {
  onFilter: (value: string) => void;
  initialFilter: string;
}

function Filters({ onFilter, initialFilter }: FiltersProps) {
  const [filterText, setFilterText] = useState(initialFilter);

  return (
    <div className="flex justify-center items-center mb-10 gap-2">
      <div className="relative">
        <Search className="absolute z-10 w-4 left-3 top-1/2 -translate-y-1/2" />
        <Input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Busca por nombre de equipo"
          className="w-64 md:w-96 pl-10"
        />
      </div>
      <Button variant="outline" onClick={() => onFilter(filterText)}>
        Filtrar
      </Button>
    </div>
  );
}

interface TeamCardProps {
  team: Team;
}

function TeamCard({ team }: TeamCardProps) {
  const getStatusInfo = (status: TeamStatus) => {
    switch (status) {
      case "pendiente":
        return { text: "Pendiente de confirmación", color: "text-purple-400" };
      case "confirmado":
        return { text: "Inscripción completa", color: "text-blue-400" };
      case "expirado":
        return { text: "Rechazada", color: "text-red-400" };
    }
  };
  const { text, color } = getStatusInfo(team.status);

  return (
    <Card>
      <CardContent className="flex space-x-5 py-5 px-7">
        <Avatar className="w-20 h-20">
          <AvatarImage src={team.image} alt={team.teamName} />
          <AvatarFallback>{team.teamName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h4 className="text-xl font-medium">{team.gameName}</h4>
          <p>Equipo: {team.teamName}</p>
          <p className={`${color} font-semibold`}>{text}</p>
        </div>
      </CardContent>
    </Card>
  );
}
