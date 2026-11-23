import { useCallback, useEffect, useState } from "react";
import { fetchPublicPodium, fetchPublicRankingVisible } from "@/features/results/api/publicPodium";
import { groupPodiumByLevel, type PodiumLevel } from "@/features/results/lib/publicPodium";

export type PublicPodiumState =
  | { status: "loading" }
  | { status: "hidden" }
  | { status: "error"; message: string }
  | { status: "ready"; levels: PodiumLevel[] };

/** Estado del /ranking público (HU-48): si está publicado y el podio de cada nivel. */
export function usePublicPodium() {
  const [state, setState] = useState<PublicPodiumState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const visible = await fetchPublicRankingVisible();
      if (!visible) {
        setState({ status: "hidden" });
        return;
      }
      setState({ status: "ready", levels: groupPodiumByLevel(await fetchPublicPodium()) });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "No se pudo cargar el ranking." });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}
