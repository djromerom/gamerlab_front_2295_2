import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMultiForm } from "@/contexts/MultiFormContext";
import { useFieldArray, useFormContext } from "react-hook-form";
import { CombinedFormValues } from "@/lib/schemas";
import { useEffect, useState } from "react";
import { INSPECT_MAX_BYTES } from "buffer";

export default function MembersStep() {
  const { back, next } = useMultiForm();
  const { control, trigger } = useFormContext<CombinedFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  const handleNext = async () => {
    const isValid = await trigger("members");
    if (isValid) next();
  };


  const [isPageLoading, setIsPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null); // Cambia el tipo según tu necesidad
  const API_ENDPOINT = `http://localhost:3000/nrcs`;
  
  const [nrcActivos, setnrcActivos] = useState<Number[]>([]);
  
  useEffect(() => {
      const fetchNrcs = async () => {
      setIsPageLoading(true);
      setError(null);
      try {
        const res = await fetch(API_ENDPOINT, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          let errorMsg = `Error ${res.status}: Failed to fetch subjects`;
          try {
            const errorBody = await res.json();
            errorMsg = `Error ${res.status}: ${errorBody.message || errorMsg}`;
          } catch (e) {}
          throw new Error(errorMsg);
        }
        const dataRespond = await res.json();

        if (!Array.isArray(dataRespond)) {
          throw new Error("La respuesta de la API no es un array válido.");
        }

        const nrcActivo: Number[] = [];
        dataRespond.forEach((item) => {
          nrcActivo.push(item.code)
        });
        setnrcActivos(nrcActivo);
      } catch (err: any) {
        console.error("Error fetching subjects:", err);
        setError(
          err.message || "Ocurrió un error desconocido al cargar las materias."
        );
        setData(null);
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchNrcs();
  }, []);

  return (
    <>
      <h2 className="text-xl font-medium">Integrantes</h2>

      {fields.map((member, idx) => (
        <div key={member.id} className="border-b border-gray-200 pb-4 mb-4">
          <div className="flex justify-between items-start mb-3">
            <span>Integrante {idx + 1}</span>
            {fields.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => remove(idx)}>
                <Trash2 />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <FormField
              control={control}
              name={`members.${idx}.nombre` as const}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nombre completo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Correo */}
            <FormField
              control={control}
              name={`members.${idx}.correo` as const}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="ejemplo@correo.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Código Estudiantil */}
            <FormField
              control={control}
              name={`members.${idx}.codigoEstudiantil` as const}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código estudiantil</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="12345678" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* NRC */}
            <FormField
              control={control}
              name={`members.${idx}.nrc` as const}
              render={({ field }) => {
                const selectedNRCs: string[] = field.value || [];
                const allNRCs = nrcActivos;
                
                const availableNRCs = allNRCs.filter(
                  (val) => !selectedNRCs.includes(String(val))
                );

                return (
                  <FormItem>
                    <FormLabel>NRC</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Select
                          onValueChange={(val) =>
                            val && field.onChange([...selectedNRCs, val])
                          }
                        >
                          <SelectTrigger style={{ width: '100%' }}>
                            <span className="text-muted-foreground">
                              Selecciona uno o más NRCs
                            </span>
                          </SelectTrigger>
                          <SelectContent style={{ width: '100%' }}>
                            {availableNRCs.map((val) => (
                              <SelectItem key={String(val)} value={String(val)}>
                                {String(val)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Badges (solo si hay seleccionados) */}
                        {selectedNRCs.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {selectedNRCs.map((val) => (
                              <div
                                key={val}
                                className="flex items-center space-x-1 rounded-full border border-input bg-muted px-3 py-1 text-sm hover:bg-muted/70 cursor-pointer transition"
                              >
                                <span>{val}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 p-0 text-destructive hover:bg-destructive/10"
                                  onClick={() =>
                                    field.onChange(
                                      selectedNRCs.filter((n) => n !== val)
                                    )
                                  }
                                >
                                  ✕
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
        </div>
      ))}

      {fields.length < 5 && (
        <Button
          variant="outline"
          onClick={() =>
            append({ nombre: "", correo: "", codigoEstudiantil: "", nrc: [] })
          }
        >
          <Plus /> Agregar integrante
        </Button>
      )}

      <div className="flex justify-between space-x-4 pt-6">
        <Button variant="outline" onClick={back}>
          Atrás
        </Button>
        <Button onClick={handleNext}>Siguiente</Button>
      </div>
    </>
  );
}
