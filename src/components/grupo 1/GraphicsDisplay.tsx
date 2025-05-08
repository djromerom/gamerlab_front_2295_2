// File: src/components/grupo 1/GraphicsDisplay.tsx

// Zona que muestra los graficos de los videojuegos

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
// Importamos los componentes de Recharts (biblioteca externa)
import { BarChart, CartesianGrid, Cell, Pie, PieChart, Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Bar, XAxis, YAxis } from "recharts";
// Importamos los componentes de chart que acabamos de crear
import { ChartContainer, ChartTooltip, ChartLegend } from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";

// Preparar datos para el gráfico de torta
import { videojuegos, datosPorMateria } from "@/fetchs/grupo 1/DataFromFetchs";

const GraphicDisplay = () => {
    //const [filtroMateria, setFiltroMateria] = useState("Todas")
    //const [filtroNRC, setFiltroNRC] = useState("Todos")
    //const [filtroJurado, setFiltroJurado] = useState("Todos")
    const [videojuegoSeleccionado, setVideojuegoSeleccionado] = useState(videojuegos[0])

    // Ordenar videojuegos por promedio para el ranking
    const videojuegosRanking = [...videojuegos].sort((a, b) => b.promedio - a.promedio)
    const top3 = videojuegosRanking.slice(0, 3)

    // Preparar datos para los gráficos
    const datosCriterios = Object.entries(videojuegoSeleccionado.criterios).map(([key, value]) => ({
        criterio: key.charAt(0).toUpperCase() + key.slice(1),
        valor: value,
    }))
    
    return (
        <TabsContent value="graficos">
            <div className="grid grid-cols-1 gap-6 mb-6">
                {/* Gráfico de Barras - Promedios por Criterio */}
                <Card>
                    <CardHeader className="pt-4">
                        <CardTitle>Gráfico de Barras - Promedios por Criterio</CardTitle>
                        <CardDescription>{videojuegoSeleccionado.nombre}</CardDescription> {/* Use destructured variable */}
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
    );
}

export default GraphicDisplay;