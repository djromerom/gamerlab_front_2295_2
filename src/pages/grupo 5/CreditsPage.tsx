"use client";
import { useEffect, useState, useRef } from "react";
import {
  Code,
  Github,
  Users,
  Heart,
  Star,
  Coffee,
  Sparkles,
  Palette,
  Cpu,
  Globe,
  Rocket,
  Database,
  Camera,
  Calendar,
  PcCase,
  Container,

} from "lucide-react";
import NavBar from "@/components/grupo 5/NavBar";
import { TextSizeControls } from "@/components/grupo 5/TextSizeControl";
import { DiscordButton } from "@/components/grupo 5/DiscordButton";
import { developers, departments, technologies, projectStats } from "@/data/contributorsData";

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

  .dev-card {
    background-color: rgba(17, 13, 32, 0.7);
    border-radius: 8px;
    transition: all 0.3s ease;
    height: 100%;
    overflow: hidden;
    position: relative;
  }

  .dev-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(172, 124, 255, 0.2);
  }

  .dev-card-content {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .dev-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #AC7CFF, #8E2DE2);
  }

  .dev-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background-color: rgba(172, 124, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    border: 2px solid #AC7CFF;
    overflow: hidden;
  }

  .social-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    background-color: rgba(172, 124, 255, 0.1);
    color: #AC7CFF;
    transition: all 0.3s ease;
    font-size: 0.875rem;
  }

  .social-link:hover {
    background-color: rgba(172, 124, 255, 0.2);
  }

  .skill-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    background-color: rgba(172, 124, 255, 0.1);
    color: #AC7CFF;
    font-size: 0.75rem;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .team-carousel {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
  }

  .team-carousel-inner {
    display: flex;
    transition: transform 0.5s ease;
  }

  .team-carousel-item {
    min-width: 100%;
    position: relative;
  }

  .team-carousel-control {
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

  .team-carousel-control:hover {
    background: rgba(172, 124, 255, 0.2);
  }

  .team-carousel-control-prev {
    left: 10px;
  }

  .team-carousel-control-next {
    right: 10px;
  }

  .team-carousel-indicators {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    z-index: 10;
  }

  .team-carousel-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .team-carousel-indicator.active {
    background: #AC7CFF;
    transform: scale(1.2);
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

  .tech-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    background-color: rgba(172, 124, 255, 0.1);
    color: white;
    transition: all 0.3s ease;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .tech-pill:hover {
    background-color: rgba(172, 124, 255, 0.2);
  }

  .stats-card {
    background-color: rgba(17, 13, 32, 0.7);
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
    transition: all 0.3s ease;
  }

  .stats-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(172, 124, 255, 0.2);
  }

  .stats-number {
    font-size: 2.5rem;
    font-weight: bold;
    color: #AC7CFF;
    margin-bottom: 0.5rem;
  }

  .department-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    background-color: rgba(172, 124, 255, 0.1);
    color: white;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .department-badge:hover {
    background-color: rgba(172, 124, 255, 0.2);
  }

  .department-badge.active {
    background-color: #AC7CFF;
    color: #060312;
  }
`;

export default function DevelopersCredits() {
  const [currentTeamSlide, setCurrentTeamSlide] = useState(0);
  const teamCarouselRef = useRef<HTMLDivElement>(null);
  const totalTeamSlides = 2; // Total number of team slides
  const discordSupportUrl = "https://discord.gg/RzAvUdspaT";

  useEffect(() => {
    document.documentElement.classList.remove("light", "high-contrast");
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  const nextTeamSlide = () => {
    setCurrentTeamSlide((prev) =>
      prev === totalTeamSlides - 1 ? 0 : prev + 1
    );
  };

  // Update carousel position when currentTeamSlide changes
  useEffect(() => {
    if (teamCarouselRef.current) {
      teamCarouselRef.current.style.transform = `translateX(-${currentTeamSlide * 100
        }%)`;
    }
  }, [currentTeamSlide]);

  // Auto-advance carousel every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextTeamSlide();
    }, 8000);
    return () => clearInterval(interval);
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





  const [activeDepartment, setActiveDepartment] = useState<string>("all");
  const [activeVersion, setActiveVersion] = useState<number | "all">("all");

  // Función para filtrar desarrolladores por departamento
  const filteredDevelopers =
    developers.filter((dev) => {
      const byDept = activeDepartment === "all" ? true : dev.department.includes(activeDepartment);
      const byVersion = activeVersion === "all" ? true : dev.version.includes(activeVersion);
      return byDept && byVersion;
    }).sort((a, b) => {
      if (activeVersion === "all") {
        const maxA = Math.max(...a.version);
        const maxB = Math.max(...b.version);
        return maxB - maxA;
      }
      return 0;
    });

  // Función para contar desarrolladores por departamento
  const getDepartmentCount = (deptId: string) => {
    return developers.filter((dev) => dev.department.includes(deptId) && (activeVersion === 'all' ? true : dev.version.includes(activeVersion))).length;
  };



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
          <h1 className="mb-8 text-center text-4xl font-bold tracking-tight">
            <span className="text-[#AC7CFF]">Arkad</span> - Equipo de Desarrollo
          </h1>

          {/* Hero Section */}
          <div className="w-full max-w-4xl mb-12">
            <div className="relative gradient-border gradient-border-purple p-0">
              <div className="gradient-border-inner"></div>
              <div className="relative z-10 p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-[#AC7CFF]">
                  Conoce a Nuestro Equipo
                </h2>
                <p className="text-gray-300 mb-6">
                  Detrás de Arkad hay un equipo apasionado de desarrolladores y
                  diseñadores que han trabajado incansablemente para crear esta
                  experiencia digital. Cada miembro ha aportado su experiencia y
                  creatividad para hacer posible este proyecto.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-[#110D20] px-4 py-2 rounded-full">
                    <Users className="w-5 h-5 text-[#AC7CFF]" />
                    <span>29 Desarrolladores</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#110D20] px-4 py-2 rounded-full">
                    <Heart className="w-5 h-5 text-[#AC7CFF]" />
                    <span>100% Pasión</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#110D20] px-4 py-2 rounded-full">
                    <Coffee className="w-5 h-5 text-[#AC7CFF]" />
                    <span>Infinitas tazas de café</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Stats */}
          <div className="w-full max-w-4xl mb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {projectStats.map((stat, index) => (
                <div key={index} className="stats-card">
                  <div className="flex justify-center mb-3">{stat.icon}</div>
                  <div className="stats-number">{stat.value}</div>
                  <div className="text-gray-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Section */}
          <div className="w-full max-w-4xl mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-[#AC7CFF]" />
              <h2 className="text-2xl font-bold">Nuestro Equipo</h2>
            </div>

            {/* Version selector (prominent) */}
            <div className="w-full max-w-4xl mb-4">
              <div className="bg-[#110D20] p-3 rounded-lg flex items-center gap-3">
                <span className="text-sm text-gray-300 font-medium">Versión:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveVersion("all")}
                    className={`cursor-pointer px-4 py-2 rounded-xl transition-all text-sm ${activeVersion === "all" ? "bg-[#AC7CFF] text-[#060312] border-2 border-[#AC7CFF]" : "text-gray-300 hover:bg-[#1A1428]"}`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setActiveVersion(1)}
                    className={`cursor-pointer px-4 py-2 rounded-xl transition-all text-sm ${activeVersion === 1 ? "bg-blue-500/20 text-blue-300 border border-blue-400" : "text-gray-300 hover:bg-[#1A1428]"}`}
                  >
                    v1
                  </button>
                  <button
                    onClick={() => setActiveVersion(2)}
                    className={`cursor-pointer px-4 py-2 rounded-xl transition-all text-sm ${activeVersion === 2 ? "bg-green-500/20 text-green-300 border border-green-400" : "text-gray-300 hover:bg-[#1A1428]"}`}
                  >
                    v2
                  </button>
                  <button
                    onClick={() => setActiveVersion(3)}
                    className={`cursor-pointer px-4 py-2 rounded-xl transition-all text-sm ${activeVersion === 3 ? "bg-yellow-500/20 text-yellow-300 border border-yellow-400" : "text-gray-300 hover:bg-[#1A1428]"}`}
                  >
                    v3
                  </button>
                </div>
                <div className="ml-auto text-sm text-gray-400">Total: {developers.filter(d => activeVersion === 'all' ? true : d.version.includes(activeVersion)).length} desarrolladores</div>
              </div>
            </div>

            {/* Department Navigation */}
            <div className="mb-8">
              <div className="bg-[#110D20] p-2 rounded-lg flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveDepartment("all")}
                  className={`px-4 py-2 cursor-pointer rounded-md transition-all flex items-center gap-2 ${activeDepartment === "all"
                    ? "bg-[#AC7CFF] text-[#060312] font-medium"
                    : "text-gray-300 hover:bg-[#1A1428]"
                    }`}
                >
                  <Globe className="w-5 h-5" />
                  Todos ({developers.filter(d => activeVersion === 'all' ? true : d.version.includes(activeVersion)).length})
                </button>
                {departments.filter(dept => getDepartmentCount(dept.id) > 0).map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => setActiveDepartment(dept.id)}
                    className={`px-4 py-2 cursor-pointer rounded-md transition-all flex items-center gap-2 ${activeDepartment === dept.id
                      ? "bg-[#AC7CFF] text-[#060312] font-medium"
                      : "text-gray-300 hover:bg-[#1A1428]"
                      }`}
                  >
                    <span
                      className={`transition-colors ${activeDepartment === dept.id
                        ? "text-[#060312]"
                        : "text-[#AC7CFF]"
                        }`}
                    ></span>
                    {dept.icon}
                    {dept.name} ({getDepartmentCount(dept.id)})
                  </button>
                ))}
              </div>
            </div>

            {/* Department Description */}
            {activeDepartment !== "all" && (
              <div className="mb-8 p-4 bg-[#110D20] rounded-lg">
                <h3 className="text-xl font-bold text-[#AC7CFF] mb-2">
                  {departments.find((d) => d.id === activeDepartment)?.name}
                </h3>
                <p className="text-gray-300">
                  {
                    departments.find((d) => d.id === activeDepartment)
                      ?.description
                  }
                </p>
              </div>
            )}

            {/* Developers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDevelopers.map((dev) => (
                <div key={dev.id} className="dev-card">
                  <div className="dev-card-content">
                    <div className="flex flex-col items-center mb-4">
                      <h3 className="text-xl font-bold text-center">
                        {dev.name}
                      </h3>
                      <p className="text-[#AC7CFF] text-sm mb-2">{dev.role}</p>
                      {dev.version && dev.version.length > 0 && (
                        <div className="flex gap-2">
                          {dev.version.map((v) => (
                            <span key={v} className={`px-2 py-0.5 rounded text-xs font-medium ${v === 1 ? "bg-blue-500/20 text-blue-300" : v === 2 ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"}`}>
                              v{v}.0
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 mt-auto">
                      <a
                        href={dev.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-link"
                      >
                        <Github className="w-4 h-4" />
                        GitHub
                      </a>
                      <a href={`mailto:${dev.email}`} className="social-link">
                        {dev.email}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technologies Section */}
          <div className="w-full max-w-4xl mb-12">
            <div className="relative gradient-border gradient-border-purple p-0">
              <div className="gradient-border-inner"></div>
              <div className="relative z-10 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Code className="w-6 h-6 text-[#AC7CFF]" />
                  <h2 className="text-2xl font-bold">Tecnologías Utilizadas</h2>
                </div>

                <p className="text-gray-300 mb-6">
                  Para crear esta plataforma, utilizamos un stack moderno de
                  tecnologías que nos permitió desarrollar una experiencia web
                  rápida, interactiva y visualmente atractiva.
                </p>

                <div className="flex flex-wrap">
                  {technologies.map((tech, index) => (
                    <div key={index} className="tech-pill">
                      {tech.icon}
                      {tech.name}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="feature-card">
                    <div className="feature-icon">
                      <Rocket className="w-6 h-6 text-[#AC7CFF]" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Rendimiento</h3>
                    <p className="text-gray-300">
                      Optimizado para cargar rápidamente y ofrecer una
                      experiencia fluida en todos los dispositivos.
                    </p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <Palette className="w-6 h-6 text-[#AC7CFF]" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Diseño</h3>
                    <p className="text-gray-300">
                      Interfaz moderna con animaciones sutiles y una estética
                      futurista que refleja el espíritu gamer.
                    </p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <Sparkles className="w-6 h-6 text-[#AC7CFF]" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Experiencia</h3>
                    <p className="text-gray-300">
                      Navegación intuitiva y contenido interactivo para mantener
                      a los usuarios comprometidos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Acknowledgments Section */}
          <div className="w-full max-w-4xl mb-12">
            <div className="relative gradient-border gradient-border-purple p-0">
              <div className="gradient-border-inner"></div>
              <div className="relative z-10 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Heart className="w-6 h-6 text-[#AC7CFF]" />
                  <h2 className="text-2xl font-bold">Agradecimientos</h2>
                </div>

                <p className="text-gray-300 mb-6">
                  Queremos expresar nuestro sincero agradecimiento a todos los
                  que hicieron posible este proyecto:
                </p>

                <ul className="space-y-4 text-gray-300">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#AC7CFF] flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-[#060312] font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">
                        Profesores y Mentores
                      </h4>
                      <p>
                        Por su guía, conocimientos y apoyo constante durante
                        todo el proceso de desarrollo.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#AC7CFF] flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-[#060312] font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">
                        Departamento de Ingeniería de Sistemas
                      </h4>
                      <p>
                        Por proporcionar los recursos y el espacio necesario
                        para llevar a cabo este proyecto.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#AC7CFF] flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-[#060312] font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">
                        Comunidad de Estudiantes
                      </h4>
                      <p>
                        Por su entusiasmo, participación y valiosos comentarios
                        durante las fases de este proyecto.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#AC7CFF] flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-[#060312] font-bold">4</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">
                        Comunidad Open Source
                      </h4>
                      <p>
                        Por las herramientas y bibliotecas que hicieron posible
                        el desarrollo de esta plataforma.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full max-w-4xl mt-12 text-center">
            <p className="text-gray-300 mb-4">
              Desarrollado con <span className="text-[#AC7CFF]">♥</span> por el
              equipo de Arkad
            </p>
            <p className="text-gray-400 text-sm">
              © 2025 Arkad. Todos los derechos reservados.
            </p>
          </div>
          <TextSizeControls />
          <DiscordButton discordUrl={discordSupportUrl} />
        </div>
      </div>
    </>
  );
}
