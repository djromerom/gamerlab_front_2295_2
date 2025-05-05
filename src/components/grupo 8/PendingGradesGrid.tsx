"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/grupo 8/boton"
import { Input } from "@/components/grupo 8/input"
import { Link } from 'react-router-dom';
import { useNavigate } from "react-router-dom"; // Importa useNavigate




// Iconos simples usando SVG en lugar de Lucide
const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-gray-400"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
)

// Icono de exclamación invertida (¡) en círculo
const InfoIcon = () => ( // Cambiado el nombre para mayor claridad
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-white" // Puedes ajustar o quitar esta clase según necesites
  >
    {/* Círculo exterior (sin cambios) */}
    <circle cx="12" cy="12" r="10"></circle>

    {/* Punto de la exclamación invertida (¡) - Ahora arriba */}
    <line x1="12" y1="8" x2="12.01" y2="8"></line>

    {/* Línea vertical de la exclamación invertida (¡) - Ahora abajo */}
    <line x1="12" y1="12" x2="12" y2="16"></line>
  </svg>
)
// Icono de flecha hacia abajo (como < pero rotado)
const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-white"
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
)

// Tipo para los datos de los juegos
interface Game {
  id: string
  equipo: string
  materia: string
  nrc: string
  participantes: string[]
  imagen?: string
}

interface PendingGamesGridProps {
  games: Game[]
}

export const PendingGamesGrid: React.FC<PendingGamesGridProps> = ({
  games = [], // Valor por defecto para evitar errores si no se pasan datos
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const navigate = useNavigate(); // Inicializa useNavigate
  
  const handleCalificarClick = (game: Game) => {
    // Excluye la imagen al enviar los datos
    const { imagen, ...gameWithoutImage } = game;
    navigate(`/pendientes-calificar/${game.id}`, { state: { game: gameWithoutImage } }); // Pasa los datos del juego sin la imagen
  };

  // Filtrar juegos basados en la búsqueda
  const filteredGames = games.filter(
    (game) =>
      game.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.equipo.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Manejar el toggle del dropdown manualmente
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  // Función temporal para el botón de información
  const handleInfoClick = (gameId: string) => {
    console.log(`Mostrar información para ${gameId}`)
    // Aquí irá la funcionalidad que se implementará más adelante
  }


  return (
    <div className="flex flex-col w-full bg-white text-black dark:bg-[#0a0a0a] dark:text-white">
      {/* Barra de búsqueda y filtros - reducido el espacio vertical */}
      <div className="flex items-center justify-end mb-4 px-5 ">
        <div className="flex gap-3">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ">
              <SearchIcon />
            </div>
            <Input
              placeholder="Busca un equipo"
              className="w-80 bg-[#1a1a2e] text-black pl-10 h-9 rounded-lg border border-[#4d5474]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="relative">
            <Button
              variant="outline"
              className="bg-[#1a1a2e] border border-[#4d5474] text-white h-9 flex items-center justify-center gap-1 px-4"
              onClick={toggleDropdown}
            >
              <ChevronDownIcon />
              <span>Filtrar</span>
            </Button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-[#1a1a2e] text-white z-10">
                <div className="py-1">
                  <div
                    className="block px-4 py-2 text-sm hover:bg-[#2a2a40] cursor-pointer"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Por equipo
                  </div>
                  <div
                    className="block px-4 py-2 text-sm hover:bg-[#2a2a40] cursor-pointer"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Por materia
                  </div>
                  <div
                    className="block px-4 py-2 text-sm hover:bg-[#2a2a40] cursor-pointer"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Por NRC
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid de juegos - aumentado el espaciado entre tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5">
        {filteredGames.map((game, index) => (
          <div key={`${game.id}-${index}`} className="bg-gray-100 dark:bg-[#1a1a2e] rounded-2xl p-5 flex flex-col">
            {/* Contenido principal de la tarjeta */}
            <div className="flex justify-between mb-4">
              {/* Información del juego */}
              <div className="flex justify-between mb-4">
               <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold">{game.id}</h3>
                <p className="text-sm"><span className="text-gray-400">Equipo:</span> {game.equipo}</p>
                <p className="text-sm"><span className="text-gray-400">Materia:</span> {game.materia}</p>
                <p className="text-sm"><span className="text-gray-400">Nrc:</span> {game.nrc}</p>
                <p className="text-sm"><span className="text-gray-400">Participantes:</span> {game.participantes.join(", ")}</p>
                </div>
            </div>

              {/* Imagen del juego - círculo más grande y más a la izquierda */}
              <div className="w-28 h-28 bg-gray-300 rounded-full flex-shrink-0 mr-6 mt-4">

                {game.imagen ? (
                  <img
                    src={game.imagen || "/placeholder.svg"}
                    alt={`${game.id} thumbnail`}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : null}
              </div>
            </div>

            {/* Barra inferior con botones */}
            <div className="flex justify-between mt-auto pt-2">
              {/* Botón de información (izquierda) - cambiado a icono "i" */}
              <button
                onClick={() => handleInfoClick(game.id)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2a2a40] hover:bg-[#3a3a50] transition-colors"
                aria-label="Información"
              >
                <InfoIcon />
              </button>

              {/* Botón de calificar (derecha) - centrado con el círculo */}
              <div className="flex justify-end mt-auto pt-2">
              <Button
              size="sm"
              className="px-7 py-2 text-lg bg-[#b3c7ff] hover:bg-[#a0b8ff] border-none text-[#110d20] font-bold shadow-md rounded-md"
              onClick={() => handleCalificarClick(game)} // Llama a la función con los datos del juego
               >
              Calificar
              </Button>
             </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje si no hay juegos */}
      {filteredGames.length === 0 && (
        <div className="flex justify-center items-center h-40 text-gray-400">
          No hay juegos pendientes por calificar
        </div>
      )}
    </div>
  )
}
