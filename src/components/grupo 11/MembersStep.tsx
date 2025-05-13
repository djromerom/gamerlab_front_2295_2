// MembersStep.tsx
"use client";
import { Plus, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
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
import type { CombinedFormValues } from "@/lib/schemas";
import { useEffect, useState } from "react";

interface NRC {
  id: number;
  code: string;
  subject: { id: number; name: string };
}

export default function MembersStep() {
  const { back, next } = useMultiForm();
  const { control, trigger } = useFormContext<CombinedFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "members" });

  const [nrcActivos, setNrcActivos] = useState<NRC[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/nrcs/select-options?includeSubjects=true", {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((j) => setNrcActivos(Array.isArray(j) ? j : j.data))
      .catch(() => setNrcActivos([]))
      .finally(() => setLoading(false));
  }, []);

  const handleNext = async () => {
    console.log(fields);
    if (await trigger("members")) next();
  };

  const display = (code: string) => {
    const n = nrcActivos.find((x) => x.code === code);
    return n ? `${n.code} – ${n.subject.name}` : code;
  };

  return (
    <>
      <h2 className="text-xl font-medium mb-4">Integrantes</h2>
      {fields.map((member, i) => {
        // Ensure nrc is always an array
        const nrcValue = member.nrc || [];
        const selected = Array.isArray(nrcValue) ? nrcValue : [];
        const available = nrcActivos.filter((n) => !selected.includes(n.code));
        
        return (
          <div key={member.id} className="border-b pb-4 mb-4">
            <div className="flex justify-between mb-3">
              <span>Integrante {i + 1}</span>
              {fields.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => remove(i)}>
                  <Trash2 />
                </Button>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Nombre */}
              <FormField
                control={control}
                name={`members.${i}.nombre`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Apellido */}
              <FormField
                control={control}
                name={`members.${i}.apellido`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Apellido" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Correo */}
              <FormField
                control={control}
                name={`members.${i}.correo`}
                rules={{
                  required: "El correo es obligatorio",
                  pattern: {
                    value: /^[\w.+-]+@uninorte\.edu\.co$/,
                    message: "El correo debe ser @uninorte.edu.co",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="usuario@uninorte.edu.co" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Código */}
              <FormField
                control={control}
                name={`members.${i}.codigoEstudiantil`}
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
                name={`members.${i}.nrc`}
                render={({ field }) => {
                  // Ensure field.value is always an array
                  const fieldValue = field.value || [];
                  const nrcValues = Array.isArray(fieldValue) ? fieldValue : [];
                  
                  return (
                    <FormItem className="md:col-span-2">
                      <FormLabel>NRC</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Select
                            value=""
                            onValueChange={(v) => {
                              if (v && !nrcValues.includes(v)) {
                                field.onChange([...nrcValues, v]);
                              }
                            }}
                            disabled={loading}
                          >
                            <SelectTrigger className="w-full">
                              {loading
                                ? "Cargando..."
                                : nrcValues.length > 0
                                ? `${nrcValues.length} NRC(s) seleccionados`
                                : "Selecciona NRC"}
                            </SelectTrigger>
                            <SelectContent className="w-full">
                              {available.map((n) => (
                                <SelectItem key={n.code} value={n.code}>
                                  {n.code} – {n.subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {nrcValues.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {nrcValues.map((c: string) => (
                                <div
                                  key={c}
                                  className="flex items-center space-x-1 rounded-full border bg-muted px-3 py-1 text-sm"
                                >
                                  <span>{c}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0 text-destructive"
                                    onClick={() =>
                                      field.onChange(nrcValues.filter((x: string) => x !== c))
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
        );
      })}
      {fields.length < 5 && (
        <Button
          variant="outline"
          onClick={() =>
            append({ nombre: "", apellido: "", correo: "", codigoEstudiantil: "", nrc: [] })
          }
        >
          <Plus /> Agregar integrante
        </Button>
      )}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={back}>
          Atrás
        </Button>
        <Button onClick={handleNext}>Siguiente</Button>
      </div>
    </>
  );
}
