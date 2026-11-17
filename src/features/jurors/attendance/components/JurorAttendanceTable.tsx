import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  METHOD_LABEL,
  STATUS_LABEL,
  formatArrival,
  sortAttendanceRows,
  type JurorAttendanceItem,
} from "@/features/jurors/attendance/api/jurorAttendance";
import { JUROR_PUBLIC_LABEL } from "@/lib/jurorLabel";

interface JurorAttendanceTableProps {
  jurors: JurorAttendanceItem[];
  emptyMessage: string;
  /** HU-35: Junior/Senior solo para el administrador; el Staff ve «Jurado». */
  showCategory?: boolean;
}

// Solo lectura: la llegada se registra en Check-in de jurados (HU-11).
export const JurorAttendanceTable: React.FC<JurorAttendanceTableProps> = ({
  jurors,
  emptyMessage,
  showCategory = false,
}) => (
  <Card className="rounded-lg overflow-hidden bg-card border-border shadow-none">
    <Table>
      <TableHeader className="bg-card border-b border-border">
        <TableRow className="hover:bg-transparent">
          <TableHead>Jurado</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Llegada</TableHead>
          <TableHead className="hidden md:table-cell">Método</TableHead>
          <TableHead className="hidden md:table-cell">Registró</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jurors.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground whitespace-normal">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          sortAttendanceRows(jurors).map((juror) => {
            const present = juror.status === "PRESENT";
            return (
              <TableRow key={juror.jurorId}>
                <TableCell className="whitespace-normal">
                  <div className="font-medium">{juror.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {showCategory ? juror.category : JUROR_PUBLIC_LABEL}
                    {juror.isProfessor && " · Profesor"}
                    {!juror.hasBadge && " · Sin escarapela"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={present ? "success" : "warning"}>{STATUS_LABEL[juror.status]}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatArrival(juror.checkedInAt)}
                  {/* En pantallas angostas el método y quién registró van bajo la hora */}
                  {present && (
                    <div className="text-xs text-muted-foreground md:hidden">
                      {juror.method ? METHOD_LABEL[juror.method] : "—"}
                      {juror.checkedInBy && ` · ${juror.checkedInBy.name}`}
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {juror.method ? METHOD_LABEL[juror.method] : "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell whitespace-normal">
                  {juror.checkedInBy?.name ?? "—"}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  </Card>
);
