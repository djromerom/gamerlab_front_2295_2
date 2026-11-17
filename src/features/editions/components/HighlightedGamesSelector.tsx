import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Archive, FileArchive, Gamepad2, Loader2, Plus, Search, X } from "lucide-react";
import type { EditionStatus } from "@/api/editions";
import { useHighlightedGamesSelector } from "@/features/editions/hooks/useHighlightedGamesSelector";
import { gameKey, type SelectorGame } from "@/features/editions/lib/highlightedGames";

interface HighlightedGamesSelectorProps {
  editionId: number;
  /** Si la edición está archivada (ARCHIVED), el catálogo son sus juegos históricos */
  editionStatus?: EditionStatus;
}

/** Marca de zip: solo se muestra cuando el back dice si el juego tiene archivo (los históricos y los destacados). */
const ZipBadge: React.FC<{ game: SelectorGame }> = ({ game }) => {
  if (game.hasGameFile === null) return null;
  return game.hasGameFile ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
      <FileArchive className="h-3 w-3" aria-hidden="true" />
      Con zip
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-gray-700 px-2 py-0.5 text-[11px] text-gray-500">
      Sin zip
    </span>
  );
};

export const HighlightedGamesSelector: React.FC<HighlightedGamesSelectorProps> = ({ editionId, editionStatus }) => {
  const archived = editionStatus === "ARCHIVED";
  const {
    loading,
    highlighted,
    available,
    catalogSize,
    withZipCount,
    isPending,
    search,
    setSearch,
    onlyWithZip,
    setOnlyWithZip,
    add,
    remove,
  } = useHighlightedGamesSelector(editionId, archived);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Cargando juegos...</span>
      </div>
    );
  }

  const emptyCatalogText =
    search.trim() || onlyWithZip
      ? "No hay juegos que coincidan con el filtro."
      : catalogSize === 0
        ? archived
          ? "Esta edición no tiene juegos históricos."
          : "Esta edición no tiene juegos confirmados."
        : "Todos los juegos del catálogo ya están destacados.";

  return (
    <div className="space-y-6">
      {/* Juegos destacados actuales */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Destacados ({highlighted.length})
        </p>
        {highlighted.length === 0 ? (
          <div className="text-sm text-gray-600 italic p-3 text-center border border-dashed border-gray-800 rounded-lg">
            Ningún juego destacado aún.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {highlighted.map((h) => {
              const key = gameKey(h);
              return (
                <Badge
                  key={key}
                  className="bg-[#AC7CFF]/10 text-[#AC7CFF] border-[#AC7CFF]/30 py-1.5 px-3 flex items-center gap-2 text-sm max-w-full"
                >
                  {h.kind === "historical" ? (
                    <Archive className="w-3.5 h-3.5 shrink-0" aria-label="Juego histórico" />
                  ) : (
                    <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="truncate">{h.name}</span>
                  {h.hasGameFile && <FileArchive className="w-3.5 h-3.5 shrink-0 text-emerald-400" aria-label="Con zip" />}
                  <button
                    onClick={() => remove(h)}
                    disabled={isPending(h)}
                    className="ml-1 hover:text-red-400 transition-colors p-0.5 disabled:opacity-50"
                    title="Quitar de destacados"
                    aria-label={`Quitar ${h.name} de destacados`}
                  >
                    {isPending(h) ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      {/* Separador + buscador */}
      <div className="pt-2 border-t border-gray-800 space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {archived ? "Juegos históricos" : "Catálogo de juegos"} ({available.length} disponibles)
          </p>
          {archived && (
            <p className="text-xs text-gray-500">
              La edición está archivada: se listan sus juegos históricos. {withZipCount} de {catalogSize} tienen zip y
              se pueden jugar en la web.
            </p>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar juego por nombre..."
            className="pl-9 bg-[#060312] border-gray-700 min-h-[40px] text-sm"
          />
        </div>
        {archived && (
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer w-fit">
            <Checkbox checked={onlyWithZip} onChange={(e) => setOnlyWithZip(e.target.checked)} />
            Solo los que tienen zip
          </label>
        )}

        {available.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4 italic">{emptyCatalogText}</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
            {available.map((vg) => {
              const key = gameKey(vg);
              return (
                <div
                  key={key}
                  className="flex items-center justify-between bg-[#060312] p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-gray-200 truncate">{vg.name}</p>
                    {(vg.teamName || vg.hasGameFile !== null) && (
                      <div className="flex flex-wrap items-center gap-2">
                        {vg.teamName && <p className="text-xs text-gray-500 truncate">{vg.teamName}</p>}
                        <ZipBadge game={vg} />
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => add(vg)}
                    disabled={isPending(vg)}
                    className="shrink-0 h-9 w-9 p-0 text-[#AC7CFF] hover:bg-[#AC7CFF]/10 ml-2 disabled:opacity-50"
                    title="Destacar juego"
                    aria-label={`Destacar ${vg.name}`}
                  >
                    {isPending(vg) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
