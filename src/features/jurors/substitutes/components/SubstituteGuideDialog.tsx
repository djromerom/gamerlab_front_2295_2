import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useSubstituteNotices } from "@/features/jurors/substitutes/contexts/SubstituteNoticesContext";
import {
  SUBSTITUTE_GUIDE_INTRO,
  SUBSTITUTE_GUIDE_STEPS,
  SUBSTITUTE_GUIDE_STEPS_TITLE,
  SUBSTITUTE_GUIDE_TITLE,
} from "@/features/jurors/substitutes/lib/substituteGuide";

/**
 * Explicación para el suplente (HU-22). En el primer ingreso de la edición solo se cierra con
 * «Entendido»; después se puede volver a abrir y cerrar con Escape o «Entendido».
 */
export function SubstituteGuideDialog() {
  const { guideOpen, guideRequired, acknowledge, closeGuide } = useSubstituteNotices();
  if (!guideOpen) return null;

  return (
    <AlertDialog open onOpenChange={(open) => !open && closeGuide()}>
      <AlertDialogContent
        className="max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={(event) => {
          if (guideRequired) event.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{SUBSTITUTE_GUIDE_TITLE}</AlertDialogTitle>
          <AlertDialogDescription>{SUBSTITUTE_GUIDE_INTRO}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="text-sm">
          <p className="mb-2 font-medium">{SUBSTITUTE_GUIDE_STEPS_TITLE}</p>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            {SUBSTITUTE_GUIDE_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>

        <AlertDialogFooter>
          <Button type="button" onClick={acknowledge} className="w-full sm:w-auto">
            Entendido
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
