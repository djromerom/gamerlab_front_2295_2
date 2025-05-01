import { useMultiForm } from "@/contexts/MultiFormContext";
import GameStep from "@/components/grupo 11/GameStep";
import MembersStep from "@/components/grupo 11/MembersStep";
import TeamStep from "@/components/grupo 11/TeamStep";

export default function StepRenderer() {
    const { step } = useMultiForm();
    switch (step) {
      case 1:
        return <MembersStep />;
      case 2:
        return <GameStep />;
      default:
        return <TeamStep />;
    }
  }