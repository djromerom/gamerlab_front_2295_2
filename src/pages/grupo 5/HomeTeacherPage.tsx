import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import StudentGradeTable from "@/components/grupo 5/StudentGradeTable";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const HomeTeacherPage: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const nrc = searchParams.get("nrc") ?? undefined; 
  const [availableNRCs, setAvailableNRCs] = useState<any[]>([]);

  useEffect(() => {
    const fetchAvailableNRCs = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/nrc`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          throw new Error("Error fetching available NRCs");
        }
        const data = await response.json();
        setAvailableNRCs(data);
        console.log(data);
      } catch (err) {
        console.log("Error fetching available NRCs:", err);
      } 
    };

    fetchAvailableNRCs();
  }, []);




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
