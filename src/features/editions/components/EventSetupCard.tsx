import type React from "react";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch.tsx";
import { updateEventSetting } from "@/features/editions/api/eventSettings";

interface EventSetupCardProps {
  value: boolean;
  url: string;
  title: string;
  subtitle: string;
  /** Campo del body del PATCH (por defecto «show») */
  field?: string;
  /** Texto de ayuda bajo el interruptor */
  hint?: string;
  /** Avisa el valor guardado, para que la página (y el contexto global) no queden con el valor viejo */
  onChange?: (value: boolean) => void;
}

const EventSetupCard: React.FC<EventSetupCardProps> = ({ value, url, title, subtitle, field, hint, onChange }) => {
  const [isOpen, setIsOpen] = useState<boolean>(value);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // El valor llega del contexto global después de montar: antes el interruptor se quedaba con el inicial
  useEffect(() => {
    setIsOpen(value);
  }, [value]);

  const handleToggle = async () => {
    const newValue = !isOpen;
    setIsOpen(newValue);
    setError(null);
    setLoading(true);
    try {
      await updateEventSetting(url, field ?? "show", newValue);
      onChange?.(newValue);
    } catch (err) {
      // se revierte y se muestra el motivo (p. ej. publicar el ranking sin liberar la nota final, BG-67)
      setIsOpen(!newValue);
      setError(err instanceof Error ? err.message : "No se pudo guardar el cambio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sm:flex-[0_1_10%] md:mb-6 space-y-2 border-2 rounded-lg overflow-hidden  md:w-full shadow-sm ">
      <div className="border-b last:border-b-0">
        <div className="w-full p-4 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <span className="font-medium ">{title}</span>
          </div>
          <span className="text-sm opacity-70">Estado </span>
        </div>
        <div className="px-4 py-3  border-t space-y-2">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm ">{subtitle}</p>
            <div>
              <Switch
                checked={isOpen}
                onCheckedChange={handleToggle}
                disabled={loading}
                className="cursor-pointer bg-purple-800"
                aria-label={title}
              />
            </div>
          </div>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventSetupCard;
