import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

interface FiltersProps {
    onFilter: (value: string) => void;
    initialFilter: string;
    activeTeamType?: string;
    setActiveTeamType?: (type: string) => void;
    teamCounts?: { total: number; uninorte: number; externo: number };
}

export function Filters({ onFilter, initialFilter, activeTeamType, setActiveTeamType, teamCounts }: FiltersProps) {
    const [filterText, setFilterText] = useState(initialFilter);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="flex justify-center items-center mb-10 gap-2 px-4 sm:px-0">
            <div className="relative w-full sm:w-auto" ref={dropdownRef}>
                <Search className="absolute z-10 w-4 left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                    type="text"
                    value={filterText}
                    onChange={(e) => {
                        const v = e.target.value;
                        setFilterText(v);
                        onFilter(v);
                    }}
                    placeholder="Busca por nombre de equipo o videojuego"
                    className={`w-full sm:w-80 md:w-[422px] pl-10 ${activeTeamType !== undefined ? "pr-10" : ""}`}
                />
                {activeTeamType !== undefined && setActiveTeamType && teamCounts && (
                    <button
                        className={`absolute right-3 top-1/2 -translate-y-1/2 z-10 transition-colors cursor-pointer ${isFilterOpen || activeTeamType !== "all" ? "text-[#AC7CFF]" : "text-gray-400 hover:text-white"}`}
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        aria-label="Filtrar por tipo"
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                )}

                {isFilterOpen && activeTeamType !== undefined && setActiveTeamType && teamCounts && (
                    <div className="absolute left-0 right-0 sm:left-auto sm:right-0 top-full mt-2 p-3 bg-[#0d0f14]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 flex flex-col gap-2 w-full sm:w-auto min-w-[200px] transition-all duration-300 animate-in fade-in slide-in-from-top-2">
                        <button
                            onClick={() => { setActiveTeamType("all"); setIsFilterOpen(false); }}
                            className={`cursor-pointer px-4 py-2 rounded-xl transition-all text-sm font-medium w-full text-left ${activeTeamType === "all"
                                ? "bg-[#AC7CFF] text-[#060312]"
                                : "text-gray-300 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            Todos ({teamCounts.total})
                        </button>
                        <button
                            onClick={() => { setActiveTeamType("uninorte"); setIsFilterOpen(false); }}
                            className={`cursor-pointer px-4 py-2 rounded-xl transition-all text-sm font-medium w-full text-left ${activeTeamType === "uninorte"
                                ? "bg-blue-500/20 text-blue-300 border border-blue-400"
                                : "text-gray-300 hover:bg-white/10 hover:text-white border border-transparent"
                                }`}
                        >
                            Uninorte ({teamCounts.uninorte})
                        </button>
                        <button
                            onClick={() => { setActiveTeamType("externo"); setIsFilterOpen(false); }}
                            className={`cursor-pointer px-4 py-2 rounded-xl transition-all text-sm font-medium w-full text-left ${activeTeamType === "externo"
                                ? "bg-green-500/20 text-green-300 border border-green-400"
                                : "text-gray-300 hover:bg-white/10 hover:text-white border border-transparent"
                                }`}
                        >
                            Externos ({teamCounts.externo})
                        </button>
                    </div>
                )}
            </div>
            <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => onFilter(filterText)}
            >
                Buscar
            </Button>
        </div>
    );
}