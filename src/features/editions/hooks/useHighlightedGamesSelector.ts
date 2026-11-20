import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { addHighlightedGame, fetchEditionVideogames, removeHighlightedGame } from "@/api/editions";
import { fetchHighlightedGames } from "@/features/public/api/highlightedGames";
import {
  addHistoricalHighlightedGame,
  fetchHistoricalVideogames,
  removeHistoricalHighlightedGame,
} from "@/features/editions/api/highlightedGames";
import {
  availableGames,
  fromHighlighted,
  fromHistoricalCatalog,
  fromLiveCatalog,
  gameKey,
  type SelectorGame,
} from "@/features/editions/lib/highlightedGames";

const errorText = (err: unknown) => (err instanceof Error && err.message) || "Ocurrió un error inesperado.";

/**
 * Estado del selector de juegos destacados de una edición (ARK-230).
 * Si la edición está archivada, el catálogo son sus juegos históricos (con la marca de zip);
 * si no, sus juegos en vivo. Los destacados se leen de GET /highlighted-games?editionId=, que trae
 * los dos tipos: así también se ven y se quitan los destacados en vivo que tenga una edición archivada.
 */
export function useHighlightedGamesSelector(editionId: number, archived: boolean) {
  const [highlighted, setHighlighted] = useState<SelectorGame[]>([]);
  const [catalog, setCatalog] = useState<SelectorGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<string>>(new Set());
  const [search, setSearch] = useState("");
  const [onlyWithZip, setOnlyWithZip] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const loadCatalog = archived
      ? fetchHistoricalVideogames(editionId).then(fromHistoricalCatalog)
      : fetchEditionVideogames(editionId).then(fromLiveCatalog);
    Promise.all([fetchHighlightedGames(editionId).then(fromHighlighted), loadCatalog])
      .then(([highlightedData, catalogData]) => {
        if (cancelled) return;
        setHighlighted(highlightedData);
        setCatalog(catalogData);
      })
      .catch((err) => {
        if (!cancelled) toast.error("Error al cargar juegos", { description: errorText(err) });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editionId, archived]);

  const available = useMemo(
    () => availableGames(catalog, highlighted, { search, onlyWithZip }),
    [catalog, highlighted, search, onlyWithZip],
  );
  const withZipCount = useMemo(() => catalog.filter((g) => g.hasGameFile === true).length, [catalog]);

  const setPending = (key: string, pending: boolean) =>
    setPendingKeys((prev) => {
      const next = new Set(prev);
      if (pending) next.add(key);
      else next.delete(key);
      return next;
    });
  const isPending = (game: SelectorGame) => pendingKeys.has(gameKey(game));

  const add = async (game: SelectorGame) => {
    setPending(gameKey(game), true);
    try {
      if (game.kind === "historical") await addHistoricalHighlightedGame(editionId, game.id);
      else await addHighlightedGame(editionId, game.id);
      setHighlighted((prev) => [...prev, game]);
      toast.success("Juego destacado", { description: `"${game.name}" fue agregado como juego destacado.` });
    } catch (err) {
      toast.error("Error al destacar juego", { description: errorText(err) });
    } finally {
      setPending(gameKey(game), false);
    }
  };

  const remove = async (game: SelectorGame) => {
    setPending(gameKey(game), true);
    try {
      if (game.kind === "historical") await removeHistoricalHighlightedGame(editionId, game.id);
      else await removeHighlightedGame(editionId, game.id);
      setHighlighted((prev) => prev.filter((h) => gameKey(h) !== gameKey(game)));
      toast.success("Juego removido", { description: `"${game.name}" ya no es un juego destacado.` });
    } catch (err) {
      toast.error("Error al remover juego", { description: errorText(err) });
    } finally {
      setPending(gameKey(game), false);
    }
  };

  return {
    loading,
    highlighted,
    available,
    catalogSize: catalog.length,
    withZipCount,
    isPending,
    search,
    setSearch,
    onlyWithZip,
    setOnlyWithZip,
    add,
    remove,
  };
}
