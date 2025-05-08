import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import StudentGradeTable from "@/components/grupo 5/StudentGradeTable";

const HomeTeacherPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-4">
      <StudentGradeTable />
    </div>
  );
};

export default HomeTeacherPage;
