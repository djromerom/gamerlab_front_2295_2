"use client";

import GameModal from "@/components/grupo 8/GameModal";
import { Input } from "@/components/grupo 8/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
    className="text-foreground"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

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
    className="text-foreground"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
    <line x1="12" y1="12" x2="12" y2="16"></line>
  </svg>
);

interface Game {
  id: number;
  nombre: string;
  equipo: string;
  teamId?: number; // HU-19: para verificar el grupo antes de calificar
  teamCode?: string; // [MODIFICACIÓN]: Código de equipo
  materia: string;
  nrc: string;
  participantes: string[];
  imagen?: string;
  descripcion: string;
  isEvaluated: boolean;
  totalScore?: number;
  comments?: string;
}

interface PendingGamesGridProps {
  games: Game[];
  showTotalScore?: boolean;
  showComments?: boolean;
  onSearch?: (query: string) => void;
  isSearching?: boolean;
  searchQuery?: string;
  page?: string;
  selectedGameIds?: Set<number>;
  onToggleSelection?: (gameId: number) => void;
}

export const PendingGamesGrid: React.FC<
  PendingGamesGridProps & { jurorId?: string }
> = ({
  games = [],
  jurorId,
  showTotalScore,
  showComments,
  onSearch,
  isSearching,
  searchQuery = "",
  page = "",
  selectedGameIds,
  onToggleSelection,
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setLocalQuery(searchQuery || "");
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  };

  const handleSearch = () => {
    if (onSearch) onSearch(localQuery);
  };

  const handleCalificarClick = (game: Game) => {
    navigate(`${page}/${game.id}`, { state: { game, jurorId } });
  };

  const handleOpenModal = (game: Game) => {
    setSelectedGame(game);
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col w-full bg-background text-foreground">
      {/* Barra de búsqueda y botón de buscar */}
      <div className="flex items-center justify-end mb-4 px-5 ">
        <div className="flex gap-3">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground">
              <SearchIcon />
            </div>
            <Input
              placeholder="Buscar"
              className="w-full md:w-80 bg-card hover:bg-accent text-foreground cursor-pointer placeholder-foreground pl-10 h-9 rounded-lg border"
              value={localQuery}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </div>
          <Button
            variant="outline"
            className="bg-card hover:bg-accent text-foreground h-9 flex items-center justify-center gap-1 px-4 cursor-pointer"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <SearchIcon />
            )}
            <span>Buscar</span>
          </Button>
        </div>
      </div>
      {/* Grid de juegos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5">
        {games.map((game, index) => (
          <div
            key={`${game.nombre}-${index}`}
            className="bg-card border shadow-sm rounded-2xl p-5 flex flex-col"
          >
            <div className="flex justify-between mb-4">
              <div className="flex items-start gap-3">
                {/* [MODIFICACIÓN]: Checkbox para selección múltiple de juegos */}
                <input
                  type="checkbox"
                  checked={selectedGameIds?.has(game.id) ?? false}
                  onChange={() => onToggleSelection?.(game.id)}
                  className="mt-1 w-5 h-5 cursor-pointer accent-[var(--selected)] flex-shrink-0"
                  title="Seleccionar este juego para calificación en lote"
                />
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold">{game.nombre}</h3>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Equipo:</span>{" "}
                    {game.equipo}
                  </p>
                  {/* [MODIFICACIÓN]: Se extrae y visualiza el último fragmento del código del equipo */}
                  {game.teamCode && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Código:</span>{" "}
                      {game.teamCode.split("-").pop() || game.teamCode}
                    </p>
                  )}
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
                  {showTotalScore && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">
                        Puntaje Total:
                      </span>{" "}
                      {game.totalScore}
                    </p>
                  )}
                </div>
              </div>
              <div className="w-32 h-32 bg-gray-300 rounded-full flex-shrink-0 mr-6 mt-4">
                {game.imagen ? (
                  <img
                    src={game.imagen || "/placeholder.svg"}
                    alt={`${game.nombre} thumbnail`}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : null}
              </div>
            </div>
            <div className="flex justify-between mt-auto ">
              <button
                onClick={() => handleOpenModal(game)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-[#ccc8d3] dark:bg-[#2a2a40] hover:bg-[#ccc8d3] dark:hover:bg-[#3a3a50] transition-colors cursor-pointer"
                aria-label="Información"
              >
                <InfoIcon />
              </button>
              <div className="flex justify-end mt-auto pt-2 px-8">
                <Button
                  size="sm"
                  className={`px-7 py-2 text-sm rounded-md ${
                    game.isEvaluated
                      ? "disabled:bg-[var(--graded)] hover:bg-gray-700 text-foreground cursor-not-allowed"
                      : "bg-[var(--selected)] hover:bg-[var(--selected-hover)] text-[var(--selected-foreground)] cursor-pointer shadow-md"
                  }`}
                  onClick={() =>
                    !game.isEvaluated && handleCalificarClick(game)
                  }
                  disabled={game.isEvaluated}
                >
                  {game.isEvaluated ? "Calificado" : "Calificar"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {modalOpen && selectedGame && (
        <GameModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          game={selectedGame}
          showTotalScore={showTotalScore}
          showComments={showComments}
        />
      )}
    </div>
  );
};
