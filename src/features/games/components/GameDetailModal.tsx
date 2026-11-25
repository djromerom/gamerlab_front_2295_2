import { ExternalLink, Heart, Monitor, Users, X } from "lucide-react";
import { isOwnLikeEvent } from "@/lib/opaqueKeys";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";

import { Team } from "@/types/team";
import { MediaCarousel } from "./MediaCarousel";
import { playPath, type GameKind } from "@/features/games/lib/gameFiles";
import { isMobileFriendly } from "@/features/games/lib/mobileFriendly";
import { useTouchOnly } from "@/hooks/useTouchOnly";
import { teamStatusLabel } from "@/features/games/lib/teamStatus";

interface GameDetailModalProps {
  team: Team;
  onClose: () => void;
  onRefresh: () => void;
  liveCount?: number;
  /** «historical» en ediciones pasadas: team.videogameId es el id del HistoricalVideogame (HU-40) */
  gameKind?: GameKind;
}

export function GameDetailModal({ team, onClose, onRefresh, liveCount, gameKind = "live" }: GameDetailModalProps) {
  const customFetch = useFetch();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  // Los juegos de los equipos se juegan solo en computador (HU-40), salvo las excepciones de ARK-317
  const touchOnly = useTouchOnly() && !isMobileFriendly(gameKind, team.videogameId);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(liveCount ?? team.likes ?? 0);
  const [isTogglingLike, setIsTogglingLike] = useState(false);

  // Synchronize the like heart icon across multiple tabs for the same user
  useEffect(() => {
    if (!socket || !user) return;
    const handleLikesUpdated = (payload: any) => {
      if (
        payload.videogameId === team.videogameId &&
        isOwnLikeEvent(payload, user.likeKey) &&
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

  // Bloquear scroll mientras el modal esté abierto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // BG-66 (ARK-266): Escape cierra el detalle, como los demás diálogos
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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

  // La ventana va en document.body: dentro de la página quedaba atrapada en el «relative z-10» del contenedor, debajo de
  // la barra de navegación y de los botones flotantes, que tapaban su parte de arriba y de abajo en el celular.
  return createPortal(
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
          // BG-66: por encima de la barra y de los botones flotantes (z-50), que a 360 px tapaban «Cerrar»
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex justify-center items-center p-3 sm:p-4 overscroll-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={team.gameName}
            // En vertical (celular o tableta) va en columna: fotos arriba e información abajo, con su propio scroll.
            // En horizontal va en fila y nunca más alta que la pantalla (en el celular acostado quedaba recortada).
            className="relative bg-[#181a20] text-white rounded-2xl overflow-hidden w-full max-w-5xl portrait:max-w-2xl max-h-full landscape:h-[min(550px,100%)] shadow-[0_0_30px_rgba(172,124,255,0.25)] border border-[#AC7CFF]/30 flex flex-col landscape:flex-row"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 12 }}
          >
            {/* Botón X de cerrar */}
            <button
              onClick={handleClose}
              aria-label="Cerrar"
              className="cursor-pointer absolute top-3 right-3 rounded-full bg-black/60 p-1.5 text-gray-300 hover:text-white transition z-50"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            {/* 🎬 Carrusel de Video e Imágenes Adicionales (NO incluye el logo) */}
            {/* En horizontal las fotos ocupan 3/5 y, en el celular acostado, la mitad: así la información no queda en una franja angosta */}
            <div className="w-full landscape:w-3/5 landscape-short:w-1/2 landscape:h-full min-h-0 bg-black flex items-center justify-center p-3 landscape-short:p-2 flex-shrink-0">
              <MediaCarousel
                images={team.additionalImages || []}
              />
            </div>

            {/* 🧾 Información del equipo */}
            <div className="@container w-full flex-1 min-w-0 flex flex-col min-h-0 bg-gradient-to-b from-[#1b1f2a] to-[#141720]">
              <div className="p-4 pt-4 md:p-6 md:pt-6 landscape-short:p-3 overflow-y-auto overscroll-contain flex-1
              [&::-webkit-scrollbar]:w-2 pr-2
              [&::-webkit-scrollbar-track]:rounded-full
              [&::-webkit-scrollbar-track]:bg-gray-800
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-[#AC7CFF]/50
              [&::-webkit-scrollbar-thumb:hover]:bg-[#AC7CFF]">

                <div className="space-y-4">
                  <div className="flex justify-center mb-2 md:mb-4 landscape-short:mb-0">
                    <div className="w-28 h-28 landscape-short:w-20 landscape-short:h-20 rounded-full border-3 border-[#AC7CFF]/40 overflow-hidden bg-white/10 p-1 flex items-center justify-center">
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
                  <div className="flex justify-between items-start gap-3.5">
                    {/* El tamaño del título va según el ancho de la columna, y una palabra que no cabe se parte:
                        con nombres largos el título empujaba el like fuera de la ventana */}
                    <h2 className="min-w-0 break-words text-xl @min-[22rem]:text-2xl @lg:text-3xl font-bold text-[#AC7CFF] mb-3 md:mb-4">
                      {team.gameName}
                    </h2>
                    {/* Like Button */}
                    <div className="flex shrink-0 items-center mb-4 mx-0 md:mr-1 md:pr-0 pr-4">
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
                  <p className="text-sm text-gray-400 mb-3 break-words">
                    Equipo:{" "}
                    <span className="text-white font-semibold">
                      {team.teamName}
                    </span>
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    Estado:{" "}
                    <span className="text-gray-200">{teamStatusLabel(team.status)}</span>
                  </p>

                  <div className="mt-2">
                    <h3 className="text-base md:text-lg font-semibold text-[#AC7CFF] mb-1.5 md:mb-2">Descripción</h3>
                    <p className="text-gray-300 text-xs md:text-sm leading-relaxed mb-3 break-words">
                      {team.description || "Sin descripción disponible."}
                    </p>
                  </div>

                  {team.members && team.members.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-[#AC7CFF]" />
                        <h4 className="text-lg font-semibold">Integrantes</h4>
                      </div>
                      <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside break-words">
                        {team.members.map((member, index) => (
                          <li key={index}>{member}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 🔗 Botones */}
                  <div className="flex flex-col items-center gap-3 mt-8 landscape-short:mt-4 pb-4 pr-4">
                    {team.repo && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(team.repo, "_blank")}
                        className="cursor-pointer w-full h-auto min-h-9 whitespace-normal text-center flex items-center justify-center gap-2 border-[#AC7CFF]/40 text-gray-200 hover:bg-[#AC7CFF]/20"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver repositorio en GitHub
                      </Button>
                    )}

                    {team.video && (
                      <Button
                        onClick={() => window.open(team.video, "_blank")}
                        className="cursor-pointer w-full h-auto min-h-9 whitespace-normal text-center flex items-center justify-center gap-2 bg-[#AC7CFF] text-[#060312] font-semibold hover:bg-[#9B6BFF]"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver trailer del juego en Youtube
                      </Button>
                    )}

                    {team.gameFileUrl && !touchOnly && (
                      <Button
                        onClick={() => navigate(playPath(gameKind, team.videogameId))}
                        className="cursor-pointer w-full flex items-center justify-center gap-2 bg-[#AC7CFF] text-[#060312] font-semibold hover:bg-[#9B6BFF]"
                      >
                        Jugar
                      </Button>
                    )}
                    {team.gameFileUrl && touchOnly && (
                      <p className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#AC7CFF]/30 px-3 py-2 text-sm text-gray-300">
                        <Monitor className="w-4 h-4 shrink-0 text-[#AC7CFF]" aria-hidden="true" />
                        Este juego se juega en computador
                      </p>
                    )}

                    {/* Botón Cerrar - Solo visible en móvil */}
                    <button
                      onClick={handleClose}
                      className="md:hidden landscape-short:block w-full py-2 px-3 rounded-lg font-medium text-sm bg-[#541ab8] text-white transition-all duration-300 ease-in-out hover:bg-[#6B2FCC]"
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
    </>,
    document.body,
  );
}
