// File: src/features/results/components/GraphicsDisplay.tsx
"use client";

import { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import {
    BarChart,
    CartesianGrid,
    Radar,
    RadarChart,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Rectangle,
    type RectangleProps,
} from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartConfig
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, Info } from "lucide-react";
import { useGlobalState } from "@/fetchs/grupo 1/GlobalStateContext";
import { AVERAGES_HIDDEN_MESSAGE, buildAverageChartData, formatAverage, isRankingHidden } from "@/features/results/lib/averages";
import { useCriteria } from "@/hooks/use-criteria";
import { buildCriteriaColumns, getCriterionValue } from "@/features/results/lib/criteriaColumns";

interface CriterioChartData {
    criterio: string;
    valor: number;
}

// Para datos de promedios generales por materia (usado por pie y ahora por el bar chart base)
interface MateriaPromedioData {
    name: string;  // Nombre de la materia
    value: number; // Promedio de la materia
    color?: string;
}

// Para datos de promedios por NRC (para el bar chart cuando se filtra por materia)
interface NRCPromedioData {
    name: string;    // Nombre del NRC (e.g., "NRC 12345")
    promedio: number; // Promedio para ese NRC
}

const COLORES_CRITERIOS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
];

const formatNumber = (value: number | undefined | null, fixedDigits: number): string => {
    if (typeof value === 'number' && !isNaN(value)) {
        return value.toFixed(fixedDigits);
    }
    return 'N/A';
};

const CustomTooltipCursor = (props: RectangleProps) => {
    const { x, y, width, height } = props;
    // Recharts a veces pasa undefined para las props inicialmente, hay que verificar
    if (x === undefined || y === undefined || width === undefined || height === undefined) {
        return null;
    }
    return <Rectangle x={x} y={y} width={width} height={height} fill="hsl(var(--muted) / 0.3)" />;
};

