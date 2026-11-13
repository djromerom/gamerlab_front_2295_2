"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  Loader2,
} from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Professor {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  isActive: boolean;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  semester: number;
}

interface Nrc {
  id: number;
  code: string;
  professorId: string;
  professor: Professor;
  subjectId: number;
  subject: Subject;
  members: any[];
  createdAt: string;
  updatedAt: string;
}

interface NrcFormData {
  code: string;
  subjectId: string;
  professorId: string;
}

interface PaginationMetadata {
  totalItems: number;
  itemsOnCurrentPage: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

interface Props {
  nrcs: Nrc[] | null;
  pagination: PaginationMetadata;
  apiBaseUrl: string;
  isDataLoading?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  refreshData: () => void;
  /** ARK-136: edición anterior (historial): sin agregar, editar ni eliminar. */
  readOnly?: boolean;
}

export const NrcsTable: React.FC<Props> = ({
  nrcs,
  pagination,
  apiBaseUrl,
  isDataLoading = false,
  onPageChange,
  onLimitChange,
  refreshData,
  readOnly = false,
}) => {
  const customFetch = useFetch();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newNrc, setNewNrc] = useState<NrcFormData>({
    code: "",
    subjectId: "",
    professorId: "",
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingNrc, setEditingNrc] = useState<Nrc | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [professorsList, setProfessorsList] = useState<Professor[]>([]);
  const [selectsLoading, setSelectsLoading] = useState(false);

  const showLoader = isDataLoading || internalIsLoading || selectsLoading;

  const columns = [
    { key: "code", label: "Código" },
    { key: "subject", label: "Materia" },
    { key: "professor", label: "Profesor" },
  ];

  // Función para validar el formato del código (4 dígitos)
  const validateCodeFormat = (code: string): boolean => {
    const codeRegex = /^\d{4}$/;
    return codeRegex.test(code);
  };

  useEffect(() => {
    const fetchSelectData = async () => {
      setSelectsLoading(true);
      try {
        const [subjectsRes, professorsRes] = await Promise.all([
          customFetch(`${apiBaseUrl}/subjects/select-options`),
          customFetch(`${apiBaseUrl}/professors/select-options`),
        ]);

        if (!subjectsRes.ok || !professorsRes.ok) {
          throw new Error("Failed to load data for selects");
        }

        const subjectsData = await subjectsRes.json();
        const professorsData = await professorsRes.json();

        // Procesar profesores para asegurar que tengan nombre
        const processedProfessors = professorsData.map((prof: any) => ({
          ...prof,
          name: prof.name || `${prof.firstName || ''} ${prof.lastName || ''}`.trim()
        }));

        setSubjectsList(subjectsData || []);
        setProfessorsList(processedProfessors || []);
      } catch (err: any) {
        console.error("Error fetching select data:", err);
        setError("Error al cargar datos para formularios.");
      } finally {
        setSelectsLoading(false);
      }
    };
    fetchSelectData();
  }, [apiBaseUrl, customFetch]);

  // Función para obtener el nombre del profesor
  const getProfessorName = (professor: Professor): string => {
    return professor.name || `${professor.firstName || ''} ${professor.lastName || ''}`.trim();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalIsLoading(true);
    setError(null);

    try {
      // Validaciones de campos requeridos
      if (!newNrc.code || !newNrc.subjectId || !newNrc.professorId) {
        throw new Error("Todos los campos (Código, Materia, Profesor) son requeridos.");
      }

      // Validación de formato del código
      if (!validateCodeFormat(newNrc.code)) {
        throw new Error("El código debe ser un número de exactamente 4 dígitos");
      }

      const codeValue = Number(newNrc.code);
      if (isNaN(codeValue)) {
        throw new Error("El código debe ser un número válido.");
      }

      const response = await customFetch(`${apiBaseUrl}/nrcs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeValue,
          subjectId: Number(newNrc.subjectId),
          professorId: newNrc.professorId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear el NRC");
      }

      onPageChange(1);
      setNewNrc({ code: "", subjectId: "", professorId: "" });
      setAddDialogOpen(false);
      refreshData();
      toast.success("NRC agregado exitosamente");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNrc) return;
    setInternalIsLoading(true);
    setError(null);

    try {
      // Validaciones de campos requeridos
      if (!editingNrc.code || !editingNrc.subjectId || !editingNrc.professorId) {
        throw new Error("Todos los campos (Código, Materia, Profesor) son requeridos.");
      }

      // Validación de formato del código
      if (!validateCodeFormat(editingNrc.code)) {
        throw new Error("El código debe ser un número de exactamente 4 dígitos");
      }

      const response = await customFetch(
        `${apiBaseUrl}/nrcs/${editingNrc.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: editingNrc.code,
            subjectId: editingNrc.subjectId,
            professorId: editingNrc.professorId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el NRC");
      }

      refreshData();
      setEditDialogOpen(false);
      setEditingNrc(null);
      toast.success("NRC actualizado exitosamente");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setInternalIsLoading(true);
    setError(null);

    try {
      const response = await customFetch(
        `${apiBaseUrl}/nrcs/${deletingId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al eliminar el NRC");
      }

      // Verificar si la página actual quedará vacía después de eliminar
      const willPageBeEmpty = nrcs && nrcs.length === 1;

      refreshData();
      setDeleteDialogOpen(false);
      setDeletingId(null);
      toast.success("NRC eliminado exitosamente");

      // Si la página quedará vacía y no es la primera página, retroceder
      if (willPageBeEmpty && pagination.currentPage > 1) {
        onPageChange(pagination.currentPage - 1);
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setInternalIsLoading(false);
    }
  };

  return (
    <div
      className={`md:bg-background text-foreground min-h-screen p-4 ${showLoader ? "opacity-75" : ""
        }`}
    >
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-xl font-medium">NRC's</h1>
        {!readOnly && (
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-card hover:bg-accent text-foreground cursor-pointer"
              disabled={!nrcs || showLoader}
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Agregar Nuevo NRC</DialogTitle>
                <DialogDescription>
                  Complete los datos del nuevo NRC.
                </DialogDescription>
              </DialogHeader>
              {error && !showLoader && (
                <div className="px-6 py-2">
                  <p className="text-sm text-red-600 dark:text-red-500">
                    {error}
                  </p>
                </div>
              )}
              <div className="grid gap-4 py-4 px-6">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-code" className="text-right">
                    Código
                  </Label>
                  <Input
                    id="add-code"
                    value={newNrc.code}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d{0,4}$/.test(value)) {
                        setNewNrc((prev) => ({
                          ...prev,
                          code: value,
                        }));
                        setCodeError(null);
                      }
                    }}
                    className="col-span-3"
                    required
                    maxLength={4}
                  />
                  {codeError && (
                    <p className="text-sm text-red-600 dark:text-red-500 col-span-3 col-start-2">
                      {codeError}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-subjectId" className="text-right">
                    Materia
                  </Label>
                  <Select
                    value={newNrc.subjectId}
                    onValueChange={(value) =>
                      setNewNrc((prev) => ({
                        ...prev,
                        subjectId: value,
                      }))
                    }
                    disabled={internalIsLoading || selectsLoading}
                  >
                    <SelectTrigger className="col-span-3 cursor-pointer">
                      <SelectValue placeholder="Seleccione una materia" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectsList.map((subject) => (
                        <SelectItem
                          key={subject.id}
                          value={subject.id.toString()}
                          className="cursor-pointer"
                        >
                          {subject.name} ({subject.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-professorId" className="text-right">
                    Profesor
                  </Label>
                  <Select
                    value={newNrc.professorId}
                    onValueChange={(value) =>
                      setNewNrc((prev) => ({
                        ...prev,
                        professorId: value,
                      }))
                    }
                    disabled={internalIsLoading || selectsLoading}
                  >
                    <SelectTrigger className="col-span-3 cursor-pointer">
                      <SelectValue placeholder="Seleccione un profesor" />
                    </SelectTrigger>
                    <SelectContent>
                      {professorsList.map((professor) => (
                        <SelectItem
                          key={professor.id}
                          value={professor.id.toString()}
                          className="cursor-pointer"
                        >
                          {getProfessorName(professor)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  className="cursor-pointer"
                  variant="outline"
                  onClick={() => {
                    setAddDialogOpen(false);
                    setError(null);
                    setNewNrc({ code: "", subjectId: "", professorId: "" });
                  }}
                  disabled={internalIsLoading}
                >
                  Cancelar
                </Button>
                <Button
                  className="cursor-pointer bg-[var(--selected)] hover:bg-[var(--selected-hover)]"
                  type="submit"
                  disabled={internalIsLoading || selectsLoading}
                >
                  {internalIsLoading ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <Card className="rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-card border-b border-border">
            <TableRow>
              {columns.map(({ key, label }) => (
                <TableHead key={key}>{label}</TableHead>
              ))}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showLoader ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Cargando...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : nrcs?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >
                  No hay NRC's disponibles.
                </TableCell>
              </TableRow>
            ) : (
              nrcs?.map((nrc) => (
                <TableRow key={nrc.id}>
                  <TableCell>{nrc.code}</TableCell>
                  <TableCell>{nrc.subject.name}</TableCell>
                  <TableCell>{getProfessorName(nrc.professor)}</TableCell>
                  <TableCell>
                    {!readOnly && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 cursor-pointer"
                          disabled={internalIsLoading}
                        >
                          <span className="sr-only">Abrir menú</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingNrc(nrc);
                            setEditDialogOpen(true);
                          }}
                          disabled={internalIsLoading}
                          className="cursor-pointer"
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setDeletingId(nrc.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-500 focus:text-red-600 focus:bg-red-100 cursor-pointer"
                          disabled={internalIsLoading}
                        >
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex justify-between items-center p-4 text-sm border-t border-border gap-2">
          <div className="flex items-center gap-1 min-[450px]:gap-2">
            <span className="w-12 min-[450px]:w-auto text-center min-[450px]:text-left leading-tight break-words">
              Filas por página
            </span>
            <Select
              value={pagination.itemsPerPage.toString()}
              onValueChange={(value) => {
                onLimitChange(parseInt(value, 10));
              }}
              disabled={showLoader || !nrcs?.length}
            >
              <SelectTrigger className="w-[70px] cursor-pointer">
                <SelectValue placeholder={pagination.itemsPerPage} />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 15, 20].map((n) => (
                  <SelectItem
                    className="cursor-pointer"
                    key={n}
                    value={n.toString()}
                  >
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 min-[450px]:gap-4 shrink-0">
            <span className="text-center min-[450px]:text-left leading-tight">
              <span className="block min-[450px]:inline">Página </span>
              <span className="block min-[450px]:inline">
                {pagination.totalPages > 0 ? pagination.currentPage : 0} de {pagination.totalPages}
              </span>
            </span>
            <div className="flex gap-1 shrink-0">
              <Button
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={
                  pagination.currentPage === 1 ||
                  showLoader ||
                  !nrcs?.length
                }
                variant="outline"
                size="icon"
                className="cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={
                  pagination.currentPage === pagination.totalPages ||
                  pagination.totalPages === 0 ||
                  showLoader ||
                  !nrcs?.length
                }
                variant="outline"
                size="icon"
                className="cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          {editingNrc && (
            <form onSubmit={handleSaveEdit}>
              <DialogHeader>
                <DialogTitle>Editar NRC</DialogTitle>
                <DialogDescription>
                  Modifique los campos del NRC según sea necesario.
                </DialogDescription>
              </DialogHeader>
              {error && !showLoader && (
                <div className="px-6 py-2">
                  <p className="text-sm text-red-600 dark:text-red-500">
                    {error}
                  </p>
                </div>
              )}
              <div className="grid gap-4 py-4 px-6">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-code" className="text-right">
                    Código
                  </Label>
                  <Input
                    id="edit-code"
                    value={editingNrc.code}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d{0,4}$/.test(value)) {
                        setEditingNrc((prev) =>
                          prev ? { ...prev, code: value } : null
                        );
                        setCodeError(null);
                      }
                    }}
                    className="col-span-3"
                    required
                    maxLength={4}
                  />
                  {codeError && (
                    <p className="text-sm text-red-600 dark:text-red-500 col-span-3 col-start-2">
                      {codeError}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-subjectId" className="text-right">
                    Materia
                  </Label>
                  <Select
                    value={editingNrc.subjectId.toString()}
                    onValueChange={(value) =>
                      setEditingNrc((prev) =>
                        prev ? { ...prev, subjectId: Number(value) } : null
                      )
                    }
                    disabled={internalIsLoading || selectsLoading}
                  >
                    <SelectTrigger className="col-span-3 cursor-pointer">
                      <SelectValue placeholder="Seleccione una materia" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectsList.map((subject) => (
                        <SelectItem
                          key={subject.id}
                          value={subject.id.toString()}
                          className="cursor-pointer"
                        >
                          {subject.name} ({subject.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-professorId" className="text-right">
                    Profesor
                  </Label>
                  <Select
                    value={editingNrc.professorId}
                    onValueChange={(value) =>
                      setEditingNrc((prev) =>
                        prev ? { ...prev, professorId: value } : null
                      )
                    }
                    disabled={internalIsLoading || selectsLoading}
                  >
                    <SelectTrigger className="col-span-3 cursor-pointer">
                      <SelectValue placeholder="Seleccione un profesor" />
                    </SelectTrigger>
                    <SelectContent>
                      {professorsList.map((professor) => (
                        <SelectItem
                          key={professor.id}
                          value={professor.id.toString()}
                          className="cursor-pointer"
                        >
                          {getProfessorName(professor)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setError(null);
                    setEditingNrc(null);
                  }}
                  disabled={internalIsLoading}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  className="cursor-pointer bg-[var(--selected)] hover:bg-[var(--selected-hover)]"
                  type="submit"
                  disabled={internalIsLoading || selectsLoading}
                >
                  {internalIsLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              el NRC seleccionado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && !showLoader && (
            <p className="text-sm text-red-600 dark:text-red-500 p-4 -mt-2 -mb-2">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setError(null);
                setDeletingId(null);
              }}
              disabled={internalIsLoading}
              className="cursor-pointer"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              disabled={internalIsLoading}
            >
              {internalIsLoading ? "Eliminando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};