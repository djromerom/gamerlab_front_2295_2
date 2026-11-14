import type React from "react";
import LayoutApplication from "@/layouts/LayoutApplication";
import StudentGradeTable from "@/features/results/components/StudentGradeTable";
import { useLocation } from "react-router-dom";

const TeacherHomePage: React.FC = () => {
  const location = useLocation();
  

  const breadcrumbs = [{ label: "Lista", href: location.pathname }];

  return (
    <LayoutApplication breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-4">
        <StudentGradeTable />
      </div>
    </LayoutApplication>
  );
};

export default TeacherHomePage;
