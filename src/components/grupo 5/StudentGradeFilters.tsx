import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, Search } from "lucide-react";
import type { GradeFilterType } from "./student-grade-table-types";

interface Props {
  selectedFair: string;
  setSelectedFair: (id: string) => void;
  setSelectedNRC: (nrc: string) => void;
  availableFairs: { id: string | number; year: number; semester: number }[];
  selectedEdition?: { year: number; semester: number };
  availableNRCs: { id: string | number; code: string | number }[];
  selectedNRC: string;
  initialLoading: boolean;
  filterSearch: string;
  setFilterSearch: (value: string) => void;
  filterType: GradeFilterType;
  setFilterType: (value: GradeFilterType) => void;
}

const semesterLabel = (semester: number) => semester === 10 ? 1 : semester === 30 ? 2 : semester;

export default function StudentGradeFilters({
  selectedFair, setSelectedFair, setSelectedNRC, availableFairs,
  selectedEdition, availableNRCs, selectedNRC, initialLoading,
  filterSearch, setFilterSearch, filterType, setFilterType,
}: Props) {
  return (
    <Card className="rounded-lg overflow-hidden bg-card mb-6">
      <div className="p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4 border-b border-border pb-4">
          <div className="w-full lg:flex-1">
            <label className="block text-xs font-medium mb-2 opacity-70">Filtrar por Feria</label>
            <div className="flex flex-wrap justify-start gap-2">
              <Button variant={selectedFair === "" ? "default" : "outline"} size="sm" onClick={() => { setSelectedFair(""); setSelectedNRC(""); }} className="cursor-pointer">Todas las Ferias</Button>
              {availableFairs.map((fair) => (
                <Button key={fair.id} variant={selectedFair === String(fair.id) ? "default" : "outline"} size="sm" onClick={() => { setSelectedFair(String(fair.id)); setSelectedNRC(""); }} className="cursor-pointer">
                  {fair.year} - S{semesterLabel(fair.semester)}
                </Button>
              ))}
              {availableFairs.length === 0 && <span className="text-xs text-muted-foreground self-center">No hay ferias disponibles</span>}
            </div>
          </div>
          <div className="w-full lg:w-1/3 lg:max-w-sm lg:ml-auto">
            <label htmlFor="grade-search" className="block text-xs font-medium mb-1.5 opacity-70">Filtrar por estudiante o equipo</label>
            <div className="flex max-w-sm lg:ml-auto">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                <Input id="grade-search" value={filterSearch} onChange={(event) => setFilterSearch(event.target.value)} placeholder={filterType === "student" ? "Nombre del estudiante" : "Nombre del equipo"} className="h-8 md:h-8 pl-9 rounded-r-none" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="icon" aria-label={`Tipo de filtro: ${filterType === "student" ? "estudiante" : "equipo"}`} title={`Filtrar por ${filterType === "student" ? "estudiante" : "equipo"}`} className="!h-8 !w-8 rounded-l-none -ml-px"><Filter className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuRadioGroup value={filterType} onValueChange={(value) => setFilterType(value as GradeFilterType)}>
                    <DropdownMenuRadioItem value="student">Estudiante</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="team">Equipo</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <div className="w-full">
          <label className="block text-xs font-medium mb-2 opacity-70">
            Filtrar por NRC{selectedEdition ? ` · ${selectedEdition.year} - S${semesterLabel(selectedEdition.semester)}` : ""}
          </label>
          <div className="flex flex-wrap justify-start gap-2">
            <Button variant={selectedNRC === "" ? "default" : "outline"} size="sm" onClick={() => setSelectedNRC("")} className="cursor-pointer">Todos los NRCs</Button>
            {availableNRCs.map((nrc) => {
              const value = String(selectedFair ? nrc.id : nrc.code);
              return <Button key={selectedFair ? nrc.id : String(nrc.code)} variant={selectedNRC === value ? "default" : "outline"} size="sm" onClick={() => setSelectedNRC(selectedNRC === value ? "" : value)} className="cursor-pointer">{nrc.code}</Button>;
            })}
            {!initialLoading && availableNRCs.length === 0 && <span className="text-xs text-muted-foreground self-center">No hay NRCs para este filtro.</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}
