import { apiFetch } from "@/lib/api";
import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import {useState} from "react";
import { Switch } from "@/components/ui/switch.tsx"
// import { ThemeProvider } from "@/components/grupo 11/theme-provider";

// const url = "/settings/evaluations-status?open="

const EventSetupCard: React.FC<{value: boolean, url: string, title: string, subtitle: string, field?: string}> = ({value, url, title, subtitle, field}) => {
    // const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(value);
    const [loading, setLoading] = useState<boolean>(false);

    
    const handleToggle = async () => {
        const newValue = !isOpen; // valor que se enviara al por medio del endpoint en este caso "true" o "false"
        setIsOpen(newValue);
        setLoading(true);
        
        try {
        const res = await apiFetch(
            `${import.meta.env.VITE_ENDPOINT_BACKEND}${url}`,
            {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field ?? "show"]: newValue }),
            }

        );

        if (!res.ok) {
            throw new Error("Error en la actualización");
        }


        } catch (error) {
        console.error("Error al actualizar:", error);
        // revertimos el cambio local si ocurrió un error
        setIsOpen((prev) => !prev);
        } finally {
        setLoading(false);
        }
    };
        

    return (
        <>
           
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            <div className="sm:flex-[0_1_10%] md:mb-6 space-y-2 border-2 rounded-lg overflow-hidden  md:w-full shadow-sm ">
                <div className="border-b last:border-b-0">
                    <div className="w-full p-4 flex items-center justify-between transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="font-medium ">{title}</span>
                        </div>
                        <span className="text-sm opacity-70">Estado </span>
                        </div>
                    <div className="px-4 py-3  border-t">
                        <div className="flex items-center justify-between">
                            <p className="text-sm ">{subtitle}</p>    
                            <div>
                                <Switch checked={isOpen} onCheckedChange={handleToggle} disabled={loading} className="cursor-pointer bg-purple-800"/>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
        </> 
  );
};

export default EventSetupCard;  