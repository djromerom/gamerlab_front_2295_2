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

export default function TeamStep() {
  const { next } = useMultiForm();
  const { control, trigger } = useFormContext<CombinedFormValues>();

  const handleNext = async () => {
    const isValid = await trigger("teamName");
    if (isValid) next();
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
