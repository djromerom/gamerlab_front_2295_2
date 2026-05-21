import { ExternalLink, Heart, Users, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";

import { Team } from "../../types/Team";
import { MediaCarousel } from "./MediaCarousel";

interface GameDetailModalProps {
  team: Team;
  onClose: () => void;
  onRefresh: () => void;
  liveCount?: number;
}

export function GameDetailModal({ team, onClose, onRefresh, liveCount }: GameDetailModalProps) {
  const customFetch = useFetch();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(liveCount ?? team.likes ?? 0);
  const [isTogglingLike, setIsTogglingLike] = useState(false);

  // Synchronize the like heart icon across multiple tabs for the same user
  useEffect(() => {
    if (!socket || !user) return;
    const handleLikesUpdated = (payload: any) => {
      if (
        payload.videogameId === team.videogameId &&
        payload.triggerUserId === user.id &&
        payload.liked !== undefined
      ) {
        setIsLiked(payload.liked);
      }
    };
    socket.on('likes:updated', handleLikesUpdated);
    return () => {
      socket.off('likes:updated', handleLikesUpdated);
    };
  }, [socket, user, team.videogameId]);

  // Keep the counter in sync with the parent's WebSocket map
  useEffect(() => {
    if (liveCount !== undefined) {
      setLikesCount(liveCount);
    }
  }, [liveCount]);

  // Check if the game is already liked on component mount.
  // Only meaningful when the user has a session — guests can't like.
  useEffect(() => {
    if (!user) {
      setIsLiked(false);
      return;
    }

    //Get the like status of the current user
    customFetch(
      `${import.meta.env.VITE_ENDPOINT_BACKEND}/videogames/${team.videogameId}/my-like`,
      { method: "GET", credentials: "include" },
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { liked: boolean }) => setIsLiked(data.liked))
      .catch(() => setIsLiked(false));
  }, [team.videogameId, user]);

  const handleClose = () => {
    //onRefresh(); // refresh not needed thanks to websocket likes implementation
    onClose(); // Close the modal
  };

  const toggleLike = async () => {
    // Only authenticated users can like
    if (!user) {
      toast.info("¡Inicia sesión para dar like!", { id: "like-auth" });
      return;
    }

    if (isTogglingLike) return;
    setIsTogglingLike(true);
    try {
      const response = await customFetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/videogames/${team.videogameId}/toggle-like`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.status === 201 || response.status === 200) {
        const data = await response.json();
        setIsLiked(data.liked);
        if (data.likeCount !== undefined) {
          setLikesCount(data.likeCount);
        }
      } else if (response.status === 401) {
        toast.info("Tu sesión expiró. Inicia sesión de nuevo.", { id: "like-auth" });
      } else if (response.status === 409) {
        setIsLiked(true);
      } else if (response.status === 400) {
        const errorData = await response.json();
        const description = errorData.message.includes("20 likes")
          ? "Este juego no puede recibir más de 20 likes sin video o fotos adicionales."
          : errorData.message.includes("10 likes")
            ? "Este juego no puede recibir más de 10 likes sin logo."
            : "Error al procesar el like. Intenta de nuevo.";
        console.error('Failed to toggle like:', errorData.message);
        toast.error(description, { id: 1 });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to toggle like:', response.status, errorData);
        toast.error("Error al procesar el like. Intenta de nuevo.", { id: 1 });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error("Error de conexión. Intenta de nuevo.", { id: 1 });
    } finally {
      setIsTogglingLike(false);
    }
  };

  return (
    <>
      <Toaster
        position="bottom-center"
        richColors={false}
        toastOptions={{
          unstyled: true,
          classNames: {
            error: 'bg-[var(--toast-error)] border border-rose-800 w-[356px] text-foreground flex flex-justify gap-2 items-center px-3 py-3 rounded-md shadow-md',
            info: 'bg-[#181a20] border border-[#AC7CFF] w-[356px] text-white flex gap-3 items-center px-4 py-3 rounded-xl shadow-[0_0_20px_rgba(172,124,255,0.3)] font-medium',
          },
        }} />
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex justify-center items-center p-4 pb-1 md:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative bg-[#181a20] text-white rounded-2xl overflow-hidden w-[95%] max-w-5xl h-[85vh] md:h-[600px] max-h-[85vh] md:max-h-[600px] shadow-[0_0_30px_rgba(172,124,255,0.25)] border border-[#AC7CFF]/30 flex flex-col md:flex-row"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 12 }}
          >
            {/* Botón X de cerrar - Oculto en móvil */}
            <button
              onClick={handleClose}
              className="cursor-pointer hidden md:block absolute top-4 right-4 text-gray-400 hover:text-white transition z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* 🎬 Carrusel de Video e Imágenes Adicionales (NO incluye el logo) */}
            <div className="w-full md:w-2/3 bg-black flex items-center justify-center p-3 flex-shrink-0">
              <MediaCarousel
                images={team.additionalImages || []}
              />
            </div>

            {/* 🧾 Información del equipo */}
            <div className="w-full md:w-1/3 flex flex-col min-h-0 bg-gradient-to-b from-[#1b1f2a] to-[#141720]">
              <div className="p-4 pt-4 md:p-6 md:pt-6 overflow-y-auto flex-1
              [&::-webkit-scrollbar]:w-2 pr-2
              [&::-webkit-scrollbar-track]:rounded-full
              [&::-webkit-scrollbar-track]:bg-gray-800
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-[#AC7CFF]/50
              [&::-webkit-scrollbar-thumb:hover]:bg-[#AC7CFF]">

                <div className="space-y-4">
                  <div className="flex justify-center mb-2 md:mb-4">
                    <div className="w-28 h-28 rounded-full border-3 border-[#AC7CFF]/40 overflow-hidden bg-white/10 p-1 flex items-center justify-center">
                      {team.logo ? (
                        <img
                          src={team.logo}
                          alt={`${team.teamName} logo`}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#AC7CFF] to-[#7C3AED] flex items-center justify-center">
                          <span className="text-white font-bold text-4xl">
                            {team.gameName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex row justify-between gap-3.5">
                    <h2 className="text-3xl font-bold text-[#AC7CFF] mb-4">
                      {team.gameName}
                    </h2>
                    {/* Like Button */}
                    <div className="flex items-center mb-4 mx-0 md:mr-1 md:pr-0 pr-4">
                      <button
                        onClick={toggleLike}
                        disabled={isTogglingLike}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-300 ${isLiked
                          ? 'bg-red-500/20 text-red-400 border border-red-400/30 hover:bg-red-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-400/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-400/30'
                          } ${isTogglingLike ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <Heart
                          size={20}
                          fill={isLiked ? "currentColor" : "none"}
                          className={`transition-all duration-300 ${isTogglingLike ? 'animate-pulse' : ''}`}
                        />
                        <span className="font-medium">
                          {isTogglingLike ? '...' : likesCount}
                        </span>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">
                    Equipo:{" "}
                    <span className="text-white font-semibold">
                      {team.teamName}
                    </span>
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    Estado:{" "}
                    <span className="capitalize text-gray-200">{team.status}</span>
                  </p>

                  <div className="mt-2">
                    <h3 className="text-lg font-semibold text-[#AC7CFF] mb-2">Descripción</h3>
                    <p className="text-gray-300 text-sm leading-relaxed mb-3">
                      {team.description || "Sin descripción disponible."}
                    </p>
                  </div>

                  {team.members && team.members.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-[#AC7CFF]" />
                        <h4 className="text-lg font-semibold">Integrantes</h4>
                      </div>
                      <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                        {team.members.map((member, index) => (
                          <li key={index}>{member}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 🔗 Botones */}
                  <div className="flex flex-col items-center gap-3 mt-8 pb-4 pr-4">
                    {team.repo && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(team.repo, "_blank")}
                        className="cursor-pointer w-full flex items-center justify-center gap-2 border-[#AC7CFF]/40 text-gray-200 hover:bg-[#AC7CFF]/20"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver repositorio en GitHub
                      </Button>
                    )}

                    {team.video && (
                      <Button
                        onClick={() => window.open(team.video, "_blank")}
                        className="cursor-pointer w-full flex items-center justify-center gap-2 bg-[#AC7CFF] text-[#060312] font-semibold hover:bg-[#9B6BFF]"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver trailer del juego en Youtube
                      </Button>
                    )}

                    {(team.gameFileUrl) && <Button
                      onClick={() => navigate(`/play-game/${team.videogameId}`)}
                      className="cursor-pointer w-full flex items-center justify-center gap-2 bg-[#AC7CFF] text-[#060312] font-semibold hover:bg-[#9B6BFF]"
                    >
                      Jugar
                    </Button>}

                    {/* Botón Cerrar - Solo visible en móvil */}
                    <button
                      onClick={handleClose}
                      className="md:hidden w-full py-2 px-3 rounded-lg font-medium text-sm bg-[#541ab8] text-white transition-all duration-300 ease-in-out hover:bg-[#6B2FCC]"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
