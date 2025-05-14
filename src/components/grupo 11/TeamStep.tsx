import { useFormContext } from "react-hook-form";
import { useMultiForm } from "@/contexts/MultiFormContext";
import { CombinedFormValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "@/components/ui/input";
import { useFetch } from "@/hooks/useFetch";
import { useEffect } from "react";

export default function TeamStep() {
  const { next } = useMultiForm();
  const { control, trigger } = useFormContext<CombinedFormValues>();

  const handleNext = async () => {
    const isValid = await trigger('teamName');
    if (isValid) next();
  };

  const TeamInfo = () => {
  const fetch = useFetch();

  useEffect(() => {
    const getTeam = async () => {
      try {
        const response = await fetch("http://localhost:3000/teams/name/TeamRocket");
        if (!response.ok) {
          throw new Error("No se pudo obtener el equipo");
        }
        const data = await response.json();
        console.log("Equipo:", data);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    getTeam();
  }, [fetch]);

  return <div>Consulta de equipo</div>;
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
              <Input {...field} placeholder="Team Rocket" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex justify-end pt-4">
        <Button onClick={handleNext}>Siguiente</Button>
      </div>
    </>
  );
}