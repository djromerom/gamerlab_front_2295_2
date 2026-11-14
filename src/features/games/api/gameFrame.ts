import { getGameFileEntry } from "@/features/teams/lib/azureFile";



export default async function fetchGameFrameEntry(videogameID: number) {
    let videogameURL: string = "";
    let gameEntry: string = "";

    try {
        const gameData = await getGameFileEntry(videogameID);
        videogameURL = gameData.gameFileURL;
        gameEntry = gameData.entry;
    } catch (error) {
        console.error("Hubo un problema fetcheando el entry del videojuego: ", error);
    }

    return { videogameURL, gameEntry };
}