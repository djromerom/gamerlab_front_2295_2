import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  readRegistrationsOpen,
  updateRegistrationsOpen,
} from "@/fetchs/registrations";

const RegistrationsToggleCard: React.FC = () => {
  const [open, setOpen] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    readRegistrationsOpen()
      .then((value) => {
        if (active) setOpen(value);
      })
      .catch(() => {
        if (active) setError("No se pudo cargar el estado de las inscripciones.");
      });
    return () => {
      active = false;
    };
  }, []);

  const handleToggle = async () => {
    if (open === null) return;
    setSaving(true);
    setError(null);
    try {
      setOpen(await updateRegistrationsOpen(!open));
    } catch {
      setError("No se pudo actualizar las inscripciones.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <div className="sm:flex-[0_1_10%] md:mb-6 space-y-2 border-2 rounded-lg overflow-hidden md:w-full shadow-sm">
        <div className="border-b last:border-b-0">
          <div className="w-full p-4 flex items-center justify-between transition-colors">
            <span className="font-medium">Inscripciones de equipos</span>
            <span className="text-sm opacity-70">
              {open === null ? (error ? "Sin datos" : "Cargando...") : open ? "Abiertas" : "Cerradas"}
            </span>
          </div>
          <div className="px-4 py-3 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm">
                Permite que cualquier persona registre su equipo desde la web.
              </p>
              <Switch
                aria-label="Inscripciones de equipos"
                checked={open === true}
                onCheckedChange={handleToggle}
                disabled={open === null || saving}
                className="cursor-pointer bg-purple-800"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegistrationsToggleCard;
