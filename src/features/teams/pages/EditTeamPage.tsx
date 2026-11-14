import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import EditBoard from "@/features/teams/components/EditBoard";


const EditTeamPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const searchParams = new URLSearchParams(location.search);
  const nrc = searchParams.get("nrc");
  const isProfesor = user?.role?.name === "Profesor";

  const breadcrumbs =
    isProfesor && isMobile
      ? [
          {
            label: "Lista",
            href: nrc ? `/home-profesor?nrc=${nrc}` : "/home-profesor",
          },
        ]
      : isProfesor
      ? [
          {
            label: "Lista",
            href: nrc ? `/home-profesor?nrc=${nrc}` : "/home-profesor",
          },
          { label: "Editar", href: location.pathname + location.search },
        ]
      : [{ label: "Editar", href: location.pathname + location.search }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      <div className="">
        <EditBoard />
      </div>
    </LayoutAplication>
  );
};

export default EditTeamPage;
