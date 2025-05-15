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

// Define an interface for your NRC option objects
interface NrcOption {
  code: number | string; // Assuming code can be number or string
  name?: string; // Optional: if your API returns a name to display
  // Add any other relevant properties from your API response
  [key: string]: any; // Allows for other properties not explicitly typed
}

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

  const [isPageLoading, setIsPageLoading] = useState(true); // Initialize to true
  const [error, setError] = useState<string | null>(null);
  const API_ENDPOINT = `${
    import.meta.env.ENDPOINT_BACKEND
  }/nrcs/select-options`;

  const [nrcActivos, setNrcActivos] = useState<NrcOption[]>([]); // Typed state

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
            /* Silently ignore error parsing error body */
          }
          throw new Error(errorMsg);
        }
        const apiResponseObject = await res.json(); // This is the array-like object
        // console.log("Raw API Response Object:", apiResponseObject);

        // --- MODIFICATION START ---
        let nrcOptionsArray: NrcOption[] = []; // Initialize as an empty array

        // Check if the response is an object and has a 'length' property,
        // indicating it's likely our array-like object.
        if (
          typeof apiResponseObject === "object" &&
          apiResponseObject !== null &&
          apiResponseObject.hasOwnProperty("length")
        ) {
          // Convert the array-like object to a true array
          const trueArray = Object.values(apiResponseObject);

          // Now filter and map this trueArray
          // Ensure that each item has a 'code' property before setting
          nrcOptionsArray = trueArray.filter(
            (item: any): item is NrcOption =>
              item && item.code !== undefined && item.code !== null
          );
          // Optional: If your API also returns 'name' and you want to ensure it's present
          // nrcOptionsArray = nrcOptionsArray.filter(item => item.name !== undefined);
        } else {
          // This case might occur if the API changes or returns something unexpected
          console.warn(
            "API response for NRCs was not the expected array-like object:",
            apiResponseObject
          );
        }
        setNrcActivos(nrcOptionsArray);
        // --- MODIFICATION END ---
      } catch (err: any) {
        console.error("Error fetching subjects:", err);
        setError(
          err.message || "Ocurrió un error desconocido al cargar las materias."
        );
        setNrcActivos([]); // Ensure it's an empty array on error
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

            {/* Apellido */}
            <FormField
              control={control}
              name={`members.${idx}.apellido` as const}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Apellido completo" />
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
                      placeholder="correo@uninorte.edu.co"
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
                const selectedNRCs: string[] = field.value || []; // These are strings of codes
                const allNrcOptionsFromState: NrcOption[] = nrcActivos; // Now an array of NrcOption

                // Filter options that are not already selected
                const availableNrcOptionsToSelect =
                  allNrcOptionsFromState.filter(
                    (nrcOption) =>
                      !selectedNRCs.includes(String(nrcOption.code))
                  );

                let triggerText = "Selecciona uno o más NRCs";
                if (isPageLoading) {
                  triggerText = "Cargando NRCs...";
                } else if (error) {
                  triggerText = "Error al cargar NRCs";
                } else if (allNrcOptionsFromState.length === 0) {
                  triggerText = "No hay NRCs disponibles";
                }

                return (
                  <FormItem>
                    <FormLabel>NRC</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Select
                          onValueChange={(
                            selectedCodeValue // This value will be String(nrcOption.code)
                          ) =>
                            selectedCodeValue &&
                            field.onChange([...selectedNRCs, selectedCodeValue])
                          }
                          disabled={
                            isPageLoading ||
                            !!error ||
                            (allNrcOptionsFromState.length === 0 &&
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
                            allNrcOptionsFromState.length > 0 ? (
                              availableNrcOptionsToSelect.map((nrcOption) => (
                                <SelectItem
                                  key={String(nrcOption.code)} // Use unique code as key
                                  value={String(nrcOption.code)} // Use code as value
                                >
                                  {/* Display nrcOption.name if available, otherwise code */}
                                  {nrcOption.name
                                    ? `${nrcOption.code} - ${nrcOption.name}`
                                    : String(nrcOption.code)}
                                </SelectItem>
                              ))
                            ) : !isPageLoading &&
                              !error &&
                              allNrcOptionsFromState.length === 0 ? (
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
                                key={val} // val is already a string code
                                className="flex items-center space-x-1 rounded-full border border-input bg-muted px-3 py-1 text-sm hover:bg-muted/70 cursor-pointer transition"
                              >
                                {/* If you stored NrcOption objects in field.value, you'd display val.name here */}
                                {/* For now, assuming val is just the string code */}
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
              apellido: "", // Added apellido
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
