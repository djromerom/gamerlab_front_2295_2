import { useEffect } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

/**
 * BG-66 (ARK-266): el registro valida cada paso con `trigger()` y nunca hace «submit» hasta el final, así que
 * React Hook Form no revalidaba al escribir y el mensaje de error seguía visible después de corregir el dato.
 * Cuando el alumno cambia un campo que tiene un error (del esquema o puesto a mano, como «ya existe un equipo con
 * este nombre»), se vuelve a validar ese campo: si ya está bien, el mensaje desaparece.
 */
export function useRevalidateOnChange<T extends FieldValues>({ watch, trigger, getFieldState }: UseFormReturn<T>) {
  useEffect(() => {
    const subscription = watch((_values, { name, type }) => {
      if (type !== "change" || !name) return;
      if (getFieldState(name).error) void trigger(name);
    });
    return () => subscription.unsubscribe();
  }, [watch, trigger, getFieldState]);
}
