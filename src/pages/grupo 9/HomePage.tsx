import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";

const HomePage: React.FC = () => {
  return (
    <LayoutAplication breadcrumbs={[]}>
      <h1>Inicio</h1>
    </LayoutAplication>
  );
};

export default HomePage;
