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
          className="relative bg-[#181a20] text-white rounded-2xl w-[90%] max-w-4xl h-[600px] max-h-[600px] shadow-2xl border border-[#AC7CFF]/30 overflow-hidden"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          {/* Botón de cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col md:flex-row h-full">
            {/* Imagen - lado izquierdo fijo */}
            <div className="md:w-1/3 p-6 flex-shrink-0">
              <img
                src={team.image || "/placeholder.svg"}
                alt={team.gameName}
                className="rounded-xl w-full h-full object-cover max-h-[550px]"
              />
            </div>
            
            {/* Contenido - lado derecho con scroll */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-6 pt-12 md:pt-6 overflow-y-auto flex-1
                [&::-webkit-scrollbar]:w-2 pr-2
                [&::-webkit-scrollbar-track]:rounded-full
                [&::-webkit-scrollbar-track]:bg-gray-800
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:bg-[#AC7CFF]/50
                [&::-webkit-scrollbar-thumb:hover]:bg-[#AC7CFF]">
              
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-[#AC7CFF]">{team.gameName}</h2>
                <p className="text-lg">Equipo: <span className="font-semibold">{team.teamName}</span></p>
                <p className="text-sm text-gray-400">
                  Estado:{" "}
                  <span className="font-semibold capitalize">{team.status}</span>
                </p>
                
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-[#AC7CFF] mb-3">Descripción</h3>
                  <p className="text-gray-300 leading-relaxed">
                    🎮 Este videojuego participa en la competencia oficial. 
                    Aquí puedes ver más información del equipo, integrantes y progreso.
                  </p>
                </div>

                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-[#AC7CFF] mb-3">Integrantes del Equipo</h3>
                  <div className="space-y-2">
                    <p className="text-gray-300">• Juan Pérez - Desarrollador</p>
                    <p className="text-gray-300">• María González - Diseñadora</p>
                    <p className="text-gray-300">• Carlos Rodríguez - Programador</p>
                    <p className="text-gray-300">• Ana López - Artist</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-[#AC7CFF] mb-3">Tecnologías Utilizadas</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-[#AC7CFF]/20 text-[#AC7CFF] px-3 py-1 rounded-full text-sm">Unity</span>
                    <span className="bg-[#AC7CFF]/20 text-[#AC7CFF] px-3 py-1 rounded-full text-sm">C#</span>
                    <span className="bg-[#AC7CFF]/20 text-[#AC7CFF] px-3 py-1 rounded-full text-sm">Blender</span>
                    <span className="bg-[#AC7CFF]/20 text-[#AC7CFF] px-3 py-1 rounded-full text-sm">Photoshop</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-8 pb-4">
                  <Button variant="default" className="bg-[#AC7CFF] hover:bg-[#945EFF]">
                    Ver más detalles
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Cerrar
                  </Button>
                </div>
              </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default GameDetailModal;
