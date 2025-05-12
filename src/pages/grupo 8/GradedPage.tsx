import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import { PendingGamesGrid } from "@/components/grupo 8/PendingGradesGrid";
import { useEffect, useState } from "react";

// Tipo para los datos del videojuego
interface VideogameDetails {
  videogameId: number;
  videogameName: string;
  logoUrl: string;
  teamName: string;
  members: { fullName: string }[];
  nrc: string | null;
  subject: string | null;
  descripcion: string | null;
  isEvaluated: boolean; // Nuevo campo
}

const GradedPage: React.FC = () => {
  const breadcrumbs = [{ label: "Juegos calificados", href: "/calificados" }];
  const [videogames, setVideogames] = useState<VideogameDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideogames = async () => {
      try {
        const response = await fetch(`http://localhost:3000/pending-games`, {
          method: "GET",
          credentials: "include", // Incluye cookies si es necesario
        });
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        console.log(data); // Verifica los datos recibidos
        setVideogames(data.data);
        setLoading(false);
      } catch (error) {
        console.error(
          "Error al cargar los detalles de los videojuegos:",
          error
        );
        setLoading(false);
      }
    };

    fetchVideogames();
  }, []);

  // Filtrar solo los juegos que ya han sido calificados
  const gradedGames = videogames.filter((videogame) => videogame.isEvaluated);

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {loading ? (
        <div className="flex justify-center items-center h-screen text-black dark:text-white ">
          <p>Cargando juegos calificados...</p>
        </div>
      ) : (
        <PendingGamesGrid
          games={gradedGames.map((videogame) => ({
            id: videogame.videogameId,
            nombre: videogame.videogameName,
            equipo: videogame.teamName,
            materia: videogame.subject || "Sin materia",
            nrc: videogame.nrc || "Sin NRC",
            participantes: videogame.members.map((member) => member.fullName),
            imagen: videogame.logoUrl,
            descripcion: videogame.descripcion || "Sin descripción", // Incluye la descripción
            isEvaluated: videogame.isEvaluated, // Pasa el valor de isEvaluated
          }))}
        />
      )}
    </LayoutAplication>
  );
};

export default GradedPage;
