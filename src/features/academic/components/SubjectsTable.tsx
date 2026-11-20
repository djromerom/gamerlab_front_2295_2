"use client";

import { pageLabel } from "@/lib/pagination";
import { useState } from "react";
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

interface Subject {
  id: number;
  name: string;
  code: string;
  abrevName: string;
  semester: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SubjectFormData {
  name: string;
  code: string;
  abrevName: string;
  semester: string;
}

interface PaginationMetadata {
  totalItems: number;
  itemsOnCurrentPage: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

interface Props {
  subjects: Subject[] | null;
  pagination: PaginationMetadata;
  apiBaseUrl: string;
  isDataLoading?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  refreshData: () => void;
}

export const SubjectsTable: React.FC<Props> = ({
  subjects,
  pagination,
  apiBaseUrl,
  isDataLoading = false,
  onPageChange,
  onLimitChange,
  refreshData,
}) => {
  const customFetch = useFetch();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newSubject, setNewSubject] = useState<SubjectFormData>({
    name: "",
    code: "",
    abrevName: "",
    semester: "",
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showLoader = isDataLoading || internalIsLoading;

  const columns = [
    { key: "name", label: "Nombre" },
    { key: "code", label: "Código" },
    { key: "abrevName", label: "Abreviación"},
    { key: "semester", label: "Semestre" },
  ];

  // Función para validar el formato del código (3 letras mayúsculas + 4 números)
  const validateCodeFormat = (code: string): boolean => {
    const codeRegex = /^[A-Z]{3}\d{4}$/;
    return codeRegex.test(code);
  };

  const validateAbrevFormat = (abrevName: string): boolean => {
    const abrevNameRegex = /^[A-Z]{3}$/;
    return abrevNameRegex.test(abrevName);
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalIsLoading(true);
    setError(null);

    try {
      // Validaciones de campos requeridos
      if (!newSubject.name || !newSubject.code || !newSubject.abrevName || !newSubject.semester) {
        throw new Error("Todos los campos (Nombre, Código, Semestre) son requeridos.");
      }

      // Validación de formato del código
      if (!validateCodeFormat(newSubject.code)) {
        throw new Error("El código debe tener 3 letras mayúsculas seguidas de 4 números");
      }

      // Validación del formato de la abreviación
      if (!validateAbrevFormat(newSubject.abrevName)) {
        throw new Error("La abreviación debe tener 3 letras mayúsculas");
      }

      // Validación del semestre
      const semesterValue = parseInt(newSubject.semester, 10);
      if (isNaN(semesterValue)) {
        throw new Error("El semestre debe ser un número válido.");
      }
      if (semesterValue < 1 || semesterValue > 12) {
        throw new Error("El semestre debe ser un número entre 1 y 12");
      }

      const response = await customFetch(`${apiBaseUrl}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSubject.name,
          code: newSubject.code,
          abrevName: newSubject.abrevName,
          semester: semesterValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear la materia");
      }

      onPageChange(1);
      setNewSubject({ name: "", code: "", abrevName: "", semester: "" });
      setAddDialogOpen(false);
      refreshData();
      toast.success("Materia agregada exitosamente");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    setInternalIsLoading(true);
    setError(null);

    try {
      // Validaciones de campos requeridos
      if (!editingSubject.name || !editingSubject.code || !editingSubject.abrevName || !editingSubject.semester) {
        throw new Error("Todos los campos (Nombre, Código, Semestre) son requeridos.");
      }

      // Validación de formato del código
      if (!validateCodeFormat(editingSubject.code)) {
        throw new Error("El código debe tener 3 letras mayúsculas seguidas de 4 números");
      }

      // Validación del formato de la abreviación
      if (!validateAbrevFormat(editingSubject.abrevName)) {
        throw new Error("La abreviación debe tener 3 letras mayúsculas");
      }

      // Validación del semestre
      const semesterValue = parseInt(editingSubject.semester.toString(), 10);
      if (isNaN(semesterValue)) {
        throw new Error("El semestre debe ser un número válido.");
      }
      if (semesterValue < 1 || semesterValue > 12) {
        throw new Error("El semestre debe ser un número entre 1 y 12");
      }

      const response = await customFetch(
        `${apiBaseUrl}/subjects/${editingSubject.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editingSubject.name,
            code: editingSubject.code,
            abrevName: editingSubject.abrevName,
            semester: semesterValue,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar la materia");
      }

      refreshData();
      setEditDialogOpen(false);
      setEditingSubject(null);
      toast.success("Materia actualizada exitosamente");
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
        `${apiBaseUrl}/subjects/${deletingId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al desactivar la materia");
      }

      // Verificar si la página actual quedará vacía después de eliminar
      const willPageBeEmpty = subjects && subjects.length === 1;

      refreshData();
      setDeleteDialogOpen(false);
      setDeletingId(null);
      toast.success("Materia eliminada exitosamente");

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
      className={`md:bg-background text-foreground min-h-screen p-4 ${
        showLoader ? "opacity-75" : ""
      }`}
    >
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-xl font-medium">Materias</h1>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-card hover:bg-accent text-foreground cursor-pointer"
              disabled={!subjects || showLoader}
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Agregar Nueva Materia</DialogTitle>
                <DialogDescription>
                  Complete los datos de la nueva materia.
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
                {columns.map(({ key, label }) => (
                  <div
                    key={key}
                    className="grid grid-cols-4 items-center gap-4"
                  >
                    <Label htmlFor={`add-${key}`} className="text-right">
                      {label}
                    </Label>
                    <Input
                      id={`add-${key}`}
                      value={newSubject[key as keyof SubjectFormData] || ""}
                      onChange={(e) =>
                        setNewSubject((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      className="col-span-3"
                      required
                    />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  className="cursor-pointer"
                  variant="outline"
                  onClick={() => {
                    setAddDialogOpen(false);
                    setError(null);
                    setNewSubject({ name: "", code: "", abrevName: "", semester: "" });
                  }}
                  disabled={internalIsLoading}
                >
                  Cancelar
                </Button>
                <Button
                  className="cursor-pointer bg-[var(--selected)] hover:bg-[var(--selected-hover)]"
                  type="submit"
                  disabled={internalIsLoading}
                >
                  {internalIsLoading ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
            ) : subjects?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >
                  No hay materias disponibles.
                </TableCell>
              </TableRow>
            ) : (
              subjects
                ?.filter((subject) => subject.isActive)
                .map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell>{subject.name}</TableCell>
                    <TableCell>{subject.code}</TableCell>
                    <TableCell>{subject.abrevName}</TableCell>
                    <TableCell>{subject.semester}</TableCell>
                    <TableCell>
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
                              setEditingSubject(subject);
                              setEditDialogOpen(true);
                            }}
                            disabled={internalIsLoading}
                            className="cursor-pointer"
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setDeletingId(subject.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-500 focus:text-red-600 focus:bg-red-100 cursor-pointer"
                            disabled={internalIsLoading}
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
              disabled={showLoader || !subjects?.length}
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
                {pageLabel(pagination.currentPage, pagination.totalPages)}
              </span>
            </span>
            <div className="flex gap-1 shrink-0">
              <Button
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={
                  pagination.currentPage === 1 ||
                  showLoader ||
                  !subjects?.length
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
                  pagination.currentPage >= pagination.totalPages ||
                  pagination.totalPages === 0 ||
                  showLoader ||
                  !subjects?.length
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
          {editingSubject && (
            <form onSubmit={handleSaveEdit}>
              <DialogHeader>
                <DialogTitle>Editar Materia</DialogTitle>
                <DialogDescription>
                  Modifique los campos de la materia según sea necesario.
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
                {columns.map(({ key, label }) => (
                  <div
                    key={key}
                    className="grid grid-cols-4 items-center gap-4"
                  >
                    <Label htmlFor={`edit-${key}`} className="text-right">
                      {label}
                    </Label>
                    <Input
                      id={`edit-${key}`}
                      value={
                        editingSubject[key as keyof Subject]?.toString() || ""
                      }
                      onChange={(e) =>
                        setEditingSubject((prev) =>
                          prev ? { ...prev, [key]: e.target.value } : null
                        )
                      }
                      className="col-span-3"
                      required
                    />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setError(null);
                    setEditingSubject(null);
                  }}
                  disabled={internalIsLoading}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  className="cursor-pointer bg-[var(--selected)] hover:bg-[var(--selected-hover)]"
                  type="submit"
                  disabled={internalIsLoading}
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
              Esta acción marcará la materia como inactiva. Podrá reactivarla
              más tarde si es necesario.
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