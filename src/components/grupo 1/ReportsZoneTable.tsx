import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CustomTableRow } from "./CustomTableRow"


const ReportsZoneTable = () => {
    return (
    <Card className="mb-6">
          <CardHeader className="pt-4">
            <CardTitle>Reportes Disponibles</CardTitle>
            <CardDescription>Descarga informes detallados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Reporte</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <CustomTableRow
                    title="Reporte General"
                    description="Evaluaciones completas de todos los videojuegos"
                    date="29/04/2025"
                  />
                  <CustomTableRow
                    title="Reporte por Materia"
                    description="Evaluaciones agrupadas por materia"
                    date="29/04/2025"
                  />
                  <CustomTableRow
                    title="Ranking Final"
                    description="Clasificación final de todos los videojuegos"
                    date="29/04/2025"
                  />
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
    )
}
export default ReportsZoneTable