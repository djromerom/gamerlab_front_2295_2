"use client";

import { useEffect, useState, useRef } from "react";
import ediciones from "@/assets/Ediciones.json";
import testimonials from "@/assets/Testimonials.json";


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
import NavBar from "@/components/grupo 5/NavBar";



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
const testimonios = testimonials;
export default function CompetitionInfo() {

  const [edicionSeleccionada, setEdicionSeleccionada] = useState(ediciones[0]);
  const testimonioss =
    testimonios.find((t) => t.edicion === edicionSeleccionada.id)
      ?.testimonios || [];

  // Separar testimonios por tipo (participantes vs asistentes/otros)
  const participantTestimonials = testimonioss.filter((t) =>
    t.role.toLowerCase().includes("participante")
  );

  const attendeeTestimonials = testimonioss.filter(
    (t) => !t.role.toLowerCase().includes("participante")
  );



  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTestimonialSlide, setCurrentTestimonialSlide] = useState(0);
  const [isTestimonialChanging, setIsTestimonialChanging] = useState(false);
  const [isTitleChanging, setIsTitleChanging] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [testimonialType, setTestimonialType] = useState<
    "participants" | "attendees"
  >("participants");

  // Build image paths for the selected edition (images named 2.JPG .. 30.JPG)
  const imagePaths = Array.from(
    { length: 29 },
    (_, i) => `/assets/carousel/${edicionSeleccionada.id}/${i + 2}.JPG`
  );

  // Total number of slides is derived from the built paths so it stays in sync
  const totalSlides = imagePaths.length;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  


  // Reset carousel and testimonial position when selected edition changes
  useEffect(() => {
    setCurrentSlide(0);
    setCurrentTestimonialSlide(0);
  }, [edicionSeleccionada]);

  const nextTestimonialSlide = () => {
    const testimonialCount =
      testimonialType === "participants"
        ? participantTestimonials.length
        : attendeeTestimonials.length;
    setCurrentTestimonialSlide((prev) =>
      prev === testimonialCount - 1 ? 0 : prev + 1
    );
  };

  const prevTestimonialSlide = () => {
    const testimonialCount =
      testimonialType === "participants"
        ? participantTestimonials.length
        : attendeeTestimonials.length;
    setCurrentTestimonialSlide((prev) =>
      prev === 0 ? testimonialCount - 1 : prev - 1
    );
  };

  const goToTestimonialSlide = (index: number) => {
    setCurrentTestimonialSlide(index);
  };

  /* imagePaths already computed above */

  // Update carousel position when currentSlide changes
  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.style.transform = `translateX(-${currentSlide * 100
        }%)`;
    }
  }, [currentSlide]);

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Reset testimonial slide when testimonial type changes
  useEffect(() => {
    setCurrentTestimonialSlide(0);
  }, [testimonialType]);

  // Auto-advance testimonial carousel every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextTestimonialSlide();
    }, 8000);
    return () => clearInterval(interval);
  }, [testimonialType]);

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

      <div className="relative min-h-screen bg-[#0d0f14] overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat animate-float"
          style={{ backgroundImage: "url('/background.webp')" }}
        >
          <div className="absolute inset-0"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center p-4 pb-12 pt-30 text-white">



          {/* Previous Edition Section (CHECK BRITO)*/}
          <div className="w-full max-w-4xl mt-0">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-6 justify-center">
              {/* ComboBox alineado con el título */}
              <div className="relative gradient-border gradient-border-purple w-full md:w-fit" style={{ padding: '8px', marginBottom: 0 }}>
                <div className="gradient-border-inner"></div>
                <select
                  value={edicionSeleccionada.id}
                  onChange={(e) => {
                    const ed = ediciones.find((ed) => ed.id === e.target.value);
                    if (ed) setEdicionSeleccionada(ed);
                  }}
                  className="relative z-10 bg-[#110D20] text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#AC7CFF] w-full"
                  style={{ border: 'none', boxShadow: 'none' }}
                >
                  {ediciones.map((ed) => (
                    <option key={ed.id} value={ed.id}>
                      {ed.id} ({ed.semestre})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <History className="w-6 h-6 text-[#AC7CFF]" />
                <h2 className="text-2xl font-bold text-center">
                  Edicion {edicionSeleccionada.id}, {edicionSeleccionada.semestre}
                </h2>
              </div>
            </div>

            {/* Main info about previous edition (CHECK BRITO)*/}
            <div className="relative gradient-border gradient-border-purple p-0 mb-8">
              <div className="gradient-border-inner"></div>
              <div className="relative z-10 p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="md:w-1/2">
                    <img

                      src={`/assets/carousel/${edicionSeleccionada.id}/MainPhoto.JPG`}
                      alt={edicionSeleccionada.alt}
                      className="rounded-lg shadow-lg object-cover w-full"
                    />
                  </div>
                  <div className="md:w-1/2">
                    <h3 className="text-xl font-bold mb-4 text-[#AC7CFF]">
                      {edicionSeleccionada.titulo}
                    </h3>
                    <p className="text-gray-300 mb-4">
                      {edicionSeleccionada.descripcion}
                    </p>
                    <p className="text-gray-300 mb-4">
                      {edicionSeleccionada.descripcion2}
                    </p>
                    <div className="flex items-center gap-2 bg-[#110D20] px-4 py-2 rounded-full">
                      <Calendar className="w-4 h-4 text-[#AC7CFF]" />

                      <span className="text-sm">{edicionSeleccionada.fecha}</span>
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
                  +30 stands con muestras de videouegos a jurados y asistentes.
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

                {edicionSeleccionada?.enfoquesEducativos?.length ? (
                  <div
                    className={`grid gap-6 ${edicionSeleccionada.enfoquesEducativos.length === 1
                      ? "grid-cols-1 justify-items-center"
                      : edicionSeleccionada.enfoquesEducativos.length === 2
                        ? "grid-cols-1 md:grid-cols-2 justify-items-center"
                        : "grid-cols-1 md:grid-cols-3"
                      }`}
                  >

                    {edicionSeleccionada.enfoquesEducativos.map((enfoque, index) => (
                      <div
                        key={index}
                        className="bg-[#110D20] p-4 rounded-lg max-w-sm w-full"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="w-5 h-5 text-[#AC7CFF]" />
                          <h4 className="font-semibold">{enfoque.titulo}</h4>
                        </div>
                        <p className="text-gray-300 text-sm">{enfoque.descripcion}</p>
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


          {/* Featured Games (CHECK BRITO)*/}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-[#AC7CFF] text-center">
              Mencion Honorífica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="game-card">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="w-5 h-5 text-[#AC7CFF]" />
                  <div>
                    <h4 className="font-semibold">{
                      edicionSeleccionada?.["Juegos Destacados"]?.split(";")[0]}
                    </h4>
                  </div>
                </div>
              </div>
              <div className="game-card">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="w-5 h-5 text-[#AC7CFF]" />
                  <div>
                    <h4 className="font-semibold">
                      {edicionSeleccionada?.["Juegos Destacados"]?.split(";")[1]}
                    </h4>
                  </div>
                </div>
              </div>
              <div className="game-card">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="w-5 h-5 text-[#AC7CFF]" />
                  <div>
                    <h4 className="font-semibold">
                      {edicionSeleccionada?.["Juegos Destacados"]?.split(";")[2]}
                    </h4>
                  </div>
                </div>
              </div>
              <div className="game-card">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="w-5 h-5 text-[#AC7CFF]" />
                  <div>
                    <h4 className="font-semibold">
                      {edicionSeleccionada?.["Juegos Destacados"]?.split(";")[3]}
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Carousel (CHECK BRITO)*/}
          {/* Hacemos el cuadro un poco más alto y aseguramos que mantenga su anchura */}
          <div className="carousel w-full h-[360px] md:h-[480px] mb-8">
            <div className="carousel-inner h-full" ref={carouselRef}>
              {imagePaths.map((src, index) => (
                <div key={index} className="carousel-item h-full relative">
                  <img
                    src={src}
                    alt={`Imagen ${index + 2}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <h3 className="text-white font-bold">
                        Feria Gamer {edicionSeleccionada.id}
                      </h3>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div
              className="carousel-control carousel-control-prev"
              onClick={prevSlide}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </div>
            <div
              className="carousel-control carousel-control-next"
              onClick={nextSlide}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Testimonials Section - Carousel */}
        <div className="w-full max-w-4xl mt-16">
          <div className="flex items-center gap-3 mb-6 justify-center">
            <Quote className="w-6 h-6 text-[#AC7CFF]" />
            <h2
              className={`text-2xl font-bold text-center ${isTitleChanging ? "title-fade-out" : "title-fade-in"
                }`}
            >
              Lo Que Dicen Nuestros{" "}
              {testimonialType === "participants"
                ? "Participantes"
                : "Asistentes"}
            </h2>
          </div>

          <div className="flex justify-center mb-8">
            <div className="bg-[#110D20] p-1 rounded-full flex">
              <button
                className={`cursor-pointer px-4 py-2 rounded-full transition-all ${testimonialType === "participants"
                  ? "bg-[#AC7CFF] text-[#060312]"
                  : "text-gray-300"
                  }`}
                onClick={() => {
                  if (testimonialType !== "participants") {
                    setIsTestimonialChanging(true);
                    setIsTitleChanging(true);
                    setTimeout(() => {
                      setTestimonialType("participants");
                      setTimeout(() => {
                        setIsTestimonialChanging(false);
                      }, 50);
                      setTimeout(() => {
                        setIsTitleChanging(false);
                      }, 100);
                    }, 500);
                  }
                }}
              >
                Participantes
              </button>
              <button
                className={`cursor-pointer px-4 py-2 rounded-full transition-all ${testimonialType === "attendees"
                  ? "bg-[#AC7CFF] text-[#060312]"
                  : "text-gray-300"
                  }`}
                onClick={() => {
                  if (testimonialType !== "attendees") {
                    setIsTestimonialChanging(true);
                    setIsTitleChanging(true);
                    setTimeout(() => {
                      setTestimonialType("attendees");
                      setTimeout(() => {
                        setIsTestimonialChanging(false);
                      }, 50);
                      setTimeout(() => {
                        setIsTitleChanging(false);
                      }, 100);
                    }, 500);
                  }
                }}
              >
                Asistentes
              </button>
            </div>
          </div>

          {/* Testimonial Carousel */}
          <div className="relative gradient-border gradient-border-purple p-0 mb-8">
            <div className="gradient-border-inner"></div>
            <div className="relative z-10 p-6 md:p-8">
              <div
                className={`carousel h-auto ${isTestimonialChanging
                  ? "testimonial-fade-out"
                  : "testimonial-fade-in"
                  }`}
              >
                <div
                  className="carousel-inner h-full"
                  style={{
                    transform: `translateX(-${currentTestimonialSlide * 100
                      }%)`,
                  }}
                >
                  {(testimonialType === "participants"
                    ? participantTestimonials
                    : attendeeTestimonials
                  ).map((t) => (
                    <div key={t.id} className="carousel-item h-full">
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

                <div
                  className="carousel-control carousel-control-prev"
                  onClick={prevTestimonialSlide}
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </div>
                <div
                  className="carousel-control carousel-control-next"
                  onClick={nextTestimonialSlide}
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </div>

                <div className="carousel-indicators">
                  {(testimonialType === "participants"
                    ? participantTestimonials
                    : attendeeTestimonials
                  ).map((_, index) => (
                    <div
                      key={index}
                      className={`carousel-indicator ${currentTestimonialSlide === index ? "active" : ""
                        }`}
                      onClick={() => goToTestimonialSlide(index)}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Footer (CHECK BRITO)*/}
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
            © 2025 Feria Gamer Uninorte. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
