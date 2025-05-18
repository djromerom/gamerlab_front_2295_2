"use client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useMediaQuery } from "@/hooks/use-media-querry";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";


// NRC y estudiantes asociados
const studentsByNRC: Record<
  string,
  { id: string; name: string; grade: number }[]
> = {
  "12345": [
    { id: "001", name: "Juan Pérez", grade: 4.5 },
    { id: "002", name: "María García", grade: 4.2 },
  ],
  "67890": [
    { id: "001", name: "Carlos Rodríguez", grade: 3.4 },
    { id: "002", name: "Ana Martínez", grade: 4.5 },
  ],
  "54321": [
    { id: "001", name: "Luis Sánchez", grade: 4.2 },
    { id: "002", name: "Sofia Fernández", grade: 4.6 },
    { id: "003", name: "Diego López", grade: 4.1 },
    { id: "004", name: "Valentina Torres", grade: 3.5 },
  ],
};

const nrcOptions = Object.keys(studentsByNRC);
interface Props {
  initialNRC?: string;
}

export default function StudentGradeTable({ initialNRC }: Props) {
  const defaultNRC = nrcOptions.includes(initialNRC || "")
    ? initialNRC!
    : nrcOptions[0];
  const [selectedNRC, setSelectedNRC] = useState(defaultNRC);
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 640px)");

  const students = studentsByNRC[selectedNRC];

  const viewStudentDetails = (id: string) => {
    navigate(`/home-estudiante?nrc=${selectedNRC}&studentId=${id}`);
  };

  const getGradeStatus = (grade: number) => {
    if (grade >= 4.5) return "text-green-600 font-medium";
    if (grade >= 4.0) return "text-blue-600 font-medium";
    if (grade >= 3.0) return "text-yellow-600 font-medium";
    return "text-red-600 font-medium";
  };

  const NRCSelector = (
    <div className="mb-4 w-full sm:w-64">
      <label className="block text-sm font-medium mb-1">
        Selecciona el NRC:
      </label>
      <Select value={selectedNRC} onValueChange={setSelectedNRC}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona NRC" />
        </SelectTrigger>
        <SelectContent>
          {nrcOptions.map((nrc) => (
            <SelectItem key={nrc} value={nrc}>
              {nrc}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  if (isMobile) {
    return (
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-xl font-bold mb-4">
          Lista de Estudiantes - NRC {selectedNRC}
        </h1>
        {NRCSelector}
        <div className="space-y-3">
          {students.map((student) => (
            <Card key={student.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">
                      ID: {student.id}
                    </p>
                    <p className="font-semibold">{student.name}</p>
                  </div>
                  <div
                    className={`text-center px-3 py-1 rounded-full text-sm ${getGradeStatus(
                      student.grade
                    )} bg-muted`}
                  >
                    {student.grade}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => viewStudentDetails(student.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver detalles
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6">
      <h1 className="text-2xl font-bold mb-6">
        Lista de Estudiantes - NRC {selectedNRC}
      </h1>
      {NRCSelector}
      <div className="overflow-x-auto">
        <Table>
          <TableCaption>Lista de estudiantes y sus calificaciones</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-center">Calificación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.id}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell
                  className={`text-center ${getGradeStatus(student.grade)}`}
                >
                  {student.grade}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewStudentDetails(student.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver detalles
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
