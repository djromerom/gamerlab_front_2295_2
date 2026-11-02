import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { type GenerateBadgesResult } from "@/fetchs/jurorBadges";

interface GenerateResultDialogProps {
  result: GenerateBadgesResult | null;
  onOpenChange: (open: boolean) => void;
}

export const GenerateResultDialog: React.FC<GenerateResultDialogProps> = ({
  result,
  onOpenChange,
}) => {
  return (
    <Dialog open={result !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Resultado de la generación</DialogTitle>
          <DialogDescription>
            {result &&
              `Nuevas: ${result.created} · Ya existentes: ${result.existing} · Omitidos: ${result.skipped.length}`}
          </DialogDescription>
        </DialogHeader>

        {result && result.skipped.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              No se pudo generar la escarapela de los siguientes usuarios:
            </p>
            <div className="max-h-80 overflow-y-auto border border-border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Jurado</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.skipped.map((s) => (
                    <TableRow key={s.jurorId}>
                      <TableCell>
                        {s.name?.trim() ? (
                          <>
                            <div className="text-sm font-medium">{s.name}</div>
                            <div className="font-mono text-xs text-muted-foreground break-all">
                              {s.jurorId}
                            </div>
                          </>
                        ) : (
                          <span className="font-mono text-xs break-all">{s.jurorId}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{s.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
