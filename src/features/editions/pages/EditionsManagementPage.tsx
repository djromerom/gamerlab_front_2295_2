import React, { useState, useEffect, useCallback } from "react";
import LayoutApplication from "@/layouts/LayoutApplication";
import { EditionsTable } from "@/features/editions/components/EditionsTable";
import { EditionDetailView } from "@/features/editions/components/EditionDetailView";
import { CreateEditionModal } from "@/features/editions/components/modals/CreateEditionModal";
import { CalendarRange, Loader2, AlertCircle } from "lucide-react";
import { fetchEditions, type Edition } from "@/api/editions";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { parseRouteId } from "@/lib/routeId";

/** BG-66 (ARK-266): el detalle de una edición vive en `?edicion=<id>`, así «Atrás» vuelve a la lista. */
const EDITION_PARAM = "edicion";

const EditionsManagementPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = parseRouteId(searchParams.get(EDITION_PARAM));
  const view = selectedId === null ? "list" : "detail";
  const [createOpen, setCreateOpen] = useState(false);

  const [editions, setEditions] = useState<Edition[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const loadEditions = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const data = await fetchEditions();
      setEditions(data);
    } catch (err: any) {
      const msg = err?.message ?? "No se pudo cargar la lista de ediciones.";
      setListError(msg);
      toast.error("Error", { description: msg });
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadEditions();
  }, [loadEditions]);

  const selectedEdition = editions.find((e) => e.id === selectedId) ?? null;

  const handleSelectEdition = (id: number) => {
    setSearchParams({ [EDITION_PARAM]: String(id) });
  };

  const handleBack = () => {
    setSearchParams({});
  };

  const handleEditionActivated = () => {
    // Refrescar lista para reflejar el cambio de isActive
    loadEditions();
  };

  const breadcrumbs =
    view === "detail" && selectedEdition
      ? [
          { label: "Ediciones", href: "/gestionar-ediciones" },
          { label: selectedEdition.title, href: "#" },
        ]
      : [{ label: "Ediciones", href: "/gestionar-ediciones" }];

  return (
    <LayoutApplication breadcrumbs={breadcrumbs}>
      <div className="p-6 w-full space-y-6">
        {/* Vistas */}
        {view === "list" ? (
          <>
            {/* Estado de carga */}
            {loadingList && (
              <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Cargando ediciones...</span>
              </div>
            )}

            {/* Estado de error */}
            {!loadingList && listError && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-destructive">
                <AlertCircle className="w-8 h-8" />
                <p className="text-sm">{listError}</p>
              </div>
            )}

            {/* Tabla/lista */}
            {!loadingList && !listError && (
              <EditionsTable
                editions={editions}
                onSelectEdition={handleSelectEdition}
                onCreateNew={() => setCreateOpen(true)}
              />
            )}
          </>
        ) : selectedEdition ? (
          <EditionDetailView
            edition={selectedEdition}
            onBack={handleBack}
            onActivated={handleEditionActivated}
          />
        ) : loadingList ? (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Cargando edición...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">No se encontró la edición.</p>
            <button type="button" onClick={handleBack} className="text-sm underline underline-offset-2 hover:text-foreground">
              Volver a la lista de ediciones
            </button>
          </div>
        )}

        {/* Modal creación */}
        <CreateEditionModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={() => {
            loadEditions();
          }}
        />
      </div>
    </LayoutApplication>
  );
};

export default EditionsManagementPage;
