import { apiFetch } from "@/lib/api";
// Updated MembersStep.tsx
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMultiForm } from "@/features/teams/contexts/MultiFormContext";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { CombinedFormValues, NO_PASTE_MESSAGE } from "@/features/teams/lib/schemas";
import { useCallback, useEffect, useMemo, useState, type ClipboardEvent, type DragEvent } from "react";
import { toast } from "sonner";
import SubjectNrcPicker from "./SubjectNrcPicker";
import {
  markedSubjectIds,
  subjectIdOf,
  subjectsFromOptions,
  subjectsMissingNrc,
  type NrcOption,
} from "@/features/teams/lib/nrcSubjects";
import {
  COMBINATION_HINT,
  invalidCombination,
  membersWithoutSharedSubject,
  SHARED_SUBJECT_MESSAGE,
  subjectFamilies,
} from "@/features/teams/lib/subjectRules";

/**
 * Los dos campos de correo no aceptan texto pegado (teclado, menú contextual o el menú del
 * celular, que también disparan `paste`) ni arrastrado (ARK-168).
 */
const blockPasteAndDrop = {
  onPaste: (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    toast.info(NO_PASTE_MESSAGE, { id: "correo-sin-pegar" });
  },
  onDrop: (event: DragEvent<HTMLInputElement>) => {
    event.preventDefault();
    toast.info(NO_PASTE_MESSAGE, { id: "correo-sin-pegar" });
  },
};

