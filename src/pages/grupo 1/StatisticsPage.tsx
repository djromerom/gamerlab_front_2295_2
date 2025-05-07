"use client"

import { useState } from "react"
import { FileSpreadsheet, FileIcon as FilePdf, RefreshCw, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import LayoutAplication from "@/layouts/LayoutAplication"

// Importamos los componentes de chart que acabamos de crear
import { ChartContainer, ChartTooltip, ChartLegend } from "@/components/ui/chart"

// Importamos los componentes de Recharts (biblioteca externa)
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Pie,
  PieChart,
  Cell,
} from "recharts"

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

// Preparar datos para el gráfico de torta
const datosPorMateria = [
  { name: "Programación Avanzada", value: 4.53, color: "hsl(215, 100%, 50%)" },
  { name: "Diseño de Videojuegos", value: 4.18, color: "hsl(145, 100%, 50%)" },
  { name: "Gráficos por Computadora", value: 4.12, color: "hsl(280, 100%, 50%)" },
]

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
              <TabsContent value="graficos">
                <div className="grid grid-cols-1 gap-6 mb-6">
                  {/* Gráfico de Barras - Promedios por Criterio */}
                  <Card>
                    <CardHeader className="pt-4">
                      <CardTitle>Gráfico de Barras - Promedios por Criterio</CardTitle>
                      <CardDescription>{videojuegoSeleccionado.nombre}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ChartContainer
                          config={{
                            jugabilidad: {
                              label: "Jugabilidad",
                              color: "hsl(12, 76%, 61%)",
                            },
                            diseño: {
                              label: "Diseño",
                              color: "hsl(173, 58%, 39%)",
                            },
                            innovación: {
                              label: "Innovación",
                              color: "hsl(197, 37%, 24%)",
                            },
                            técnica: {
                              label: "Técnica",
                              color: "hsl(43, 74%, 66%)",
                            },
                            presentación: {
                              label: "Presentación",
                              color: "hsl(27, 87%, 67%)",
                            },
                          }}
                          className="min-h-[300px]"
                        >
                          <BarChart
                            width={500}
                            height={300}
                            data={datosCriterios}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="criterio" />
                            <YAxis domain={[0, 5]} />
                            <ChartTooltip />
                            <Bar dataKey="valor" fill="hsl(12, 76%, 61%)" radius={4} />
                          </BarChart>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gráfico de Radar - Comparación de Criterios */}
                  <Card>
                    <CardHeader className="pt-4">
                      <CardTitle>Gráfico de Radar - Comparación de Criterios</CardTitle>
                      <CardDescription>{videojuegoSeleccionado.nombre}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ChartContainer
                          config={{
                            valor: {
                              label: "Puntuación",
                              color: "hsl(12, 76%, 61%)",
                            },
                          }}
                          className="aspect-square min-h-[300px]"
                        >
                          <RadarChart width={500} height={300} data={datosCriterios}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="criterio" />
                            <PolarRadiusAxis angle={30} domain={[0, 5]} />
                            <Radar
                              name="Puntuación"
                              dataKey="valor"
                              stroke="hsl(12, 76%, 61%)"
                              fill="hsl(12, 76%, 61%)"
                              fillOpacity={0.6}
                            />
                            <ChartTooltip />
                            <ChartLegend />
                          </RadarChart>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gráfico de Torta - Distribución por Materia */}
                  <Card>
                    <CardHeader className="pt-4">
                      <CardTitle>Gráfico de Torta - Distribución por Materia</CardTitle>
                      <CardDescription>Promedios por NRC</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ChartContainer
                          config={{
                            programacion: {
                              label: "Programación Avanzada",
                              color: "hsl(215, 100%, 50%)",
                            },
                            diseno: {
                              label: "Diseño de Videojuegos",
                              color: "hsl(145, 100%, 50%)",
                            },
                            graficos: {
                              label: "Gráficos por Computadora",
                              color: "hsl(280, 100%, 50%)",
                            },
                          }}
                          className="min-h-[300px]"
                        >
                          <PieChart width={500} height={300}>
                            <Pie
                              data={datosPorMateria}
                              cx={250}
                              cy={150}
                              labelLine={true}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }: { name: string; percent: number }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {datosPorMateria.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <ChartTooltip />
                            <ChartLegend />
                          </PieChart>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Criterios por Videojuego - Visualización alternativa */}
                  <Card>
                    <CardHeader className="pt-4">
                      <CardTitle>Criterios por Videojuego</CardTitle>
                      <CardDescription>{videojuegoSeleccionado.nombre}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(videojuegoSeleccionado.criterios).map(([criterio, valor]) => (
                          <div key={criterio} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium capitalize">{criterio}</span>
                              <span className="text-sm font-medium">{valor.toFixed(1)}/5.0</span>
                            </div>
                            <Progress value={(valor / 5) * 100} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gráfico de Radar - Visualización alternativa */}
                  <Card>
                    <CardHeader className="pt-4">
                      <CardTitle>Comparación de Criterios</CardTitle>
                      <CardDescription>{videojuegoSeleccionado.nombre}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(videojuegoSeleccionado.criterios).map(([criterio, valor]) => (
                          <Card key={criterio} className="border-0 shadow-none">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                              <div className="relative w-20 h-20 mb-2">
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-2xl font-bold">{valor.toFixed(1)}</div>
                                </div>
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                  <circle
                                    className="text-muted stroke-current"
                                    strokeWidth="10"
                                    fill="transparent"
                                    r="40"
                                    cx="50"
                                    cy="50"
                                  />
                                  <circle
                                    className="text-primary stroke-current"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    fill="transparent"
                                    r="40"
                                    cx="50"
                                    cy="50"
                                    strokeDasharray={`${(valor / 5) * 251.2} 251.2`}
                                    strokeDashoffset="0"
                                    transform="rotate(-90 50 50)"
                                  />
                                </svg>
                              </div>
                              <div className="text-sm font-medium capitalize">{criterio}</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top 3 Videojuegos */}
                  <Card>
                    <CardHeader className="pt-4">
                      <CardTitle>Top 3 Videojuegos</CardTitle>
                      <CardDescription>Mejores calificaciones</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6 pb-4">
                        {top3.map((videojuego, index) => (
                          <div key={videojuego.id} className="flex items-center">
                            <div className="mr-4">
                              <Avatar
                                className={`h-12 w-12 ${index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-300" : "bg-amber-700"}`}
                              >
                                <AvatarFallback>{index + 1}</AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{videojuego.nombre}</p>
                              <p className="text-sm text-muted-foreground truncate">{videojuego.materia}</p>
                            </div>
                            <div className="ml-2">
                              <div className="text-xl font-bold">{videojuego.promedio.toFixed(2)}</div>
                              <Progress value={(videojuego.promedio / 5) * 100} className="h-1 w-16" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Distribución por Materia */}
                  <Card>
                    <CardHeader className="pt-4">
                      <CardTitle>Distribución por Materia</CardTitle>
                      <CardDescription>Promedios por NRC</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {[
                          { name: "Programación Avanzada", value: 4.53, color: "bg-blue-500" },
                          { name: "Diseño de Videojuegos", value: 4.18, color: "bg-green-500" },
                          { name: "Gráficos por Computadora", value: 4.12, color: "bg-purple-500" },
                        ].map((item) => (
                          <div key={item.name} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full ${item.color} mr-2`}></div>
                                <span className="text-sm font-medium">{item.name}</span>
                              </div>
                              <span className="text-sm font-medium">{item.value.toFixed(2)}</span>
                            </div>
                            <Progress value={(item.value / 5) * 100} className={`h-2`} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sección de Reportes */}
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
                  <TableRow>
                    <TableCell className="font-medium">Reporte General</TableCell>
                    <TableCell>Evaluaciones completas de todos los videojuegos</TableCell>
                    <TableCell>29/04/2025</TableCell>
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
                  <TableRow>
                    <TableCell className="font-medium">Reporte por Materia</TableCell>
                    <TableCell>Evaluaciones agrupadas por materia</TableCell>
                    <TableCell>29/04/2025</TableCell>
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
                  <TableRow>
                    <TableCell className="font-medium">Ranking Final</TableCell>
                    <TableCell>Clasificación final de todos los videojuegos</TableCell>
                    <TableCell>29/04/2025</TableCell>
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
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutAplication>
  )
}
