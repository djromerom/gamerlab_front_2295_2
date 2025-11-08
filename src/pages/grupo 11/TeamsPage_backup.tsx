"use client";
import { useState, useEffect } from "react";
import { Search, X, ExternalLink, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import NavBar from "@/components/grupo 5/NavBar";
import { useFetch } from "@/hooks/useFetch";
import { TeamSkeletonGrid } from "@/components/grupo 5/TeamSkeleton";
import { TextSizeControls } from "@/components/grupo 5/TextSizeControl";
import { DiscordButton } from "@/components/grupo 5/DiscordButton";
import { motion, AnimatePresence } from "framer-motion";
import ReactPlayer from "react-player";

export type TeamStatus = "pendiente" | "confirmado" | "expirado";

export interface Team {
  id: number;
  gameName: string;
  teamName: string;
  image?: string;
  status: TeamStatus;
  video?: string;
  repo?: string;
  members?: string[];
  description?: string;
  logo?: string;
  additionalImages?: string[];
}

export default function TeamsPage() {
  useEffect(() => {
    document.documentElement.classList.remove("light", "high-contrast");
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const customFetch = useFetch();
  const discordSupportUrl = "https://discord.gg/RzAvUdspaT";

  useEffect(() => {
    async function fetchTeams() {
      setLoading(true);
      
      try {
        const res = await customFetch(
          `${import.meta.env.VITE_ENDPOINT_BACKEND}/videogames`,
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        );

        const rawData = await res.json();
        console.log("🔍 Datos crudos del backend:", rawData);
        
        const data: Team[] = rawData.map((team: any) => {
          // SOLUCIÓN TEMPORAL: Agregar imágenes de ejemplo para pruebas
          let additionalImages: string[] = [];
          
          // Para el equipo "pruebaa", agregar imágenes de ejemplo
          if (team.name && team.name.toLowerCase().includes('prueba')) {
            additionalImages = [
              "https://picsum.photos/800/600?random=1",
              "https://picsum.photos/800/600?random=2", 
              "https://picsum.photos/800/600?random=3",
              "https://picsum.photos/800/600?random=4"
            ];
            console.log("🖼️ Agregando imágenes de prueba para:", team.name);
          }
          
          return {
            id: team.id,
            gameName: team.name || "Sin nombre",
            teamName: team.teamName || "Sin equipo",
            status: team.status?.toLowerCase() as TeamStatus || "pendiente",
            video: team.videoUrl,
            repo: team.repoUrl,
            members: team.members || [],
            description: team.descripcion || "Sin descripción disponible.",
            logo: team.logoUrl || "/Arkad.svg",
            additionalImages: additionalImages,
          };
        });
        
        console.log("✅ Datos procesados:", data);
        setTeams(data);
      } catch (error) {
        console.error("❌ Error al cargar equipos:", error);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTeams();
  }, []);

  const filteredTeams = teams.filter(
    (team) =>
      team.gameName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.teamName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFilter = (value: string) => {
    setSearchQuery(value);
  };

  return (
    <div className="relative min-h-screen bg-[#0d0f14] overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat animate-float"
        style={{ backgroundImage: "url('/background.webp')" }}
      >
        <div className="absolute inset-0"></div>
      </div>
      <NavBar />
      <div className=" max-w-7xl mx-auto relative z-10 items-center p-4 pb-12 pt-30 text-white">
        <h1 className="text-4xl font-bold text-center mb-10 text-[#AC7CFF]">
          ¡Echa un vistazo a los videojuegos participantes!
        </h1>

        <Filters onFilter={handleFilter} initialFilter={searchQuery} />

        <div className="relative">
          {loading ? (
            <TeamSkeletonGrid />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          )}
        </div>
      </div>
      <TextSizeControls />
      <DiscordButton discordUrl={discordSupportUrl} />
    </div>
  );
}

interface FiltersProps {
  onFilter: (value: string) => void;
  initialFilter: string;
}

function Filters({ onFilter, initialFilter }: FiltersProps) {
  const [filterText, setFilterText] = useState(initialFilter);

  return (
    <div className="flex justify-center items-center mb-10 gap-2">
      <div className="relative">
        <Search className="absolute z-10 w-4 left-3 top-1/2 -translate-y-1/2" />
        <Input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Busca por nombre de equipo o videojuego"
          className="w-64 md:w-96 pl-10"
        />
      </div>
      <Button
        variant="outline"
        className="cursor-pointer"
        onClick={() => onFilter(filterText)}
      >
        Buscar
      </Button>
    </div>
  );
}

interface TeamCardProps {
  team: Team;
}

function TeamCard({ team }: TeamCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusInfo = (status: TeamStatus) => {
    switch (status) {
      case "pendiente":
        return { text: "Pendiente de confirmación", color: "text-purple-400" };
      case "confirmado":
        return { text: "Inscripción completa", color: "text-blue-400" };
      case "expirado":
        return { text: "Rechazada", color: "text-red-400" };
    }
  };

  const { text, color } = getStatusInfo(team.status);

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(true)}
        className="cursor-pointer"
      >
        <Card className="transition-all duration-300 hover:shadow-xl hover:border-[#AC7CFF]/50">
          <CardContent className="flex space-x-5 py-5 px-7">
            <Avatar className="w-20 h-20">
              <AvatarImage
                src={team.image || "/placeholder.svg"}
                alt={team.teamName}
              />
              <AvatarFallback>{team.teamName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h4 className="text-xl font-medium">{team.gameName}</h4>
              <p>Equipo: {team.teamName}</p>
              <p className={`${color} font-semibold`}>{text}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {isOpen && (
        <GameDetailModal team={team} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}

interface MediaCarouselProps {
  video?: string;
  images: string[]; // Solo imágenes adicionales, NO incluye el logo
  gameImage?: string; // Solo para thumbnail del video
}

function MediaCarousel({ video, images, gameImage }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  console.log("🎨 MediaCarousel recibió:", { video, images, gameImage });
  
  // Crear array con todos los elementos multimedia (solo video e imágenes adicionales, NO el logo)
  const mediaItems = [];
  
  // Agregar video como primer elemento si existe
  if (video) {
    mediaItems.push({ type: 'video', src: video, thumbnail: gameImage });
    console.log("📹 Video agregado al carrusel");
  }
  
  // Agregar SOLO las imágenes adicionales (no incluir el logo)
  images.forEach((image, index) => {
    console.log(`🖼️ Procesando imagen ${index}:`, image);
    if (image && image.trim() !== '') {
      mediaItems.push({ type: 'image', src: image });
      console.log("✅ Imagen agregada al carrusel:", image);
    } else {
      console.log("❌ Imagen vacía o inválida:", image);
    }
  });
  
  console.log("📋 MediaItems finales:", mediaItems);

  // Si no hay elementos, mostrar placeholder
  if (mediaItems.length === 0) {
    return (
      <div className="w-full aspect-video rounded-xl overflow-hidden max-h-[550px] bg-gray-800 flex items-center justify-center">
        <p className="text-gray-400 text-center px-4">
          Sin multimedia disponible<br />
          <span className="text-sm opacity-75">Sube un video o imágenes adicionales</span>
        </p>
      </div>
    );
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const currentItem = mediaItems[currentIndex];

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden max-h-[550px]">
      {/* Contenido actual */}
      {currentItem.type === 'video' ? (
        <ReactPlayer
          src={currentItem.src}
          width="100%"
          height="100%"
          controls
          light={currentItem.thumbnail}
        />
      ) : (
        <img
          src={currentItem.src}
          alt="Imagen del juego"
          className="w-full h-full object-cover"
        />
      )}

      {/* Controles del carrusel (solo si hay más de un elemento) */}
      {mediaItems.length > 1 && (
        <>
          {/* Botón anterior */}
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Botón siguiente */}
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicadores */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {mediaItems.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-[#AC7CFF]'
                    : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          {/* Contador */}
          <div className="absolute top-4 right-4 bg-black/60 text-white px-2 py-1 rounded text-sm">
            {currentIndex + 1} / {mediaItems.length}
          </div>
        </>
      )}
    </div>
  );
}

interface GameDetailModalProps {
  team: Team;
  onClose: () => void;
}

function GameDetailModal({ team, onClose }: GameDetailModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex justify-center items-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative bg-[#181a20] text-white rounded-2xl overflow-hidden w-[95%] max-w-5xl h-[600px] max-h-[600px] shadow-[0_0_30px_rgba(172,124,255,0.25)] border border-[#AC7CFF]/30 flex flex-col md:flex-row"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 12 }}
        >
          {/* Botón de cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* 🎬 Carrusel de Video e Imágenes Adicionales (NO incluye el logo) */}
          <div className="md:w-2/3 bg-black flex items-center justify-center p-3 flex-shrink-0">
            <MediaCarousel 
              video={team.video} 
              images={team.additionalImages || []} 
              gameImage={team.image} // Solo para thumbnail del video, no se incluye en el carrusel
            />
          </div>

          {/* 🧾 Información del equipo */}
          <div className="md:w-1/3 flex flex-col min-h-0 bg-gradient-to-b from-[#1b1f2a] to-[#141720]">
            <div className="p-6 pt-12 md:pt-6 overflow-y-auto flex-1
              [&::-webkit-scrollbar]:w-2 pr-2
              [&::-webkit-scrollbar-track]:rounded-full
              [&::-webkit-scrollbar-track]:bg-gray-800
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-[#AC7CFF]/50
              [&::-webkit-scrollbar-thumb:hover]:bg-[#AC7CFF]">
              
              <div className="space-y-4">
                {team.logo && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={team.logo || "/Arkad.svg"}
                      alt={`${team.gameName} logo`}
                      className="w-28 h-28 object-contain"
                    />
                  </div>
                )}
                <h2 className="text-3xl font-bold text-[#AC7CFF] mb-1">
                  {team.gameName}
                </h2>
                <p className="text-sm text-gray-400 mb-2">
                  Equipo:{" "}
                  <span className="text-white font-semibold">
                    {team.teamName}
                  </span>
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  Estado:{" "}
                  <span className="capitalize text-gray-200">{team.status}</span>
                </p>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-[#AC7CFF] mb-3">Descripción</h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-5">
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
                      className="w-full flex items-center justify-center gap-2 border-[#AC7CFF]/40 text-gray-200 hover:bg-[#AC7CFF]/20"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver repositorio en GitHub
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}