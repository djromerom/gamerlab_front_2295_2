// Updated MembersStep.tsx
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
import { toast } from "sonner";

// Define an interface for your NRC option objects
interface NrcOption {
  code: number | string;
  name?: string;
  [key: string]: unknown;
}

export default function MembersStep() {
  const { back, next } = useMultiForm();
  const { control, trigger, watch, setError } = useFormContext<CombinedFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  // Watch all member emails to validate them against the API
  const memberEmails = watch("members").map(member => member.correo);
  const [isValidatingEmails, setIsValidatingEmails] = useState(false);

  // Email validation against API
  const validateEmails = async () => {
    // Filter out empty emails
    const emailsToValidate = memberEmails.filter(email => email.trim() !== "");
    
    if (emailsToValidate.length === 0) return true; // No emails to validate
    
    // setIsValidatingEmails(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/teams/validate-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails: emailsToValidate }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: Error al validar correos`);
      }
      
      const result = await response.json();
      
      // Check each email in the result
      let allValid = true;
      fields.forEach((_, index) => {
        const email = watch(`members.${index}.correo`);
        if (email && result[email]) {
          setError(`members.${index}.correo`, {
            type: 'manual',
            message: 'Este correo ya está registrado'
          });
          allValid = false;
        }
      });
      
      return allValid;
    } catch (error) {
      console.error("Error validating emails:", error);
      toast.error("Error al validar correos", {
        description: error instanceof Error ? error.message : "Error desconocido",
      });
      return false;
    } finally {
      setIsValidatingEmails(false);
    }
  };

  const handleNext = async () => {
    // First validate the form fields
    const isValid = await trigger("members");
    if (!isValid) return;
    
    // Then validate emails against API
    const emailsValid = await validateEmails();
    if (!emailsValid) return;
    
    // If everything is valid, move to next step
    next();
  };

  const [isPageLoading, setIsPageLoading] = useState(true);
  const API_ENDPOINT = `${import.meta.env.VITE_ENDPOINT_BACKEND}/nrcs/select-options`;

  const [nrcActivos, setNrcActivos] = useState<NrcOption[]>([]);

  useEffect(() => {
    const fetchNrcs = async () => {
      setIsPageLoading(true);
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
        const apiResponseObject = await res.json();

        let nrcOptionsArray: NrcOption[] = [];

        if (
          typeof apiResponseObject === "object" &&
          apiResponseObject !== null &&
          Object.prototype.hasOwnProperty.call(apiResponseObject, "length")
        ) {
          const trueArray = Object.values(apiResponseObject);

          nrcOptionsArray = trueArray.filter(
            (item): item is NrcOption =>
              !!item && (item as NrcOption).code !== undefined && (item as NrcOption).code !== null
          );
        } else {
          console.warn(
            "API response for NRCs was not the expected array-like object:",
            apiResponseObject
          );
        }
        setNrcActivos(nrcOptionsArray);
      } catch (err) {
        console.error("Error fetching subjects:", err);
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

      <div className=" overflow-y-auto
  [&::-webkit-scrollbar]:w-2 pr-5
  [&::-webkit-scrollbar-track]:rounded-full
  [&::-webkit-scrollbar-track]:bg-gray-100
  [&::-webkit-scrollbar-thumb]:rounded-full
  [&::-webkit-scrollbar-thumb]:bg-gray-300
  dark:[&::-webkit-scrollbar-track]:bg-neutral-700
  dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500" style={{ maxHeight: 400, overflowY: "auto" }}>
        {fields.map((member, idx) => (
          <div key={member.id} className="border-b border-gray-200 pb-4 mb-4">
            <div className="flex justify-between items-start mb-3">
              <span>Integrante {idx + 1}</span>
              {fields.length > 1 && (
                <Button
                  variant="ghost"
                  className="cursor-pointer"
                  size="icon"
                  onClick={() => remove(idx)}
                >
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
                      <Input {...field} placeholder="Nombre(s)" />
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
                      <Input {...field} placeholder="Apellido(s)" />
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
                    <FormLabel>Correo Institucional</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="correo@ejemplo.com"
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
                  const allNrcOptionsFromState: NrcOption[] = nrcActivos;

                  // Solo evitar duplicados dentro del mismo miembro
                  // Diferentes miembros SÍ pueden tener el mismo NRC
                  const availableNrcOptionsToSelect =
                    allNrcOptionsFromState.filter(
                      (nrcOption) =>
                        !selectedNRCs.includes(String(nrcOption.code))
                    );

                  let triggerText = "Selecciona TODOS los NRCs del integrante";
                  if (isPageLoading) {
                    triggerText = "Cargando NRCs...";
                  } else if (allNrcOptionsFromState.length === 0) {
                    triggerText = "No hay NRCs disponibles";
                  }

                  return (
                    <FormItem>
                      <FormLabel>NRC</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Select
                            key={selectedNRCs.join(",")} // Fuerza re-render cuando cambian los NRCs
                            value="" // Siempre vacio para permitir nueva selección
                            onValueChange={(selectedCodeValue) => {
                              if (selectedCodeValue && !selectedNRCs.includes(selectedCodeValue)) {
                                field.onChange([...selectedNRCs, selectedCodeValue]);
                              }
                            }}
                            disabled={
                              isPageLoading ||
                              (allNrcOptionsFromState.length === 0 &&
                                !isPageLoading)
                            }
                          >
                            <SelectTrigger
                              className="cursor-pointer"
                              style={{ width: "100%" }}
                            >
                              <span className="text-muted-foreground">
                                {triggerText}
                              </span>
                            </SelectTrigger>
                            <SelectContent style={{ width: "100%" }}>
                              {!isPageLoading &&
                              allNrcOptionsFromState.length > 0 ? (
                                availableNrcOptionsToSelect.map((nrcOption) => (
                                  <SelectItem
                                    className="cursor-pointer"
                                    key={String(nrcOption.code)}
                                    value={String(nrcOption.code)}
                                  >
                                    {nrcOption.name
                                      ? `${nrcOption.code} - ${nrcOption.name}`
                                      : String(nrcOption.code)}
                                  </SelectItem>
                                ))
                              ) : !isPageLoading &&
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
                                  key={val}
                                  className="flex items-center space-x-1 rounded-full border border-input bg-muted px-3 py-1 text-sm hover:bg-muted/70 cursor-pointer transition"
                                >
                                  <span>{val}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
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
      </div>

      {fields.length < 5 && (
        <Button
          type="button"
          className="cursor-pointer"
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
        <Button type="button" className="cursor-pointer" variant="outline" onClick={back}>
          Atrás
        </Button>
        <Button 
          type="button"
          variant="home" 
          onClick={handleNext}
          disabled={isValidatingEmails}
        >
          {isValidatingEmails ? "Validando..." : "Siguiente"}
        </Button>
      </div>
    </>
  );
}