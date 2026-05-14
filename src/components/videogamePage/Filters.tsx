import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState } from "react";

interface FiltersProps {
    onFilter: (value: string) => void;
    initialFilter: string;
}

export function Filters({ onFilter, initialFilter }: FiltersProps) {
    const [filterText, setFilterText] = useState(initialFilter);

    return (
        <div className="flex justify-center items-center mb-10 gap-2">
            <div className="relative">
                <Search className="absolute z-10 w-4 left-3 top-1/2 -translate-y-1/2" />
                <Input
                    type="text"
                    value={filterText}
                    onChange={(e) => {
                        const v = e.target.value;
                        setFilterText(v);
                        onFilter(v);
                    }}
                    placeholder="Busca por nombre de equipo o videojuego"
                    className="w-64 md:w-96 pl-10"
                />
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