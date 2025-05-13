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
import { CombinedFormValues } from "@/lib/schemas"; // Ensure this import is correct
import { useEffect, useState } from "react";

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

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_ENDPOINT = `http://localhost:3000/nrcs/select-options`;

  // Store NRC codes as an array of strings
  const [nrcActivos, setNrcActivos] = useState<string[]>([]);

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
          } catch (e) {
            /* Ignore parsing error of error body */
          }
          throw new Error(errorMsg);
        }
        const dataRespond = await res.json(); // This is now directly the array

        // --- MODIFICATION START ---
        if (Array.isArray(dataRespond)) {
          // Check if dataRespond itself is an array
          // Assuming each item in dataRespond is an object with a 'code' property.
          // Extract the 'code', convert to string, ensure it's not null/undefined, and make unique.
          const codes = dataRespond // Use dataRespond directly
            .map((item) =>
              item && item.code !== undefined && item.code !== null
                ? String(item.code)
                : null
            )
            .filter((code): code is string => code !== null) // Type guard to ensure only strings proceed, and filter out nulls
            .filter((code, index, self) => self.indexOf(code) === index); // Keep only unique codes
          setNrcActivos(codes);
        } else {
          // This warning will now trigger if dataRespond is not an array
          console.warn(
            "API response for NRCs was not an array as expected:",
            dataRespond
          );
          setNrcActivos([]);
        }
        // --- MODIFICATION END ---
      } catch (err: any) {
        console.error("Error fetching subjects:", err);
        setError(
          err.message || "Ocurrió un error desconocido al cargar las materias."
        );
        setNrcActivos([]);
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchNrcs();
  }, [API_ENDPOINT]);

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
                const selectedNRCs: string[] = field.value || []; // These are strings

                // nrcActivos is now correctly an array of unique NRC code strings
                const allNrcCodesFromState: string[] = nrcActivos;

                const availableNRCsToSelect = allNrcCodesFromState.filter(
                  (code) => !selectedNRCs.includes(code)
                );

                let triggerText = "Selecciona uno o más NRCs";
                if (isPageLoading) {
                  triggerText = "Cargando NRCs...";
                } else if (error) {
                  triggerText = "Error al cargar NRCs";
                } else if (allNrcCodesFromState.length === 0) {
                  triggerText = "No hay NRCs disponibles";
                }

                return (
                  <FormItem>
                    <FormLabel>NRC</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Select
                          onValueChange={(selectedCode) =>
                            selectedCode &&
                            field.onChange([...selectedNRCs, selectedCode])
                          }
                          disabled={
                            isPageLoading ||
                            !!error ||
                            (allNrcCodesFromState.length === 0 &&
                              !isPageLoading)
                          }
                        >
                          <SelectTrigger style={{ width: "100%" }}>
                            <span className="text-muted-foreground">
                              {triggerText}
                            </span>
                          </SelectTrigger>
                          <SelectContent style={{ width: "100%" }}>
                            {!isPageLoading &&
                            !error &&
                            allNrcCodesFromState.length > 0 ? (
                              availableNRCsToSelect.map(
                                (
                                  code // 'code' is now a unique string like "1001", "1002"
                                ) => (
                                  <SelectItem
                                    key={code} // Use the unique string code as the key
                                    value={code} // Use the unique string code as the value
                                  >
                                    {code}{" "}
                                    {/* Display the code. Modify if you want to display name from an object */}
                                  </SelectItem>
                                )
                              )
                            ) : !isPageLoading &&
                              !error &&
                              allNrcCodesFromState.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No hay NRCs disponibles.
                              </div>
                            ) : null}
                          </SelectContent>
                        </Select>

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
                    {error && !isPageLoading && (
                      <p className="text-sm font-medium text-destructive">
                        {error}
                      </p>
                    )}
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
            append({
              nombre: "",
              apellido: "",
              correo: "",
              codigoEstudiantil: "",
              nrc: [],
            })
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
