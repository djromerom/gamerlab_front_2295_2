import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CustomTableRow } from "./CustomTableRow"


const DownloadReport = () => {
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
                  <TableRow >
                    <TableHead className="font-semibold">Nombre del Reporte</TableHead>
                    <TableHead className="font-semibold">Descripción</TableHead>
                    <TableHead className="font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <CustomTableRow
                    title="Reporte de Equipos"
                    description="Exporta un archivo Excel con la información y calificaciones de cada equipo/videojuego"
                  />
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
    )
}
export default DownloadReport