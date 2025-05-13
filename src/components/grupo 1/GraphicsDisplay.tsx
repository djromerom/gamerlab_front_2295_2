// File: src/components/grupo 1/GraphicsDisplay.tsx
"use client";

import { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
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
    ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartLegend, ChartConfig } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, Info } from "lucide-react";
import { useGlobalState } from "@/fetchs/grupo 1/GlobalStateContext";

// ... (interfaces y helper formatNumber sin cambios) ...
interface CriterioChartData {
    criterio: string;
    valor: number;
}

interface PieChartData {
    name: string;
    value: number;
    color?: string;
}

const formatNumber = (value: number | undefined | null, fixedDigits: number): string => {
    if (typeof value === 'number' && !isNaN(value)) {
        return value.toFixed(fixedDigits);
    }
    return 'N/A';
};


const GraphicDisplay = () => {
    const {
        videojuegoSeleccionado,
        listaVideojuegos,
        datosGraficoTortaMaterias,
        isLoading,
        error,
        fetchGlobalData,
    } = useGlobalState();

    const carouselRef = useRef<HTMLDivElement>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const totalSlides = 3;

    const navigateSlide = (direction: "prev" | "next") => {
        if (carouselRef.current) {
            const newSlide =
                direction === "next" ? Math.min(currentSlide + 1, totalSlides - 1) : Math.max(currentSlide - 1, 0);
            setCurrentSlide(newSlide);
            const slideWidth = carouselRef.current.clientWidth;
            carouselRef.current.scrollTo({
                left: newSlide * slideWidth,
                behavior: "smooth",
            });
        }
    };

    // --- Data Processing with Safety Checks (sin cambios) ---
    const criteriosSeleccionado = useMemo(() => {
        if (videojuegoSeleccionado?.criterios && typeof videojuegoSeleccionado.criterios === 'object') {
            return videojuegoSeleccionado.criterios;
        }
        return null;
    }, [videojuegoSeleccionado]);

    const datosCriteriosChart: CriterioChartData[] = useMemo(() => {
        if (!criteriosSeleccionado) return [];
        return Object.entries(criteriosSeleccionado)
            .map(([key, value]) => ({
                criterio: key.charAt(0).toUpperCase() + key.slice(1),
                valor: typeof value === 'number' && !isNaN(value) ? Math.max(0, Math.min(value, 5)) : 0,
            }))
            .filter(item => typeof item.valor === 'number');
    }, [criteriosSeleccionado]);

    const videojuegosRanking = useMemo(() => {
        if (!listaVideojuegos) return [];
        return [...listaVideojuegos].sort((a, b) => {
            const promedioA = typeof a.promedio === 'number' && !isNaN(a.promedio) ? a.promedio : -Infinity;
            const promedioB = typeof b.promedio === 'number' && !isNaN(b.promedio) ? b.promedio : -Infinity;
            return promedioB - promedioA;
        });
    }, [listaVideojuegos]);

    const top3 = useMemo(() => videojuegosRanking.slice(0, 3), [videojuegosRanking]);

    const pieChartData: PieChartData[] = useMemo(() => {
        if (Array.isArray(datosGraficoTortaMaterias)) {
            return datosGraficoTortaMaterias.filter(
                item => item && typeof item.value === 'number' && !isNaN(item.value) && typeof item.name === 'string'
            );
        }
        return [];
    }, [datosGraficoTortaMaterias]);

    // --- Loading State (sin cambios) ---
    if (isLoading) {
        return (
            <TabsContent value="graficos" className="flex items-center justify-center py-10 min-h-[400px]">
                <div className="flex flex-col items-center space-y-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Cargando gráficos...</p>
                </div>
            </TabsContent>
        );
    }

    // --- Error State (sin cambios) ---
    if (error) {
        return (
            <TabsContent value="graficos" className="min-h-[400px]">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        No se pudieron cargar los datos para los gráficos. ({error.message})
                    </AlertDescription>
                    <Button onClick={fetchGlobalData} variant="secondary" size="sm" className="mt-4">
                        Reintentar
                    </Button>
                </Alert>
            </TabsContent>
        );
    }

    // --- No Data / No Selection State (sin cambios) ---
    if (listaVideojuegos.length === 0 || !videojuegoSeleccionado) {
        return (
            <TabsContent value="graficos" className="min-h-[400px]">
                <Card className="flex flex-col items-center justify-center text-center h-full py-10">
                     <CardHeader>
                        <CardTitle className="flex items-center justify-center gap-2">
                           <Info className="h-6 w-6 text-muted-foreground"/> Información
                        </CardTitle>
                        <CardDescription>
                            {listaVideojuegos.length === 0
                                ? "No se encontraron datos de videojuegos."
                                : "Selecciona un videojuego de la lista o tabla para ver sus gráficos detallados."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {listaVideojuegos.length === 0 && (
                           <p className="text-sm text-muted-foreground">Intenta recargar o verifica si hay datos disponibles.</p>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        );
    }

    // --- Chart Configurations (sin cambios) ---
    const barChartConfig = { valor: { label: "Promedio", color: "hsl(var(--chart-1))" } } satisfies ChartConfig;
    const radarChartConfig = { valor: { label: "Puntuación", color: "hsl(var(--chart-2))" } } satisfies ChartConfig;
    const pieChartConfig = {} satisfies ChartConfig;

    return (
        <TabsContent value="graficos">
            {/* --- Carousel --- */}
            <div className="relative mb-8">
                {/* Navigation Controls - Adjusted positioning */}
                 <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-background/80 backdrop-blur-sm hover:bg-accent disabled:opacity-50" // MODIFICADO AQUÍ
                    onClick={() => navigateSlide("prev")}
                    disabled={currentSlide === 0}
                    aria-label="Gráfico anterior"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                 <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-background/80 backdrop-blur-sm hover:bg-accent disabled:opacity-50" // MODIFICADO AQUÍ
                    onClick={() => navigateSlide("next")}
                    disabled={currentSlide === totalSlides - 1}
                    aria-label="Gráfico siguiente"
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>

                {/* Carousel Container (sin cambios) */}
                <div
                    ref={carouselRef}
                    className="flex overflow-x-hidden snap-x snap-mandatory rounded-lg border bg-card text-card-foreground shadow-sm"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    {/* Slide 1: Bar Chart (sin cambios internos significativos) */}
                    <div className="min-w-full snap-center p-0">
                        <CardHeader className="pt-4 px-4 md:px-6">
                            <CardTitle>Promedios por Criterio</CardTitle>
                            <CardDescription>{videojuegoSeleccionado.nombre}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-2 pb-4">
                            {datosCriteriosChart.length > 0 ? (
                                <ChartContainer config={barChartConfig} className="min-h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={datosCriteriosChart} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey="criterio" tickLine={false} tickMargin={10} axisLine={false} />
                                            <YAxis domain={[0, 5]} tickLine={false} axisLine={false} tickMargin={10} />
                                            <ChartTooltip cursor={false} contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                                            <Bar dataKey="valor" fill="var(--color-valor)" radius={4} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                    Datos de criterios no disponibles para este gráfico.
                                </div>
                            )}
                        </CardContent>
                    </div>

                    {/* Slide 2: Radar Chart (sin cambios internos significativos) */}
                    <div className="min-w-full snap-center p-0">
                        <CardHeader className="pt-4 px-4 md:px-6">
                            <CardTitle>Comparación de Criterios (Radar)</CardTitle>
                            <CardDescription>{videojuegoSeleccionado.nombre}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-2 pb-4">
                             {datosCriteriosChart.length > 0 ? (
                                <ChartContainer config={radarChartConfig} className="min-h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RadarChart data={datosCriteriosChart} margin={{ top: 20, right: 30, bottom: 5, left: 30 }}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="criterio" />
                                            <PolarRadiusAxis angle={30} domain={[0, 5]} />
                                            <Radar
                                                name="Puntuación"
                                                dataKey="valor"
                                                stroke="var(--color-valor)"
                                                fill="var(--color-valor)"
                                                fillOpacity={0.6}
                                            />
                                            <ChartTooltip cursor={false} contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                             ) : (
                                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                    Datos de criterios no disponibles para este gráfico.
                                </div>
                            )}
                        </CardContent>
                    </div>

                    {/* Slide 3: Pie Chart (sin cambios internos significativos) */}
                    <div className="min-w-full snap-center p-0">
                        <CardHeader className="pt-4 px-4 md:px-6">
                            <CardTitle>Distribución por NRC/Materia</CardTitle>
                            <CardDescription>Promedio general por grupo</CardDescription>
                        </CardHeader>
                        <CardContent className="px-2 pb-4">
                            {pieChartData.length > 0 ? (
                                <ChartContainer config={pieChartConfig} className="min-h-[300px] w-full">
                                     <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <ChartTooltip cursor={false} contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                                            <Pie
                                                data={pieChartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius="80%"
                                                dataKey="value"
                                                nameKey="name"
                                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                                                    const RADIAN = Math.PI / 180;
                                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                                    return (
                                                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="10px">
                                                            {`${(percent * 100).toFixed(0)}%`}
                                                        </text>
                                                    );
                                                }}
                                            >
                                                {pieChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color || `hsl(var(--chart-${index + 1}))`} />
                                                ))}
                                            </Pie>
                                             <ChartLegend />
                                        </PieChart>
                                     </ResponsiveContainer>
                                </ChartContainer>
                            ) : (
                                 <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                    Datos de distribución por materia no disponibles.
                                </div>
                            )}
                        </CardContent>
                    </div>
                </div>

                {/* Position Indicators (sin cambios) */}
                <div className="flex justify-center gap-2 mt-4">
                    {Array.from({ length: totalSlides }).map((_, index) => (
                        <button
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${currentSlide === index ? "bg-primary" : "bg-muted hover:bg-muted-foreground/50"}`}
                            onClick={() => {
                                setCurrentSlide(index);
                                carouselRef.current?.scrollTo({
                                    left: index * (carouselRef.current?.clientWidth || 0),
                                    behavior: "smooth",
                                });
                            }}
                            aria-label={`Ir al gráfico ${index + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* --- Grid of other info cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

                {/* Criterios Details Card (sin cambios) */}
                <Card>
                    <CardHeader className="pt-4">
                        <CardTitle>Detalle de Criterios</CardTitle>
                        <CardDescription>{videojuegoSeleccionado.nombre}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {criteriosSeleccionado ? (
                            <div className="space-y-4">
                                {Object.entries(criteriosSeleccionado)
                                    .filter(([key, value]) => typeof value === 'number' && !isNaN(value))
                                    .map(([criterio, valor]) => (
                                    <div key={criterio} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium capitalize">{criterio}</span>
                                            <span className="text-sm font-medium">{formatNumber(valor, 1)}/5.0</span>
                                        </div>
                                        <Progress value={(Math.max(0, Math.min(valor, 5)) / 5) * 100} className="h-2" aria-label={`Progreso de ${criterio}`} />
                                    </div>
                                ))}
                                {datosCriteriosChart.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No hay datos numéricos válidos para los criterios.</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Datos de criterios no disponibles.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Top 3 Videojuegos Card */}
                <Card>
                    <CardHeader className="pt-4">
                        <CardTitle>Top 3 Videojuegos (General)</CardTitle>
                        <CardDescription>Mejores calificaciones promedio</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-6"> {/* MODIFICADO AQUÍ: Added bottom padding */}
                       {top3.length > 0 ? (
                           <div className="space-y-4">
                                {top3.map((videojuego, index) => (
                                    <div key={videojuego.id} className="flex items-center gap-4">
                                        <Avatar
                                            className={`h-10 w-10 text-white font-semibold flex items-center justify-center rounded-full ${
                                                index === 0 ? "bg-yellow-500" : index === 1 ? "bg-slate-400" : "bg-orange-600"
                                            }`}
                                        >
                                            <AvatarFallback className="bg-transparent">{index + 1}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate" title={videojuego.nombre || 'Sin Nombre'}>{videojuego.nombre || 'Sin Nombre'}</p>
                                            <p className="text-xs text-muted-foreground truncate" title={videojuego.materia || '-'}>{videojuego.materia || '-'}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold">{formatNumber(videojuego.promedio, 2)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                       ) : (
                           <p className="text-sm text-muted-foreground">No hay suficientes datos para generar el top 3.</p>
                       )}
                    </CardContent>
                </Card>

                {/* Promedio General Card (sin cambios) */}
                 <Card>
                    <CardHeader className="pt-4">
                        <CardTitle>Promedio General</CardTitle>
                        <CardDescription>{videojuegoSeleccionado.nombre}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center pt-8">
                         <div className="relative w-32 h-32 mb-4">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle
                                    className="text-muted/20 stroke-current"
                                    strokeWidth="10" fill="transparent" r="40" cx="50" cy="50"
                                />
                                <circle
                                    className="text-primary stroke-current"
                                    strokeWidth="10" strokeLinecap="round" fill="transparent"
                                    r="40" cx="50" cy="50"
                                    strokeDasharray={`${((typeof videojuegoSeleccionado.promedio === 'number' ? Math.max(0, Math.min(videojuegoSeleccionado.promedio, 5)) : 0) / 5) * 251.2} 251.2`}
                                    transform="rotate(-90 50 50)"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl font-bold">{formatNumber(videojuegoSeleccionado.promedio, 2)}</span>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Calificación promedio total</p>
                    </CardContent>
                </Card>


                {/* Distribución por Materia Card (Details) */}
                <Card>
                    <CardHeader className="pt-4">
                        <CardTitle>Promedios por Materia/NRC</CardTitle>
                        <CardDescription>Detalle de la distribución</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-6"> {/* MODIFICADO AQUÍ: Added bottom padding */}
                        {pieChartData.length > 0 ? (
                             <div className="space-y-3">
                                {pieChartData.map((item, index) => (
                                    <div key={item.name} className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div style={{ backgroundColor: item.color || `hsl(var(--chart-${index + 1}))` }} className="w-3 h-3 rounded-full flex-shrink-0"></div>
                                            <span className="text-sm font-medium truncate" title={item.name}>{item.name}</span>
                                        </div>
                                        <span className="text-sm font-semibold">{formatNumber(item.value, 2)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                           <p className="text-sm text-muted-foreground">No hay datos de distribución por materia disponibles.</p>
                        )}
                    </CardContent>
                </Card>

            </div> {/* End Grid */}
        </TabsContent>
    );
};

export default GraphicDisplay;