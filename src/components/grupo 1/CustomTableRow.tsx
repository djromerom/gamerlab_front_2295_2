// CustomTableRow.tsx
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface CustomTableRowProps {
  title: string;
  description: string;
  date?: string; // Considera usar un tipo más específico si es necesario
}

export const CustomTableRow = ({ title, description, date }: CustomTableRowProps) => {
  return (
    <TableRow>
      <TableCell className="font-medium">{title}</TableCell>
      <TableCell>{description}</TableCell>
      <TableCell>{date ?? "No disponible"}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" aria-label="Descargar Excel">
            <Download className="h-4 w-4 mr-1" /> Excel
          </Button>
          <Button variant="outline" size="sm" aria-label="Descargar PDF">
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

// Opcional: Si realmente necesitas CustomTableRowBeta, dale un propósito único.
export const CustomTableRowBeta = ({ title, description }: CustomTableRowProps) => {
  return (
    <TableRow > 
      <TableCell className="font-medium">{title}</TableCell>
      <TableCell>{description}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" aria-label="Descargar Excel">
            <Download className="h-4 w-4 mr-1" /> Excel
          </Button>
          <Button variant="outline" size="sm" aria-label="Descargar PDF">
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};