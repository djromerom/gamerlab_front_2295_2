"use client";

import { useState } from "react";
import {
  Users,
  RefreshCw,
  UserX,
  UserPlus,
  Shield,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AppSidebar } from "@/components/grupo 9/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface Jurado {
  id: number;
  name: string;
  email: string;
  avatar: string;
  specialty: string;
  tipo: "oficial" | "remanente";
  status: "disponible" | "ausente";
  rol?: "principal" | "auxiliar";
  ultimaConexion?: string;
}

interface Team {
  id: number;
  name: string;
  game: string;
  semester: string;
  jurados: Jurado[];
  requiredJurados: number;
}

const initialJurados: Jurado[] = [
  // Jurados Oficiales
  { id: 1, name: "Dr. Carlos Mendoza", email: "cmendoza@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", specialty: "Game Design", tipo: "oficial", status: "disponible", ultimaConexion: "22/04/2026, 18:45" },
  { id: 2, name: "Dra. Laura Torres", email: "ltorres@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", specialty: "Programming", tipo: "oficial", status: "disponible", ultimaConexion: "23/04/2026, 09:30" },
  { id: 3, name: "Ing. Roberto Silva", email: "rsilva@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", specialty: "UX/UI", tipo: "oficial", status: "disponible", ultimaConexion: "21/04/2026, 14:22" },
  { id: 4, name: "Dra. Ana Morales", email: "amorales@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", specialty: "Game Design", tipo: "oficial", status: "disponible", ultimaConexion: "23/04/2026, 11:15" },
  { id: 5, name: "Dr. Miguel Ruiz", email: "maruiz@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", specialty: "Programming", tipo: "oficial", status: "disponible", ultimaConexion: "22/04/2026, 16:50" },
  { id: 6, name: "Ing. Patricia Gómez", email: "pgomez@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop", specialty: "Graphics", tipo: "oficial", status: "disponible", ultimaConexion: "20/04/2026, 20:10" },
  { id: 7, name: "Dr. Fernando Castro", email: "fcastro@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop", specialty: "Game Design", tipo: "oficial", status: "disponible", ultimaConexion: "23/04/2026, 08:05" },
  { id: 8, name: "Dra. Sofía Ramírez", email: "sramirez@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop", specialty: "Programming", tipo: "oficial", status: "disponible", ultimaConexion: "22/04/2026, 13:40" },
  { id: 9, name: "Ing. David López", email: "dlopez@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop", specialty: "UX/UI", tipo: "oficial", status: "disponible", ultimaConexion: "21/04/2026, 17:55" },
  { id: 10, name: "Dra. Elena Vargas", email: "evargas@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop", specialty: "Graphics", tipo: "oficial", status: "disponible", ultimaConexion: "23/04/2026, 10:20" },
  { id: 11, name: "Ing. Andrés Pérez", email: "aperez@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop", specialty: "Programming", tipo: "oficial", status: "disponible", ultimaConexion: "22/04/2026, 15:35" },
  { id: 12, name: "Dra. Lucía Martínez", email: "lmartinez@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop", specialty: "Game Design", tipo: "oficial", status: "disponible", ultimaConexion: "20/04/2026, 19:25" },
  { id: 13, name: "Dr. Gabriel Sánchez", email: "gsanchez@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop", specialty: "UX/UI", tipo: "oficial", status: "disponible", ultimaConexion: "23/04/2026, 12:00" },
  { id: 14, name: "Dra. Valentina Cruz", email: "vcruz@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=100&h=100&fit=crop", specialty: "Graphics", tipo: "oficial", status: "disponible", ultimaConexion: "21/04/2026, 16:10" },
  { id: 15, name: "Ing. Tomás Reyes", email: "treyes@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop", specialty: "Programming", tipo: "oficial", status: "disponible", ultimaConexion: "22/04/2026, 14:30" },
  { id: 16, name: "Dra. Isabella Romero", email: "iromero@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=100&h=100&fit=crop", specialty: "Game Design", tipo: "oficial", status: "disponible", ultimaConexion: "23/04/2026, 07:50" },
  { id: 17, name: "Dr. Santiago Mejía", email: "smejia@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=100&h=100&fit=crop", specialty: "UX/UI", tipo: "oficial", status: "disponible", ultimaConexion: "20/04/2026, 21:15" },
  { id: 18, name: "Dra. Camila Herrera", email: "cherrera@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1581403341630-a6e0b9d2d257?w=100&h=100&fit=crop", specialty: "Graphics", tipo: "oficial", status: "disponible", ultimaConexion: "22/04/2026, 11:45" },
  { id: 19, name: "Ing. Mateo Jiménez", email: "mjimenez@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&h=100&fit=crop", specialty: "Programming", tipo: "oficial", status: "disponible", ultimaConexion: "21/04/2026, 13:05" },
  { id: 20, name: "Dra. Mariana Ortiz", email: "mortiz@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop", specialty: "Game Design", tipo: "oficial", status: "disponible", ultimaConexion: "23/04/2026, 09:55" },

  // Jurados Remanentes (Suplentes)
  { id: 21, name: "Ing. José Hernández", email: "jhernandez@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop", specialty: "UX/UI", tipo: "remanente", status: "disponible", ultimaConexion: "22/04/2026, 17:20" },
  { id: 22, name: "Dra. Carmen Díaz", email: "cdiaz@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop", specialty: "Graphics", tipo: "remanente", status: "disponible", ultimaConexion: "21/04/2026, 15:40" },
  { id: 23, name: "Dr. Ricardo Soto", email: "rsoto@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=100&h=100&fit=crop", specialty: "Programming", tipo: "remanente", status: "disponible", ultimaConexion: "20/04/2026, 18:30" },
  { id: 24, name: "Ing. María Campos", email: "mcampos@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop", specialty: "Game Design", tipo: "remanente", status: "disponible", ultimaConexion: "23/04/2026, 10:10" },
  { id: 25, name: "Dr. Pablo Rojas", email: "projas@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop", specialty: "UX/UI", tipo: "remanente", status: "disponible", ultimaConexion: "22/04/2026, 12:25" },
  { id: 26, name: "Dra. Isabel Núñez", email: "inunez@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=100&h=100&fit=crop", specialty: "Graphics", tipo: "remanente", status: "disponible", ultimaConexion: "21/04/2026, 19:50" },
  { id: 27, name: "Ing. Julio Vega", email: "jvega@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop", specialty: "Programming", tipo: "remanente", status: "disponible", ultimaConexion: "20/04/2026, 16:35" },
  { id: 28, name: "Dra. Andrea Parra", email: "aparra@uninorte.edu.co", avatar: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=100&h=100&fit=crop", specialty: "Game Design", tipo: "remanente", status: "disponible", ultimaConexion: "23/04/2026, 08:40" },
];

const initialTeams: Team[] = [
  { id: 1, name: "SecurityFools", game: "CyberMaze", semester: "Semestre 4", jurados: [], requiredJurados: 3 },
  { id: 2, name: "Aracataca fc", game: "CyberDefenders: Cybercity", semester: "Semestre 1", jurados: [], requiredJurados: 3 },
  { id: 3, name: "Cyber Heroes", game: "Cyber Hero", semester: "Semestre 2", jurados: [], requiredJurados: 3 },
  { id: 4, name: "CyberLife INC", game: "Security Run", semester: "Semestre 3", jurados: [], requiredJurados: 3 },
  { id: 5, name: "Digital Warriors", game: "Data Shield", semester: "Semestre 4", jurados: [], requiredJurados: 3 },
  { id: 6, name: "Code Breakers", game: "Firewall Escape", semester: "Semestre 2", jurados: [], requiredJurados: 3 },
];

export function JuradosAssignment() {
  const [jurados, setJurados] = useState<Jurado[]>(initialJurados);
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showJuradoModal, setShowJuradoModal] = useState(false);
  const [asignarComoAuxiliar, setAsignarComoAuxiliar] = useState(false);
  const [showJuradosListModal, setShowJuradosListModal] = useState(false);

  console.log("Jurados:", jurados.length);
  console.log("Teams:", teams.length);

  // Obtener jurados disponibles
  const getJuradosDisponibles = (tipo?: "oficial" | "remanente") => {
    const asignados = teams.flatMap(t => t.jurados.map(j => j.id));
    return jurados.filter(j => {
      const disponible = j.status === "disponible" && !asignados.includes(j.id);
      if (tipo) {
        return disponible && j.tipo === tipo;
      }
      return disponible;
    });
  };

  // Asignación automática usando solo jurados oficiales
  const assignJuradosAutomatically = () => {
    const oficiales = getJuradosDisponibles("oficial");

    if (oficiales.length < teams.length * 3) {
      alert("No hay suficientes jurados oficiales disponibles para asignar automáticamente");
      return;
    }

    let juradoIndex = 0;
    const newTeams = teams.map(team => {
      const juradosAsignados: Jurado[] = [];
      for (let i = 0; i < team.requiredJurados; i++) {
        if (oficiales[juradoIndex]) {
          juradosAsignados.push(oficiales[juradoIndex]);
          juradoIndex++;
        }
      }
      return { ...team, jurados: juradosAsignados };
    });

    setTeams(newTeams);
  };

  // Agregar jurado a un equipo
  const addJuradoToTeam = (teamId: number, jurado: Jurado) => {
    setTeams(teams.map(t => {
      if (t.id === teamId) {
        const juradosActuales = t.jurados.filter(j => !j.rol || j.rol === "principal");

        // Si está asignando como auxiliar, siempre permitir
        if (asignarComoAuxiliar) {
          return { ...t, jurados: [...t.jurados, { ...jurado, rol: "auxiliar" }] };
        }

        // Si hay espacio para principales, agregar como principal
        if (juradosActuales.length < t.requiredJurados) {
          return { ...t, jurados: [...t.jurados, { ...jurado, rol: "principal" }] };
        }
      }
      return t;
    }));
    setSelectedTeam(null);
    setShowJuradoModal(false);
    setAsignarComoAuxiliar(false);
  };

  // Abrir modal para seleccionar jurado
  const openJuradoModal = (team: Team, esAuxiliar = false) => {
    setSelectedTeam(team);
    setAsignarComoAuxiliar(esAuxiliar);
    setShowJuradoModal(true);
  };

  // Remover jurado de un equipo
  const removeJuradoFromTeam = (teamId: number, juradoId: number) => {
    setTeams(teams.map(t => {
      if (t.id === teamId) {
        return { ...t, jurados: t.jurados.filter(j => j.id !== juradoId) };
      }
      return t;
    }));
  };

  // Reemplazar jurado ausente con remanente
  const replaceWithRemanente = (teamId: number, juradoAusenteId: number, juradoRemanente: Jurado) => {
    // Marcar el oficial como ausente
    setJurados(jurados.map(j =>
      j.id === juradoAusenteId ? { ...j, status: "ausente" } : j
    ));

    // Reemplazar en el equipo
    setTeams(teams.map(t => {
      if (t.id === teamId) {
        return {
          ...t,
          jurados: t.jurados.map(j =>
            j.id === juradoAusenteId ? juradoRemanente : j
          )
        };
      }
      return t;
    }));
  };

  // Marcar jurado como ausente
  const markJuradoAsAusent = (juradoId: number) => {
    if (!confirm("¿Marcar este jurado como ausente? Se removerá de todos los equipos y deberás asignar un remanente.")) return;

    setJurados(jurados.map(j =>
      j.id === juradoId ? { ...j, status: "ausente" } : j
    ));

    setTeams(teams.map(t => ({
      ...t,
      jurados: t.jurados.filter(j => j.id !== juradoId)
    })));
  };

  // Restaurar jurado ausente
  const restoreJurado = (juradoId: number) => {
    setJurados(jurados.map(j =>
      j.id === juradoId ? { ...j, status: "disponible" } : j
    ));
  };

  // Resetear todas las asignaciones
  const resetAllAssignments = () => {
    if (!confirm("¿Estás seguro de que quieres eliminar todas las asignaciones?")) return;
    setTeams(teams.map(t => ({ ...t, jurados: [] })));
  };

  const juradosOficialesDisponibles = getJuradosDisponibles("oficial");
  const juradosRemanentesDisponibles = getJuradosDisponibles("remanente");
  const juradosAusentes = jurados.filter(j => j.status === "ausente");
  const totalAsignados = teams.reduce((sum, t) => sum + t.jurados.filter(j => !j.rol || j.rol === "principal").length, 0);
  const totalRequeridos = teams.reduce((sum, t) => sum + t.requiredJurados, 0);
  const equiposCompletos = teams.filter(t => t.jurados.filter(j => !j.rol || j.rol === "principal").length === t.requiredJurados).length;
  const remanentesEnUso = teams.flatMap(t => t.jurados).filter(j => j.tipo === "remanente").length;
  const auxiliaresEnUso = teams.flatMap(t => t.jurados).filter(j => j.rol === "auxiliar").length;

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 z-20" />

            <nav aria-label="breadcrumb">
              <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5">
                <li className="items-center gap-1.5 hidden md:block">
                  <Link
                    to="/inicio"
                    className="hover:text-foreground transition-colors"
                  >
                    Inicio
                  </Link>
                </li>

                <li
                  role="presentation"
                  aria-hidden="true"
                  className="hidden md:inline"
                >
                  <ChevronRight className="size-3.5" />
                </li>

                <li className="inline-flex items-center gap-1.5">
                  <span className="text-foreground">Asignación de Jurados</span>
                </li>
              </ol>
            </nav>
          </div>
        </header>

        <div className="bg-background text-foreground min-h-screen p-4">
          <div className="px-4 py-2">
            <h1 className="text-xl font-medium mb-2">
              Gestión de Jurados - Asignación de Equipos
            </h1>

            <p className="text-muted-foreground mb-8 text-sm md:text-base">
              Asigna jurados oficiales automáticamente y usa jurados remanentes
              como respaldo.
            </p>

            {/* Stats Cards */}
            <div className="max-w-7xl grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="bg-card border border-border rounded-xl p-3 md:p-4">
                <div className="text-xs mb-1 flex items-center gap-1 text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span>Oficiales</span>
                </div>
                <div className="text-xl md:text-2xl">{juradosOficialesDisponibles.length}</div>
                <div className="text-xs text-muted-foreground">disponibles</div>
              </div>

              <div className="bg-card border border-border rounded-xl p-3 md:p-4">
                <div className="text-xs mb-1 flex items-center gap-1 text-muted-foreground">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Remanentes</span>
                </div>
                <div className="text-xl md:text-2xl">{juradosRemanentesDisponibles.length}</div>
                <div className="text-xs text-muted-foreground">disponibles</div>
              </div>

              <div className="bg-card border border-border rounded-xl p-3 md:p-4">
                <div className="text-xs mb-1 text-muted-foreground">Asignados</div>
                <div className="text-xl md:text-2xl">
                  {totalAsignados}/{totalRequeridos}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-3 md:p-4">
                <div className="text-xs mb-1 text-muted-foreground">Equipos OK</div>
                <div className="text-xl md:text-2xl">
                  {equiposCompletos}/{teams.length}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-3 md:p-4">
                <div className="text-xs mb-1 text-muted-foreground">Rem. en uso</div>
                <div className="text-xl md:text-2xl">{remanentesEnUso}</div>
              </div>

              <div className="bg-card border border-border rounded-xl p-3 md:p-4">
                <div className="text-xs mb-1 text-muted-foreground">Auxiliares</div>
                <div className="text-xl md:text-2xl">{auxiliaresEnUso}</div>
              </div>

              <div className="bg-card border border-border rounded-xl p-3 md:p-4">
                <div className="text-xs mb-1 text-muted-foreground">Ausentes</div>
                <div className="text-xl md:text-2xl">{juradosAusentes.length}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="max-w-7xl flex flex-wrap gap-3 md:gap-4 mb-8 md:mb-12">
              <button
                onClick={() => setShowJuradosListModal(true)}
                className="inline-flex items-center gap-2 rounded-md border bg-card hover:bg-accent text-foreground px-4 md:px-6 py-2 md:py-3 text-sm md:text-base"
              >
                <Users className="w-4 md:w-5 h-4 md:h-5" />
                Lista de Jurados
              </button>

              <button
                onClick={assignJuradosAutomatically}
                className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 md:px-6 py-2 md:py-3 text-sm md:text-base"
              >
                <RefreshCw className="w-4 md:w-5 h-4 md:h-5" />
                <span className="hidden sm:inline">Asignar Jurados Oficiales</span>
                <span className="sm:hidden">Asignar</span>
              </button>

              <button
                onClick={resetAllAssignments}
                className="inline-flex items-center gap-2 rounded-md border bg-card hover:bg-accent text-foreground px-4 md:px-6 py-2 md:py-3 text-sm md:text-base"
              >
                <UserX className="w-4 md:w-5 h-4 md:h-5" />
                Limpiar Todo
              </button>
            </div>

            <div className="max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
              {/* Teams Section - 3 columns */}
              <div className="lg:col-span-3 order-2 lg:order-1">
                <h2 className="text-xl md:text-2xl mb-4 md:mb-6 flex items-center gap-2">
                  <Users className="w-6 md:w-7 h-6 md:h-7" />
                  Equipos ({teams.length})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {teams.map((team) => {
                    const juradosPrincipales = team.jurados.filter(
                      (j) => !j.rol || j.rol === "principal"
                    );
                    const juradosAuxiliares = team.jurados.filter(
                      (j) => j.rol === "auxiliar"
                    );
                    const isComplete =
                      juradosPrincipales.length === team.requiredJurados;
                    const isEmpty = team.jurados.length === 0;
                    const hasRemanentes = team.jurados.some(
                      (j) => j.tipo === "remanente"
                    );
                    const hasAuxiliares = juradosAuxiliares.length > 0;

                    return (
                      <div
                        key={team.id}
                        className={`bg-card border rounded-2xl p-4 md:p-6 transition-all ${isComplete
                            ? hasRemanentes
                              ? "border-amber-500/50"
                              : "border-green-500/50"
                            : isEmpty
                              ? "border-red-500/30"
                              : "border-yellow-500/30"
                          }`}
                      >
                        <div className="mb-3 md:mb-4 pb-3 md:pb-4 border-b border-border">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base md:text-lg font-medium truncate">
                                {team.game}
                              </h3>
                              <p className="text-muted-foreground text-sm truncate">
                                Equipo: {team.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {team.semester}
                              </p>
                            </div>

                            <div className="flex flex-col gap-1 items-end flex-shrink-0">
                              <div className="px-2 md:px-3 py-1 rounded-full text-xs border bg-muted">
                                {juradosPrincipales.length}/{team.requiredJurados}
                                {hasAuxiliares && (
                                  <span className="ml-1">+{juradosAuxiliares.length}</span>
                                )}
                              </div>

                              {hasRemanentes && (
                                <div className="px-2 py-1 rounded-full text-xs border border-amber-500/30 text-amber-500 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span className="hidden md:inline">Con remanentes</span>
                                  <span className="md:hidden">Remanente</span>
                                </div>
                              )}

                              {hasAuxiliares && (
                                <div className="px-2 py-1 rounded-full text-xs border flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span className="hidden md:inline">Con auxiliares</span>
                                  <span className="md:hidden">Aux.</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 md:space-y-3 mb-3 md:mb-4">
                          {team.jurados.map((jurado) => (
                            <div
                              key={jurado.id}
                              className={`border rounded-xl p-2 md:p-3 flex items-center gap-2 md:gap-3 group hover:border-primary/50 transition-all ${jurado.rol === "auxiliar"
                                  ? "bg-card border-cyan-500/30"
                                  : jurado.tipo === "oficial"
                                    ? "bg-card border-blue-500/30"
                                    : "bg-card border-amber-500/30"
                                }`}
                            >
                              <div className="relative flex-shrink-0">
                                <img
                                  src={jurado.avatar}
                                  alt={jurado.name}
                                  className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-border object-cover"
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="text-xs md:text-sm font-medium truncate">
                                  {jurado.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  <span className="hidden md:inline">
                                    {jurado.specialty} •{" "}
                                    {jurado.rol === "auxiliar"
                                      ? "Auxiliar"
                                      : jurado.tipo === "oficial"
                                        ? "Oficial"
                                        : "Remanente"}
                                  </span>
                                  <span className="md:hidden">
                                    {jurado.rol === "auxiliar"
                                      ? "Auxiliar"
                                      : jurado.tipo === "oficial"
                                        ? "Oficial"
                                        : "Remanente"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button
                                  onClick={() => markJuradoAsAusent(jurado.id)}
                                  className="p-1.5 md:p-2 rounded-lg border hover:bg-accent transition-all"
                                  title="Marcar ausente"
                                >
                                  <UserX className="w-3 md:w-4 h-3 md:h-4" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {Array.from({
                            length: team.requiredJurados - juradosPrincipales.length,
                          }).map((_, idx) => (
                            <button
                              key={`empty-${idx}`}
                              onClick={() => openJuradoModal(team, false)}
                              className="w-full h-12 md:h-16 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-accent/30 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                              <UserPlus className="w-4 md:w-5 h-4 md:h-5" />
                              <span className="hidden md:inline">Agregar Jurado</span>
                              <span className="md:hidden">Agregar</span>
                            </button>
                          ))}

                          {isComplete && (
                            <button
                              onClick={() => openJuradoModal(team, true)}
                              className="w-full h-12 md:h-16 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-accent/30 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                              <UserPlus className="w-4 md:w-5 h-4 md:h-5" />
                              <span className="hidden md:inline">Agregar Auxiliar</span>
                              <span className="md:hidden">+ Auxiliar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar - Jurados Pool */}
              <div className="lg:col-span-1 space-y-4 md:space-y-6 order-1 lg:order-2">
                <div>
                  <h3 className="text-base md:text-xl mb-3 md:mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    <span>Jurados Oficiales</span>
                  </h3>

                  <div className="bg-card border border-border rounded-xl p-3 mb-3">
                    <p className="text-xs text-muted-foreground">
                      Disponibles:{" "}
                      <span className="font-bold text-lg text-foreground">
                        {juradosOficialesDisponibles.length}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2 md:space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {juradosOficialesDisponibles.map((jurado) => (
                      <div
                        key={jurado.id}
                        className="bg-card border border-border rounded-xl p-2 md:p-3 transition-all"
                      >
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="relative">
                            <img
                              src={jurado.avatar}
                              alt={jurado.name}
                              className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-border object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs md:text-sm font-medium truncate">
                              {jurado.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {jurado.specialty}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {juradosOficialesDisponibles.length === 0 && (
                      <p className="text-muted-foreground text-center py-8 text-sm">
                        No hay jurados oficiales disponibles
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-base md:text-xl mb-3 md:mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Jurados Remanentes</span>
                  </h3>

                  <div className="bg-card border border-border rounded-xl p-3 mb-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      Disponibles:{" "}
                      <span className="font-bold text-lg text-foreground">
                        {juradosRemanentesDisponibles.length}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Úsalos solo si un oficial no llega
                    </p>
                  </div>

                  <div className="space-y-2 md:space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {juradosRemanentesDisponibles.map((jurado) => (
                      <div
                        key={jurado.id}
                        className="bg-card border border-border rounded-xl p-2 md:p-3 transition-all"
                      >
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="relative">
                            <img
                              src={jurado.avatar}
                              alt={jurado.name}
                              className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-border object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs md:text-sm font-medium truncate">
                              {jurado.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {jurado.specialty}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {juradosRemanentesDisponibles.length === 0 && (
                      <p className="text-muted-foreground text-center py-8 text-sm">
                        No hay jurados remanentes disponibles
                      </p>
                    )}
                  </div>
                </div>

                {juradosAusentes.length > 0 && (
                  <div>
                    <h3 className="text-sm md:text-base mb-2 md:mb-3 flex items-center gap-1.5">
                      <UserX className="w-4 md:w-5 h-4 md:h-5" />
                      <span>Ausentes ({juradosAusentes.length})</span>
                    </h3>

                    <div className="space-y-1.5 md:space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {juradosAusentes.map((jurado) => (
                        <div
                          key={jurado.id}
                          className="bg-card border border-border rounded-lg p-2 md:p-2.5 group"
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={jurado.avatar}
                              alt={jurado.name}
                              className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-border grayscale object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] md:text-xs font-medium truncate">
                                {jurado.name}
                              </div>
                              <div className="text-muted-foreground text-[10px] md:text-xs">
                                {jurado.tipo === "oficial" ? "Oficial" : "Remanente"}
                              </div>
                            </div>
                            <button
                              onClick={() => restoreJurado(jurado.id)}
                              className="px-1.5 py-0.5 rounded border hover:bg-accent text-[10px] md:text-xs opacity-0 group-hover:opacity-100 transition-all"
                            >
                              OK
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tus dos modales se quedan exactamente igual aquí abajo */}
          {showJuradosListModal && (
            // ... deja tu modal actual sin cambios
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
              {/* aquí pegas tu modal actual tal cual */}
            </div>
          )}

          {showJuradoModal && selectedTeam && (
            // ... deja tu modal actual sin cambios
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
              {/* aquí pegas tu modal actual tal cual */}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}