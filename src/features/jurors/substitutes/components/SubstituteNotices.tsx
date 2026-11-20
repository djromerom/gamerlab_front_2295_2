import { SubstituteGuideDialog } from "@/features/jurors/substitutes/components/SubstituteGuideDialog";
import { SubstituteNoticeCard } from "@/features/jurors/substitutes/components/SubstituteNoticeCard";

/** HU-22: explicación y aviso del suplente, montados una vez dentro del router. */
export function SubstituteNotices() {
  return (
    <>
      <SubstituteNoticeCard />
      <SubstituteGuideDialog />
    </>
  );
}
