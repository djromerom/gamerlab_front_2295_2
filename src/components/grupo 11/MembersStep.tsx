import { apiFetch } from "@/lib/api";
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
import { nrcLabel } from "@/lib/registration";

// Define an interface for your NRC option objects
interface NrcOption {
  code: number | string;
  name?: string;
  subject?: { id?: number; name?: string } | null;
  [key: string]: unknown;
}

export default function MembersStep() {
  const { back, next } = useMultiForm();
  const { control, trigger, getValues, setError, setFocus } = useFormContext<CombinedFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  const [isValidatingEmails, setIsValidatingEmails] = useState(false);

  /**
   * Revisa contra la API una lista de valores (correos o códigos) y marca el campo de cada
   * integrante que ya esté registrado. Devuelve true si ninguno lo está.
   */
  const checkTaken = async (
    path: "validate-emails" | "validate-student-codes",
    bodyKey: "emails" | "studentCodes",
    field: "correo" | "codigoEstudiantil",
    message: string,
  ): Promise<boolean> => {
    const values = getValues("members").map((member) =>
      field === "correo"
        ? member.correo.trim().toLowerCase()
        : member.codigoEstudiantil.trim(),
    );
    const toCheck = [...new Set(values.filter((value) => value !== ""))];
    if (toCheck.length === 0) return true;

    const response = await apiFetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/teams/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [bodyKey]: toCheck }),
    });

    // Un back sin la ruta nueva (404) no bloquea el registro: el envío final igual la revisa
    if (response.status === 404 && path === "validate-student-codes") return true;
    // El backend limita estas rutas públicas por IP (BG-02)
    if (response.status === 429) {
      throw new Error("Se han hecho demasiadas solicitudes desde tu red. Espera un minuto e inténtalo de nuevo.");
    }
    if (!response.ok) {
      throw new Error(`Error ${response.status} al validar los datos de los integrantes`);
    }

    const result = (await response.json()) as Record<string, boolean>;
    const taken = values
      .map((value, index) => (value && result[value] ? index : -1))
      .filter((index) => index >= 0);
    taken.forEach((index) => {
      setError(`members.${index}.${field}`, { type: "manual", message });
    });
    if (taken.length > 0) {
      // El campo puede quedar fuera de vista dentro de la lista con scroll
      setFocus(`members.${taken[0]}.${field}`);
      toast.error(`${message} (integrante ${taken.map((i) => i + 1).join(", ")})`);
    }
    return taken.length === 0;
  };

  const handleNext = async () => {
    // Primero las reglas del formulario (vacíos, formato, repetidos dentro del equipo)
    const isValid = await trigger("members");
    if (!isValid) return;

    setIsValidatingEmails(true);
    try {
      // Luego contra la API: correos y códigos ya registrados (BG-06)
      const emailsFree = await checkTaken(
        "validate-emails",
        "emails",
        "correo",
        "Este correo ya está registrado",
      );
      const codesFree = await checkTaken(
        "validate-student-codes",
        "studentCodes",
        "codigoEstudiantil",
        "Este código ya está registrado en otro equipo",
      );
      if (emailsFree && codesFree) next();
    } catch (error) {
      console.error("Error validating members:", error);
      toast.error("No se pudieron validar los integrantes", {
        description: error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setIsValidatingEmails(false);
    }
  };

  const [isPageLoading, setIsPageLoading] = useState(true);
  // includeSubjects: cada opción muestra la materia además del número (BG-07)
  const API_ENDPOINT = `${import.meta.env.VITE_ENDPOINT_BACKEND}/nrcs/select-options?includeSubjects=true`;

  const [nrcActivos, setNrcActivos] = useState<NrcOption[]>([]);

  useEffect(() => {
    const fetchNrcs = async () => {
      setIsPageLoading(true);
      try {
        const res = await apiFetch(API_ENDPOINT, {
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
                  type="button"
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
                      <Input {...field} placeholder="Nombre(s)" maxLength={50} />
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
                      <Input {...field} placeholder="Apellido(s)" maxLength={50} />
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
                      <Input {...field} placeholder="200123456" inputMode="numeric" maxLength={20} />
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
                                    {nrcLabel(nrcOption)}
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
                                  <span>
                                    {nrcLabel(
                                      allNrcOptionsFromState.find((o) => String(o.code) === val) ?? { code: val },
                                    )}
                                  </span>
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