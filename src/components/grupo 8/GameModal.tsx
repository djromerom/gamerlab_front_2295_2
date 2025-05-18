"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/grupo 8/boton"; // Asegúrate que esta ruta es correcta

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
    comments?: string;
  };
  showTotalScore?: boolean;
  showComments?: boolean;
}

const GameModal: React.FC<GameModalProps> = ({
  open,
  onClose,
  game,
  showComments = false,
}) => {
  const navigate = useNavigate();

  if (!game) return null;

  const handleCalificarClick = () => {
    navigate(`/pendientes-calificar/${game.id}`, { state: { game } });
    onClose();
  };



  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="bg-white dark:bg-[#18182A] text-gray-900 dark:text-white max-w-lg w-full rounded-lg p-6 shadow-xl border border-gray-200 dark:border-gray-700"
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
            className={`px-6 py-2 text-base font-semibold rounded-md shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 
              ${
                game.isEvaluated
                  ? "bg-gray-500 hover:bg-gray-400 text-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-300 cursor-not-allowed focus:ring-gray-500 dark:focus:ring-gray-600 focus:ring-offset-white dark:focus:ring-offset-[#18182A]"
                  : "bg-blue-600 hover:bg-blue-700 text-white dark:bg-[#7B6CF0] dark:hover:bg-[#6a5acd] dark:text-white focus:ring-blue-600 dark:focus:ring-[#7B6CF0] focus:ring-offset-white dark:focus:ring-offset-[#18182A]"
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