import { useEffect, useState } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import RegistrationClosedPage from "@/features/public/pages/RegistrationClosedPage";
import TeamRegisterPage from "@/features/teams/pages/TeamRegisterPage";
import { fetchRegistrationsOpen } from "@/api/registrations";

/** Muestra el registro de equipos solo si las inscripciones están abiertas. */
export default function RegistrationGate() {
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetchRegistrationsOpen().then((value) => {
      if (active) setOpen(value);
    });
    return () => {
      active = false;
    };
  }, []);

  if (open === null) return <LoadingScreen text="Cargando..." />;
  return open ? <TeamRegisterPage /> : <RegistrationClosedPage />;
}
