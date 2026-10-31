import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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
  sortBy: "student" | "team";
  setSortBy: (value: "student" | "team") => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (value: "asc" | "desc") => void;
  onClear: () => void;
  disabled?: boolean;
}

const semesterLabel = (semester: number) => semester === 10 ? 1 : semester === 30 ? 2 : semester;

export default function StudentGradeFilters({
  selectedFair, setSelectedFair, setSelectedNRC, availableFairs,
  selectedEdition, availableNRCs, selectedNRC, initialLoading,
  filterSearch, setFilterSearch,
  sortBy, setSortBy, sortOrder, setSortOrder, onClear, disabled = false,
}: Props) {
  return (
    <Card className="rounded-lg overflow-hidden bg-card mb-6">
      <div className="p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4 border-b border-border pb-4">
          <div className="w-full lg:flex-1">
            <label className="block text-xs font-medium mb-2 opacity-70">Filtrar por Feria</label>
            <div className="flex flex-wrap justify-start gap-2">
              <Button disabled={disabled} variant={selectedFair === "" ? "default" : "outline"} size="sm" onClick={() => { setSelectedFair(""); setSelectedNRC(""); }} className="cursor-pointer">Todas las Ferias</Button>
              {availableFairs.map((fair) => (
                <Button key={fair.id} disabled={disabled} variant={selectedFair === String(fair.id) ? "default" : "outline"} size="sm" onClick={() => { setSelectedFair(String(fair.id)); setSelectedNRC(""); }} className="cursor-pointer">
                  {fair.year} - S{semesterLabel(fair.semester)}
                </Button>
              ))}
              {availableFairs.length === 0 && <span className="text-xs text-muted-foreground self-center">No hay ferias disponibles</span>}
            </div>
          </div>
          <div className="w-full lg:w-1/3 lg:max-w-sm lg:ml-auto">
            <label htmlFor="grade-search" className="block text-xs font-medium mb-1.5 opacity-70">Buscar por equipo o estudiante</label>
            <div className="flex max-w-sm lg:ml-auto">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                <Input id="grade-search" disabled={disabled} value={filterSearch} onChange={(event) => setFilterSearch(event.target.value)} placeholder="Nombre o código de equipo o estudiante" className="h-8 md:h-8 pl-9" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border pb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="grade-sort-by" className="block text-xs font-medium mb-1.5 opacity-70">Ordenar por</label>
              <select id="grade-sort-by" disabled={disabled} value={sortBy} onChange={(event) => setSortBy(event.target.value as "student" | "team")} className="h-8 rounded-md border border-input bg-background px-2 text-sm">
                <option value="team">Grupo</option>
                <option value="student">Estudiante</option>
              </select>
            </div>
            <div>
              <label htmlFor="grade-sort-order" className="block text-xs font-medium mb-1.5 opacity-70">Orden</label>
              <select id="grade-sort-order" disabled={disabled} value={sortOrder} onChange={(event) => setSortOrder(event.target.value as "asc" | "desc")} className="h-8 rounded-md border border-input bg-background px-2 text-sm">
                <option value="asc">A-Z</option>
                <option value="desc">Z-A</option>
              </select>
            </div>
          </div>
          <Button type="button" disabled={disabled} variant="outline" size="sm" onClick={onClear} className="cursor-pointer self-start sm:self-auto">Limpiar filtros</Button>
        </div>
        <div className="w-full">
          <label className="block text-xs font-medium mb-2 opacity-70">
            Filtrar por NRC{selectedEdition ? ` · ${selectedEdition.year} - S${semesterLabel(selectedEdition.semester)}` : ""}
          </label>
          <div className="flex flex-wrap justify-start gap-2">
            <Button disabled={disabled} variant={selectedNRC === "" ? "default" : "outline"} size="sm" onClick={() => setSelectedNRC("")} className="cursor-pointer">Todos los NRCs</Button>
            {availableNRCs.map((nrc) => {
              const value = String(nrc.id);
              return <Button key={nrc.id} disabled={disabled} variant={selectedNRC === value ? "default" : "outline"} size="sm" onClick={() => setSelectedNRC(selectedNRC === value ? "" : value)} className="cursor-pointer">{nrc.code}</Button>;
            })}
            {!initialLoading && availableNRCs.length === 0 && <span className="text-xs text-muted-foreground self-center">No hay NRCs para este filtro.</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}
