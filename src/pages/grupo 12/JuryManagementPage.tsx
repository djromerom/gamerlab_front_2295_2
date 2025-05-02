import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";

const JuryManagementPage: React.FC = () => {
  const breadcrumbs = [{ label: "Materias", href: "/materias" }];
  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      <h1>Jurados</h1>
    </LayoutAplication>
  );
};

export default JuryManagementPage;