import { Team, TeamStatus } from "@/types/team";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { GameDetailModal } from "./GameDetailModal";
import { Heart } from "lucide-react";


interface TeamCardProps {
    team: Team;
    onRefresh: () => void;
    liveLikeCount: number;
}

// Función para extraer el semestre del código de equipo
const getSemesterFromTeamCode = (teamCode?: string): string | null => {
    if (!teamCode) return null;
    const match = teamCode.match(/^[Nn](\d+)/);
    return match ? match[1] : null;
};

// Cartas de equipo en pagina de videojuegos
export function TeamCard({ team, onRefresh, liveLikeCount }: TeamCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    const getStatusInfo = (status: TeamStatus) => {
        switch (status) {
            case "PENDIENTE":
                return { text: "Pendiente de confirmación", color: "text-purple-400" };
            case "CONFIRMADO":
                return { text: "Inscripción completa", color: "text-blue-400" };
            case "RECHAZADO":
                return { text: "Rechazada", color: "text-red-400" };
            default:
                return { text: "Estado desconocido", color: "text-gray-400" };
        }
    };

    const { text, color } = getStatusInfo(team.status);

    // Obtener el semestre del código de equipo
    const semester = getSemesterFromTeamCode(team.teamCode);
    const semesterDisplay = semester && semester !== "0" ? `Semestre ${semester}` : "Colegio";

    return (
        <>
            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsOpen(true)}
                className="cursor-pointer"
            >
                <Card className="relative transition-all duration-300 hover:shadow-xl hover:border-[#AC7CFF]/50 min-h-[180px] sm:h-[180px]">
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                        {/* HU-39 (ARK-209): equipo que presenta sin ser calificado */}
                        {team.notGradable && (
                            <div className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-400/30">
                                Presentador externo
                            </div>
                        )}
                        {/* Badge de tipo de equipo */}
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${!team.isExternal
                            ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                            : "bg-green-500/20 text-green-300 border border-green-400/30"
                            }`}>
                            {!team.isExternal ? "Uninorte" : "Externo"}
                        </div>
                    </div>

                    <CardContent className="flex space-x-4 sm:space-x-5 pt-11 pb-7 px-6 sm:py-6 sm:px-8 h-full">
                        <div className="flex items-center">
                            <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-[#AC7CFF]/30 flex-shrink-0">
                                <AvatarImage
                                    src={team.logo}
                                    alt={`${team.teamName} logo`}
                                    className="object-cover rounded-full"
                                />
                                <AvatarFallback className="bg-gradient-to-br from-[#AC7CFF] to-[#7C3AED] text-white font-bold text-2xl">
                                    {team.gameName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="flex flex-col justify-center space-y-1 flex-1 min-w-0 pr-12 sm:pr-16">
                            <h4 className="text-lg sm:text-xl font-medium leading-snug line-clamp-2">{team.gameName}</h4>
                            <p>Equipo: {team.teamName}</p>
                            <p className="text-sm text-gray-400">{semesterDisplay}</p>
                            <div className="flex items-center justify-between">
                                <p className={`${color} font-semibold`}>{text}</p>
                            </div>
                        </div>
                    </CardContent>
                    <div className="absolute flex justify-center bottom-9 right-7 gap-1 text-red-400">
                        <Heart size={20} fill="currentColor" />
                        <span className="text-sm font-bold">{liveLikeCount}</span>
                    </div>
                </Card>
            </motion.div>

            {isOpen && (
                <GameDetailModal
                    team={team}
                    onClose={() => setIsOpen(false)}
                    onRefresh={onRefresh}
                    liveCount={liveLikeCount}
                />
            )}
        </>
    );
}
