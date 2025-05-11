import type React from "react";
import Review from "@/components/grupo 5/Review";
import Scoreboard from "@/components/grupo 5/Scoreboard";
import LayoutAplication from "@/layouts/LayoutAplication";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const HomeStudentPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const searchParams = new URLSearchParams(location.search);
  const nrc = searchParams.get("nrc");
  const isProfesor = user?.role?.name === "Profesor";

  const breadcrumbs =
    isProfesor && isMobile
      ? [{ label: "Lista", href: nrc ? `/home-profesor?nrc=${nrc}` : "/home-profesor" }]
      : isProfesor
      ? [
          { label: "Lista", href: nrc ? `/home-profesor?nrc=${nrc}` : "/home-profesor" },
          { label: "Nota", href: location.pathname + location.search },
        ]
      : [{ label: "Nota", href: location.pathname + location.search }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-4">
        <Scoreboard />
        <Review />
      </div>
    </LayoutAplication>
  );
};

export default HomeStudentPage;
