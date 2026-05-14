import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { toast } from "sonner"

import { TeamMembersProps } from "@/types/teamMembers";
import { useAuth } from "@/contexts/AuthContext"

export default function FormEditMembers ({ 
    setStudents,
    editStudent, setEditStudent, 
    editNrcs, setEditNrcs, 
    editFirstName, setEditFirstName, 
    editLastName, setEditLastName, 
    editEmail, setEditEmail, 
    editStudentCode, setEditStudentCode, 
    nrcOptions,
    searchNrc, setSearchNrc,
    updateStudentBasics,
    handleSaveNrcs
 }: TeamMembersProps) {
    const { user } = useAuth();
    return (
        <Dialog open={!!editStudent} onOpenChange={open => !open && setEditStudent(null)}>
            <DialogContent className="max-w-md w-full">
                <DialogHeader>
                    <DialogTitle>Editar datos de {editStudent?.firstName}</DialogTitle>
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
                                disabled
                                onChange={(e) => setEditFirstName(e.target.value)}
                                placeholder="Nombre"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label>Apellido</Label>
                            <Input
                                value={editLastName}
                                disabled
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
                            placeholder="usuario@ejemplo.com"
                            // Si este estudiante es el principal y debe bloquearse:
                            disabled={user?.email === editStudent?.email}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label>Código estudiantil</Label>
                        <Input
                            value={editStudentCode}
                            disabled
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
                                )
                            )}
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
                            if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(editEmail)) {
                                toast.error("El correo ingresado no es válido");
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
                                if (editStudent && user) {
                                    if (editStudent.email !== user.email) {
                                        await updateStudentBasics({
                                            id: editStudent.id,
                                            email: editEmail.trim(),
                                        });
                                    }

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
                                        : s));
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
    )
}