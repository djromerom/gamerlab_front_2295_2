import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ROW_ERROR_MESSAGE,
  STATUS_LABEL,
  TYPE_LABEL,
  type EditionJurorItem,
  type JurorEditionListStatus,
  type StatusRowError,
} from "@/fetchs/jurorEdition";

interface EditionJurorsTableProps {
  jurors: EditionJurorItem[];
  selectedIds: Set<string>;
  onToggle: (juror: EditionJurorItem) => void;
  onToggleAll: (checked: boolean) => void;
  rowErrors: Map<string, StatusRowError>;
  writable: boolean;
}

const statusVariant: Record<JurorEditionListStatus, "default" | "secondary" | "outline" | "success" | "warning" | "destructive"> = {
  PENDING: "warning",
  CONFIRMED: "success",
  DECLINED: "destructive",
  AUTOMATIC: "secondary",
};

// Fechas del back en UTC; se muestran en hora de Colombia
const formatUpdatedAt = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Bogota",
      }).format(new Date(iso))
    : "—";

export const EditionJurorsTable: React.FC<EditionJurorsTableProps> = ({
  jurors,
  selectedIds,
  onToggle,
  onToggleAll,
  rowErrors,
  writable,
}) => {
  // Los profesores (AUTOMATIC) no se seleccionan: entran por sus NRC
  const selectable = writable ? jurors.filter((j) => j.status !== "AUTOMATIC") : [];
  const allSelected = selectable.length > 0 && selectable.every((j) => selectedIds.has(j.jurorId));

  return (
    <Card className="rounded-lg overflow-hidden bg-card border-border shadow-none">
      <Table>
        <TableHeader className="bg-card border-b border-border">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[50px]">
              {writable && (
                <label className="flex items-center cursor-pointer">
                  <Checkbox
                    checked={allSelected}
                    disabled={selectable.length === 0}
                    onChange={(e) => onToggleAll((e.target as HTMLInputElement).checked)}
                    aria-label="Seleccionar todos los de esta página"
                  />
                </label>
              )}
            </TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Último cambio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jurors.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                No hay jurados con estos filtros.
              </TableCell>
            </TableRow>
          ) : (
            jurors.map((juror) => {
              const name = `${juror.firstName} ${juror.lastName}`;
              const rowError = rowErrors.get(juror.jurorId);
              return (
                <TableRow key={juror.jurorId} className={rowError ? "bg-destructive/10" : undefined}>
                  <TableCell>
                    {writable && juror.status !== "AUTOMATIC" && (
                      <label className="flex items-center cursor-pointer">
                        <Checkbox
                          checked={selectedIds.has(juror.jurorId)}
                          onChange={() => onToggle(juror)}
                          aria-label={`Seleccionar ${name}`}
                        />
                      </label>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {name}
                    {rowError && (
                      <p className="text-xs font-normal text-destructive">{ROW_ERROR_MESSAGE[rowError]}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{juror.email}</TableCell>
                  <TableCell>{juror.category}</TableCell>
                  <TableCell>{juror.type ? TYPE_LABEL[juror.type] : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[juror.status] ?? "outline"}>
                      {STATUS_LABEL[juror.status] ?? juror.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatUpdatedAt(juror.updatedAt)}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Card>
  );
};
