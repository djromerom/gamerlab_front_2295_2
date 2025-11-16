import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Team } from "@/pages/grupo 11/TeamsPage";
import { ThemeProvider } from "@/components/grupo 11/theme-provider"
    
interface TeamCodeProps {
  variant?: "default" | "title";
}

export default function TeamCode({ variant = "default"}: TeamCodeProps) {
    const [team, setTeam] = useState<Team | null>(null);

    const { user, userRole } = useAuth();

    if (userRole === undefined) {
        return null;
    } 

    if (userRole !== "Estudiante") {
        return null;
    }

    useEffect(() => {

        const fetchData = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/teams`, {
                    method: "GET",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" }
                });
                if (!response.ok) {
                    throw new Error("Error fetching teams");
                }
                const teamsInfo = await response.json();


                setTeam(
                    teamsInfo.find((t: { userId: string }) => t.userId === user?.id) || null
                );
                
            } catch (error) {
                console.error(error);
            }
        };

        fetchData();
    }, [user?.id]);

    

    if (variant === "default") {
        return (
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                <div className="flex justify-start ml-0 m-4">
                    <div className="flex justify-between gap-3 rounded-2xl p-0 text-xl border-2 border-border bg-card">
                        <p className="pl-4 p-2 font-semibold text-base text-foreground">Codigo del equipo:</p>
                        <p className="leading-tight font-bold p-2 rounded-2xl bg-primary text-primary-foreground">
                            {team?.teamCode ?? "Cargando..."}
                        </p>
                    </div>
                </div>
            </ThemeProvider>
        )
    } else if (variant === "title" && userRole === "Estudiante") {
        return (
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">   
                <div className="grid-cols-1 grid-rows-2 border-2 rounded-2xl p-4 h-full gap-10px ">
                    <div className="flex justify-center text-3xl border-b-2  ">
                        <h1 className="font-bold tracking-tighter">Equipo</h1>
                        
                    </div>
                    <div className="flex justify-center ">
                        <p className="font-bold in-dark:text-white tracking-tighter text-4xl p-5 text-shadow-10xl ">
                            {team?.teamCode ?? "Cargando..."}
                        </p>
                    </div>
                </div>
            </ThemeProvider>    
        )
    } else {
        return null;
    }
}
