"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  formatScore,
  type GradedCriterion,
} from "@/features/grading/lib/gradedGames";

interface GameModalProps {
  open: boolean;
  onClose: () => void;
  game: {
    id: number;
    nombre: string;
    equipo: string;
    materia: string;
    nrc: string;
    participantes: string[];
    descripcion: string;
    imagen?: string;
    isEvaluated: boolean;
    totalScore?: number;
    comments?: string;
    criteria?: GradedCriterion[];
  };
  showTotalScore?: boolean;
  showComments?: boolean;
  // Navegación de la pantalla que abre el modal (cada rol califica en su propia ruta)
  onCalificar?: () => void;
}

const GameModal: React.FC<GameModalProps> = ({
  open,
  onClose,
  game,
  showTotalScore = false,
  showComments = false,
  onCalificar,
}) => {
  const navigate = useNavigate();

  if (!game) return null;

  const handleCalificarClick = () => {
    if (onCalificar) {
      onCalificar();
    } else {
      navigate(`/pendientes-calificar/${game.id}`, { state: { game } });
    }
    onClose();
  };



  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="bg-card text-foreground max-w-lg w-full rounded-lg p-6 shadow-xl border "
      >
        <DialogHeader className="relative mb-1">
          <DialogTitle className="text-3xl font-bold text-left leading-tight text-gray-900 dark:text-white">
            {game.nombre.toUpperCase()}
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute top-0 right-0 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
            aria-label="Cerrar"
          >
          
          </button>
        </DialogHeader>

        <div className="mt-4 ">
          <div className="flex flex-row">
            <div className="flex-grow space-y-0.5 text-sm leading-snug text-gray-700 dark:text-gray-300">
              <p>
                <strong>Equipo:</strong> {game.equipo}
              </p>
              <p>
                <strong>Materia:</strong> {game.materia}
              </p>
              <p>
                <strong>Nrc:</strong> {game.nrc}
              </p>
              <p>
                <strong>Participantes:</strong> {game.participantes.join(", ")}
              </p>
            </div>

            {game.imagen ? (
              <div className="flex-shrink-0">
                <img
                  src={game.imagen}
                  alt={`Logo de ${game.nombre}`}
                  className="w-28 h-28 rounded-full object-cover bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600"
                />
              </div>
            ) : (
              // Placeholder si no hay imagen
              <div className="flex-shrink-0">
                <div className="w-28 h-28 rounded-full bg-gray-300 dark:bg-gray-500 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                  {/* Opcional: Iniciales o un icono genérico */}
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm leading-snug text-gray-700 dark:text-gray-300">
              <strong>Descripción:</strong> {game.descripcion}
            </p>
          </div>

          {/* ARK-264: el detalle de un juego calificado muestra la nota y los criterios */}
          {showTotalScore && game.isEvaluated && (
            <div className="mt-3 rounded-md border p-3 text-sm text-gray-700 dark:text-gray-300">
              <p>
                <strong>Nota:</strong> {formatScore(game.totalScore)}
              </p>
              {game.criteria && game.criteria.length > 0 && (
                <ul aria-label="Puntaje por criterio" className="mt-2 space-y-0.5">
                  {game.criteria.map((criterion) => (
                    <li key={criterion.criterionId} className="flex justify-between gap-4">
                      <span>{criterion.name}</span>
                      <span className="font-medium">{formatScore(criterion.score)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {showComments && game.comments && (
            <div>
              <p className="text-sm leading-snug text-gray-700 dark:text-gray-300">
                <strong>Comentarios:</strong> {game.comments}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            size="sm"
            className={`px-6 py-2 text-base font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 
              ${
                game.isEvaluated
                  ? "disabled:bg-[var(--graded)] hover:bg-gray-700 text-foreground cursor-not-allowed"
                  : "bg-[var(--selected)] hover:bg-[var(--selected-hover)] text-[var(--selected-foreground)] shadow-md cursor-pointer"
              }`}
            onClick={() => !game.isEvaluated && handleCalificarClick()}
            disabled={game.isEvaluated}
          >
            {game.isEvaluated ? "Calificado" : "Calificar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameModal;