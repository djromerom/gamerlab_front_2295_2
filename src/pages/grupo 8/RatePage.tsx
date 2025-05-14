
"use client"

import Criteriabutton from "@/components/grupo 8/criteriabutton"; // Importa el componente criteriabutton
import { useEffect, useState } from "react"
import { FileIcon as FilePdf, RefreshCw } from "lucide-react"
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/grupo 8/textarea"
import LayoutAplication from "@/layouts/LayoutAplication"
import { Loader } from "lucide-react"; // Asegúrate de tener este import


// Tipos
interface Game {
    id: number
    nombre: string
    equipo: string
    materia: string
    nrc: string
    participantes: string[]
    descripcion?: string
    imagen?: string
}

interface EvaluationCriteria {
    id: string
    name: string
    score: number
    maxScore: number
}



export default function RatePage({ params }: { params: { id: string } }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation(); // Obtén el estado de navegación
    const game = location.state?.game; // Extrae los datos del juego del estado
    const jurorId = location.state?.jurorId; // <-- Aquí tienes el jurorId
    const [loading, setLoading] = useState(true)
    const [comments, setComments] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false);


    const [criteria, setCriteria] = useState<EvaluationCriteria[]>([
        { id: "interfaz", name: "Interfaz de usuario", score: 1, maxScore: 5 },
        { id: "interaccion", name: "Interacción", score: 1, maxScore: 5 },
        { id: "resultados", name: "Resultados", score: 1, maxScore: 5 },
        { id: "presentacion", name: "Presentación del proyecto", score: 1, maxScore: 5 },
        { id: "funcionamiento", name: "Funcionamiento del programa", score: 1, maxScore: 5 },
        { id: "presentacion_grupo", name: "Presentación personal grupo", score: 1, maxScore: 5 },
    ])



    useEffect(() => {
        if (game) {
            // Si los datos del juego están disponibles, desactiva el estado de carga
            setLoading(false);
        } else {
            // Si no hay datos del juego, redirige a la página de pendientes
            navigate("/pendientes-calificar");
        }
    }, [game, navigate]);

    const handleScoreChange = (criteriaId: string, score: number) => {
        setCriteria(criteria.map((c) => (c.id === criteriaId ? { ...c, score } : c)));
    };


    const handleSubmit = async () => {
        setIsSubmitting(true);
        // 1. Calcular promedio
        const promedio_puntaje =
            criteria.reduce((acc, curr) => acc + curr.score, 0) / criteria.length;

        // 2. Preparar datos para evaluacion
        const fecha_creacion = new Date().toISOString();
        const evaluationPayload = {
            date: fecha_creacion,
            videogameId: game.id,
            totalScore: promedio_puntaje,
            comments: comments,
        };

        // 3. Enviar a tabla evaluacion y obtener id_evaluacion
        let evaluationId;
        try {

            const resEval = await fetch("http://localhost:3000/evaluation", {
                method: "POST",
                credentials: "include", // Incluye cookies si es necesario
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(evaluationPayload),
            });
            const evalData = await resEval.json();
            evaluationId = evalData.evaluationId; // Ajusta según la respuesta de tu backend
        } catch (err) {
            alert("Error guardando la evaluación");
            return;
        }

        // 4. Mapear criterios a sus ids
        const criterioMap: Record<string, number> = {
            interfaz: 1,
            interaccion: 2,
            resultados: 3,
            presentacion: 4,
            funcionamiento: 5,
            presentacion_grupo: 6,
        };

        // 5. Preparar y enviar detalles_evaluacion
        const details = criteria.map((c) => ({
            evaluationId: evaluationId,
            criterionId: criterioMap[c.id],
            score: c.score,
            createdAt: fecha_creacion,
            updatedAt: fecha_creacion,
            isActive: true,
        }));

        try {

            await fetch("http://localhost:3000/evaluation/details", {
                method: "POST",
                credentials: "include", // Incluye cookies si es necesario
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ details }),
            });
            navigate("/pendientes-calificar");
        } catch (err) {
            alert("Error guardando los detalles de la evaluación");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <LayoutAplication breadcrumbs={[]}>
                <div className="flex justify-center items-center h-screen text-white">
                    <p>Cargando información del juego...</p>
                </div>
            </LayoutAplication>
        );
    }
    const breadcrumbs = [
        { label: "Pendientes por calificar", href: "/pendientes-calificar" },
        { label: game?.nombre || "Juego", href: `/juego/${params.id}` },
    ];

    const getDescription = (id: string): string => {
        switch (id) {
            case "interfaz":
                return "Diseño, colores, usabilidad";
            case "interaccion":
                return "Controles, guía al usuario, intuitividad";
            case "resultados":
                return "Reacciones, recompensas, retroalimentación visual";
            case "presentacion":
                return "Claridad, coherencia, comunicación del objetivo";
            case "funcionamiento":
                return "Que no tenga errores y cumpla su propósito";
            case "presentacion_grupo":
                return "Lenguaje corporal, presencia, orden y seguridad al exponer";
            default:
                return "Sin descripción";
        }
    };

    return (
        <LayoutAplication breadcrumbs={breadcrumbs}>
            <div className="container mx-auto py-6 p-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight py-1">Evaluación de Videojuego</h1>
                        <p className="text-muted-foreground">Complete los criterios de evaluación para {game?.nombre}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate("/pendientes-calificar")}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Volver a pendientes
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 md:col-span-4">


                        <Card className="h-full py-5">
                            <CardHeader>
                                {/* Círculo con el logo del juego */}
                                {game.imagen && (
                                    <div className="flex justify-center mb-4 p-3">
                                        <div className="w-38 h-38 bg-gray-300 rounded-full overflow-hidden shadow-md">
                                            <img
                                                src={game.imagen}
                                                alt={`${game.nombre} logo`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                    </div>
                                )}
                                <CardTitle>Información del Juego</CardTitle>
                                <CardDescription>Detalles del proyecto a evaluar</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Equipo</p>
                                        <p>{game.equipo}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Materia</p>
                                        <p>{game.materia}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">NRC</p>
                                        <p>{game.nrc}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Participantes</p>
                                        <p>{game.participantes.join(", ")}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                                        <p className="text-sm">{game.descripcion}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>


                    <div className="col-span-12 md:col-span-8">
                        <Card className="h-full py-6">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold">Criterios de Evaluación</CardTitle>
                                <CardDescription >Califique cada aspecto del proyecto</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-lg font-bold">Criterio</TableHead>
                                            <TableHead className="text-right"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {criteria.map((criterion) => (
                                            <TableRow key={criterion.id}>
                                                <TableCell colSpan={2} className="font-medium text-base px-0">
                                                    {criterion.name}
                                                    <div className="mt-2 flex items-center gap-4">
                                                        <p className="text-xs font-medium text-muted-foreground">Puntuación:</p>
                                                        <input
                                                            type="range"
                                                            min="1"
                                                            max="5"
                                                            step="1"
                                                            value={criterion.score}
                                                            onChange={(e) =>
                                                                handleScoreChange(criterion.id, parseFloat(e.target.value))
                                                            }
                                                            className="w-full h-2 rounded-lg appearance-none cursor-pointer px-0"
                                                            style={{
                                                                background: `linear-gradient(to right, #b3c7ff ${((criterion.score - 1) / 4) * 100}%, #e5e7eb ${((criterion.score - 1) / 4) * 100}%)`,
                                                                accentColor: "#b3c7ff dark:", // Cambia el color del círculo del slider
                                                            }}
                                                        />
                                                        <span className="text-sm font-medium px-0">{criterion.score}</span>
                                                        <Criteriabutton description={getDescription(criterion.id)} />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                <div className="mt-6">
                                    <h3 className="font-medium mb-2">Comentarios Adicionales</h3>
                                    <Textarea
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        className="w-full h-32 bg-[#1a1a2e] text-black border border-[#4d5474] rounded-md"
                                        placeholder="Escribe tus comentarios sobre el juego..."
                                    />
                                </div>

                                <div className="flex justify-end mt-6">
                                    <Button
                                        className="bg-[#6644ff] hover:bg-[#5a3be5] dark:bg-[#b3bcff] dark:text-[#1a1a2e] dark:hover:bg-[#b3c7ff] text-white font-bold min-w-[170px] flex justify-center items-center"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <span className="flex justify-center items-center w-full">
                                                <Loader className="animate-spin w-5 h-5" />
                                            </span>
                                        ) : (
                                            "Enviar Evaluación"
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </LayoutAplication>
    );
}