import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import StudentGradeTable from "@/components/grupo 5/StudentGradeTable";
import { useLocation } from "react-router-dom";

const HomeTeacherPage: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const nrc = searchParams.get("nrc") ?? undefined; 

  const breadcrumbs = [{ label: "Lista", href: location.pathname }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-4">
        <StudentGradeTable initialNRC={nrc} />
      </div>
    </LayoutAplication>
  );
};

export default HomeTeacherPage;
