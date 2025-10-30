import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";

interface GameDetailModalProps {
  team: {
    gameName: string;
    teamName: string;
    status: string;
    image?: string;
  };
  onClose: () => void;
}

function GameDetailModal({ team, onClose }: GameDetailModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative bg-[#181a20] text-white rounded-2xl p-6 w-[90%] max-w-3xl shadow-2xl border border-[#AC7CFF]/30"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          {/* Botón de cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col md:flex-row gap-6">
            <img
              src={team.image || "/placeholder.svg"}
              alt={team.gameName}
              className="rounded-xl w-full md:w-1/3 object-cover"
            />
            <div className="flex-1 space-y-3">
              <h2 className="text-3xl font-bold text-[#AC7CFF]">{team.gameName}</h2>
              <p className="text-lg">Equipo: <span className="font-semibold">{team.teamName}</span></p>
              <p className="text-sm text-gray-400">
                Estado:{" "}
                <span className="font-semibold capitalize">{team.status}</span>
              </p>
              <p className="mt-4 text-gray-300">
                🎮 Este videojuego participa en la competencia oficial. 
                Aquí puedes ver más información del equipo, integrantes y progreso.
              </p>
              <div className="flex gap-3 mt-5">
                <Button variant="default" className="bg-[#AC7CFF] hover:bg-[#945EFF]">
                  Ver más detalles
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
