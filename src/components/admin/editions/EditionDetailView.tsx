import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FileText,
  ImageIcon,
  Images,
  MessageSquareQuote,
  Gamepad2,
  GraduationCap,
  CheckCircle,
  Power,
  Pencil,
  Loader2,
} from "lucide-react";
import { EditionInfoModal } from "@/components/admin/editions/modals/EditionInfoModal";
import { BannerModal } from "@/components/admin/editions/modals/BannerModal";
import { GalleryModal } from "@/components/admin/editions/modals/GalleryModal";
import { TestimonialsModal } from "@/components/admin/editions/modals/TestimonialsModal";
import { HighlightedGamesModal } from "@/components/admin/editions/modals/HighlightedGamesModal";
import { EducationalFocusesModal } from "@/components/admin/editions/modals/EducationalFocusesModal";
import { toast } from "sonner";
import { activateEdition, type Edition } from "@/fetchs/editions";

interface EditionDetailViewProps {
  edition: Edition;
  onBack: () => void;
  onActivated?: () => void; // para que la página padre refresque la lista
}

type ModalKey = "info" | "banner" | "gallery" | "testimonials" | "games" | "focuses" | null;

const semesterLabel: Record<number, string> = {
  10: "Primer Semestre",
  20: "Intersemestral",
  30: "Segundo Semestre",
};

interface ActionCard {
  key: ModalKey;
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
}

const ACTION_CARDS: ActionCard[] = [
  {
    key: "info",
    icon: FileText,
    title: "Información General",
    description: "Título, descripciones, fechas y textos de presentación.",
    accent: "from-violet-500/10 to-purple-600/5 border-violet-500/20 hover:border-violet-500/50",
  },
  {
    key: "banner",
    icon: ImageIcon,
    title: "Foto Principal",
    description: "Imagen de cabecera que encabeza el landing de la feria.",
    accent: "from-sky-500/10 to-blue-600/5 border-sky-500/20 hover:border-sky-500/50",
  },
  {
    key: "games",
    icon: Gamepad2,
    title: "Juegos Destacados",
    description: "Selecciona los proyectos que merecen mención especial.",
    accent: "from-emerald-500/10 to-green-600/5 border-emerald-500/20 hover:border-emerald-500/50",
  },
  {
    key: "gallery",
    icon: Images,
    title: "Galería de Fotos",
    description: "Sube fotos del evento para el histórico de la edición.",
    accent: "from-orange-500/10 to-amber-600/5 border-orange-500/20 hover:border-orange-500/50",
  },
  {
    key: "testimonials",
    icon: MessageSquareQuote,
    title: "Testimonios",
    description: "Añade o gestiona testimonios de participantes y asistentes.",
    accent: "from-pink-500/10 to-rose-600/5 border-pink-500/20 hover:border-pink-500/50",
  },
  {
    key: "focuses",
    icon: GraduationCap,
    title: "Enfoques Educativos",
    description: "Áreas temáticas y objetivos pedagógicos de la edición.",
    accent: "from-teal-500/10 to-cyan-600/5 border-teal-500/20 hover:border-teal-500/50",
  },
];

export const EditionDetailView: React.FC<EditionDetailViewProps> = ({
  edition,
  onBack,
  onActivated,
}) => {
    const [openModal, setOpenModal] = useState<ModalKey>(null);
  const [activating, setActivating] = useState(false);

  const handleActivate = async () => {
    try {
      setActivating(true);
      await activateEdition(edition.id);
      toast.success("Edición activada", { description: `"${edition.title}" es ahora la edición activa en el landing.` });
      onActivated?.(); // refresca la lista en la página padre
    } catch (err: any) {
      toast.error("Error al activar edición", { description: err?.message ?? "Ocurrió un error inesperado." });
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mt-1 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-foreground truncate">
              {edition.title}
            </h2>
            {edition.isActive ? (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 flex items-center gap-1 shrink-0">
                <CheckCircle className="w-3 h-3" />
                Activa
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground border-border shrink-0">
                Histórico
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {edition.year} · {semesterLabel[edition.semester] ?? `Semestre ${edition.semester}`}
          </p>
        </div>

        {!edition.isActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleActivate}
            disabled={activating}
            className="shrink-0 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500/60 disabled:opacity-60"
          >
            {activating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Activando...
              </>
            ) : (
              <>
                <Power className="w-4 h-4 mr-2" />
                Activar edición
              </>
            )}
          </Button>
        )}
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACTION_CARDS.map(({ key, icon: Icon, title, description, accent }) => (
          <button
            key={key}
            onClick={() => setOpenModal(key)}
            className={`group relative text-left rounded-xl border bg-gradient-to-br p-5 transition-all duration-200 ${accent} hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AC7CFF]`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-background/60 border border-border/50">
                <Icon className="w-5 h-5 text-[#AC7CFF]" />
              </div>
              <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground leading-snug">{description}</p>
          </button>
        ))}
      </div>

      {/* Modales */}
      <EditionInfoModal
        open={openModal === "info"}
        onOpenChange={open => setOpenModal(open ? "info" : null)}
        edition={edition}
        onSuccess={onActivated}
      />

      <BannerModal
        open={openModal === "banner"}
        onOpenChange={open => setOpenModal(open ? "banner" : null)}
        editionId={edition.id}
        currentPhotoUrl={edition.mainPhotoUrl}
        onSuccess={onActivated}
      />

      <GalleryModal
        open={openModal === "gallery"}
        onOpenChange={open => setOpenModal(open ? "gallery" : null)}
        editionId={edition.id}
        existingPhotos={edition.photosUrls ?? []}
        onSuccess={onActivated}
      />

      <TestimonialsModal
        open={openModal === "testimonials"}
        onOpenChange={open => setOpenModal(open ? "testimonials" : null)}
        editionId={edition.id}
      />

      <HighlightedGamesModal
        open={openModal === "games"}
        onOpenChange={open => setOpenModal(open ? "games" : null)}
        editionId={edition.id}
      />

      <EducationalFocusesModal
        open={openModal === "focuses"}
        onOpenChange={open => setOpenModal(open ? "focuses" : null)}
        editionId={edition.id}
      />
    </div>
  );
};
