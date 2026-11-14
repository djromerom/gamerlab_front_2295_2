import type React from "react";
import LayoutApplication from "@/layouts/LayoutApplication";
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
    <LayoutApplication breadcrumbs={breadcrumbs}>
      <div className="">
        <EditBoard />
      </div>
    </LayoutApplication>
  );
};

export default EditTeamPage;
