import React, { useState, useEffect, useCallback } from "react";
import LayoutApplication from "@/layouts/LayoutApplication";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { JurorBadgesTable } from "@/features/jurors/badges/components/JurorBadgesTable";
import { GenerateResultDialog } from "@/features/jurors/badges/components/GenerateResultDialog";
import { AlertCircle, Download, IdCard, Loader2 } from "lucide-react";
import {
  downloadJurorBadgesPdf,
  fetchJurorBadges,
  generateJurorBadges,
  regenerateJurorBadge,
  type GenerateBadgesResult,
  type JurorBadge,
} from "@/features/jurors/badges/api/jurorBadges";
import { toast } from "sonner";

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

const JurorBadgesPage: React.FC = () => {
  const [badges, setBadges] = useState<JurorBadge[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateBadgesResult | null>(null);

  const [toRegenerate, setToRegenerate] = useState<JurorBadge | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const loadBadges = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const result = await fetchJurorBadges();
      setBadges(result.data);
      // Conservar solo la selección de escarapelas que sigan existiendo
      setSelectedIds((prev) => {
        const ids = new Set(result.data.map((b) => b.jurorId));
        return new Set([...prev].filter((id) => ids.has(id)));
      });
    } catch (err) {
      const msg = errorMessage(err, "No se pudo cargar la lista de escarapelas.");
      setListError(msg);
      toast.error("Error", { description: msg });
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateJurorBadges();
      setGenerateResult(result);
      toast.success("Escarapelas generadas", {
        description: `Nuevas: ${result.created} · Ya existentes: ${result.existing}`,
      });
      loadBadges();
    } catch (err) {
      toast.error("Error", { description: errorMessage(err, "No se pudieron generar las escarapelas.") });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Con todas seleccionadas se omiten los ids: el back las incluye todas y la URL no crece
      const allSelected = selectedIds.size === badges.length;
      await downloadJurorBadgesPdf(
        selectedIds.size && !allSelected ? [...selectedIds] : undefined,
      );
    } catch (err) {
      toast.error("Error", { description: errorMessage(err, "No se pudo descargar el PDF.") });
    } finally {
      setDownloading(false);
    }
  };

  const handleConfirmRegenerate = async () => {
    if (!toRegenerate) return;
    const badge = toRegenerate;
    setToRegenerate(null);
    setRegeneratingId(badge.jurorId);
    try {
      const result = await regenerateJurorBadge(badge.jurorId);
      setBadges((prev) =>
        prev.map((b) => (b.jurorId === result.jurorId ? { ...b, token: result.token } : b)),
      );
      toast.success("Escarapela regenerada", {
        description: `Reimprime la escarapela de ${badge.name}; el QR anterior ya no es válido.`,
      });
    } catch (err) {
      toast.error("Error", { description: errorMessage(err, "No se pudo regenerar la escarapela.") });
    } finally {
      setRegeneratingId(null);
    }
  };

  const toggleOne = (jurorId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jurorId)) next.delete(jurorId);
      else next.add(jurorId);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(badges.map((b) => b.jurorId)) : new Set());
  };

  const breadcrumbs = [{ label: "Escarapelas", href: "/escarapelas" }];

  return (
    <LayoutApplication breadcrumbs={breadcrumbs}>
      <div className="p-6 w-full space-y-6">
        <div className="flex flex-col gap-4">
          {/* Fila 1: Título */}
          <div>
            <h1 className="text-lg md:text-xl font-medium">Escarapelas de Jurados</h1>
            <p className="text-sm text-muted-foreground">
              Escarapelas con código QR de los jurados y profesores de la edición activa.
            </p>
          </div>

          {/* Fila 2: Contador y acciones */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
            <div className="text-sm text-muted-foreground">
              {badges.length} escarapela{badges.length !== 1 ? "s" : ""}
              {selectedIds.size > 0 && ` · ${selectedIds.size} seleccionada${selectedIds.size !== 1 ? "s" : ""}`}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="outline"
                className="bg-card hover:bg-accent text-foreground h-10"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <IdCard className="h-4 w-4 mr-2" />
                )}
                Generar escarapelas
              </Button>
              <Button
                className="h-10"
                onClick={handleDownload}
                disabled={downloading || badges.length === 0}
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {selectedIds.size > 0 ? "Descargar seleccionadas" : "Descargar PDF"}
              </Button>
            </div>
          </div>
        </div>

        {/* Estado de carga */}
        {loadingList && (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Cargando escarapelas...</span>
          </div>
        )}

        {/* Estado de error */}
        {!loadingList && listError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-destructive">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">{listError}</p>
          </div>
        )}

        {/* Tabla */}
        {!loadingList && !listError && (
          <JurorBadgesTable
            badges={badges}
            selectedIds={selectedIds}
            onToggle={toggleOne}
            onToggleAll={toggleAll}
            onRegenerate={setToRegenerate}
            regeneratingId={regeneratingId}
          />
        )}

        <GenerateResultDialog
          result={generateResult}
          onOpenChange={(open) => !open && setGenerateResult(null)}
        />

        {/* Confirmación de regeneración */}
        <AlertDialog
          open={toRegenerate !== null}
          onOpenChange={(open) => !open && setToRegenerate(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Regenerar escarapela?</AlertDialogTitle>
              <AlertDialogDescription>
                Se creará un nuevo código QR para {toRegenerate?.name}. La escarapela impresa
                actualmente dejará de ser válida y deberá reimprimirse.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmRegenerate}>Regenerar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </LayoutApplication>
  );
};

export default JurorBadgesPage;
