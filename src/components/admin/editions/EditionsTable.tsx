import React from "react";
import { editionsCountLabel } from "@/lib/pluralize";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { type Edition } from "@/fetchs/editions";

interface EditionsListProps {
  editions: Edition[];
  onSelectEdition: (id: number) => void;
  onCreateNew: () => void;
}

const semesterLabel: Record<number, string> = {
  10: "Primer Semestre",
  20: "Intersemestral",
  30: "Segundo Semestre",
};

export const EditionsTable: React.FC<EditionsListProps> = ({
  editions,
  onSelectEdition,
  onCreateNew,
}) => {
  return (
    <div className="bg-background text-foreground min-h-[calc(100vh-10rem)] -mx-6 px-6 -mt-6 pt-6">
      <div className="flex flex-col gap-4 mb-6">
        {/* Fila 1: Título */}
        <div>
          <h1 className="text-lg md:text-xl font-medium">Gestión de Ediciones</h1>
        </div>

        {/* Fila 2: Botón y contador */}
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="text-sm text-muted-foreground">
            {editionsCountLabel(editions.length)}
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              className="bg-card hover:bg-accent text-foreground whitespace-nowrap shrink-0 h-10 px-3 sm:px-4"
              onClick={onCreateNew}
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Agregar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <Card className="rounded-lg overflow-hidden bg-card border-border shadow-none">
        <Table>
          <TableHeader className="bg-card border-b border-border">
            <TableRow className="hover:bg-transparent">
              <TableHead>Título</TableHead>
              <TableHead>Año y Semestre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {editions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  No hay ediciones registradas aún.
                </TableCell>
              </TableRow>
            ) : (
              editions.map((edition) => (
                <TableRow key={edition.id}>
                  <TableCell className="font-medium">
                    {edition.title}
                  </TableCell>
                  <TableCell>
                    <div>{edition.year}</div>
                    <div className="text-muted-foreground text-xs">
                      {semesterLabel[edition.semester] ?? `Semestre ${edition.semester}`}
                    </div>
                  </TableCell>
                  <TableCell>
                    {edition.status === 'ACTIVE' && (
                      <Badge variant="default">Activa</Badge>
                    )}
                    {edition.status === 'INACTIVE' && (
                      <Badge variant="secondary">Inactiva</Badge>
                    )}
                    {edition.status === 'ARCHIVED' && (
                      <Badge variant="destructive">Archivada</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onSelectEdition(edition.id)}
                      title="Editar edición"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
