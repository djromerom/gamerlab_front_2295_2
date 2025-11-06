"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Pencil } from "lucide-react"
import LoadingScreen from "@/components/grupo 5/LoadingScreen"
import { toast } from "sonner"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { FaGithubAlt, FaYoutube } from "react-icons/fa"
import { Textarea } from "../ui/textarea"

type Student = {
  id: string;
  name: string;
  nrcs: string[];
  firstName: string;
  lastName: string;
  email: string;
  studentCode: string;
};

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

type Team = {
  id: string;
  nameTeam: string;
  nameGame: string;
  description: string;
  logo: string;
  url: string;
  github: string;
}

export default function EditBoard() {
  // Simulación de datos (reemplaza por fetch si lo necesitas)


  const [students, setStudents] = useState<Student[]>([])
  const [nrcOptions, setNrcOptions] = useState<NRCOption[]>([])

  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editStudentCode, setEditStudentCode] = useState("");

  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [editNrcs, setEditNrcs] = useState<string[]>([])
  const [searchNrc, setSearchNrc] = useState("")
  const [loading, setLoading] = useState(false)

  const [edit, setEdit] = useState < boolean | null >(false)
  const [infoEquipo, setInfoEquipo] = useState< Team >({
    id: '1', 
    nameTeam: 'Arcade',
    nameGame: 'Piloto', 
    description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Cupiditate iusto aliquid non qui doloribus magni! Assumenda at excepturi culpa dicta quod illum cupiditate amet, accusantium rerum doloribus ipsa, officia a!',
    logo: 'https://gamerlab.blob.core.windows.net/gamer-storage-container/1762351036115-Imagenes%20Para%20Pc.jpg?sv=2025-11-05&se=2029-01-05T23%3A43%3A56Z&sr=b&sp=r&sig=UjJWzgbfrj84yk8m68M9T%2B5pZ%2BTubLDn720SMR%2FTveQ%3D',
    url: 'https://www.youtube.com/watch?v=Geq5b0BHjE0',
    github: 'https://github.com/settings/admin'

  })

  const [infoEditEquipo, setInfoEditEquipo] = useState(infoEquipo)



  const updateStudentNrcs = async ({ id, nrcCodes }: UpdateStudentNrcsDto) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/students/members/${id}/nrcs`, {
        method: 'PATCH',
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nrcCodes }),
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

  const updateStudentBasics = async ({
    id,
    firstName,
    lastName,
    email,
    studentCode,
  }: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    studentCode: string;
  }) => {
    const response = await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/students/members/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, studentCode }),
    });
    if (!response.ok) {
      throw new Error("Error al actualizar los datos del estudiante");
    }
    return response.json();
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
          studentsData.map((s: RawStudent) => ({
            id: s.id.toString(),
            name: `${s.firstName} ${s.lastName}`,
            nrcs: s.nrcs.map((nrc) => nrc.code),
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email,
            studentCode: s.studentCode,
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
    <div className="w-full min-w-[400px] max-w-3xl mx-auto p-4 space-y-[40px]">
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
                          setEditFirstName(student.firstName || "");
                          setEditLastName(student.lastName || "");
                          setEditEmail(student.email || "");
                          setEditStudentCode(student.studentCode || "");
                        }}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Editar información
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
            <DialogTitle>Editar datos de {editStudent?.name}</DialogTitle>
            <DialogDescription>
              Edita los datos del estudiante y sus NRCs asignados.
            </DialogDescription>
          </DialogHeader>

          {/* NUEVOS CAMPOS: ENCIMA DE LOS NRCs */}
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label>Nombre</Label>
                <Input
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder="Nombre"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Apellido</Label>
                <Input
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder="Apellido"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label>Correo</Label>
              <Input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="usuario@uninorte.edu.co"
                disabled={true}
              // Si este estudiante es el principal y debe bloquearse:
              // disabled={editStudent?.isLeader === true}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Código estudiantil</Label>
              <Input
                value={editStudentCode}
                onChange={(e) => setEditStudentCode(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="1234567890"
              />
            </div>
          </div>

          {/* TUS CAMPOS EXISTENTES DE NRCs */}
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
                      onClick={() => setEditNrcs(prev => prev.length >= 2 ? prev : [...prev, nrc.code])}
                      disabled={editNrcs.length >= 2}
                      title={editNrcs.length >= 2 ? "Máximo 2 NRCs" : undefined}
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
              onClick={async () => {
                // Validaciones mínimas
                if (!editFirstName.trim() || !editLastName.trim()) {
                  toast.error("Nombre y apellido son obligatorios");
                  return;
                }
                if (!editEmail.trim()) {
                  toast.error("El correo es obligatorio");
                  return;
                }
                if (!/^[A-Z0-9._%+-]+@uninorte\.edu\.co$/i.test(editEmail)) {
                  toast.error("El correo debe ser @uninorte.edu.co");
                  return;
                }
                if (!editStudentCode.trim()) {
                  toast.error("Código estudiantil obligatorio");
                  return;
                }
                if (editNrcs.length === 0) {
                  toast.error("Debes asignar al menos un NRC", { style: { background: "#ef4444", color: "#fff" } });
                  return;
                }
                if (editNrcs.length > 2) {
                  toast.error("No puedes asignar más de 2 NRCs", { style: { background: "#ef4444", color: "#fff" } });
                  return;
                }

                try {
                  // 1) Actualiza datos básicos
                  if (editStudent) {
                    await updateStudentBasics({
                      id: editStudent.id,
                      firstName: editFirstName.trim(),
                      lastName: editLastName.trim(),
                      email: editEmail.trim(),
                      studentCode: editStudentCode.trim(),
                    });

                    // refresca en memoria local
                    setStudents(prev =>
                      prev.map(s =>
                        s.id === editStudent.id
                          ? {
                            ...s,
                            name: `${editFirstName.trim()} ${editLastName.trim()}`,
                            firstName: editFirstName.trim(),
                            lastName: editLastName.trim(),
                            email: editEmail.trim(),
                            studentCode: editStudentCode.trim(),
                          }
                          : s
                      )
                    );
                  }

                  // 2) Actualiza NRCs
                  handleSaveNrcs(editStudent, editNrcs, setStudents, setEditStudent);
                } catch (err: any) {
                  console.error(err);
                  toast.error(err?.message || "No se pudo actualizar el estudiante");
                }
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Card className="w-full shadow-sm border pb-4 bg-transparent py-5 md:p-10">
        <CardContent>
          <div className="flex flex-col justify-center space-x-5 space-y-5">
            <div className="flex justify-center items-center rounded-[20px] w-full space-x-5">
              <img src={infoEquipo.logo} alt="Logo del equipo" className="w-[60px] rounded-[20px]"/>
              <div>
                <h2 className="font-bold text-[20px]">
                  {infoEquipo.nameGame.toUpperCase()}
                </h2>
                <h3 className="font-medium">{infoEquipo.nameTeam}</h3>
              </div>
            </div>
            <div className="w-full">
              <p className="text-[12px] mt-3 text-center">
                {infoEquipo.description}
              </p>
            </div>
            <div className="flex justify-center items-center w-full space-x-5 border-t-1 p-5">
              <a href={infoEquipo.github} target="_blank">
                <FaGithubAlt size={25} className="cursor-pointer hover:text-[#6e5494]" />
              </a>
              <a href={infoEquipo.url} target="_blank">
                <FaYoutube size={25} className="cursor-pointer hover:text-[#FF0000]"/>
              </a>
            </div>
          </div>
          <Button className="w-full cursor-pointer" onClick={()=>setEdit(true)}>
            Editar
          </Button>
        </CardContent>
      </Card>

      <Dialog open={!!edit} onOpenChange={() => {!open; setEdit(null)}}>
        <DialogContent  className="max-w-md w-full">
          
          <DialogHeader>
            <DialogTitle>Editar equipo {infoEquipo?.nameTeam}</DialogTitle>
            <DialogDescription>
              Edita los datos del equipo y el juego.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Nombre del equipo</Label>
                <Input
                  value={infoEditEquipo?.nameTeam}
                  onChange={(e) => setInfoEditEquipo((prev) => ({...prev, nameTeam: e.target.value}))}
                  placeholder="Nombre del equipo"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Nombre del juego</Label>
                <Input
                  value={infoEditEquipo.nameGame}
                  onChange={(e) => setInfoEditEquipo((prev) => ({...prev, nameGame: e.target.value}))}
                  placeholder="Mi juego"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Description</Label>
              <Textarea className={"flex resize-none"} value={infoEditEquipo.description} onChange={(e) => setInfoEditEquipo((prev) => ({...prev, description: e.target.value}))} placeholder={"Escribe una descripción del juego"} style={{height:80}}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Logo</Label>
              <Input
                value={infoEditEquipo.logo}
                onChange={(e) => setInfoEditEquipo((prev) => ({...prev, logo: e.target.value}))}
                inputMode="numeric"
                placeholder="http://..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Vídeo de youtube</Label>
                <Input
                  value={infoEditEquipo?.url}
                  onChange={(e) => setInfoEditEquipo((prev) => ({...prev, url: e.target.value}))}
                  placeholder="https://youtube..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Repositorio Github</Label>
                <Input
                  value={infoEditEquipo.github}
                  onChange={(e) => setInfoEditEquipo((prev) => ({...prev, nameGame: e.target.value}))}
                  placeholder="https://github..."
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={async () => { setInfoEditEquipo(infoEquipo); setEdit(false) }}
            >
              Cancelar
            </Button>
            <Button onClick={async () => {await setInfoEquipo(infoEditEquipo); setEdit(false)}}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}