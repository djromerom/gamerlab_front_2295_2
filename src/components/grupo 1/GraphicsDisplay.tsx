// File: src/components/grupo 1/GraphicsDisplay.tsx
"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TabsContent } from "@/components/ui/tabs"
import {
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    Radar,
    RadarChart,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Bar,
    XAxis,
    YAxis,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartLegend } from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react" // Importamos iconos para navegación
import { useGlobalState } from "@/fetchs/grupo 1/GlobalStateContext"

const GraphicDisplay = () => {
    const { videojuegoSeleccionado, listaVideojuegos, datosGraficoTortaMaterias, isLoading, error, fetchGlobalData } =
        useGlobalState()

    // Referencia para el contenedor del carrusel
    const carouselRef = useRef<HTMLDivElement>(null)

    // Estado para controlar la navegación
    const [currentSlide, setCurrentSlide] = useState(0)

    // Número total de slides (gráficos principales)
    const totalSlides = 3

    // Función para navegar entre slides
    const navigateSlide = (direction: "prev" | "next") => {
        if (carouselRef.current) {
            const newSlide =
                direction === "next" ? Math.min(currentSlide + 1, totalSlides - 1) : Math.max(currentSlide - 1, 0)

            setCurrentSlide(newSlide)

            // Scroll suave al slide correspondiente
            const slideWidth = carouselRef.current.clientWidth
            carouselRef.current.scrollTo({
                left: newSlide * slideWidth,
                behavior: "smooth",
            })
        }
    }

    // 1. Manejar estado de carga
    if (isLoading) {
        return (
            <TabsContent value="graficos" className="flex items-center justify-center h-96">
                <p>Cargando gráficos...</p>
            </TabsContent>
        )
    }

    // 2. Manejar estado de error
    if (error) {
        return (
            <TabsContent value="graficos" className="flex flex-col items-center justify-center h-96">
                <p className="text-red-500">Error al cargar los datos: {error.message}</p>
                <Button onClick={fetchGlobalData} className="mt-4">
                    Reintentar
                </Button>
            </TabsContent>
        )
    }

    // 3. Manejar caso donde no hay videojuego seleccionado o no hay datos
    if (!videojuegoSeleccionado || listaVideojuegos.length === 0) {
        return (
            <TabsContent value="graficos">
                <Card>
                    <CardHeader>
                        <CardTitle>No hay datos de videojuegos disponibles</CardTitle>
                        <CardDescription>
                            {listaVideojuegos.length === 0
                                ? "No se encontraron videojuegos."
                                : "Por favor, selecciona un videojuego para ver sus gráficos."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {listaVideojuegos.length === 0 && <p>Intenta recargar la página o contacta al administrador.</p>}
                    </CardContent>
                </Card>
            </TabsContent>
        )
    }

    // Si llegamos aquí, videojuegoSeleccionado existe y no estamos cargando ni en error.
    const videojuegosRanking = [...listaVideojuegos].sort((a, b) => b.promedio - a.promedio)
    const top3 = videojuegosRanking.slice(0, 3)

    const datosCriterios = Object.entries(videojuegoSeleccionado.criterios).map(([key, value]) => ({
        criterio: key.charAt(0).toUpperCase() + key.slice(1),
        valor: value,
    }))

    return (
        <TabsContent value="graficos">
            {/* Carrusel de gráficos principales */}
            <div className="relative mb-8">
                {/* Controles de navegación */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full bg-background/80 backdrop-blur-sm"
                        onClick={() => navigateSlide("prev")}
                        disabled={currentSlide === 0}
                    >
                        <ChevronLeft className="h-6 w-6" />
                        <span className="sr-only">Anterior</span>
                    </Button>
                </div>

                <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full bg-background/80 backdrop-blur-sm"
                        onClick={() => navigateSlide("next")}
                        disabled={currentSlide === totalSlides - 1}
                    >
                        <ChevronRight className="h-6 w-6" />
                        <span className="sr-only">Siguiente</span>
                    </Button>
                </div>

                {/* Contenedor del carrusel */}
                <div
                    ref={carouselRef}
                    className="flex overflow-x-hidden snap-x snap-mandatory"
                    style={{ scrollbarWidth: "none" }}
                >
                    {/* Slide 1: Gráfico de Barras */}
                    <div className="min-w-full snap-center">
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
                    </div>

                    {/* Slide 2: Gráfico de Radar */}
                    <div className="min-w-full snap-center">
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
                    </div>

                    {/* Slide 3: Gráfico de Torta */}
                    <div className="min-w-full snap-center">
                        <Card>
                            <CardHeader className="pt-4">
                                <CardTitle>Gráfico de Torta - Distribución por NRC/Materia</CardTitle>
                                <CardDescription>Promedios generales</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ChartContainer config={{/* ... */ }} className="min-h-[300px]">
                                        <PieChart>
                                            <Pie
                                                data={datosGraficoTortaMaterias} // <--- USA ESTE
                                                cx="50%"
                                                cy="50%"
                                                labelLine={true}
                                                outerRadius="80%"
                                                fill="#8884d8"
                                                dataKey="value"
                                                nameKey="name"
                                                label={({ name, percent }: { name: string; percent: number }) =>
                                                    `${name}: ${(percent * 100).toFixed(0)}%`
                                                }
                                            >
                                                {datosGraficoTortaMaterias.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color || "#8884d8"} />
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
                </div>

                {/* Indicadores de posición */}
                <div className="flex justify-center gap-2 mt-4">
                    {Array.from({ length: totalSlides }).map((_, index) => (
                        <button
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors ${currentSlide === index ? "bg-primary" : "bg-muted"}`}
                            onClick={() => {
                                setCurrentSlide(index)
                                carouselRef.current?.scrollTo({
                                    left: index * carouselRef.current.clientWidth,
                                    behavior: "smooth",
                                })
                            }}
                            aria-label={`Ir al gráfico ${index + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* Resto de tarjetas informativas en grid */}
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
                        <CardDescription>Mejores calificaciones generales</CardDescription>
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
                            {datosGraficoTortaMaterias.map((item) => (
                                <div key={item.name} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className={`w-3 h-3 rounded-full ${item.color} mr-2`}></div>
                                            <span className="text-sm font-medium">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-medium">{item.value.toFixed(2)}</span>
                                    </div>
                                    <Progress value={(item.value / 5) * 100} className="h-2" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
    )
}

export default GraphicDisplay