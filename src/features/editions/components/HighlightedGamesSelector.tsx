import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Gamepad2, X, Plus, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  fetchHighlightedGames,
  addHighlightedGame,
  removeHighlightedGame,
  fetchEditionVideogames,
  type HighlightedGame,
  type Videogame,
} from "@/fetchs/editions";

interface HighlightedGamesSelectorProps {
  editionId: number;
}

export const HighlightedGamesSelector: React.FC<HighlightedGamesSelectorProps> = ({ editionId }) => {
  
  const [highlighted, setHighlighted] = useState<HighlightedGame[]>([]);
  const [allVideogames, setAllVideogames] = useState<Videogame[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  // Cargar datos al montar
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingInit(true);
      try {
        const [highlightedData, allGames] = await Promise.all([
          fetchHighlightedGames(editionId),
          fetchEditionVideogames(editionId),
        ]);
        if (!cancelled) {
          setHighlighted(highlightedData);
          setAllVideogames(allGames);
        }
      } catch (err: any) {
        if (!cancelled) {
          toast.error("Error al cargar juegos", { description: err?.message ?? "Ocurrió un error inesperado." });
        }
      } finally {
        if (!cancelled) setLoadingInit(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [editionId]);

  const highlightedIds = new Set(highlighted.map(h => h.videogameId));

  // Videojuegos disponibles (no destacados), filtrados por búsqueda
  const available = allVideogames.filter(vg => {
    if (highlightedIds.has(vg.id)) return false;
    if (search.trim()) {
      return vg.name.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const handleAdd = async (videogame: Videogame) => {
    setAddingId(videogame.id);
    try {
      const created = await addHighlightedGame(editionId, videogame.id);
      // Si el backend no retorna el videogame embebido, construimos el objeto localmente
      const newHighlight: HighlightedGame = {
        editionId,
        videogameId: videogame.id,
        videogame: created.videogame ?? videogame,
      };
      setHighlighted(prev => [...prev, newHighlight]);
      toast.success("Juego destacado", { description: `"${videogame.name}" fue agregado como juego destacado.` });
    } catch (err: any) {
      toast.error("Error al destacar juego", { description: err?.message ?? "Ocurrió un error inesperado." });
    } finally {
      setAddingId(null);
    }
  };

  const handleRemove = async (highlight: HighlightedGame) => {
    setRemovingId(highlight.videogameId);
    try {
      await removeHighlightedGame(editionId, highlight.videogameId);
      setHighlighted(prev => prev.filter(h => h.videogameId !== highlight.videogameId));
      toast.success("Juego removido", { description: `"${highlight.videogame?.name ?? "Juego"}" ya no es un juego destacado.` });
    } catch (err: any) {
      toast.error("Error al remover juego", { description: err?.message ?? "Ocurrió un error inesperado." });
    } finally {
      setRemovingId(null);
    }
  };

  if (loadingInit) {
    return (
      <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Cargando juegos...</span>
      </div>
    );
  }

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
            {highlighted.map(h => (
              <Badge
                key={h.videogameId}
                className="bg-[#AC7CFF]/10 text-[#AC7CFF] border-[#AC7CFF]/30 py-1.5 px-3 flex items-center gap-2 text-sm"
              >
                <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
                <span>{h.videogame?.name ?? `ID ${h.videogameId}`}</span>
                <button
                  onClick={() => handleRemove(h)}
                  disabled={removingId === h.videogameId}
                  className="ml-1 hover:text-red-400 transition-colors p-0.5 disabled:opacity-50"
                  title="Quitar de destacados"
                >
                  {removingId === h.videogameId ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Separador + buscador */}
      <div className="pt-2 border-t border-gray-800 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Catálogo de juegos ({available.length} disponibles)
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar juego por nombre..."
            className="pl-9 bg-[#060312] border-gray-700 min-h-[40px] text-sm"
          />
        </div>

        {available.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4 italic">
            {search.trim()
              ? "No se encontraron juegos con ese nombre."
              : "Todos los juegos del catálogo ya están destacados."}
          </p>
        ) : (
          <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
            {available.map(vg => (
              <div
                key={vg.id}
                className="flex items-center justify-between bg-[#060312] p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{vg.name}</p>
                  {vg.teamName && (
                    <p className="text-xs text-gray-500 truncate">{vg.teamName}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAdd(vg)}
                  disabled={addingId === vg.id}
                  className="shrink-0 h-9 w-9 p-0 text-[#AC7CFF] hover:bg-[#AC7CFF]/10 ml-2 disabled:opacity-50"
                  title="Destacar juego"
                >
                  {addingId === vg.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
