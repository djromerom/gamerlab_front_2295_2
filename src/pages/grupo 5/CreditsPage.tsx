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
  Filter,
} from "lucide-react";
import NavBar from "@/components/grupo 5/NavBar";
import { TextSizeControls } from "@/components/grupo 5/TextSizeControl";
import { DiscordButton } from "@/components/grupo 5/DiscordButton";
import { developers, departments, technologies, projectStats } from "@/data/contributorsData";

import "./CreditsPage.css";

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





  const [activeDepartment, setActiveDepartment] = useState<string>("all");
  const [activeVersion, setActiveVersion] = useState<number | "all">("all");
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Función para filtrar desarrolladores por departamento
  const filteredDevelopers =
    developers.filter((dev) => {
      const byDept = activeDepartment === "all" ? true : dev.department.includes(activeDepartment);
      const byVersion = activeVersion === "all" ? true : dev.version.includes(activeVersion);
      return byDept && byVersion;
    }).sort((a, b) => {
      // First, people with fewer versions
      if (a.version.length !== b.version.length) {
        return a.version.length - b.version.length;
      }

      // If they have the same number of versions, sort by the most recent version
      const maxA = Math.max(...a.version);
      const maxB = Math.max(...b.version);
      if (maxB !== maxA) {
        return maxB - maxA;
      }

      // Alphabetical order to be consistent
      return a.name.localeCompare(b.name);
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
          <h1 className="mb-6 md:mb-8 text-center text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            <span className="text-[#AC7CFF]">Arkad</span> - Equipo de Desarrollo
          </h1>

          {/* Hero Section */}
          <div className="w-full max-w-4xl mb-8 md:mb-12">
            <div className="relative gradient-border gradient-border-purple p-0">
              <div className="gradient-border-inner"></div>
              <div className="relative z-10 p-5 md:p-8">
                <h2 className="text-xl md:text-3xl font-bold mb-3 md:mb-4 text-[#AC7CFF]">
                  Conoce a Nuestro Equipo
                </h2>
                <p className="text-sm md:text-base text-gray-300 mb-5 md:mb-6">
                  Detrás de Arkad hay un equipo apasionado de desarrolladores y
                  diseñadores que han trabajado incansablemente para crear esta
                  experiencia digital. Cada miembro ha aportado su experiencia y
                  creatividad para hacer posible este proyecto.
                </p>
                <div className="flex flex-wrap gap-2 md:gap-4">
                  <div className="flex items-center gap-1.5 md:gap-2 bg-[#110D20] px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm">
                    <Users className="w-4 h-4 md:w-5 md:h-5 text-[#AC7CFF]" />
                    <span>{developers.length} Desarrolladores</span>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 bg-[#110D20] px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm">
                    <Heart className="w-4 h-4 md:w-5 md:h-5 text-[#AC7CFF]" />
                    <span>100% Pasión</span>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 bg-[#110D20] px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm">
                    <Coffee className="w-4 h-4 md:w-5 md:h-5 text-[#AC7CFF]" />
                    <span>Infinitas tazas de café</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Stats */}
          <div className="w-full max-w-4xl mb-6 md:mb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              {projectStats.map((stat, index) => (
                <div key={index} className="stats-card p-2 md:p-6 flex flex-col justify-center">
                  <div className="flex justify-center mb-1 md:mb-3 transform scale-75 md:scale-100">{stat.icon}</div>
                  <div className="stats-number text-2xl md:text-4xl mb-0.5 md:mb-2 leading-none">{stat.value}</div>
                  <div className="text-gray-300 text-[10px] md:text-sm leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Section */}
          <div className="w-full max-w-4xl mb-6 md:mb-12">
            <div className="flex flex-nowrap items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-2 min-w-0">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-[#AC7CFF] shrink-0" />
                <h2 className="text-xl md:text-2xl font-bold truncate">Nuestro Equipo</h2>
              </div>
              
              <div className="relative shrink-0" ref={filterDropdownRef}>
                <div className="relative gradient-border gradient-border-purple flex items-center" style={{ padding: '3px' }}>
                  <div className="gradient-border-inner" style={{ borderRadius: '6px' }}></div>
                  <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="relative z-10 p-2 md:py-2 md:px-4 bg-[#110D20] hover:bg-[#AC7CFF]/20 rounded transition-colors flex items-center gap-2"
                  >
                    <Filter className="w-5 h-5 text-[#AC7CFF]" />
                    <span className="hidden md:inline text-sm font-medium">Filtrar</span>
                  </button>
                </div>
                
                {isFilterOpen && (
                   <div className="absolute right-0 top-full mt-2 p-4 bg-[#0d0f14]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 flex flex-col gap-6 min-w-[300px] transition-all duration-300 animate-in fade-in slide-in-from-top-2">
                      
                      {/* Version Section */}
                      <div>
                        <h4 className="text-[#AC7CFF] text-sm font-bold mb-3 flex justify-between items-center">
                          <span>Versión</span>
                          <span className="text-xs text-gray-400 font-normal">
                            Total: {developers.filter(d => activeVersion === 'all' ? true : d.version.includes(activeVersion)).length}
                          </span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setActiveVersion("all")}
                            className={`cursor-pointer px-3 py-1.5 rounded-lg transition-all text-xs font-medium ${activeVersion === "all" ? "bg-[#AC7CFF] text-[#060312] border border-[#AC7CFF]" : "bg-[#110D20] text-gray-300 hover:bg-[#1A1428] border border-white/10"}`}
                          >
                            Todas
                          </button>
                          <button
                            onClick={() => setActiveVersion(1)}
                            className={`cursor-pointer px-3 py-1.5 rounded-lg transition-all text-xs font-medium ${activeVersion === 1 ? "bg-blue-500/20 text-blue-300 border border-blue-400" : "bg-[#110D20] text-gray-300 hover:bg-[#1A1428] border border-white/10"}`}
                          >
                            v1
                          </button>
                          <button
                            onClick={() => setActiveVersion(2)}
                            className={`cursor-pointer px-3 py-1.5 rounded-lg transition-all text-xs font-medium ${activeVersion === 2 ? "bg-green-500/20 text-green-300 border border-green-400" : "bg-[#110D20] text-gray-300 hover:bg-[#1A1428] border border-white/10"}`}
                          >
                            v2
                          </button>
                          <button
                            onClick={() => setActiveVersion(3)}
                            className={`cursor-pointer px-3 py-1.5 rounded-lg transition-all text-xs font-medium ${activeVersion === 3 ? "bg-yellow-500/20 text-yellow-300 border border-yellow-400" : "bg-[#110D20] text-gray-300 hover:bg-[#1A1428] border border-white/10"}`}
                          >
                            v3
                          </button>
                        </div>
                      </div>
                      
                      {/* Department Section */}
                      <div>
                        <h4 className="text-[#AC7CFF] text-sm font-bold mb-3">Roles</h4>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => setActiveDepartment("all")}
                            className={`w-full text-left px-3 py-2 cursor-pointer rounded-lg transition-all flex items-center gap-2 text-sm ${activeDepartment === "all"
                              ? "bg-[#AC7CFF] text-[#060312] font-medium"
                              : "bg-[#110D20] text-gray-300 hover:bg-[#1A1428] border border-white/10"
                              }`}
                          >
                            <Globe className="w-4 h-4" />
                            Todos ({developers.filter(d => activeVersion === 'all' ? true : d.version.includes(activeVersion)).length})
                          </button>
                          {departments.filter(dept => getDepartmentCount(dept.id) > 0).map((dept) => (
                            <button
                              key={dept.id}
                              onClick={() => setActiveDepartment(dept.id)}
                              className={`w-full text-left px-3 py-2 cursor-pointer rounded-lg transition-all flex items-center justify-between text-sm ${activeDepartment === dept.id
                                ? "bg-[#AC7CFF] text-[#060312] font-medium"
                                : "bg-[#110D20] text-gray-300 hover:bg-[#1A1428] border border-white/10"
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={activeDepartment === dept.id ? "text-[#060312]" : "text-[#AC7CFF]"}>{dept.icon}</span>
                                {dept.name}
                              </div>
                              <span className="text-xs opacity-70">({getDepartmentCount(dept.id)})</span>
                            </button>
                          ))}
                        </div>
                      </div>

                   </div>
                )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredDevelopers.map((dev) => (
                <div key={dev.id} className="dev-card">
                  <div className="dev-card-content p-5 md:p-6">
                    <div className="flex flex-col items-center mb-4">
                      <h3 className="text-lg md:text-xl font-bold text-center">
                        {dev.name}
                      </h3>
                      <p className="text-[#AC7CFF] text-xs md:text-sm mb-2">{dev.role}</p>
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
          <div className="w-full max-w-4xl mb-6 md:mb-12">
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

                <div className="flex flex-wrap gap-2 md:gap-3">
                  {technologies.map((tech, index) => (
                    <div key={index} className="tech-pill text-xs md:text-sm !py-1.5 md:!py-2 !px-3 md:!px-4">
                      {tech.icon}
                      {tech.name}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
                  <div className="feature-card p-4 md:p-6">
                    <div className="feature-icon w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4">
                      <Rocket className="w-5 h-5 md:w-6 md:h-6 text-[#AC7CFF]" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold mb-1 md:mb-2">Rendimiento</h3>
                    <p className="text-gray-300 text-xs md:text-sm">
                      Optimizado para cargar rápidamente y ofrecer una
                      experiencia fluida en todos los dispositivos.
                    </p>
                  </div>
                  <div className="feature-card p-4 md:p-6">
                    <div className="feature-icon w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4">
                      <Palette className="w-5 h-5 md:w-6 md:h-6 text-[#AC7CFF]" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold mb-1 md:mb-2">Diseño</h3>
                    <p className="text-gray-300 text-xs md:text-sm">
                      Interfaz moderna con animaciones sutiles y una estética
                      futurista que refleja el espíritu gamer.
                    </p>
                  </div>
                  <div className="feature-card p-4 md:p-6">
                    <div className="feature-icon w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4">
                      <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-[#AC7CFF]" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold mb-1 md:mb-2">Experiencia</h3>
                    <p className="text-gray-300 text-xs md:text-sm">
                      Navegación intuitiva y contenido interactivo para mantener
                      a los usuarios comprometidos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Acknowledgments Section */}
          <div className="w-full max-w-4xl mb-6 md:mb-12">
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
              © {new Date().getFullYear()} Arkad. Todos los derechos reservados.
            </p>
          </div>
          <TextSizeControls />
          <DiscordButton discordUrl={discordSupportUrl} />
        </div>
      </div>
    </>
  );
}
