// CustomTableRow.tsx
import { TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface CustomTableRowProps {
  title: string
  description: string
  date: string
}

const CustomTableRow = ({ title, description, date }: CustomTableRowProps) => {
  return (
    <TableRow>
      <TableCell className="font-medium">{title}</TableCell>
      <TableCell>{description}</TableCell>
      <TableCell>{date}</TableCell>
      <TableCell>
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1" /> Excel
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1" /> PDF
        </Button>
      </div>
      </TableCell>
    </TableRow>
  )
}

export default CustomTableRow
