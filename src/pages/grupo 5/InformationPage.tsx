"use client";
import { useEffect, useState } from "react";
import {
  Calendar,
  Palette,
  Users,
  MapPin,
  Clock,
  Info,
  Gamepad2,
} from "lucide-react";
import NavBar from "@/components/grupo 5/NavBar";
import { TextSizeControls } from "@/components/grupo 5/TextSizeControl";
import { fetchEditions, fetchHighlightedGames, Edition, HighlightedGame } from "@/fetchs/editions";
import { Link } from "react-router-dom";

// Estilos para el borde luminoso mejorado
const glowStyles = `
  @property --angle{
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
  }

  @keyframes spin{
    from{
      --angle: 0deg;
    }
    to{
      --angle: 360deg;
    }
  }

  .gradient-border {
    position: relative;
    z-index: 0;
    border-radius: 8px;
    overflow: hidden;
  }

  .gradient-border::after, .gradient-border::before{
    content: '';
    position: absolute;
    height: 100%;
    width: 100%;
    background-image: conic-gradient(from var(--angle), #ff4545, #00ff99, #006aff, #ff0095, #ff4545);
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    z-index: -1;
    border-radius: 8px;
    animation: 3s spin linear infinite;
  }
  
  .gradient-border::before{
    filter: blur(1.5rem);
    opacity: 0.5;
  }

  .gradient-border-inner {
    position: absolute;
    inset: 3px;
    background: #060312;
    border-radius: 6px;
    z-index: 1;
  }

  .gradient-border-purple::after, .gradient-border-purple::before {
    background-image: conic-gradient(
      from var(--angle),
      #6A0DAD,
      #8E2DE2,
      #A55EEA,
      #C084FC,
      #3C1361,
      #6A0DAD
    );
  }

  .info-card {
    backdrop-filter: blur(8px);
    background-color: rgba(6, 3, 18, 0.7);
    border-radius: 8px;
    padding: 1.5rem;
    height: 100%;
  }

  .carousel {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
  }

  .carousel-inner {
    display: flex;
    transition: transform 0.5s ease;
  }

  .testimonial-fade-out {
    opacity: 0;
    transform: scale(0.95);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }

  .testimonial-fade-in {
    opacity: 1;
    transform: scale(1);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }

  .title-fade-out {
    opacity: 0;
    transform: translateY(-10px);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }

  .title-fade-in {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }

  .carousel-item {
    min-width: 100%;
    position: relative;
  }

  .carousel-control {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    background: rgba(6, 3, 18, 0.7);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    border: 1px solid rgba(172, 124, 255, 0.3);
    transition: all 0.3s ease;
  }

  .carousel-control:hover {
    background: rgba(172, 124, 255, 0.2);
  }

  .carousel-control-prev {
    left: 10px;
  }

  .carousel-control-next {
    right: 10px;
  }

  .carousel-indicators {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    z-index: 10;
  }

  .carousel-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .carousel-indicator.active {
    background: #AC7CFF;
    transform: scale(1.2);
  }

  .testimonial-card {
    backdrop-filter: blur(8px);
    background-color: rgba(6, 3, 18, 0.7);
    border-radius: 8px;
    padding: 1.5rem;
    height: 100%;
    position: relative;
  }

  .testimonial-card::before {
    content: '"';
    position: absolute;
    top: 10px;
    left: 15px;
    font-size: 60px;
    color: rgba(172, 124, 255, 0.2);
    font-family: serif;
    line-height: 1;
  }

  .feature-card {
    background-color: rgba(17, 13, 32, 0.7);
    border-radius: 8px;
    padding: 1.5rem;
    transition: all 0.3s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(172, 124, 255, 0.2);
  }

  .feature-icon {
    background-color: rgba(172, 124, 255, 0.1);
    width: 50px;
    height: 50px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .game-card {
    background-color: rgba(17, 13, 32, 0.7);
    border-radius: 8px;
    padding: 1rem;
    transition: all 0.3s ease;
    border-left: 3px solid #AC7CFF;
  }

  .game-card:hover {
    background-color: rgba(26, 20, 48, 0.7);
  }
`;

