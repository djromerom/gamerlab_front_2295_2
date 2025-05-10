"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom"; // Importa useNavigate
import { Button } from "@/components/grupo 8/boton"; // Importa el componente de botón reutilizable

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
    imagen?: string; // logo del juego
    isEvaluated: boolean; // Indica si el juego ya ha sido calificado
  };
}

const GameModal: React.FC<GameModalProps> = ({ open, onClose, game }) => {
  const navigate = useNavigate(); // Inicializa useNavigate

  if (!game) return null;

  const handleCalificarClick = () => {
    navigate(`/pendientes-calificar/${game.id}`, { state: { game } }); // Navega a la página de calificación con los datos del juego
    onClose(); // Cierra el modal después de navegar
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-[#1a1a2e] text-black dark:text-white max-w-md w-full rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-4">
            {game.nombre}
          </DialogTitle>
          {/* Botón de salida */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Cerrar"
          >
            
          </button>
        </DialogHeader>

        {/* Contenedor de contenido + imagen */}
        <div className="flex justify-between gap-4 text-sm">
          {/* Información del juego */}
          <div className="space-y-1 flex-1">
            <p>
              <strong>Equipo:</strong> {game.equipo}
            </p>
            <p>
              <strong>Materia:</strong> {game.materia}
            </p>
            <p>
              <strong>NRC:</strong> {game.nrc}
            </p>
            <p>
              <strong>Participantes:</strong> {game.participantes.join(", ")}
            </p>
            <p>
              <strong>Descripción:</strong> {game.descripcion}
            </p>
          </div>

          {/* Logo del juego */}
          {game.imagen && (
            <div className="shrink-0 px-3">
              <img
                src={game.imagen}
                alt="Logo del juego"
                className="w-30 h-30 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
              />
            </div>
          )}
        </div>

        {/* Botón de calificar */}
        <div className="pt-4 flex justify-end px-5">
          <Button
            size="sm"
            className={`px-7 py-2 text-lg font-bold shadow-md rounded-md ${game.isEvaluated
                ? "bg-gray-700 hover:bg-gray-700 text-white cursor-not-allowed"
                : "bg-[#6644ff] hover:bg-[#5a3be5] dark:bg-[#b3bcff] dark:text-[#1a1a2e] dark:hover:bg-[#b3c7ff] text-white"
              }`}
            onClick={() => !game.isEvaluated && handleCalificarClick()} // Solo permite clic si no está evaluado
            disabled={game.isEvaluated} // Deshabilita el botón si está evaluado
          >
            {game.isEvaluated ? "Calificado" : "Calificar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameModal;