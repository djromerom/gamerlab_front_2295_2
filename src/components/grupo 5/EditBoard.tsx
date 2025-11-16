"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Pencil } from "lucide-react"
import LoadingScreen from "@/components/grupo 5/LoadingScreen"
import { toast } from "sonner"

import TeamCode from "@/components/grupo 5/TeamCode.tsx"


type Student = {
  id: string
  name: string
  nrcs: string[]
}

type RawStudent = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  studentCode: string;
  nrcs: { code: string }[]; // Suponiendo que cada NRC tiene un campo `code`
};

type NRCOption = {
  code: string
}

type UpdateStudentNrcsDto = {
  id: string;
  nrcCodes: string[];
};


export default function EditBoard() {
  // Simulación de datos (reemplaza por fetch si lo necesitas)


  const [students, setStudents] = useState<Student[]>([])
  const [nrcOptions, setNrcOptions] = useState<NRCOption[]>([])

  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [editNrcs, setEditNrcs] = useState<string[]>([])
  const [searchNrc, setSearchNrc] = useState("")
  const [loading, setLoading] = useState(false)
  
  const updateStudentNrcs = async ({ id, nrcCodes }: UpdateStudentNrcsDto) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/students/members/${id}/nrcs`, {
        method: 'PATCH',
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify( {nrcCodes} ),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar los NRCs del estudiante');
      }

      const data = await response.json();
      console.log('Estudiante actualizado:', data);
      return data;
    } catch (error) {
      console.error('Error en PATCH:', error);
    }
  };

  useEffect(() => {

    const fetchData = async () => {
      setLoading(true);
      try {
        // Reemplaza estas URLs por las de tu backend
        const studentsRes = await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/students/members`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })
        const nrcsRes = await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/nrcs/select-options`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })

        if (!studentsRes.ok || !nrcsRes.ok) throw new Error("Error al cargar datos");

        const studentsData = await studentsRes.json();
        const nrcsData = await nrcsRes.json();

        setNrcOptions(
          Array.isArray(nrcsData)
            ? nrcsData.map((nrc: any) => ({ code: nrc.code }))
            : []
        );

        setStudents(
          studentsData.map((s: RawStudent ) => ({
            id: s.id.toString(),
            name: `${s.firstName} ${s.lastName}`,
            nrcs: s.nrcs.map((nrc) => nrc.code),
          }))
        )

      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="w-full max-w-3xl mx-auto p-4"><LoadingScreen /></div>
  } 

  function handleSaveNrcs(
    editStudent: Student | null,
    editNrcs: string[],
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>,
    setEditStudent: (s: Student | null) => void
  ) {
    if (editStudent) {
      setStudents(students =>
        students.map(s =>
          s.id === editStudent.id ? { ...s, nrcs: editNrcs } : s
        )
      );
      updateStudentNrcs({ id: editStudent.id, nrcCodes: editNrcs });
      toast.success("NRC Editado", { style: { background: "#22c55e", color: "#fff" } });
      setEditStudent(null);
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <TeamCode />
      <Card className="w-full shadow-sm border pb-4">
        <CardHeader className="pt-6">
          <CardTitle className="text-lg font-medium text-foreground mb-6 w-full">
            Estudiantes del equipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-2 text-left">Nombre</th>
                  <th className="py-2 px-2 text-left">NRCs</th>
                  <th className="py-2 px-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b hover:bg-muted transition-colors">
                    <td className="py-2 px-2">{student.name}</td>
                    <td className="py-2 px-2">
                      <div className="flex flex-wrap gap-2">
                        {student.nrcs.map((nrc) => {
                          const nrcObj = nrcOptions.find(opt => opt.code === nrc)
                          return (
                            <span
                              key={nrc}
                              className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground border border-accent"
                            >
                              {nrcObj ? `${nrcObj.code}` : nrc}
                            </span>
                          )
                        })}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditStudent(student)
                          setEditNrcs(student.nrcs)
                        }}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Editar NRCs
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para editar NRCs */}
      <Dialog open={!!editStudent} onOpenChange={open => !open && setEditStudent(null)}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Editar NRCs de {editStudent?.name}</DialogTitle>
            <DialogDescription>
              Aquí puedes eliminar o agregar NRCs para este estudiante.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block text-sm font-medium">NRCs asignados</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {editNrcs.map((nrc) => {
                const nrcObj = nrcOptions.find(opt => opt.code === nrc);
                return (
                  <span
                    key={nrc}
                    className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground border border-accent"
                  >
                    {nrcObj ? `${nrcObj.code}` : nrc}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="ml-1 p-0.5 flex items-center justify-center cursor-pointer"
                      style={{ lineHeight: 1, height: '1.5em', width: '1.5em' }}
                      onClick={() => setEditNrcs(prev => prev.filter(code => code !== nrc))}
                      aria-label="Eliminar NRC"
                    >
                      <span className="text-lg leading-none">×</span>
                    </Button>
                  </span>
                );
              })}
            </div>
            <label className="block text-sm font-medium">Agregar NRC</label>
            <div>
              <input
                type="text"
                placeholder="Buscar NRC"
                className="w-full border rounded px-2 py-1 mb-2"
                value={searchNrc}
                onChange={e => setSearchNrc(e.target.value)}
              />
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {nrcOptions
                  .filter(nrc => !editNrcs.includes(nrc.code) && String(nrc.code).includes(searchNrc))
                  .map(nrc => (
                    <Button
                      key={nrc.code}
                      variant="ghost"
                      className="justify-start"
                      onClick={() => setEditNrcs(prev => [...prev, nrc.code])}
                    >
                      {nrc.code}
                    </Button>
                  ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditStudent(null)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (editNrcs.length === 0) {
                  toast.error("Debes asignar al menos un NRC", { style: { background: "#ef4444", color: "#fff" } });
                  return;
                }

                if (editNrcs.length > 2) {
                  toast.error("No puedes asignar más de 2 NRCs", { style: { background: "#ef4444", color: "#fff" } });
                  return;
                }

                handleSaveNrcs(editStudent, editNrcs, setStudents, setEditStudent);
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}