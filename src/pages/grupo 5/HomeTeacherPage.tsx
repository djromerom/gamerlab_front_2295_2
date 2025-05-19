import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import StudentGradeTable from "@/components/grupo 5/StudentGradeTable";
import { useLocation } from "react-router-dom";

const HomeTeacherPage: React.FC = () => {
  const location = useLocation();
  

  const breadcrumbs = [{ label: "Lista", href: location.pathname }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-4">
        <StudentGradeTable />
      </div>
    </LayoutAplication>
  );
};

export default HomeTeacherPage;
