import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import { useAuth } from "@/contexts/AuthContext";
import HomeStudentPage from "../grupo 5/HomeStudentPage";
import HomeTeacherPage from "../grupo 5/HomeTeacherPage";

const HomePage: React.FC = () => {
  const { user } = useAuth(); // Default to "Estudiante" if no role is found
  return (
    <LayoutAplication breadcrumbs={[]}>
      {user?.role?.name === "Estudiante" && <HomeStudentPage />}
      {user?.role?.name === "Profesor" && <HomeTeacherPage />}
    </LayoutAplication>
  );
};

export default HomePage;
