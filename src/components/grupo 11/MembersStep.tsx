import { apiFetch } from "@/lib/api";
// Updated MembersStep.tsx
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  subjectId?: number;
  professorName?: string;
  subject?: { id?: number; name?: string; abrevName?: string } | null;
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
  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({});

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
    const optionsByCode = new Map(nrcActivos.map((option) => [String(option.code), option]));
    const invalidMember = getValues("members").findIndex((member) => {
      const subjectIds = member.nrc.map((code) =>
        String(optionsByCode.get(code)?.subjectId ?? optionsByCode.get(code)?.subject?.id ?? ""),
      );
      return new Set(subjectIds).size !== subjectIds.length;
    });
    if (invalidMember >= 0) {
      const message = "Elige un solo NRC por materia";
      setError(`members.${invalidMember}.nrc`, { type: "manual", message });
      setFocus(`members.${invalidMember}.nrc`);
      toast.error(`Integrante ${invalidMember + 1}: ${message}`);
      return;
    }

    setIsValidatingEmails(true);
    try {
      // Luego contra la API: correos y códigos ya inscritos en la edición actual. Haber
      // participado en una edición anterior no los ocupa (ARK-128).
      const emailsFree = await checkTaken(
        "validate-emails",
        "emails",
        "correo",
        "Este correo ya está inscrito en esta edición o pertenece a una cuenta que no es de estudiante",
      );
      const codesFree = await checkTaken(
        "validate-student-codes",
        "studentCodes",
        "codigoEstudiantil",
        "Este código ya está inscrito en otro equipo de esta edición",
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
  // includeSubjects: cada opción muestra la materia además del número
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
                  const subjects = Array.from(
                    new Map(
                      allNrcOptionsFromState
                        .filter((option) => option.subject)
                        .map((option) => {
                          const subjectId = String(option.subjectId ?? option.subject?.id ?? "");
                          return [subjectId, {
                            id: subjectId,
                            name: option.subject?.name ?? option.name ?? "",
                            abrevName: option.subject?.abrevName ?? option.subject?.name ?? "",
                          }];
                        }),
                    ).values(),
                  );
                  const subjectByCode = new Map(
                    allNrcOptionsFromState.map((option) => [
                      String(option.code),
                      String(option.subjectId ?? option.subject?.id ?? ""),
                    ]),
                  );

                  return (
                    <FormItem>
                      <FormLabel>NRC</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          {isPageLoading && <p className="text-sm text-muted-foreground">Cargando NRCs...</p>}
                          {!isPageLoading && subjects.length === 0 && (
                            <p className="text-sm text-muted-foreground">No hay NRCs disponibles.</p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {subjects.map((subject) => {
                              const key = `${idx}:${subject.id}`;
                              const active = Boolean(openSubjects[key]) || selectedNRCs.some(
                                (code) => subjectByCode.get(code) === subject.id,
                              );
                              return (
                                <Button
                                  type="button"
                                  variant={active ? "default" : "outline"}
                                  size="sm"
                                  key={subject.id}
                                  title={subject.name}
                                  aria-pressed={active}
                                  onClick={() => {
                                    const nextOpen = !active;
                                    setOpenSubjects((current) => ({ ...current, [key]: nextOpen }));
                                    if (!nextOpen) {
                                      field.onChange(selectedNRCs.filter(
                                        (code) => subjectByCode.get(code) !== subject.id,
                                      ));
                                    }
                                  }}
                                >
                                  {subject.abrevName}
                                </Button>
                              );
                            })}
                          </div>
                          {subjects.filter((subject) => {
                            const key = `${idx}:${subject.id}`;
                            return openSubjects[key] || selectedNRCs.some(
                              (code) => subjectByCode.get(code) === subject.id,
                            );
                          }).map((subject) => {
                            const currentCode = selectedNRCs.find(
                              (code) => subjectByCode.get(code) === subject.id,
                            );
                            const options = allNrcOptionsFromState.filter(
                              (option) => String(option.subjectId ?? option.subject?.id) === subject.id,
                            );
                            return (
                              <div key={subject.id} className="space-y-1">
                                <label className="text-sm font-medium" title={subject.name}>{subject.name}</label>
                                <Select
                                  value={currentCode}
                                  onValueChange={(code) => {
                                    field.onChange([
                                      ...selectedNRCs.filter(
                                        (selectedCode) => subjectByCode.get(selectedCode) !== subject.id,
                                      ),
                                      code,
                                    ]);
                                  }}
                                >
                                  <SelectTrigger><SelectValue placeholder={`Selecciona el NRC de ${subject.abrevName}`} /></SelectTrigger>
                                  <SelectContent>
                                    {options.map((option) => (
                                      <SelectItem key={String(option.code)} value={String(option.code)}>
                                        {String(option.code)}{option.professorName ? ` · ${option.professorName}` : ""}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
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