export default function CompetitionInfo() {
  const [activeEdition, setActiveEdition] = useState<Edition | null>(null);
  const [highlightedGames, setHighlightedGames] = useState<HighlightedGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.remove("light", "high-contrast");
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  useEffect(() => {
    const loadActiveEdition = async () => {
      try {
        setLoading(true);
        const editions = await fetchEditions();
        const active = editions.find((e) => e.status === 'ACTIVE');
        if (active) {
          setActiveEdition(active);
          const games = await fetchHighlightedGames(active.id);
          setHighlightedGames(games);
        }
      } catch (error) {
        console.error("Error loading active edition:", error);
      } finally {
        setLoading(false);
      }
    };
    loadActiveEdition();
  }, []);

  // Inyectar los estilos CSS en el documento
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = glowStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Por Definir";
    try {
      const date = new Date(isoString);
      const formatted = new Intl.DateTimeFormat('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      }).format(date);
      return formatted.replace(',', '').replace(/^\w/, c => c.toUpperCase());
    } catch {
      return "Fecha Inválida";
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "--:--";
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }).format(date).toLowerCase();
    } catch {
      return "--:--";
    }
  };

  return (
    <>
      <NavBar />
      <div className="relative min-h-screen bg-[#0d0f14] overflow-hidden dark">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat animate-float"
          style={{ backgroundImage: "url('/background.webp')" }}
        >
          <div className="absolute inset-0"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center p-4 pb-12 pt-30 text-white">
          <h1 className="mb-6 md:mb-8 text-center text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            <span className="text-[#AC7CFF]">Feria Gamer Uninorte</span>
            <span className="block sm:inline"> - {activeEdition ? `Edición ${activeEdition.year}-${activeEdition.semester === 10 ? '1' : activeEdition.semester === 30 ? '2' : activeEdition.semester}` : "Edición Actual"}</span>
          </h1>

          {/* Hero Section */}
          <div className="w-full max-w-4xl mb-12">
            <div className="relative gradient-border gradient-border-purple p-0">
              <div className="gradient-border-inner"></div>
              <div className="relative z-10 p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-[#AC7CFF]">
                  {activeEdition?.title || "¡Bienvenidos a la Feria Gamer Uninorte!"}
                </h2>
                <p className="text-gray-300 mb-8 text-sm md:text-base leading-relaxed">
                  {activeEdition?.description ||
                    `Este es un evento académico y experiencial donde los
                  estudiantes del programa de Ingeniería de Sistemas de la
                  Universidad del Norte, desde primer hasta cuarto semestre,
                  presentan al público general los videojuegos que han
                  desarrollado en el marco de sus asignaturas. Esta feria no
                  solo celebra la creatividad y el talento técnico de los
                  universitarios, sino que también invita a estudiantes de
                  colegio a participar, interactuar y conocer de cerca el
                  proceso de creación de videojuegos, fomentando así el interés
                  por la tecnología, la programación y el diseño interactivo.`}
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap items-start gap-4 sm:gap-6 text-gray-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#AC7CFF]" />
                    <span className="text-sm md:text-base font-medium">{formatDate(activeEdition?.startsAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#AC7CFF]" />
                    <span className="text-sm md:text-base font-medium">Campus Uninorte</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#AC7CFF]" />
                    <span className="text-sm md:text-base font-medium">+400 Participantes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Information Cards */}
          <div className="w-full max-w-4xl flex flex-col md:grid md:grid-cols-3 gap-4 md:gap-5">
            {/* Card 1 - Tematica */}
            <div className="info-card md:col-span-2 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-[#110D20]">
                  <Palette className="w-6 h-6 text-[#AC7CFF]" />
                </div>
                <h3 className="text-xl font-bold">Temática</h3>
              </div>
              <p className="text-gray-300 mb-2 whitespace-pre-line text-sm md:text-base leading-relaxed">
                {activeEdition?.description2 || "Nuevas temáticas e innovadores videojuegos te esperan en esta edición."}
              </p>
            </div>

            {/* Card 2 - Actividades */}
            <div className="info-card md:col-span-1 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-[#110D20]">
                  <Gamepad2 className="w-6 h-6 text-[#AC7CFF]" />
                </div>
                <h3 className="text-xl font-bold">Actividades</h3>
              </div>
              <p className="text-gray-300 mb-3 text-sm">
                Disfruta de múltiples actividades durante el día del evento:
              </p>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#AC7CFF]"></div>
                  <span>Zona de realidad virtual</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#AC7CFF]"></div>
                  <span>Stands de Videojuegos</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#AC7CFF]"></div>
                  <span>Y mucho más...</span>
                </li>
              </ul>
            </div>

            {/* Card 3 - Horarios */}
            <div className="info-card md:col-span-3 !h-auto !p-4 md:!p-5 flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="flex items-center gap-3 mb-3 md:mb-0">
                <div className="p-2 rounded-full bg-[#110D20]">
                  <Clock className="w-6 h-6 text-[#AC7CFF]" />
                </div>
                <h3 className="text-xl font-bold">Horarios</h3>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 w-full md:w-auto pl-11 md:pl-0">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-white text-sm md:text-base">
                      {formatDate(activeEdition?.startsAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-[#AC7CFF] text-sm md:text-base font-medium">
                      {formatTime(activeEdition?.startsAt)} - {formatTime(activeEdition?.endsAt)}
                    </span>
                  </div>
              </div>
            </div>
          </div>

          {/* Highlighted Games Section */}
          <div className="w-full max-w-4xl mt-12 mb-4">
            <h3 className="text-2xl font-bold mb-6 text-[#AC7CFF] text-center">
              Juegos Destacados de esta Edición
            </h3>

            {!loading && highlightedGames.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {highlightedGames.map((game) => (
                  <Link to={`/equipos?search=${encodeURIComponent(game.videogame?.name || "")}`} key={game.videogameId} className="game-card flex items-center justify-center gap-3 py-6 hover:scale-105 transition-transform cursor-pointer">
                    {game.videogame?.logoUrl ? (
                      <img src={game.videogame.logoUrl} alt={game.videogame.name} className="w-8 h-8 object-contain rounded" />
                    ) : (
                      <Gamepad2 className="w-6 h-6 text-[#AC7CFF]" />
                    )}
                    <h4 className="font-bold text-lg text-center">{game.videogame?.name || "Juego Desconocido"}</h4>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed border-gray-800 rounded-lg">
                <p className="text-gray-400">
                  {loading ? "Cargando juegos destacados..." : "Los juegos destacados serán anunciados próximamente."}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="w-full max-w-4xl mt-12 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Info className="w-5 h-5 text-[#AC7CFF]" />
              <p className="text-gray-300">
                Para más información contacta a:{" "}
                <span className="text-[#AC7CFF]">
                  info-openlab@uninorte.edu.co
                </span>
              </p>
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Arkad. Todos los derechos reservados.
            </p>
          </div>
          <TextSizeControls />

        </div>
      </div>
    </>
  );
}
