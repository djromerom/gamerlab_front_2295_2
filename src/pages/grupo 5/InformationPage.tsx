"use client";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  Calendar,
  Trophy,
  Palette,
  Users,
  MapPin,
  Clock,
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTestimonialSlide, setCurrentTestimonialSlide] = useState(0);
  const [isTestimonialChanging, setIsTestimonialChanging] = useState(false);
  const [isTitleChanging, setIsTitleChanging] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [testimonialType, setTestimonialType] = useState<
    "participants" | "attendees"
  >("participants");

  const totalSlides = 30; // Total number of slides in the carousel

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const nextTestimonialSlide = () => {
    const testimonialCount =
      testimonialType === "participants"
        ? testimonials.length
        : attendeeTestimonials.length;
    setCurrentTestimonialSlide((prev) =>
      prev === testimonialCount - 1 ? 0 : prev + 1
    );
  };

  const prevTestimonialSlide = () => {
    const testimonialCount =
      testimonialType === "participants"
        ? testimonials.length
        : attendeeTestimonials.length;
    setCurrentTestimonialSlide((prev) =>
      prev === 0 ? testimonialCount - 1 : prev - 1
    );
  };

  const goToTestimonialSlide = (index: number) => {
    setCurrentTestimonialSlide(index);
  };

  const imagePaths = Array.from(
    { length: 29 },
    (_, i) => `/assets/carousel/${i + 2}.JPG`
  );

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

  // Testimonios de participantes
  const testimonials = [
    {
      id: 1,
      name: "Fabian de Jesús Miranda Varelo",
      role: "Participante - Carrot Mania",
      quote:
        "El año pasado fui expositor en la feria gamer con Carrot Mania, un juego diseñado para comparar la eficiencia de la iteratividad con la recursividad. La dinámica consistía en ayudar a un conejo a recuperar sus zanahorias atrapadas en burbujas. Fue una experiencia enriquecedora, donde pude interactuar con estudiantes de bachillerato, asistentes y jurados, recibiendo valiosa retroalimentación que me ayudó a mejorar mi propuesta y reforzar mis habilidades en el desarrollo de videojuegos.",
    },
    {
      id: 2,
      name: "Laura González Valdeblanquez",
      role: "Participante - Musical Bubble Coffe",
      quote:
        "La participación en la FeriaGamer fue una experiencia muy enriquecedora y gratificante, ya que brindó el espacio para poder mostrar el proyecto, que se logró con tanto fuerzo y trabajo en equipo, a personas interesadas, lo cual , en particular, me hacía mucha ilusión. Además, la dinámica de presentar el proyecto para diferentes jurados y demás público, nos ayuda a prepararnos para saber como actuar de acuerdo a la persona.",
    },
    {
      id: 3,
      name: "Marian Andrea Pacheco Charris ",
      role: "Participante",
      quote:
        "Puedo describir mi experiencia participando en la feria gamer como muy enriquecedora, fue un excelente espacio para profundizar mis habilidades de comunicación, y exponer acerca del proceso que fue realizar un proyecto que relacionaba dos materias de programación. Además, me brindó la oportunidad de escuchar diferentes opiniones y críticas constructivas para tener en cuenta en mis próximos proyectos.",
    },
    {
      id: 4,
      name: "Arturo José González Barros",
      role: "Participante",
      quote:
        "Participar en la feria gamer fue para mí un verdadero reto. Pensar en haber hecho un programa completamente funcional con los conocimientos aprendidos en clase me hizo darme cuenta de las grandes capacidades que uno puede llegar a tener y el excelente trabajo de los profesores al enseñarnos las bases necesarias para afrontar esos grandes retos. Me gustó mucho tener un equipo de trabajo del cuál podía apoyarme y entenderme bastante bien, lo que facilitó las fechas de entrega y la presentación de un excelente trabajo. Y por último, me motivó a hacer trabajos similares para adquirir experiencias y probar mis conocimientos.",
    },
  ];

  const attendeeTestimonials = [
    {
      id: 1,
      name: "Jefferson Jose Torres Lora",
      role: "Monitor Programación Orientada a Objetos",
      quote:
        "La dinámica de los jóvenes en la feria gamer es excelente, ya que no solo aprenden sobre programación y desarrollo, sino que también adquieren conciencia sobre la temática central del evento. Esto permite que los estudiantes se diviertan y se entretengan mientras aprenden de forma progresiva y significativa.",
    },
    {
      id: 2,
      name: "Elvira Elena Florez Carbonell",
      role: "Monitora Estructura de Datos I y Algoritmia y Programación I",
      quote:
        "Desde mi experiencia como monitora y jurado en la feria gamer, considero que este espacio, si bien aún presenta muchas oportunidades para mejorar y crecer, también representa una gran oportunidad para mostrar a las demás carreras los proyectos desarrollados por los alumnos. Además, permite que tanto participantes como visitantes observen, reflexionen y aprecien de primera mano cómo se evidencian los avances en resultados a medida que se progresa de semestre.",
    },
    {
      id: 2,
      name: "Margarita Gamarra Acosta",
      role: "Profesora Departamento de Ingeniería de Sistemas y Computación",
      quote:
        "Para mi la feria gamer es una muestra del trabajo, esfuerzo y pasión de todos los estudiantes participantes. El trabajo en equipo se ve reflejado en los excelentes resultados que muestran en cada uno de sus videojuegos, esta es ya la tercera versión de la feria y cada vez quedo mas sorprendida con las presentaciones y la creatividad de los trabajos que presentan, cada semestre agregan nuevas y mejores herramientas a los videojuegos y este semestre se unen mas estudiantes interesados en participar, este semestre queremos brindarle un espacio habierto para toda la comunidad uninorteña, para que los proyectos sean visibles ante toda la comunidad académica.",
    },
  ];

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
            Información General
          </h1>

          {/* Hero Section */}
          <div className="w-full max-w-4xl mb-12">
            <div className="relative gradient-border gradient-border-purple p-0">
              <div className="gradient-border-inner"></div>
              <div className="relative z-10 p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-[#AC7CFF]">
                  ¡Bienvenidos a la Feria Gamer Uninorte 2025!
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
                    <span>04 Junio, 2025</span>
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
                videojuegos para crear conciencia ambiental. Bajo el lema “Juega
                Verde, Piensa Verde”, los videojuegos estarán inspirados en el
                cuidado del planeta, la sostenibilidad y el impacto positivo de
                la tecnología.
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
                    Jornada AM - 05 de Junio
                  </h4>
                  <p>8:30 - 12:00: Exhibiciones y stands</p>
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
                Disfruta de múltiples actividades durante los tres días del
                evento:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#AC7CFF]"></div>
                  <span>Zona de realidad virtual</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#AC7CFF]"></div>
                  <span>Zona retro gaming</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#AC7CFF]"></div>
                  <span>Talleres de desarrollo de videojuegos</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Previous Edition Section - REDESIGNED */}
          <div className="w-full max-w-4xl mt-16">
            <div className="flex items-center gap-3 mb-6 justify-center">
              <History className="w-6 h-6 text-[#AC7CFF]" />
              <h2 className="text-2xl font-bold text-center">
                Edición Anterior - 2024
              </h2>
            </div>

            {/* Main info about previous edition */}
            <div className="relative gradient-border gradient-border-purple p-0 mb-8">
              <div className="gradient-border-inner"></div>
              <div className="relative z-10 p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="md:w-1/2">
                    <img
                      src={"/assets/carousel/MainPhoto.JPG"}
                      alt="Feria Gamer 2024"
                      className="rounded-lg shadow-lg object-cover w-full"
                    />
                  </div>
                  <div className="md:w-1/2">
                    <h3 className="text-xl font-bold mb-4 text-[#AC7CFF]">
                      Educación a través del Gaming
                    </h3>
                    <p className="text-gray-300 mb-4">
                      Innovación y aprendizaje se fusionaron en la II Feria
                      Gamer del programa de Ingeniería de Sistemas y
                      Computación, evento donde los videojuegos se transformaron
                      en herramientas para educar sobre los peligros del mundo
                      digital.
                    </p>
                    <p className="text-gray-300 mb-4">
                      Estudiantes de primero a tercer semestre presentaron el
                      jueves, 28 de noviembre de 2024, sus proyectos finales,
                      una serie de videojuegos diseñados para generar conciencia
                      sobre riesgos como el grooming, phishing y ciberacoso,
                      mientras demostraban su creatividad y dominio técnico en
                      programación.
                    </p>
                    <div className="flex items-center gap-2 bg-[#110D20] px-4 py-2 rounded-full inline-flex">
                      <Calendar className="w-4 h-4 text-[#AC7CFF]" />
                      <span className="text-sm">28 de noviembre, 2024</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features of previous edition */}
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

            {/* Educational focus */}
            <div className="relative gradient-border gradient-border-purple p-0 mb-8">
              <div className="gradient-border-inner"></div>
              <div className="relative z-10 p-6 md:p-8">
                <h3 className="text-xl font-bold mb-4 text-[#AC7CFF]">
                  Enfoque Educativo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#110D20] p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-5 h-5 text-[#AC7CFF]" />
                      <h4 className="font-semibold">Anti-Grooming</h4>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Videojuegos que enseñan a identificar y prevenir el acoso
                      en línea por parte de adultos hacia menores.
                    </p>
                  </div>
                  <div className="bg-[#110D20] p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-5 h-5 text-[#AC7CFF]" />
                      <h4 className="font-semibold">Anti-Phishing</h4>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Experiencias interactivas para reconocer intentos de
                      suplantación de identidad y estafas en línea.
                    </p>
                  </div>
                  <div className="bg-[#110D20] p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-5 h-5 text-[#AC7CFF]" />
                      <h4 className="font-semibold">Anti-Ciberacoso</h4>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Juegos que concientizan sobre el impacto del acoso en
                      línea y cómo combatirlo efectivamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Games */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-[#AC7CFF] text-center">
                Juegos Destacados
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="game-card">
                  <div className="flex items-center gap-3">
                    <Gamepad2 className="w-5 h-5 text-[#AC7CFF]" />
                    <div>
                      <h4 className="font-semibold">Dulces y Burbujas</h4>
                    </div>
                  </div>
                </div>
                <div className="game-card">
                  <div className="flex items-center gap-3">
                    <Gamepad2 className="w-5 h-5 text-[#AC7CFF]" />
                    <div>
                      <h4 className="font-semibold">
                        Leyendas de Papel, Páginas de Aventura
                      </h4>
                    </div>
                  </div>
                </div>
                <div className="game-card">
                  <div className="flex items-center gap-3">
                    <Gamepad2 className="w-5 h-5 text-[#AC7CFF]" />
                    <div>
                      <h4 className="font-semibold">Carrot Mania</h4>
                    </div>
                  </div>
                </div>
                <div className="game-card">
                  <div className="flex items-center gap-3">
                    <Gamepad2 className="w-5 h-5 text-[#AC7CFF]" />
                    <div>
                      <h4 className="font-semibold">Musical Bubble Coffe</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Carousel */}
            <div className="carousel h-[300px] md:h-[400px] mb-8">
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
                          Feria Gamer 2024
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
                      ? testimonials
                      : attendeeTestimonials
                    ).map((testimonial) => (
                      <div
                        key={testimonial.id}
                        className="carousel-item h-full"
                      >
                        <div className="testimonial-card border-none bg-transparent">
                          <div className="flex flex-col h-full">
                            <p className="text-gray-300 mb-6 flex-grow text-center text-lg italic">
                              "{testimonial.quote}"
                            </p>
                            <div className="flex items-center justify-center gap-4 mt-auto">
                              <div className="w-[50px] h-[50px] rounded-full bg-[#1A1428] flex items-center justify-center border-2 border-[#AC7CFF]">
                                <User className="w-6 h-6 text-[#AC7CFF]" />
                              </div>
                              <div>
                                <h4 className="font-semibold">
                                  {testimonial.name}
                                </h4>
                                <p className="text-sm text-[#AC7CFF]">
                                  {testimonial.role}
                                </p>
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
                      ? testimonials
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

          {/* Registration Section */}
          <div className="w-full max-w-4xl mt-16">
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
          </div>

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
