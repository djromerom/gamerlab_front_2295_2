"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/grupo 8/textarea";
import LayoutAplication from "@/layouts/LayoutAplication";

// Tipos
interface Game {
  id: string;
  equipo: string;
  materia: string;
  nrc: string;
  participantes: string[];
  descripcion?: string;
  imagen?: string;
}

interface EvaluationCriteria {
  id: string;
  name: string;
  score: number;
  maxScore: number;
}

export default function RatedPage({ params }: { params: { id: string } }) {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState("");

  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([
    { id: "interfaz", name: "Interfaz de usuario", score: 0, maxScore: 5 },
    { id: "interaccion", name: "Interacción", score: 0, maxScore: 5 },
    { id: "resultados", name: "Resultados", score: 0, maxScore: 5 },
    {
      id: "presentacion",
      name: "Presentación del proyecto",
      score: 0,
      maxScore: 5,
    },
    {
      id: "funcionamiento",
      name: "Funcionamiento del programa",
      score: 0,
      maxScore: 5,
    },
    {
      id: "presentacion_grupo",
      name: "Presentación personal grupo",
      score: 0,
      maxScore: 5,
    },
  ]);

  // Obtener datos del juego
  useEffect(() => {
    // Simulación de fetch
    setTimeout(() => {
      setGame({
        id: params.id,
        equipo: "Thunders",
        materia: "Estructura de Datos 1",
        nrc: "2287",
        participantes: ["Juan A", "Fernando R", "Alejandro V", "Juliana M"],
        descripcion:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      });
      setLoading(false);
    }, 500);
  }, [params.id]);

  const handleScoreChange = (criteriaId: string, score: number) => {
    setCriteria(
      criteria.map((c) => (c.id === criteriaId ? { ...c, score } : c))
    );
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

  const breadcrumbs = [{ label: "Mi equipo", href: "/mi-equipo" }];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      <div className="container mx-auto py-6 p-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mi equipo</h1>
            <p className="text-muted-foreground">
              Criterios calificados por los jurados al equipo {game?.equipo}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-4">
            <Card className="h-full py-5">
              <CardHeader>
                <CardTitle>Información del Juego</CardTitle>
                <CardDescription>
                  Detalles del proyecto a evaluar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Equipo
                    </p>
                    <p>{game?.equipo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Materia
                    </p>
                    <p>{game?.materia}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      NRC
                    </p>
                    <p>{game?.nrc}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Participantes
                    </p>
                    <p>{game?.participantes.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Descripción
                    </p>
                    <p className="text-sm">{game?.descripcion}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 md:col-span-8">
            <Card className="py-5">
              <CardHeader>
                <CardTitle>Criterios de Evaluación</CardTitle>
                <CardDescription>
                  Califique cada aspecto del proyecto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Criterio</TableHead>
                      <TableHead className="text-right">Puntuación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {criteria.map((criterion) => (
                      <TableRow key={criterion.id}>
                        <TableCell className="font-medium">
                          {criterion.name}
                        </TableCell>
                        <TableCell className="text-right">
                          <select
                            disabled
                            value={criterion.score}
                            onChange={(e) =>
                              handleScoreChange(
                                criterion.id,
                                parseInt(e.target.value)
                              )
                            }
                            className="bg-[#1a1a2e] text-white border border-[#4d5474] rounded px-2 py-1 text-sm"
                          >
                            {[...Array(criterion.maxScore + 1)].map((_, i) => (
                              <option key={i} value={i}>
                                {i}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-6">
                  <h3 className="font-medium mb-2">Comentarios Adicionales</h3>
                  <Textarea
                    disabled
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full h-32 bg-[#1a1a2e] text-white border border-[#4d5474] rounded-md"
                    placeholder="Escribe tus comentarios sobre el juego..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LayoutAplication>
  );
}
