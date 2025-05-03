import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import { PendingGamesGrid } from "@/components/grupo 8/PendingGradesGrid";
import { useEffect, useState } from "react";

// Tipo para los datos de los juegos
interface Game {
    id: string
    equipo: string
    materia: string
    nrc: string
    participantes: string[]
    imagen?: string
  }
  
  // Datos de ejemplo para mostrar mientras se conecta con la API
  const mockGames: Game[] = [
    {
      id: "JUEGO1000",
      equipo: "Thunders",
      materia: "Estructura de Datos 1",
      nrc: "2287",
      participantes: ["Juan A", "Fernando R", "Alejandro V", "Juliana M"],
    },
    {
      id: "JUEGO1000",
      equipo: "Thunders",
      materia: "Estructura de Datos 1",
      nrc: "2287",
      participantes: ["Juan A", "Fernando R", "Alejandro V", "Juliana M"],
    },
    {
      id: "JUEGO2000",
      equipo: "Thunders",
      materia: "Estructura de Datos 2",
      nrc: "2287",
      participantes: ["Juan A", "Fernando R", "Alejandro V", "Juliana M"],
    },
    {
      id: "JUEGO3000",
      equipo: "Thunders",
      materia: "Estructura de Datos 1",
      nrc: "2287",
      participantes: ["Juan A", "Fernando R", "Alejandro V", "Juliana M"],
    },
    {
      id: "JUEGO1000",
      equipo: "Thunders",
      materia: "Estructura de Datos 1",
      nrc: "2287",
      participantes: ["Juan A", "Fernando R", "Alejandro V", "Juliana M"],
    },
    {
      id: "JUEGO1000",
      equipo: "Thunders",
      materia: "Estructura de Datos 1",
      nrc: "2287",
      participantes: ["Juan A", "Fernando R", "Alejandro V"],
    },
  ]
  

const PendingGradesPage: React.FC = () => {
  const breadcrumbs = [{ label: "Pendientes por calificar", href: "/pendientes-calificar" }];
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Aquí puedes hacer la llamada a tu API para obtener los juegos pendientes
    // Por ahora usamos los datos de ejemplo
    const fetchGames = async () => {
      try {
        // Simulamos una llamada a API
        // const response = await fetch('tu-api/games/pending');
        // const data = await response.json();
        // setGames(data);

        // Usando datos de ejemplo por ahora
        setTimeout(() => {
          setGames(mockGames)
          setLoading(false)
        }, 500) // Simulamos un pequeño retraso de carga
      } catch (error) {
        console.error("Error al cargar los juegos:", error)
        setLoading(false)
      }
    }

    fetchGames()
  }, [])
  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
     <PendingGamesGrid games={games} />    
    </LayoutAplication>
  );
};


export default PendingGradesPage;