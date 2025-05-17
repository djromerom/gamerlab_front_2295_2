"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/grupo 8/boton";
import { Input } from "@/components/grupo 8/input";
import { useNavigate } from "react-router-dom"; // Importa useNavigate
import GameModal from "@/components/grupo 8/GameModal";

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
);

// Icono de exclamación invertida (¡) en círculo
const InfoIcon = () => (
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
    className="text-white" // Cambia el color del ícono en modo oscuro
  >
    {/* Círculo exterior */}
    <circle
      cx="12"
      cy="12"
      r="10"
      className="stroke-white" // Cambia el color del círculo en modo oscuro
    ></circle>

    {/* Punto de la exclamación invertida (¡) */}
    <line x1="12" y1="8" x2="12.01" y2="8"></line>

    {/* Línea vertical de la exclamación invertida (¡) */}
    <line x1="12" y1="12" x2="12" y2="16"></line>
  </svg>
);
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
    className="text-black dark:text-white"
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

// Tipo para los datos de los juegos
interface Game {
  id: number;
  nombre: string;
  equipo: string;
  materia: string;
  nrc: string;
  participantes: string[];
  imagen?: string;
  descripcion: string; // Nuevo campo
  isEvaluated: boolean; // Nuevo campo
}

interface PendingGamesGridProps {
  games: Game[];
}

export const PendingGamesGrid: React.FC<
  PendingGamesGridProps & { jurorId?: string }
> = ({
  games = [], // Valor por defecto para evitar errores si no se pasan datos
  jurorId,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sortedGames, setSortedGames] = useState<Game[]>(games); // Estado para los juegos ordenados
  const navigate = useNavigate(); // Inicializa useNavigate
  const [selectedGame, setSelectedGame] = useState(null); // Estado para el juego seleccionado
  const [modalOpen, setModalOpen] = useState(false);

  const handleCalificarClick = (game: Game) => {
    navigate(`/pendientes-calificar/${game.id}`, { state: { game, jurorId } });
  };

  // Función para ordenar los juegos
  const handleSort = (criteria: "equipo" | "nrc" | "materia") => {
    const sorted = [...games].sort((a, b) => {
      if (criteria === "nrc") {
        return parseInt(a.nrc) - parseInt(b.nrc); // Orden numérico para NRC
      } else {
        return a[criteria].localeCompare(b[criteria]); // Orden alfabético para equipo y materia
      }
    });
    setSortedGames(sorted);
    setIsDropdownOpen(false); // Cierra el dropdown después de ordenar
  };

  // Filtrar juegos basados en la búsqueda
  const filteredGames = sortedGames.filter(
    (game) =>
      game.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.equipo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Manejar el toggle del dropdown manualmente
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleOpenModal = (game: any) => {
    setSelectedGame(game);
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col w-full bg-background text-foreground">
      {/* Barra de búsqueda y filtros - reducido el espacio vertical */}
      <div className="flex items-center justify-end mb-4 px-5 ">
        <div className="flex gap-3">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ">
              <SearchIcon />
            </div>
            <Input
              placeholder="Busca un equipo"
              className="w-80 bg-[#1a1a2e] text-black dark:text-white placeholder-gray-400 pl-10 h-9 rounded-lg border border-[#4d5474]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="relative">
            <Button
              variant="outline"
              className="bg-[#1a1a2e] border border-[#4d5474] text-foreground h-9 flex items-center justify-center gap-1 px-4 dark:hover:bg-[#1a1a2e] cursor-pointer"
              onClick={toggleDropdown}
            >
              <ChevronDownIcon />
              <span>Filtrar</span>
            </Button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-background text-foreground z-10">
                <div className="py-1">
                  <div
                    className="block px-4 py-2 text-sm text-foreground hover:bg-[#f3f4f6] cursor-pointer dark:hover:bg-[#2a2a40]"
                    onClick={() => handleSort("equipo")}
                  >
                    Por equipo
                  </div>
                  <div
                    className="block px-4 py-2 text-sm text-foreground hover:bg-[#f3f4f6] cursor-pointer dark:hover:bg-[#2a2a40]"
                    onClick={() => handleSort("materia")}
                  >
                    Por materia
                  </div>
                  <div
                    className="block px-4 py-2 text-sm text-foreground hover:bg-[#f3f4f6] cursor-pointer dark:hover:bg-[#2a2a40]"
                    onClick={() => handleSort("nrc")}
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
          <div
            key={`${game.nombre}-${index}`}
            className="bg-gray-100 dark:bg-[#1a1a2e] rounded-2xl p-5 flex flex-col"
          >
            {/* Contenido principal de la tarjeta */}
            <div className="flex justify-between mb-4">
              {/* Información del juego */}
              <div className="flex justify-between mb-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold">{game.nombre}</h3>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Equipo:</span>{" "}
                    {game.equipo}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Materia:</span>{" "}
                    {game.materia}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Nrc:</span>{" "}
                    {game.nrc}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">
                      Participantes:
                    </span>{" "}
                    {game.participantes.join(", ")}
                  </p>
                </div>
              </div>

              {/* Imagen del juego - círculo más grande y más a la izquierda */}
              <div className="w-30 h-30 bg-gray-300 rounded-full flex-shrink-0 mr-6 mt-4">
                {game.imagen ? (
                  <img
                    src={game.imagen || "/placeholder.svg"}
                    alt={`${game.nombre} thumbnail`}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : null}
              </div>
            </div>

            {/* Barra inferior con botones */}
            <div className="flex justify-between mt-auto pt-2">
              {/* Botón de información (izquierda) */}
              <button
                onClick={() => handleOpenModal(game)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-[#ccc8d3] dark:bg-[#2a2a40] hover:bg-[#ccc8d3] dark:hover:bg-[#3a3a50] transition-colors cursor-pointer"
                aria-label="Información"
              >
                <InfoIcon />
              </button>

              {/* Botón de calificar (derecha) - centrado con el círculo */}
              <div className="flex justify-end mt-auto pt-2 px-8">     
                <Button
                  size="sm"
                  className={`px-7 py-2 text-lg font-bold rounded-md ${
                    game.isEvaluated
                      ? "disabled:bg-[var(--graded)] hover:bg-gray-700 text-foreground cursor-not-allowed"
                      : "bg-[var(--selected)] hover:bg-[var(--selected-hover)] text-[var(--selected-foreground)] shadow-md"
                  }`}
                  onClick={() =>
                    !game.isEvaluated && handleCalificarClick(game)
                  } // Solo permite clic si no está evaluado
                  disabled={game.isEvaluated} // Deshabilita el botón si está evaluado
                >
                  {game.isEvaluated ? "Calificado" : "Calificar"}
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
      {modalOpen && selectedGame && (
        <GameModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          game={selectedGame}
        />
      )}
    </div>
  );
};