export default function MembersStep() {
  const { back, next } = useMultiForm();
  const { control, trigger, getValues, setValue, setError, setFocus, clearErrors } =
    useFormContext<CombinedFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  const [isValidatingEmails, setIsValidatingEmails] = useState(false);
  // Materias marcadas que aún no tienen NRC, por integrante (id del field array). Las que ya
  // tienen NRC salen del valor del formulario.
  const [pendingSubjects, setPendingSubjects] = useState<Record<string, string[]>>({});
  const setPendingFor = useCallback((memberId: string, subjectIds: string[]) => {
    setPendingSubjects((current) => ({ ...current, [memberId]: subjectIds }));
  }, []);
  const watchedMembers = useWatch({ control, name: "members" });

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
    // Una materia marcada sin NRC no se ignora: se pide su NRC (propuesta A)
    const missingByMember = getValues("members").map((member, index) =>
      subjectsMissingNrc(subjects, nrcActivos, member.nrc ?? [], pendingSubjects[fields[index]?.id] ?? []),
    );
    missingByMember.forEach((missing, index) => {
      if (missing.length === 0) return;
      setError(`members.${index}.nrc`, {
        type: "manual",
        message: `Elige el NRC de ${missing.map((subject) => subject.name).join(" y de ")}`,
      });
    });
    const firstMissing = missingByMember.findIndex((missing) => missing.length > 0);
    if (firstMissing >= 0) {
      setFocus(`members.${firstMissing}.nrc`);
      return;
    }
    // ARK-193: materias que no se pueden combinar (por ejemplo, al volver de un borrador)
    const families = subjectFamilies(nrcActivos);
    const markedByMember = getValues("members").map((member, index) =>
      markedSubjectIds(subjects, nrcActivos, member.nrc ?? [], pendingSubjects[fields[index]?.id] ?? []),
    );
    const combinationByMember = markedByMember.map((marked) =>
      invalidCombination(
        subjects.filter((subject) => marked.includes(subject.id)),
        families,
      ),
    );
    const badCombination = combinationByMember.findIndex((pair) => pair !== null);
    if (badCombination >= 0) {
      const [first, second] = combinationByMember[badCombination]!;
      const message = `${first.name} y ${second.name} no se pueden marcar juntas. ${COMBINATION_HINT}`;
      setError(`members.${badCombination}.nrc`, { type: "manual", message });
      setFocus(`members.${badCombination}.nrc`);
      toast.error(`Integrante ${badCombination + 1}: ${message}`);
      return;
    }
    // ARK-193: desde el segundo integrante, cada uno comparte una materia con alguno de los
    // anteriores; el NRC puede ser distinto (mismo curso, otro grupo)
    const lonely = membersWithoutSharedSubject(markedByMember);
    if (lonely.length > 0) {
      lonely.forEach((index) => {
        setError(`members.${index}.nrc`, { type: "manual", message: SHARED_SUBJECT_MESSAGE });
      });
      setFocus(`members.${lonely[0]}.nrc`);
      toast.error(`Integrante ${lonely.map((i) => i + 1).join(", ")}: ${SHARED_SUBJECT_MESSAGE}`);
      return;
    }
    if (!isValid) return;
    const optionsByCode = new Map(nrcActivos.map((option) => [String(option.code), option]));
    let removedUnknownNrc = false;
    getValues("members").forEach((member, index) => {
      const knownCodes = member.nrc.filter((code) => optionsByCode.has(String(code)));
      if (knownCodes.length !== member.nrc.length) {
        removedUnknownNrc = true;
        setValue(`members.${index}.nrc`, knownCodes, { shouldValidate: true });
      }
    });
    const invalidMember = getValues("members").findIndex((member) => {
      const subjectIds = member.nrc.map((code) => subjectIdOf(optionsByCode.get(String(code))));
      return new Set(subjectIds).size !== subjectIds.length;
    });
    if (removedUnknownNrc && invalidMember < 0) {
      toast.info("Se quitaron NRC que ya no están disponibles en esta edición.");
    }
    if (invalidMember >= 0) {
      const message = "Elige un solo NRC por materia";
      setError(`members.${invalidMember}.nrc`, { type: "manual", message });
      setFocus(`members.${invalidMember}.nrc`);
      toast.error(`Integrante ${invalidMember + 1}: ${message}`);
      return;
    }
    // Si se quitaron NRC desconocidos, el integrante puede haber quedado sin ninguno
    if (removedUnknownNrc && !(await trigger("members"))) return;

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
  const subjects = useMemo(() => subjectsFromOptions(nrcActivos), [nrcActivos]);

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
        const knownCodes = new Set(nrcOptionsArray.map((option) => String(option.code)));
        getValues("members").forEach((member, index) => {
          const currentCodes = member.nrc ?? [];
          const validCodes = currentCodes.filter((code) => knownCodes.has(String(code)));
          if (validCodes.length !== currentCodes.length) {
            setValue(`members.${index}.nrc`, validCodes, { shouldValidate: true });
          }
        });
      } catch (err) {
        console.error("Error fetching subjects:", err);
        setNrcActivos([]);
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchNrcs();
  }, [API_ENDPOINT, getValues, setValue]);

  return (
    <>
      <h2 className="text-xl font-medium">Integrantes</h2>

      {/* ARK-193: sin altura fija ni scroll propio; la lista crece y se desplaza la página */}
      <div data-testid="members-list">
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
                        {...blockPasteAndDrop}
                        type="email"
                        placeholder="correo@ejemplo.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Repetir correo (ARK-168) */}
              <FormField
                control={control}
                name={`members.${idx}.confirmarCorreo` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repite tu correo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        {...blockPasteAndDrop}
                        type="email"
                        autoComplete="off"
                        placeholder="Escribe de nuevo el correo"
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

              {/* Materias y NRC: propuesta A del «Selector de NRC de Arkad» (HU-31, ARK-193) */}
              <FormField
                control={control}
                name={`members.${idx}.nrc` as const}
                render={({ field, fieldState }) => {
                  const previous = idx > 0 ? watchedMembers?.[idx - 1] : undefined;
                  const canCopy = !isPageLoading && subjects.length > 0 && (previous?.nrc?.length ?? 0) > 0;
                  return (
                    <FormItem className="md:col-span-2">
                      {isPageLoading ? (
                        <p className="text-sm text-muted-foreground">Cargando NRCs...</p>
                      ) : subjects.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay NRCs disponibles.</p>
                      ) : (
                        <SubjectNrcPicker
                          ref={field.ref}
                          options={nrcActivos}
                          subjects={subjects}
                          value={field.value ?? []}
                          onChange={(codes) => {
                            field.onChange(codes);
                            clearErrors(`members.${idx}.nrc`);
                          }}
                          pending={pendingSubjects[member.id] ?? []}
                          onPendingChange={(subjectIds) => {
                            setPendingFor(member.id, subjectIds);
                            clearErrors(`members.${idx}.nrc`);
                          }}
                          invalid={Boolean(fieldState.error)}
                        />
                      )}
                      {canCopy && (
                        <button
                          type="button"
                          className="justify-self-start cursor-pointer text-xs text-[#B3C7FF] underline underline-offset-2"
                          onClick={() => {
                            field.onChange([...(previous?.nrc ?? [])]);
                            setPendingFor(member.id, pendingSubjects[fields[idx - 1].id] ?? []);
                            clearErrors(`members.${idx}.nrc`);
                          }}
                        >
                          Copiar del integrante anterior
                        </button>
                      )}
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
              confirmarCorreo: "",
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