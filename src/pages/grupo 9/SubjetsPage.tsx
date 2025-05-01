import type React from "react";
import LayoutAplication from "@/layout/LayoutAplication";

const SubjetsPage: React.FC = () => {
  const breadcrumbs = [{ label: "Materias", href: "/materias" }];
  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      <h1>materias</h1>
    </LayoutAplication>
  );
};

export default SubjetsPage;
