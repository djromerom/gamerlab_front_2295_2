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
      teamCarouselRef.current.style.transform = `translateX(-${
        currentTeamSlide * 100
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

  // Datos de los desarrolladores agrupados por departamento
  const departments = [
    {
      id: "frontend",
      name: "Frontend",
      icon: <Code className="w-5 h-5" />,
      description:
        "Responsables de la interfaz de usuario y experiencia de usuario de la plataforma.",
    },
    {
      id: "backend",
      name: "Backend",
      icon: <Database className="w-5 h-5" />,
      description: "Encargados de la lógica de negocio, APIs y bases de datos.",
    },
    {
      id: "design",
      name: "UX & UI",
      icon: <Palette className="w-5 h-5" />,
      description: "Creadores de la identidad visual y experiencia de usuario.",
    },
    {
      id: "sa",
      name: "Software Architecture",
      icon: <Star className="w-5 h-5" />,
      description: "Responsable de la arquitectura y diseño del software.",
    },
    {
      id: "devops",
      name: "DevOps",
      icon: <Cpu className="w-5 h-5" />,
      description:
        "Responsable de la infraestructura, despliegue y operaciones.",
    },
     {
      id: "fullstacks",
      name: "FullStacks",
      icon: <PcCase className="w-5 h-5" />,
      description:
        "Desarrolladores encargados tanto del frontend como del backend de la plataforma.",
    }
  ];

  const developers = [ 
    {
      id: 28,
      name: "Natalia Carpintero",
      role: "Scrum Master",
      department: "Backend",
      version: "2.0",
      github: "https://github.com/Carpinteron",
      email: "carpinteron@uninorte.edu.co",
    }, 
    {
      id: 27,
      name: "Isabella Arrieta",
      role: "FullStack Developer",
      department: "fullstacks",
      version: "2.0",
      github: "https://github.com/IsaAJ05",
      email: "isabellajuliao@uninorte.edu.co",
    },
    
    {
      id: 29,
      name: "Sebastian Brito",
      role: "FullStack Developer",
      department: "fullstacks",
      version: "2.0",
      github: "https://github.com/sbritoa20",
      email: "sbritoa@uninorte.edu.co",
    },
    
    {
      id: 23,
      name: "Carlos Arango",
      role: "Frontend Leader",
      department: "frontend",
      version: "2.0",
      github: "https://github.com/carlosam7",
      email: "arangocarlos@uninorte.edu.co",
    },
    {
      id: 21,
      name: "Andres Monserrat",
      role: "Frontend Developer",
      department: "frontend",
      version: "2.0",
      github: "https://github.com/andresmonserrat",
      email: "monserrata@uninorte.edu.co",
    },
    
   
    {
      id: 24,
      name: "Judith Perez",
      role: "Frontend Developer",
      department: "frontend",
      version: "2.0",
      github: "https://github.com/judithpc23",
      email: "jiconde@uninorte.edu.co",
    },
    {
      id: 26,
      name: "Kevin Torregrosa",
      role: "Backend Leader",
      department: "backend",
      version: "2.0",
      github: "https://github.com/MrManini",
      email: "kjtorregrosa@uninorte.edu.co",
    },
    {
      id: 22,
      name: "Esteban Dadul",
      role: "Backend Developer",
      department: "backend",
      version: "2.0",
      github: "https://github.com/edadul",
      email: "edadul@uninorte.edu.co",
    },
    {
      id: 25,
      name: "Nicolas Muvdi",
      role: "Backend Developer",
      department: "backend",
      version: "2.0",
      github: "https://github.com/muvdi1805",
      email: "namuvdi@uninorte.edu.co",
    },
    
   
    {
      id: 1,
      name: "Alejandra Valencia",
      role: "Scrum Master",
      department: "backend",
      version: "1.0",
      github: "https://github.com/alejavalerua",
      email: "alejandrarua@uninorte.edu.co",
    },
    {
      id: 2,
      name: "Juan Povea",
      role: "Backend Leader",
      department: "backend",
      version: "1.0",
      github: "https://github.com/J-Povea21",
      email: "japovea@uninorte.edu.co",
    },
    {
      id: 3,
      name: "Jorge Sánchez",
      role: "Frontend Leader",
      department: "frontend",
      version: "1.0",
      github: "https://github.com/jorgeluissanchez",
      email: "jlbarreneche@uninorte.edu.co",
    },
    {
      id: 4,
      name: "Carlos López",
      role: "UX/UI & Frontend developer",
      department: "design",
      version: "1.0",
      github: "https://github.com/cegallardo0405",
      email: "cegallardo@uninorte.edu.co",
    },
    {
      id: 5,
      name: "Yovany Zhu",
      role: "UX/UI & Frontend developer",
      department: "design",
      version: "1.0",
      github: "https://github.com/yzhuye",
      email: "yzhu@uninorte.edu.co",
    },
    {
      id: 6,
      name: "Jhonatan Romero",
      role: "Frontend developer",
      department: "frontend",
      version: "1.0",
      github: "https://github.com/jhonatanrp05",
      email: "jpachecos@uninorte.edu.co",
    },
    {
      id: 7,
      name: "Juan Carrasquilla",
      role: "Backend developer",
      department: "backend",
      version: "1.0",
      github: "https://github.com/JuanMicarras",
      email: "jmcarrasquilla@uninorte.edu.co",
    },
    {
      id: 8,
      name: "Camilo Navarro",
      role: "Frontend developer",
      department: "frontend",
      version: "1.0",
      github: "https://github.com/NavarroCamilo",
      email: "navarrocamilo@uninorte.edu.co",
    },
    {
      id: 9,
      name: "Manuel Yepes",
      role: "Frontend developer",
      department: "frontend",
      version: "1.0",
      github: "https://github.com/amyepes",
      email: "amyepes@uninorte.edu.co",
    },
    {
      id: 10,
      name: "Juan Pardo",
      role: "Frontend developer",
      department: "frontend",
      version: "1.0",
      github: "https://github.com/JuanPar063",
      email: "anzolas@uninorte.edu.co",
    },
    {
      id: 11,
      name: "Santiago Hoyos",
      role: "Frontend developer",
      department: "frontend",
      version: "1.0",
      github: "https://github.com/santiagohoyos20",
      email: "hoyosjs@uninorte.edu.co",
    },
    {
      id: 12,
      name: "Presly Romero",
      role: "Backend developer",
      department: "backend",
      version: "1.0",
      github: "https://github.com/PreslyR",
      email: "preslyr@uninorte.edu.co",
    },
    {
      id: 13,
      name: "Jesús Cabrera",
      role: "Backend developer",
      department: "backend",
      version: "1.0",
      github: "https://github.com/JesusC25",
      email: "jcabrerad@uninorte.edu.co",
    },
    {
      id: 14,
      name: "Bernardo Álvarez",
      role: "Frontend developer",
      department: "frontend",
      version: "1.0",
      github: "https://github.com/Bern723",
      email: "abernardo@uninorte.edu.co",
    },
    {
      id: 15,
      name: "Keiver Miranda",
      role: "Backend developer",
      department: "backend",
      version: "1.0",
      github: "https://github.com/keiver213",
      email: "mkeiver@uninorte.edu.co",
    },
    {
      id: 16,
      name: "Sandro Torres",
      role: "Backend developer",
      department: "backend",
      version: "1.0",
      github: "https://github.com/sandrotg",
      email: "tsandro@uninorte.edu.co",
    },
    {
      id: 17,
      name: "Camilo de la Rosa",
      role: "Devops",
      department: "devops",
      version: "1.0",
      github: "https://github.com/CamiloDlRM",
      email: "amovillac@uninorte.edu.co",
    },
    {
      id: 18,
      name: "María Osorno",
      role: "Frontend developer",
      department: "frontend",
      version: "1.0",
      github: "https://github.com/cosnor",
      email: "osornoc@uninorte.edu.co",
    },
    {
      id: 19,
      name: "Alberto Sandoval",
      role: "Backend developer",
      department: "backend",
      version: "1.0",
      github: "https://github.com/albertojs7",
      email: "albertojs@uninorte.edu.co",
    },
    {
      id: 20,
      name: "Daniel Romero",
      role: "Product manager",
      department: "sa",
      version: "1.0",
      github: "https://github.com/djromerom",
      email: "djromero@uninorte.edu.co",
    },
    
  ];

  const [activeDepartment, setActiveDepartment] = useState<string>("all");
  const [activeVersion, setActiveVersion] = useState<string>("all");

  // Función para filtrar desarrolladores por departamento
  const filteredDevelopers =
    developers.filter((dev) => {
      const byDept = activeDepartment === "all" ? true : dev.department === activeDepartment;
      const byVersion = activeVersion === "all" ? true : dev.version === activeVersion;
      return byDept && byVersion;
    });

  // Función para contar desarrolladores por departamento
  const getDepartmentCount = (deptId: string) => {
    return developers.filter((dev) => dev.department === deptId && (activeVersion === 'all' ? true : dev.version === activeVersion)).length;
  };

  // Tecnologías utilizadas
  const technologies = [
    { name: "React", icon: <Code className="w-4 h-4" /> },
    { name: "TypeScript", icon: <Code className="w-4 h-4" /> },
    { name: "Tailwind CSS", icon: <Palette className="w-4 h-4" /> },
    { name: "Nest.js", icon: <Cpu className="w-4 h-4" /> },
    { name: "Vite", icon: <Rocket className="w-4 h-4" /> },
    { name: "PostgreSQL", icon: <Database className="w-4 h-4" /> },
    { name: "Vercel", icon: <Globe className="w-4 h-4" /> },
    { name: "GitHub", icon: <Github className="w-4 h-4" /> },
    { name: "Figma", icon: <Camera className="w-4 h-4" /> },
    { name: "Prisma", icon: <Database className="w-4 h-4" /> },
    { name: "Docker", icon: <Container className="w-4 h-4" /> },
  ];

  // Estadísticas del proyecto
  const projectStats = [
    {
      value: "28",
      label: "Desarrolladores",
      icon: <Users className="w-6 h-6 text-[#AC7CFF]" />,
    },
    {
      value: "5",
      label: "Semanas de Desarrollo",
      icon: <Calendar className="w-6 h-6 text-[#AC7CFF]" />,
    },
    {
      value: "999+",
      label: "Commits",
      icon: <Github className="w-6 h-6 text-[#AC7CFF]" />,
    },
    {
      value: "∞",
      label: "Líneas de Código",
      icon: <Code className="w-6 h-6 text-[#AC7CFF]" />,
    },
  ];

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
                    <span>19 Desarrolladores</span>
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
                    className={`px-4 py-2 rounded-xl transition-all text-sm ${activeVersion === "all" ? "bg-[#AC7CFF] text-[#060312] border-2 border-[#AC7CFF]" : "text-gray-300 hover:bg-[#1A1428]"}`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setActiveVersion("1.0")}
                    className={`px-4 py-2 rounded-xl transition-all text-sm ${activeVersion === "1.0" ? "bg-blue-500/20 text-blue-300 border border-blue-400" : "text-gray-300 hover:bg-[#1A1428]"}`}
                  >
                    v1
                  </button>
                  <button
                    onClick={() => setActiveVersion("2.0")}
                    className={`px-4 py-2 rounded-xl transition-all text-sm ${activeVersion === "2.0" ? "bg-purple-500/20 text-purple-300 border border-purple-400" : "text-gray-300 hover:bg-[#1A1428]"}`}
                  >
                    v2
                  </button>
                </div>
                <div className="ml-auto text-sm text-gray-400">Filtra por versión de los desarrolladores</div>
              </div>
            </div>

            {/* Department Navigation */}
            <div className="mb-8">
              <div className="bg-[#110D20] p-2 rounded-lg flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveDepartment("all")}
                  className={`px-4 py-2 cursor-pointer rounded-md transition-all flex items-center gap-2 ${
                    activeDepartment === "all"
                      ? "bg-[#AC7CFF] text-[#060312] font-medium"
                      : "text-gray-300 hover:bg-[#1A1428]"
                  }`}
                >
                  <Globe className="w-5 h-5" />
                  Todos ({developers.filter(d => activeVersion === 'all' ? true : d.version === activeVersion).length})
                </button>
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => setActiveDepartment(dept.id)}
                    className={`px-4 py-2 cursor-pointer rounded-md transition-all flex items-center gap-2 ${
                      activeDepartment === dept.id
                        ? "bg-[#AC7CFF] text-[#060312] font-medium"
                        : "text-gray-300 hover:bg-[#1A1428]"
                    }`}
                  >
                    <span
                      className={`transition-colors ${
                        activeDepartment === dept.id
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
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-center">
                          {dev.name}
                        </h3>
                        {dev.version && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${dev.version === "1.0" ? "bg-blue-500/20 text-blue-300" : "bg-purple-500/20 text-purple-300"}`}>
                            v{dev.version}
                          </span>
                        )}
                      </div>
                      <p className="text-[#AC7CFF] text-sm mb-2">{dev.role}</p>
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
