"use client"

import { useState } from "react"
import { FileSpreadsheet, FileIcon as FilePdf, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import LayoutAplication from "@/layouts/LayoutAplication"
import ReportsZoneTable from "@/components/grupo 1/ReportsZoneTable"

import GraphicDisplay from "@/components/grupo 1/GraphicsDisplay"

// Datos de ejemplo
const videojuegos = [
  {
    id: 1,
    nombre: "Space Adventure2",
    materia: "Programación Avanzada",
    nrc: "12345",
    criterios: {
      jugabilidad: 4.5,
      diseño: 4.2,
      innovación: 4.8,
      técnica: 4.3,
      presentación: 4.6,
    },
    promedio: 4.48,
    evaluaciones: 5,
    totalJurados: 5,
  },
  {
    id: 2,
    nombre: "Puzzle Master",
    materia: "Diseño de Videojuegos",
    nrc: "23456",
    criterios: {
      jugabilidad: 4.2,
      diseño: 4.7,
      innovación: 4.1,
      técnica: 4.0,
      presentación: 4.3,
    },
    promedio: 4.26,
    evaluaciones: 4,
    totalJurados: 5,
  },
  {
    id: 3,
    nombre: "Fantasy Quest",
    materia: "Programación Avanzada",
    nrc: "12345",
    criterios: {
      jugabilidad: 4.7,
      diseño: 4.5,
      innovación: 4.3,
      técnica: 4.6,
      presentación: 4.8,
    },
    promedio: 4.58,
    evaluaciones: 5,
    totalJurados: 5,
  },
  {
    id: 4,
    nombre: "Racing Simulator",
    materia: "Gráficos por Computadora",
    nrc: "34567",
    criterios: {
      jugabilidad: 4.0,
      diseño: 4.1,
      innovación: 3.8,
      técnica: 4.5,
      presentación: 4.2,
    },
    promedio: 4.12,
    evaluaciones: 3,
    totalJurados: 5,
  },
  {
    id: 5,
    nombre: "Zombie Survival",
    materia: "Diseño de Videojuegos",
    nrc: "23456",
    criterios: {
      jugabilidad: 4.3,
      diseño: 4.0,
      innovación: 3.9,
      técnica: 4.1,
      presentación: 4.2,
    },
    promedio: 4.1,
    evaluaciones: 4,
    totalJurados: 5,
  },
]


const materias = ["Todas", "Programación Avanzada", "Diseño de Videojuegos", "Gráficos por Computadora"]
const nrcs = ["Todos", "12345", "23456", "34567"]
const jurados = ["Todos", "Juan Pérez", "María López", "Carlos Rodríguez", "Ana Martínez", "Pedro Sánchez"]


export default function StatisticsPage() {
  const [filtroMateria, setFiltroMateria] = useState("Todas")
  const [filtroNRC, setFiltroNRC] = useState("Todos")
  const [filtroJurado, setFiltroJurado] = useState("Todos")
  const [videojuegoSeleccionado, setVideojuegoSeleccionado] = useState(videojuegos[0])

  // Ordenar videojuegos por promedio para el ranking
  const videojuegosRanking = [...videojuegos].sort((a, b) => b.promedio - a.promedio)
  const top3 = videojuegosRanking.slice(0, 3)

  // Preparar datos para los gráficos
  const datosCriterios = Object.entries(videojuegoSeleccionado.criterios).map(([key, value]) => ({
    criterio: key.charAt(0).toUpperCase() + key.slice(1),
    valor: value,
  }))

  const breadcrumbs = [{ label: "Estadisticas", href: "/estadisticas" }]
  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      <div className="container mx-auto py-6 p-10">
        {/*Header de titulo y botones de exportación*/}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reportes y Analítica</h1>
            <p className="text-muted-foreground">Visualización de resultados de evaluaciones de videojuegos</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar datos
            </Button>
            <Button variant="outline" size="sm">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
            <Button variant="outline" size="sm">
              <FilePdf className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2 pt-2">
              <CardTitle className="text-sm font-medium">Total de Videojuegos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{videojuegos.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-2">
              <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(videojuegos.reduce((acc, game) => acc + game.promedio, 0) / videojuegos.length).toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-2">
              <CardTitle className="text-sm font-medium">Progreso de Evaluación</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-2xl font-bold">
                {videojuegos.reduce((acc, game) => acc + game.evaluaciones, 0)} /{" "}
                {videojuegos.reduce((acc, game) => acc + game.totalJurados, 0)}
              </div>
              <Progress
                value={
                  (videojuegos.reduce((acc, game) => acc + game.evaluaciones, 0) /
                    videojuegos.reduce((acc, game) => acc + game.totalJurados, 0)) *
                  100
                }
                className="mt-2"
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-12 gap-6 mb-6">
          <div className="col-span-12 md:col-span-3">
            <Card className="h-full pt-2">
              <CardHeader className="pt-2">
                <CardTitle>Filtros</CardTitle>
                <CardDescription>Refina los resultados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Materia</label>
                  <Select value={filtroMateria} onValueChange={setFiltroMateria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar materia" />
                    </SelectTrigger>
                    <SelectContent>
                      {materias.map((materia) => (
                        <SelectItem key={materia} value={materia}>
                          {materia}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">NRC</label>
                  <Select value={filtroNRC} onValueChange={setFiltroNRC}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar NRC" />
                    </SelectTrigger>
                    <SelectContent>
                      {nrcs.map((nrc) => (
                        <SelectItem key={nrc} value={nrc}>
                          {nrc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Jurado</label>
                  <Select value={filtroJurado} onValueChange={setFiltroJurado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar jurado" />
                    </SelectTrigger>
                    <SelectContent>
                      {jurados.map((jurado) => (
                        <SelectItem key={jurado} value={jurado}>
                          {jurado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Videojuego</label>
                  <Select
                    value={videojuegoSeleccionado.id.toString()}
                    onValueChange={(value) =>
                      setVideojuegoSeleccionado(
                        videojuegos.find((v) => v.id === Number.parseInt(value)) || videojuegos[0],
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar videojuego" />
                    </SelectTrigger>
                    <SelectContent>
                      {videojuegos.map((videojuego) => (
                        <SelectItem key={videojuego.id} value={videojuego.id.toString()}>
                          {videojuego.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-12 md:col-span-9">
            <Tabs defaultValue="tabla">
              <TabsList className="mb-4">
                <TabsTrigger value="tabla">Tabla de Resultados</TabsTrigger>
                <TabsTrigger value="ranking">Ranking</TabsTrigger>
                <TabsTrigger value="graficos">Gráficos</TabsTrigger>
              </TabsList>
              {/*Tabla de resultados*/}
              <TabsContent value="tabla">
                <Card>
                  <CardHeader className="pt-4">
                    <CardTitle>Tabla de Resultados</CardTitle>
                    <CardDescription>Evaluaciones por videojuego y criterio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto pb-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Videojuego</TableHead>
                            <TableHead>Materia</TableHead>
                            <TableHead>NRC</TableHead>
                            <TableHead>Jugabilidad</TableHead>
                            <TableHead>Diseño</TableHead>
                            <TableHead>Innovación</TableHead>
                            <TableHead>Técnica</TableHead>
                            <TableHead>Presentación</TableHead>
                            <TableHead>Promedio</TableHead>
                            <TableHead>Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {videojuegos.map((videojuego) => (
                            <TableRow key={videojuego.id}>
                              <TableCell className="font-medium">{videojuego.nombre}</TableCell>
                              <TableCell>{videojuego.materia}</TableCell>
                              <TableCell>{videojuego.nrc}</TableCell>
                              <TableCell>{videojuego.criterios.jugabilidad.toFixed(1)}</TableCell>
                              <TableCell>{videojuego.criterios.diseño.toFixed(1)}</TableCell>
                              <TableCell>{videojuego.criterios.innovación.toFixed(1)}</TableCell>
                              <TableCell>{videojuego.criterios.técnica.toFixed(1)}</TableCell>
                              <TableCell>{videojuego.criterios.presentación.toFixed(1)}</TableCell>
                              <TableCell className="font-bold">{videojuego.promedio.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={videojuego.evaluaciones === videojuego.totalJurados ? "success" : "warning"}
                                >
                                  {videojuego.evaluaciones}/{videojuego.totalJurados}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              {/*Tabla ranking*/}
              <TabsContent value="ranking">
                <Card>
                  <CardHeader className="pt-4">
                    <CardTitle>Ranking General</CardTitle>
                    <CardDescription>Videojuegos ordenados por puntaje promedio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Posición</TableHead>
                            <TableHead>Videojuego</TableHead>
                            <TableHead>Materia</TableHead>
                            <TableHead>NRC</TableHead>
                            <TableHead>Promedio</TableHead>
                            <TableHead>Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {videojuegosRanking.map((videojuego, index) => (
                            <TableRow key={videojuego.id}>
                              <TableCell>
                                <Badge
                                  variant={index < 3 ? "default" : "outline"}
                                  className="w-8 h-8 rounded-full flex items-center justify-center"
                                >
                                  {index + 1}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">{videojuego.nombre}</TableCell>
                              <TableCell>{videojuego.materia}</TableCell>
                              <TableCell>{videojuego.nrc}</TableCell>
                              <TableCell className="font-bold">{videojuego.promedio.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={videojuego.evaluaciones === videojuego.totalJurados ? "success" : "warning"}
                                >
                                  {videojuego.evaluaciones}/{videojuego.totalJurados}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <GraphicDisplay />
              
            </Tabs>
          </div>
        </div>

        {/* Sección de Reportes */}
        <ReportsZoneTable />
      </div>
    </LayoutAplication>
  )
}
