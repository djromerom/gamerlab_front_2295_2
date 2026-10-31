export interface Team {
    id: number; // id del equipo
    videogameId: number; // id real del videojuego
    gameName: string;
    teamName: string;
    teamCode: string;
    userId?: string; // obsoleto: el back lo retirará; usar isMine
    isMine?: boolean; // solo con sesión: el usuario autenticado es el líder
    status: TeamStatus;
    video?: string;
    repo?: string;
    members?: string[];
    description?: string;
    logo?: string;
    additionalImages?: string[];
    isExternal?: boolean;
    likes?: number;
    gameFileUrl?: string,
    entry?: string,
    finalScore?: number | null
}

export type TeamStatus = "PENDIENTE" | "CONFIRMADO" | "RECHAZADO";
