"use client";
import { useEffect} from "react";
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
  useEffect(() => {
    document.documentElement.classList.remove("light", "high-contrast");
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
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
          <h1 className="mb-8 text-center text-4xl font-bold tracking-tight">
            <span className="text-[#AC7CFF]">Feria Gamer Uninorte</span> -
            Edición 2025-30
          </h1>

          {/* Hero Section */}
          <div className="w-full max-w-4xl mb-12">
            <div className="relative gradient-border gradient-border-purple p-0">
              <div className="gradient-border-inner"></div>
              <div className="relative z-10 p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-[#AC7CFF]">
                  ¡Bienvenidos a la Feria Gamer Uninorte 2025-30!
                </h2>
                <p className="text-gray-300 mb-6">
                  Este es un evento académico y experiencial donde los
                  estudiantes del programa de Ingeniería de Sistemas de la
                  Universidad del Norte, desde primer hasta cuarto semestre,
                  presentan al público general los videojuegos que han
                  desarrollado en el marco de sus asignaturas. Esta feria no
                  solo celebra la creatividad y el talento técnico de los
                  universitarios, sino que también invita a estudiantes de
                  colegio a participar, interactuar y conocer de cerca el
                  proceso de creación de videojuegos, fomentando así el interés
                  por la tecnología, la programación y el diseño interactivo.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-[#110D20] px-4 py-2 rounded-full">
                    <Calendar className="w-5 h-5 text-[#AC7CFF]" />
                    <span>Por Definir</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#110D20] px-4 py-2 rounded-full">
                    <MapPin className="w-5 h-5 text-[#AC7CFF]" />
                    <span>Campus Uninorte</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#110D20] px-4 py-2 rounded-full">
                    <Users className="w-5 h-5 text-[#AC7CFF]" />
                    <span>+400 Participantes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Information Cards */}
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 - Tematica */}
            <div className="info-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-[#110D20]">
                  <Palette className="w-6 h-6 text-[#AC7CFF]" />
                </div>
                <h3 className="text-xl font-bold">Temática</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Este año, la feria gamer se enfoca en el poder de los
                videojuegos para promover la ciberseguridad y la protección digital.
                Bajo el lema “Juega Seguro, Navega Seguro”, los videojuegos estarán 
                inspirados en la concientización sobre la seguridad en línea, el uso 
                responsable de la tecnología y la importancia de proteger la información
                 en el mundo digital.
              </p>
            </div>

            {/* Card 2 - Horarios */}
            <div className="info-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-[#110D20]">
                  <Clock className="w-6 h-6 text-[#AC7CFF]" />
                </div>
                <h3 className="text-xl font-bold">Horarios</h3>
              </div>
              <div className="space-y-3 text-gray-300">
                <div>
                  <h4 className="font-semibold text-white">
                    Jornada AM - Jueves 27 de Noviembre
                  </h4>
                  <p>08:30 a.m. - 12:30 p.m.</p>
                </div>
              </div>
            </div>

            {/* Card 3 - Actividades */}
            <div className="info-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-[#110D20]">
                  <Gamepad2 className="w-6 h-6 text-[#AC7CFF]" />
                </div>
                <h3 className="text-xl font-bold">Actividades</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Disfruta de múltiples actividades durante el día del
                evento:
              </p>
              <ul className="space-y-2 text-gray-300">
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
          </div>



          {/* Registration Section */}
          {/* <div className="w-full max-w-4xl mt-16">
            <div className="relative gradient-border gradient-border-purple p-0">
              <div className="gradient-border-inner"></div>
              <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-[#AC7CFF]">
                    ¿Quieres participar?
                  </h2>
                  <p className="text-gray-300 max-w-md">
                    Regístrate ahora para asegurar el lugar de tu equipo en la
                    feria.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/registro-equipo">
                    <button className="px-6 py-3 bg-[#AC7CFF] hover:bg-[#ba93fe] text-[#060312] font-medium rounded-lg transition-colors cursor-pointer">
                      Registrarse
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div> */}

          {/* Footer */}
          <div className="w-full max-w-4xl mt-12 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Info className="w-5 h-5 text-[#AC7CFF]" />
              <p className="text-gray-300">
                Para más información contacta a:{" "}
                <span className="text-[#AC7CFF]">
                  djromero@uninorte.edu.co
                </span>
              </p>
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 Arkad. Todos los derechos reservados.
            </p>
          </div>
          <TextSizeControls />
          
        </div>
      </div>
    </>
  );
}
