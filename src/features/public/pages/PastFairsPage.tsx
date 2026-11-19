"use client";

import { useEffect, useState, useRef } from "react";
import { formatEditionDate } from "@/lib/editionDate";
import { useInfiniteCarousel } from "@/features/games/hooks/useInfiniteCarousel";
import {
  fetchEditions,
  fetchHighlightedGames,
  fetchTestimonials,
  fetchEducationalFocuses,
  Edition,
  Testimonial,
  EducationalFocus,
  HighlightedGame
} from "@/api/editions";
import { Link } from "react-router-dom";
import { pickDefaultPastEdition } from "@/features/public/lib/defaultPastEdition";
import { semesterLabel, semesterName } from "@/lib/semesterLabel";

import {
  Calendar,
  Trophy,
  Users,
  Info,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  Quote,
  History,
  Shield,
  Monitor,
  User,
} from "lucide-react";
import NavBar from "@/components/NavBar";
import { ArkadBackground } from "@/components/background/ArkadBackground";



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

  /* Podium specific gradient borders */
  .gradient-border-gold::after, .gradient-border-gold::before {
    background-image: conic-gradient(
      from var(--angle),
      #B8860B,
      #FFD700,
      #FFE680,
      #FFD700,
      #B8860B
    );
  }
  .gradient-border-silver::after, .gradient-border-silver::before {
    background-image: conic-gradient(
      from var(--angle),
      #8A8A8A,
      #C0C0C0,
      #E0E0E0,
      #C0C0C0,
      #8A8A8A
    );
  }
  .gradient-border-bronze::after, .gradient-border-bronze::before {
    background-image: conic-gradient(
      from var(--angle),
      #7C4A21,
      #CD7F32,
      #E7A56B,
      #CD7F32,
      #7C4A21
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
export default function PastFairsPage() {
  const [editionsList, setEditionsList] = useState<Edition[]>([]);
  const [edicionSeleccionada, setEdicionSeleccionada] = useState<Edition | null>(null);
  const [editionsLoaded, setEditionsLoaded] = useState(false);
  const [isEditionOpen, setIsEditionOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [testimonios, setTestimonios] = useState<Testimonial[]>([]);
  const [enfoques, setEnfoques] = useState<EducationalFocus[]>([]);
  const [highlightedGames, setHighlightedGames] = useState<HighlightedGame[]>([]);

  // Build image list
  const imagePaths = edicionSeleccionada?.photosUrls?.map((p) => p.url) || [];
  const mainPhotoUrl = edicionSeleccionada?.mainPhotoUrl;
  const allImages = [mainPhotoUrl, ...imagePaths].filter(Boolean) as string[];

  // ── Carousels ─────────────────────────────────────────────────────────────
  const imgCarousel = useInfiniteCarousel(allImages, 5000);
  const tstCarousel = useInfiniteCarousel(testimonios, 8000);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsEditionOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Load Editions on Mount ────────────────────────────────────────────────
  useEffect(() => {
    const loadEditions = async () => {
      try {
        const editions = await fetchEditions();
        const pastEditions = editions.filter(e => e.status !== 'ACTIVE');
        setEditionsList(pastEditions);
        // ARK-248 (BG-58): la última edición ya terminada, nunca una de prueba con fecha futura
        setEdicionSeleccionada(pickDefaultPastEdition(pastEditions));
      } catch (error) {
        console.error("Error loading editions:", error);
      } finally {
        setEditionsLoaded(true);
      }
    };
    loadEditions();
  }, []);

  // ── Load relations when edition changes ──────────────────────────────────
  useEffect(() => {
    if (!edicionSeleccionada) return;
    const loadEditionData = async () => {
      try {
        const [tests, focusData, games] = await Promise.all([
          fetchTestimonials(edicionSeleccionada.id),
          fetchEducationalFocuses(edicionSeleccionada.id),
          fetchHighlightedGames(edicionSeleccionada.id)
        ]);
        setTestimonios(tests);
        setEnfoques(focusData);
        setHighlightedGames(games);
      } catch (error) {
        console.error("Error loading edition data:", error);
      }
    };
    loadEditionData();
  }, [edicionSeleccionada]);

  // Inyectar los estilos CSS en el documento
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = glowStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  //podio , top 1 top 2 y top 3 separados por;
  // const podio = edicionSeleccionada.podio ? edicionSeleccionada.podio: [];


  return (
    <>
      <NavBar />

      <div className="relative min-h-screen overflow-hidden">
        <ArkadBackground modo="lento" estiloNuevo />

        <div className="relative z-10 flex flex-col items-center p-4 pb-12 pt-30 text-white">



          {/* Previous Edition Section */}
          <div className="w-full max-w-4xl mt-0">
            <div className="flex flex-nowrap items-center justify-between gap-2 mb-4 md:mb-5">
              <div className="flex items-center gap-2 min-w-0">
                <History className="w-5 h-5 md:w-6 md:h-6 text-[#AC7CFF] shrink-0" />
                <h2 className="text-lg md:text-2xl font-bold text-left truncate">
                  {edicionSeleccionada ? (
                    <>Edición {edicionSeleccionada.year} - <span className="text-[#AC7CFF]">{semesterLabel(edicionSeleccionada.semester)}</span></>
                  ) : "Ediciones pasadas"}
                </h2>
              </div>
              <div className="relative shrink-0" ref={dropdownRef}>
                <div className="relative gradient-border gradient-border-purple flex items-center" style={{ padding: '3px' }}>
                  <div className="gradient-border-inner" style={{ borderRadius: '6px' }}></div>
                  <button
                    onClick={() => setIsEditionOpen(!isEditionOpen)}
                    className="relative z-10 p-2 md:py-2 md:px-4 bg-[#110D20] hover:bg-[#AC7CFF]/20 rounded transition-colors flex items-center gap-2"
                  >
                    <Calendar className="w-5 h-5 text-[#AC7CFF]" />
                    <span className="hidden md:inline text-sm font-medium">Cambiar Edición</span>
                  </button>
                </div>
                {isEditionOpen && (
                  <div className="absolute right-0 top-full mt-2 p-3 bg-[#0d0f14]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 flex flex-col gap-2 min-w-[200px] transition-all duration-300 animate-in fade-in slide-in-from-top-2">
                    {editionsList.map((ed) => (
                      <button
                        key={ed.id}
                        onClick={() => { setEdicionSeleccionada(ed); setIsEditionOpen(false); }}
                        className={`cursor-pointer px-4 py-2 rounded-xl transition-all text-sm font-medium w-full text-left ${edicionSeleccionada?.id === ed.id ? "bg-[#AC7CFF] text-white shadow-md shadow-[#AC7CFF]/20" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                      >
                        {ed.year} - {semesterLabel(ed.semester)} ({semesterName(ed.semester)})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {editionsLoaded && !edicionSeleccionada && (
              <p className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-gray-300">
                Todavía no hay ediciones terminadas.
                {editionsList.length > 0 && " Usa «Cambiar Edición» para ver las programadas."}
              </p>
            )}

            {/* Main info about previous edition (CHECK BRITO)*/}
            {edicionSeleccionada && (
              <>
                <div className="relative gradient-border gradient-border-purple p-0 mb-8">
                  <div className="gradient-border-inner"></div>
                  <div className="relative z-10 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      <div className="md:w-1/2">
                        <img

                          src={edicionSeleccionada.mainPhotoUrl || "/assets/placeholder.jpg"}
                          alt={edicionSeleccionada.alt}
                          className="rounded-lg shadow-lg object-cover w-full"
                        />
                      </div>
                      <div className="md:w-1/2">
                        <h3 className="text-xl font-bold mb-4 text-[#AC7CFF]">
                          {edicionSeleccionada.title}
                        </h3>
                        <p className="text-gray-300 mb-4">
                          {edicionSeleccionada.description}
                        </p>
                        <p className="text-gray-300 mb-4">
                          {edicionSeleccionada.description2}
                        </p>
                        <div className="flex items-center gap-2 bg-[#110D20] px-4 py-2 rounded-full">
                          <Calendar className="w-4 h-4 text-[#AC7CFF]" />

                          <span className="text-sm">
                            {formatEditionDate(edicionSeleccionada.startsAt, { withYear: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features of previous edition (CHECK BRITO)*/}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="feature-card">
                    <div className="feature-icon">
                      <Users className="w-6 h-6 text-[#AC7CFF]" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Participación</h3>
                    <p className="text-gray-300">
                      Más de 400 estudiantes del programa de Ingeniería de sistemas
                      y computación participaron del evento.
                    </p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <Trophy className="w-6 h-6 text-[#AC7CFF]" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Premios</h3>
                    <p className="text-gray-300">
                      Máxima calificación posible a los videojuegos más destacados.
                    </p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <Monitor className="w-6 h-6 text-[#AC7CFF]" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Exhibición</h3>
                    <p className="text-gray-300">
                      +30 stands con muestras de videojuegos a jurados y asistentes.
                    </p>
                  </div>
                </div>


                {/* Educational focus (CHECK BRITO)*/}
                <div className="relative gradient-border gradient-border-purple p-0 mb-8">
                  <div className="gradient-border-inner"></div>
                  <div className="relative z-10 p-6 md:p-8">
                    <h3 className="text-xl font-bold mb-4 text-[#AC7CFF]">
                      Enfoque Educativo
                    </h3>

                    {enfoques?.length ? (
                      <div
                        className={`grid gap-6 ${enfoques.length === 1
                          ? "grid-cols-1 justify-items-center"
                          : enfoques.length === 2
                            ? "grid-cols-1 md:grid-cols-2 justify-items-center"
                            : "grid-cols-1 md:grid-cols-3"
                          }`}
                      >

                        {enfoques.map((enfoque, index) => (
                          <div
                            key={index}
                            className="bg-[#110D20] p-4 rounded-lg max-w-sm w-full"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Shield className="w-6 h-6 text-[#AC7CFF]" />
                              <h4 className="font-bold text-lg">{enfoque.title}</h4>
                            </div>
                            <p className="text-gray-300 text-base">{enfoque.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center">
                        No hay enfoques educativos disponibles.
                      </p>
                    )}
                  </div>
                </div>
                {/* Establecer colores estáticos para los avatares del podio mediante CSS que sobrescribe el inline style */}
                <style>
                  {`
              /* Podio: left = segundo, center = primero, right = tercero */
              .grid.grid-cols-3.gap-6.items-end > div:nth-child(1) .relative.mb-3,
              .grid.grid-cols-3.gap-6.items-end > div:nth-child(1) .rounded-full {
                background-color: #9CA3AF !important; /* gris/plata */
                border-color: #9CA3AF !important;
              }
              .grid.grid-cols-3.gap-6.items-end > div:nth-child(2) .relative.mb-4,
              .grid.grid-cols-3.gap-6.items-end > div:nth-child(2) .rounded-full {
                background-color: #D4AF37 !important; /* dorado */
                border-color: #FFD700 !important;
              }
              .grid.grid-cols-3.gap-6.items-end > div:nth-child(3) .relative.mb-2,
              .grid.grid-cols-3.gap-6.items-end > div:nth-child(3) .rounded-full {
                background-color: #CD7F32 !important; /* bronce */
                border-color: #CD7F32 !important;
              }

              /* Asegurar que el texto dentro del avatar sea legible */
              .grid.grid-cols-3.gap-6.items-end > div > .relative span,
              .grid.grid-cols-3.gap-6.items-end > div > .relative strong {
                color: #ffffff !important;
              }
              `}
                </style>

                <div className="flex justify-center mt-12 mb-8">
                  <div className="relative gradient-border gradient-border-purple inline-block p-[2px]">
                    <div className="gradient-border-inner" style={{ borderRadius: '6px' }}></div>
                    <Link
                      to={`/ediciones-pasadas/${edicionSeleccionada.id}/juegos`}
                      className="group relative z-10 flex items-center gap-2 px-10 py-4 text-lg bg-[#0d0f14] hover:bg-[#110D20] hover:shadow-[0_0_20px_rgba(172,124,255,0.3)] text-white font-bold rounded-md transition-all duration-300"
                    >
                      Ver Proyectos de la Edición
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-[#AC7CFF]" />
                    </Link>
                  </div>
                </div>
              </>
            )}


            {/* Photo Carousel */}
            {allImages.length > 0 ? (
              <div className="carousel w-full h-[360px] md:h-[480px] mb-8">
                <div
                  className="carousel-inner h-full"
                  ref={imgCarousel.trackRef}
                  onTransitionEnd={imgCarousel.onTransitionEnd}
                >
                  {imgCarousel.extended.map((src, index) => (
                    <div key={index} className="carousel-item h-full relative">
                      <img
                        src={src}
                        alt={`Imagen ${index}`}
                        className="w-full h-full object-cover"
                      />
                      {index === 1 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                          <h3 className="text-white font-bold">
                            Feria Gamer {edicionSeleccionada.year} - {semesterLabel(edicionSeleccionada.semester)}
                          </h3>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {allImages.length > 1 && (
                  <>
                    <div className="carousel-control carousel-control-prev" onClick={imgCarousel.prev}>
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </div>
                    <div className="carousel-control carousel-control-next" onClick={imgCarousel.next}>
                      <ChevronRight className="w-6 h-6 text-white" />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full h-[360px] md:h-[480px] mb-8 bg-[#110D20] flex items-center justify-center rounded-lg">
                <p className="text-gray-400">No hay fotos disponibles para esta edición.</p>
              </div>
            )}
          </div>

          {/* Testimonials Section - Carousel */}
          <div className="w-full max-w-4xl mt-16">
            <div className="flex items-center gap-3 mb-6 justify-center">
              <Quote className="w-6 h-6 text-[#AC7CFF]" />
              <h2 className="text-2xl font-bold text-center">
                Lo Que Dicen de Nosotros
              </h2>
            </div>

            {/* Testimonial Carousel */}
            {testimonios.length > 0 ? (
              <div className="relative gradient-border gradient-border-purple p-0 mb-8">
                <div className="gradient-border-inner"></div>
                <div className="relative z-10 p-6 md:p-8">
                  <div className="carousel h-auto">
                    <div
                      className="carousel-inner h-full"
                      ref={tstCarousel.trackRef}
                      onTransitionEnd={tstCarousel.onTransitionEnd}
                    >
                      {tstCarousel.extended.map((t, index) => (
                        <div key={`${t.id}-${index}`} className="carousel-item h-full">
                          <div className="testimonial-card border-none bg-transparent">
                            <div className="flex flex-col h-full">
                              <p className="text-gray-300 mb-6 flex-grow text-center text-lg italic">
                                "{t.quote}"
                              </p>
                              <div className="flex items-center justify-center gap-4 mt-auto">
                                <div className="w-[50px] h-[50px] rounded-full bg-[#1A1428] flex items-center justify-center border-2 border-[#AC7CFF]">
                                  <User className="w-6 h-6 text-[#AC7CFF]" />
                                </div>
                                <div>
                                  <h4 className="font-semibold">{t.name}</h4>
                                  <p className="text-sm text-[#AC7CFF]">{t.role}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {testimonios.length > 1 && (
                      <>
                        <div className="carousel-control carousel-control-prev" onClick={tstCarousel.prev}>
                          <ChevronLeft className="w-6 h-6 text-white" />
                        </div>
                        <div className="carousel-control carousel-control-next" onClick={tstCarousel.next}>
                          <ChevronRight className="w-6 h-6 text-white" />
                        </div>

                        <div className="carousel-indicators">
                          {testimonios.map((_, index) => (
                            <div
                              key={index}
                              className={`carousel-indicator ${tstCarousel.activeDot === index ? 'active' : ''}`}
                              onClick={() => tstCarousel.goTo(index)}
                            ></div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed border-gray-800 rounded-lg">
                <p className="text-gray-400">No hay testimonios registrados para esta edición.</p>
              </div>
            )}
          </div>


          {/* Footer (CHECK BRITO)*/}
          <div className="w-full max-w-4xl mt-12 text-center">
            <div className="flex items-start sm:items-center justify-center gap-2 mb-4">
              <Info className="w-5 h-5 shrink-0 mt-0.5 sm:mt-0 text-[#AC7CFF]" />
              <p className="text-gray-300 text-left sm:text-center">
                Para más información contacta a:{" "}
                <span className="text-[#AC7CFF]">
                  info-openlab@uninorte.edu.co
                </span>
              </p>
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Feria Gamer Uninorte. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
