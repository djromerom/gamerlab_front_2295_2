import { apiFetch } from "@/lib/api";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useMultiForm } from "@/contexts/MultiFormContext";
import { CombinedFormValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { nameCheckUrl } from "@/lib/registration";

export default function TeamStep() {
  const { next } = useMultiForm();
  const { control, trigger, getValues, setError, clearErrors } =
    useFormContext<CombinedFormValues>();
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    const isValid = await trigger("teamName");
    if (!isValid) return;

    const teamName = getValues("teamName");
    setLoading(true);

    try {
      const res = await apiFetch(
        nameCheckUrl(import.meta.env.VITE_ENDPOINT_BACKEND, "name", teamName)
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const exists = await res.json();

      if (exists === true) {
        setError("teamName", {
          type: "manual",
          message: "Ya existe un equipo con este nombre en esta edición. Por favor elige otro.",
        });
        return;
      }

      clearErrors("teamName");
      next();
    } catch (e) {
      
      toast("Error de red", {
        description: "No se pudo verificar el nombre del equipo.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FormField
        control={control}
        name="teamName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre del equipo</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Team Rocket" maxLength={50} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex justify-end pt-4">
        <Button type="button" variant="home" onClick={handleNext} disabled={loading}>
          {loading ? "Verificando..." : "Siguiente"}
        </Button>
      </div>
    </>
  );
}
