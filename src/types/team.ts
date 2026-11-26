export interface Team {
    id: number; // id del equipo
    videogameId: number; // id real del videojuego
    gameName: string;
    teamName: string;
    teamCode: string;
    userId?: string; // obsoleto: el back lo retirará; usar isMine
    isMine?: boolean; // solo con sesión: el usuario autenticado es el líder
    isMember?: boolean; // solo con sesión: es el líder o un integrante activo (solo para mostrar)
    editionId?: number;
    status: TeamStatus;
    video?: string;
    repo?: string;
    members?: string[];
    description?: string;
    logo?: string;
    additionalImages?: string[];
    isExternal?: boolean;
    notGradable?: boolean; // HU-39 (ARK-209): presentador externo, no se califica
    likes?: number;
    gameFileUrl?: string,
    entry?: string,
    allowMobile?: boolean, // TA-36 (ARK-326): se puede jugar en celular
    finalScore?: number | null
}

export type TeamStatus = "PENDIENTE" | "CONFIRMADO" | "RECHAZADO";
