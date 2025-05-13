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
}

export default function MembersStep() {
  const { back, next } = useMultiForm();
  const { control, trigger } = useFormContext<CombinedFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "members" });

  const [nrcActivos, setNrcActivos] = useState<NRC[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/nrcs/select-options", {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((j) => setNrcActivos(Array.isArray(j) ? j : j.data))
      .catch(() => setNrcActivos([]))
      .finally(() => setLoading(false));
  }, []);

  const handleNext = async () => {
    if (await trigger("members")) next();
  };

  return (
    <>
      <h2 className="text-xl font-medium mb-4">Integrantes</h2>
      {fields.map((member, i) => {
        // Valores seleccionados de NRC
        const fieldNrc = member.nrc || [];
        const selected = Array.isArray(fieldNrc) ? fieldNrc : [];
        // Filtrar las opciones ya seleccionadas
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
              <FormField
                control={control}
                name={`members.${i}.nrc`}
                render={({ field }) => {
                  const nrcValues = Array.isArray(field.value) ? field.value : [];
                  return (
                    <FormItem className="md:col-span-2">
                      <FormLabel>NRC</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Select
                            value=""
                            onValueChange={(v) => field.onChange([...nrcValues, v])}
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
                                  {n.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {nrcValues.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {nrcValues.map((c) => (
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
                                      field.onChange(nrcValues.filter((x) => x !== c))
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