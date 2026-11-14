import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"

import { NRCOption, Student } from "@/features/teams/types/teamMembers"

export default function CardTeamMembers ({ 
    students, 
    nrcOptions, 
    setEditStudent,
    setEditNrcs,
    setEditFirstName,
    setEditLastName,
    setEditEmail,
    setEditStudentCode, 
} : { 
    students: Student[], 
    nrcOptions: NRCOption[], 
    setEditStudent: React.Dispatch<React.SetStateAction<Student | null>>,
    setEditNrcs: React.Dispatch<React.SetStateAction<string[]>>,
    setEditFirstName: React.Dispatch<React.SetStateAction<string>>,
    setEditLastName: React.Dispatch<React.SetStateAction<string>>,
    setEditEmail: React.Dispatch<React.SetStateAction<string>>,
    setEditStudentCode: React.Dispatch<React.SetStateAction<string>>
}) {
    return (
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
                                    <td className="py-2 px-2">{student.firstName}</td>
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
    )
}