const GraphicsDisplay = () => {
    const {
        videojuegoSeleccionado,
        listaVideojuegos,
        datosGraficoTortaMaterias, // Asumo que este tiene { name: string, value: number, color?: string }
        isLoading,
        error,
        fetchGlobalData,
        filtroMateria, // Para la lógica del nuevo gráfico de barras
        listaVideojuegosFiltrados, // Para la lógica del nuevo gráfico de barras
        nrcsFiltrados, // Para la lógica del nuevo gráfico de barras
    } = useGlobalState();

    

    const carouselRef = useRef<HTMLDivElement>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const totalSlides = 3; // AHORA SON 3 SLIDES

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

    // --- Data Processing ---
    const criteriosSeleccionado = useMemo(() => {
        if (videojuegoSeleccionado?.criterios && typeof videojuegoSeleccionado.criterios === 'object') {
            return videojuegoSeleccionado.criterios;
        }
        return null;
    }, [videojuegoSeleccionado]);

    // Datos para Bar Chart Vertical (Slide 0) y Radar Chart (Slide 1)
    const { criteria } = useCriteria();
    const columnasCriterios = useMemo(
        () => buildCriteriaColumns(criteria, videojuegoSeleccionado ? [videojuegoSeleccionado] : []),
        [criteria, videojuegoSeleccionado]
    );

    const datosCriteriosChart: CriterioChartData[] = useMemo(() => {
        if (!criteriosSeleccionado) {
            // Sin criterios (p. ej. ranking oculto) no se grafican ceros engañosos
            return [];
        }
        return columnasCriterios.map((columna, index) => {
            const valorDelBackend = getCriterionValue(criteriosSeleccionado, columna);
            return {
                criterio: columna.name, // Nombre actual del criterio (GET /criteria)
                valor: typeof valorDelBackend === 'number' && !isNaN(valorDelBackend)
                    ? Math.max(0, Math.min(valorDelBackend, 5)) // Asegurar que el valor es un número y está en rango
                    : 0, // Valor por defecto si no se encuentra o no es número
                fill: COLORES_CRITERIOS[index % COLORES_CRITERIOS.length],
            };
        });
    }, [columnasCriterios, criteriosSeleccionado]);

    // Promedios por materia / NRC; con el ranking oculto el backend los envía en null.
    const { materias: promediosGeneralesPorMateria, chart: barChartHorizontalData, hidden: promediosOcultos, materiasHidden } = useMemo(
        () => buildAverageChartData({
            materias: Array.isArray(datosGraficoTortaMaterias) ? datosGraficoTortaMaterias : [],
            filtroMateria,
            videojuegos: listaVideojuegosFiltrados ?? [],
            nrcs: nrcsFiltrados ?? [],
        }),
        [datosGraficoTortaMaterias, filtroMateria, listaVideojuegosFiltrados, nrcsFiltrados]
    );


    const rankingOculto = useMemo(() => isRankingHidden(listaVideojuegos ?? []), [listaVideojuegos]);
    const sinCriterios = rankingOculto ? AVERAGES_HIDDEN_MESSAGE : "Datos de criterios no disponibles para este gráfico.";

    // Top 3 para la card (sin cambios)
    const videojuegosRanking = useMemo(() => {
        if (!listaVideojuegos) return [];
        return [...listaVideojuegos].sort((a, b) => {
            const promedioA = typeof a.promedio === 'number' && !isNaN(a.promedio) ? a.promedio : -Infinity;
            const promedioB = typeof b.promedio === 'number' && !isNaN(b.promedio) ? b.promedio : -Infinity;
            return promedioB - promedioA;
        });
    }, [listaVideojuegos]);
    const top3 = useMemo(() => videojuegosRanking.slice(0, 3), [videojuegosRanking]);


    // --- Loading, Error, No Data States (sin cambios) ---
    if (isLoading) { /* ... tu código de loading ... */
        return (
            <TabsContent value="graficos" className="flex items-center justify-center py-10 min-h-[400px]">
                <div className="flex flex-col items-center space-y-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Cargando gráficos...</p>
                </div>
            </TabsContent>
        );
    }
    if (error) { /* ... tu código de error ... */
        return (
            <TabsContent value="graficos" className="min-h-[400px]">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        No se pudieron cargar los datos para los gráficos. ({error.message})
                    </AlertDescription>
                    <Button className="cursor-pointer mt-4" onClick={fetchGlobalData} variant="secondary" size="sm">
                        Reintentar
                    </Button>
                </Alert>
            </TabsContent>
        );
    }
    if (listaVideojuegos.length === 0 || !videojuegoSeleccionado) { /* ... tu código de no data ... */
        return (
            <TabsContent value="graficos" className="min-h-[400px]">
                <Card className="flex flex-col items-center justify-center text-center h-full py-10">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-center gap-2">
                            <Info className="h-6 w-6 text-muted-foreground" /> Información
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

    const CustomizedAxisTick = (props: any) => {
        const { x, y, payload } = props; // payload.value es el texto del tick

        return (
            <g transform={`translate(${x},${y})`}> {/* Mueve el grupo al punto del tick original */}
                <text
                    x={0} // Posición X relativa al grupo transformado
                    y={0} // Posición Y relativa al grupo transformado
                    dx={15} // <--- DESPLAZAMIENTO HORIZONTAL HACIA LA DERECHA (experimenta con este valor)
                    dy={15} // Desplazamiento vertical para ajustar después de la rotación (mantenlo o ajústalo)
                    textAnchor="end" // Sigue siendo útil para la rotación
                    fill="#666"
                    transform="rotate(-25)" // Rotación
                    fontSize={15} // O tu tamaño de fuente preferido
                >
                    {payload.value.length > 20 ? `${payload.value.substring(0, 18)}...` : payload.value}
                </text>
            </g>
        );
    };

    // --- Chart Configurations ---
    const barChartVerticalConfig = { valor: { label: "Promedio", color: "hsl(var(--chart-1))" } } satisfies ChartConfig;
    const radarChartConfig = { valor: { label: "Puntuación", color: "hsl(var(--chart-2))" } } satisfies ChartConfig;
    const barChartHorizontalConfig = { promedio: { label: "Promedio", color: "hsl(var(--chart-3))" } } satisfies ChartConfig;

    // Helper para mensaje de no datos en gráficos
    const renderNoDataMessage = (message: string) => (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground p-4 text-center">
            {message}
        </div>
    );
    //
    
    return (
        <TabsContent value="graficos">
            {/* --- Carousel --- */}
            <div className="relative mb-8">
                <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-background/80 backdrop-blur-sm hover:bg-accent disabled:opacity-50"
                    onClick={() => navigateSlide("prev")}
                    disabled={currentSlide === 0}
                    aria-label="Gráfico anterior"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-background/80 backdrop-blur-sm hover:bg-accent disabled:opacity-50"
                    onClick={() => navigateSlide("next")}
                    disabled={currentSlide === totalSlides - 1}
                    aria-label="Gráfico siguiente"
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>

                <div
                    ref={carouselRef}
                    className="flex overflow-x-hidden snap-x snap-mandatory rounded-lg border bg-card text-card-foreground shadow-sm"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    {/* Slide 0: Bar Chart Vertical de Criterios */}
                    {currentSlide === 0 && (
                        <div className="min-w-full snap-center p-0">
                            <CardHeader className="pt-4 px-4 md:px-6">
                                <CardTitle>Promedios por Criterio</CardTitle>
                                <CardDescription>{videojuegoSeleccionado?.nombre || "N/A"}</CardDescription>
                            </CardHeader>
                            <CardContent className="px-2 pb-4">
                                {datosCriteriosChart.length > 0 ? (
                                    <ChartContainer config={barChartVerticalConfig} className="min-h-[350px] w-full">
                                        <ResponsiveContainer width="100%" height={350}>
                                            <BarChart
                                                data={datosCriteriosChart}
                                                margin={{ top: 20, right: 20, left: 0, bottom: 60 }}
                                            >
                                                <CartesianGrid vertical={false} />
                                                <XAxis
                                                    dataKey="criterio"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tick={<CustomizedAxisTick />}
                                                    interval={0}
                                                />
                                                <YAxis domain={[0, 5]} tickLine={false} axisLine={false} tickMargin={10} ticks={[0, 1, 2, 3, 4, 5]} />
                                                {/* --- APLICAR LA CORRECCIÓN AQUÍ --- */}
                                                <ChartTooltip
                                                    cursor={<CustomTooltipCursor />} // Usar el componente personalizado
                                                    contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                                                />
                                                <Bar dataKey="valor" fill="var(--color-valor)" radius={4} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                ) : (
                                    renderNoDataMessage(sinCriterios)
                                )}
                            </CardContent>
                        </div>
                    )}

                    {/* Slide 1: Radar Chart de Criterios */}
                    {currentSlide === 1 && (
                        <div className="min-w-full snap-center p-0">
                            <CardHeader className="pt-4 px-4 md:px-6">
                                <CardTitle>Comparación de Criterios (Radar)</CardTitle>
                                <CardDescription>{videojuegoSeleccionado?.nombre || "N/A"}</CardDescription>
                            </CardHeader>
                            <CardContent className="px-2 pb-4">
                                {datosCriteriosChart.length > 0 ? (
                                    <ChartContainer config={radarChartConfig} className="min-h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <RadarChart data={datosCriteriosChart} margin={{ top: 20, right: 30, bottom: 5, left: 30 }}>
                                                <PolarGrid />
                                                <PolarAngleAxis dataKey="criterio" />
                                                <PolarRadiusAxis angle={30} domain={[0, 5]} tickCount={5} />
                                                <Radar
                                                    name="Puntuación"
                                                    dataKey="valor"
                                                    stroke="var(--color-valor)"
                                                    fill="var(--color-valor)"
                                                    fillOpacity={0.6}
                                                />
                                                <ChartTooltip cursor={false} contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                ) : (
                                    renderNoDataMessage(sinCriterios)
                                )}
                            </CardContent>
                        </div>
                    )}

                    {/* Slide 2: NUEVO Bar Chart Horizontal (Materias/NRCs) */}
                    {currentSlide === 2 && (
                        <div className="min-w-full snap-center p-0">
                            <CardHeader className="pt-4 px-4 md:px-6">
                                <CardTitle>
                                    {filtroMateria === "Todas" ? "Promedios Generales por Materia" : `Promedios por NRC - ${filtroMateria}`}
                                </CardTitle>
                                <CardDescription>
                                    {filtroMateria === "Todas"
                                        ? "Distribución de promedios de todas las materias"
                                        : `Detalle de NRCs para la materia: ${filtroMateria}`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-2 pb-4">
                                {promediosOcultos ? (
                                    renderNoDataMessage(AVERAGES_HIDDEN_MESSAGE)
                                ) : barChartHorizontalData.length > 0 ? (
                                    <ChartContainer config={barChartHorizontalConfig} className="min-h-[300px] w-full">
                                        {/* Altura dinámica para el contenedor del gráfico */}
                                        <ResponsiveContainer width="100%" height={Math.max(300, barChartHorizontalData.length * 40)}>
                                            <BarChart
                                                data={barChartHorizontalData}
                                                layout="vertical"
                                                margin={{ top: 5, right: 30, left: (filtroMateria === "Todas" ? 100 : 70), bottom: 5 }} // Ajustar margen izquierdo
                                            >
                                                <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" />
                                                <XAxis type="number" domain={[0, 5]} tickLine={false} axisLine={false} ticks={[0, 1, 2, 3, 4, 5]} />
                                                <YAxis
                                                    dataKey="name"
                                                    type="category"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    width={filtroMateria === "Todas" ? 120 : 90} // Más ancho para nombres de materias
                                                    tick={{ fontSize: 12 }}
                                                    interval={0} // Muestra todas las etiquetas del eje Y
                                                />
                                                <ChartTooltip
                                                    cursor={<CustomTooltipCursor />}
                                                    contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                                                />
                                                <Bar
                                                    dataKey="promedio" // La clave que contiene el valor numérico
                                                    fill="var(--color-promedio)" // Usa el color de la config
                                                    radius={[0, 4, 4, 0]} // Barras redondeadas a la derecha
                                                    name="Promedio"
                                                // barSize={20} // Puedes fijar un tamaño si lo prefieres
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                ) : (
                                    renderNoDataMessage(
                                        filtroMateria === "Todas"
                                            ? "No hay datos de promedios de materias para mostrar."
                                            : `No hay datos de NRCs para la materia: ${filtroMateria}.`
                                    )
                                )}
                            </CardContent>
                        </div>
                    )}
                </div>

                {/* Position Indicators (actualizados para totalSlides) */}
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

            {/* --- Grid of other info cards (sin cambios) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Criterios Details Card */}
                <Card>
                    <CardHeader className="pt-4">
                        <CardTitle>Detalle de Criterios</CardTitle>
                        <CardDescription>{videojuegoSeleccionado?.nombre || "N/A"}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-6">
                        {criteriosSeleccionado ? ( /* ... tu código ... */
                            <div className="space-y-4">
                                {Object.entries(criteriosSeleccionado)
                                    .filter(([_key, value]) => typeof value === 'number' && !isNaN(value))
                                    .map(([criterio, valor]) => (
                                        <div key={criterio} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium capitalize">{criterio}</span>
                                                <span className="text-sm font-medium">{formatNumber(valor, 2)}/5.00</span>
                                            </div>
                                            <Progress value={(Math.max(0, Math.min(valor, 5)) / 5) * 100} className="h-2" aria-label={`Progreso de ${criterio}`} />
                                        </div>
                                    ))}
                                {datosCriteriosChart.length === 0 && !criteriosSeleccionado && ( // Corregido para mostrar si no hay criterios
                                    <p className="text-sm text-muted-foreground">No hay datos numéricos válidos para los criterios.</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">{rankingOculto ? AVERAGES_HIDDEN_MESSAGE : "Datos de criterios no disponibles. Selecciona un videojuego."}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Top 3 Videojuegos Card */}
                <Card>
                    <CardHeader className="pt-4">
                        <CardTitle>Top 3 Videojuegos (General)</CardTitle>
                        <CardDescription>Mejores calificaciones promedio</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-6">
                        {rankingOculto ? (
                            <p className="text-sm text-muted-foreground">{AVERAGES_HIDDEN_MESSAGE}</p>
                        ) : top3.length > 0 ? ( /* ... tu código ... */
                            <div className="space-y-4">
                                {top3.map((videojuego, index) => (
                                    <div key={videojuego.id} className="flex items-center gap-4">
                                        <Avatar
                                            className={`h-10 w-10 text-white font-semibold flex items-center justify-center rounded-full ${index === 0 ? "bg-yellow-500" : index === 1 ? "bg-slate-400" : "bg-orange-600"
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

                {/* Promedio General Card */}
                <Card>
                    <CardHeader className="pt-4">
                        <CardTitle>Promedio General</CardTitle>
                        <CardDescription>{videojuegoSeleccionado?.nombre || "N/A"}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center pt-8">
                        {rankingOculto ? (
                            <p className="text-sm text-muted-foreground text-center">{AVERAGES_HIDDEN_MESSAGE}</p>
                        ) : formatAverage(videojuegoSeleccionado?.promedio) === null ? (
                            <p className="text-sm text-muted-foreground text-center">Sin calificar</p>
                        ) : (<>
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
                                    strokeDasharray={`${((typeof videojuegoSeleccionado?.promedio === 'number' ? Math.max(0, Math.min(videojuegoSeleccionado.promedio, 5)) : 0) / 5) * 251.2} 251.2`}
                                    transform="rotate(-90 50 50)"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl font-bold">{formatAverage(videojuegoSeleccionado?.promedio)}</span>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Calificación promedio total</p>
                        </>)}
                    </CardContent>
                </Card>

                {/* Distribución por Materia Card (Details) */}
                <Card>
                    <CardHeader className="pt-4">
                        <CardTitle>Promedios por Materia</CardTitle>
                        <CardDescription>Detalle de la distribución</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-6">
                        {materiasHidden ? (
                            <p className="text-sm text-muted-foreground">{AVERAGES_HIDDEN_MESSAGE}</p>
                        ) : promediosGeneralesPorMateria.length > 0 ? ( // Usa la variable correcta
                            <div className="space-y-3">
                                {promediosGeneralesPorMateria.map((item, index) => ( // Usa la variable correcta
                                    <div key={item.name} className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div style={{ backgroundColor: item.color || `hsl(var(--chart-${index + 1}))` }} className="w-3 h-3 rounded-full flex-shrink-0"></div>
                                            <span className="text-sm font-medium truncate" title={item.name}>{item.name}</span>
                                        </div>
                                        <span className="text-sm font-semibold">{formatAverage(item.value, 2) ?? 'N/A'}</span>
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

export default GraphicsDisplay;