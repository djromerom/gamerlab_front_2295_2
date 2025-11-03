import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Trash2, Eye, ChevronRight, ChevronLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";

interface Equipo {
    id: string;
    nombre: string;
}

interface Jurado {
    id: string;
    nombre: string;
    tipo: "senior" | "junior";
    equipos: Equipo[];
}

export default function AssignmentLayout() {
    const [jurados, setJurados] = useState<Jurado[]>([
        {
            id: "J001",
            nombre: "María Gómez",
            tipo: "senior",
            equipos: [
                { id: "E01", nombre: "Team Alpha" },
                { id: "E02", nombre: "Team Beta" },
            ],
        },
        {
            id: "J002",
            nombre: "Carlos López",
            tipo: "junior",
            equipos: [{ id: "E03", nombre: "Team Gamma" }],
        },
        {
            id: "J003",
            nombre: "Carlos López",
            tipo: "junior",
            equipos: [{ id: "E03", nombre: "Team Gamma" }],
        },
        {
            id: "J004",
            nombre: "Carlos López",
            tipo: "junior",
            equipos: [{ id: "E03", nombre: "Team Gamma" }],
        },
        {
            id: "J005",
            nombre: "Carlos López",
            tipo: "junior",
            equipos: [{ id: "E03", nombre: "Team Gamma" }],
        },
        {
            id: "J006",
            nombre: "Carlos López",
            tipo: "junior",
            equipos: [{ id: "E03", nombre: "Team Gamma" }],
        },
        {
            id: "J007",
            nombre: "Carlos López",
            tipo: "junior",
            equipos: [{ id: "E03", nombre: "Team Gamma" }],
        },
        {
            id: "J008",
            nombre: "Carlos López",
            tipo: "junior",
            equipos: [{ id: "E03", nombre: "Team Gamma" }],
        },
        {
            id: "J009",
            nombre: "Carlos López",
            tipo: "junior",
            equipos: [{ id: "E03", nombre: "Team Gamma" }],
        },
        {
            id: "J010",
            nombre: "Carlos López",
            tipo: "junior",
            equipos: [{ id: "E03", nombre: "Team Gamma" }],
        },
        {
            id: "J011",
            nombre: "Carlos López",
            tipo: "junior",
            equipos: [{ id: "E03", nombre: "Team Gamma" }],
        },
        {
            id: "J012",
            nombre: "Carlos López",
            tipo: "junior",
            equipos: [{ id: "E03", nombre: "Team Gamma" }],
        },
        {
            id: "J013",
            nombre: "Carlos López",
            tipo: "junior",
            equipos: [{ id: "E03", nombre: "Team Gamma" }],
        },
        {
            id: "J014",
            nombre: "Carlos López",
            tipo: "junior",
            equipos: [{ id: "E03", nombre: "Team Gamma" }],
        },
    ]);
    const [nuevoEquipo, setNuevoEquipo] = useState({ id: "", nombre: "" });
    const [juradoSeleccionado, setJuradoSeleccionado] = useState<Jurado | null>(null);
    const [paginaActual, setPaginaActual] = useState(1)
    const [filasPorPagina, setFilasPorPagina] = useState(5)
    const totalPaginas = Math.ceil(jurados.length / filasPorPagina)

    const handleEliminarEquipo = (idJurado: string, idEquipo: string) => {
        setJurados((prev) =>
            prev.map((jur) =>
                jur.id === idJurado
                    ? { ...jur, equipos: jur.equipos.filter((e) => e.id !== idEquipo) }
                    : jur
            )
        );
    };

    const handleAsignarEquipo = () => {
        if (!juradoSeleccionado || !nuevoEquipo.id || !nuevoEquipo.nombre) return;
        setJurados((prev) =>
            prev.map((jur) =>
                jur.id === juradoSeleccionado.id
                ? { ...jur, equipos: [...jur.equipos, nuevoEquipo] }
                : jur
            )
        );
        setNuevoEquipo({ id: "", nombre: "" });
    };
    const juradosPaginados = jurados.slice (
        (paginaActual - 1) * filasPorPagina,
        paginaActual * filasPorPagina
    )

    return (
        <div className="bg-background text-foreground min-h-screen p-4">
            <div className="flex justify-between items-center mb-6 px-4">
                <h1 className="text-xl font-semibold">Jurados</h1>
            </div>

            <div className="w-full overflow-x-auto   rounded-xl shadow-md border">
                <Table className="min-w-full text-sm">
                        <TableRow>
                            <TableHead className="px-5 py-3 text-left">ID</TableHead>
                            <TableHead className="px-5 py-3 text-left">Nombre</TableHead>
                            <TableHead className="px-5 py-3 text-left">Tipo</TableHead>
                            <TableHead className="px-5 py-3 text-right">Equipos asignados</TableHead>
                            <TableHead className="px-5 py-3 text-right">Acciones</TableHead>
                        </TableRow>
                    <TableBody>
                        {juradosPaginados.map((jurado, i) => (
                            <TableRow
                                key={jurado.id}
                                className={i % 2 === 0 ? "border-y-1" : "border-b-1"}
                            >
                                <TableCell className="px-5 py-3">{jurado.id}</TableCell>
                                <TableCell className="px-5 py-3">{jurado.nombre}</TableCell>
                                <TableCell className="px-5 py-3 capitalize">{jurado.tipo}</TableCell>

                                {/* Ver equipos */}
                                <TableCell className="px-5 py-3 text-right">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setJuradoSeleccionado(jurado)}
                                                className="hover:border-2 hover:border-[#6a8cff]"
                                            >
                                                <Eye size={16} />
                                                Ver equipos
                                            </Button>
                                        </DialogTrigger>

                                        <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Equipos de {jurado.nombre}</DialogTitle>
                                        </DialogHeader>

                                        <div className="max-h-60 overflow-y-auto mt-3 space-y-2">
                                            {jurado.equipos.length > 0 ? (
                                                jurado.equipos.map((equipo) => (
                                                    <div
                                                    key={equipo.id}
                                                    className="flex justify-between items-center border-1 px-3 py-2 rounded-md"
                                                    >
                                                        <span>{equipo.nombre}</span>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                            handleEliminarEquipo(jurado.id, equipo.id)
                                                            }
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                ))
                                                ) : (
                                                <p className="text-sm text-gray-400 text-center py-2">
                                                    No hay equipos asignados
                                                </p>
                                            )}
                                        </div>
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>

                                {/* Asignar nuevo equipo */}
                                <TableCell className="px-5 py-3 text-right">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant={"home"}
                                                size="sm"
                                                onClick={() => setJuradoSeleccionado(jurado)}
                                            >
                                                Asignar equipo
                                            </Button>
                                        </DialogTrigger>

                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Asignar equipo a {jurado.nombre}
                                                </DialogTitle>
                                            </DialogHeader>

                                            <div className="space-y-3 mt-2">
                                                <Input
                                                    placeholder="ID del equipo"
                                                    value={nuevoEquipo.id}
                                                    onChange={(e) =>
                                                        setNuevoEquipo({
                                                            ...nuevoEquipo,
                                                            id: e.target.value,
                                                        })
                                                    }
                                                />
                                                <Input
                                                    placeholder="Nombre del equipo"
                                                    value={nuevoEquipo.nombre}
                                                    onChange={(e) =>
                                                        setNuevoEquipo({
                                                            ...nuevoEquipo,
                                                            nombre: e.target.value,
                                                    })
                                                    }
                                                />
                                                <Button
                                                    variant={"home"}
                                                    onClick={handleAsignarEquipo}
                                                    className="w-full"
                                                >
                                                    Guardar
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                
                {/* Paginación */}
                <div className="flex items-center justify-between m-4">
                    <div className="flex items-center gap-2">
                        <span>Filas por página:</span>
                        <Select
                            value={filasPorPagina.toString()}
                            onValueChange={v => {
                            setFilasPorPagina(parseInt(v))
                            setPaginaActual(1)
                            }}
                        > 
                            <SelectTrigger className="w-20">
                            <SelectValue placeholder="5" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <span>
                            Página {paginaActual} de {totalPaginas}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaActual(p => Math.max(p - 1, 1))}
                            disabled={paginaActual === 1}
                        >
                            <ChevronLeft />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))}
                            disabled={paginaActual === totalPaginas}
                        >
                            <ChevronRight />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
