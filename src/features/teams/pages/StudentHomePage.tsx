import type React from "react";
import Scoreboard from "@/features/results/components/Scoreboard";
import LayoutAplication from "@/layouts/LayoutAplication";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const StudentHomePage: React.FC = () => {
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
          { label: "Notas", href: location.pathname + location.search },
        ]
      : [{ label: "Notas", href: location.pathname + location.search }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      {isProfesor ? (
        <div className="m-4 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border p-8 text-center">
          <h2 className="text-lg font-medium text-foreground">Esta vista es para estudiantes</h2>
          <p className="text-sm text-muted-foreground">
            Las notas del equipo se muestran a cada estudiante. Para ver a tus estudiantes, vuelve a la lista.
          </p>
          <Link
            to={nrc ? `/home-profesor?nrc=${nrc}` : "/home-profesor"}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Ir a la lista
          </Link>
        </div>
      ) : (
        <div className="">
          <Scoreboard />
        </div>
      )}
    </LayoutAplication>
  );
};

export default StudentHomePage;
