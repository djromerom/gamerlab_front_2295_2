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
  id: string; // UUID
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProfessorFormData {
  name: string;
  email: string;
}

interface Props {
  professors: Professor[] | null;
  apiBaseUrl: string;
  isDataLoading?: boolean;
}

export const ProfessorsTable: React.FC<Props> = ({
  professors,
  apiBaseUrl,
  isDataLoading = false,
}) => {
  const customFetch = useFetch();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [allProfessors, setAllProfessors] = useState<Professor[]>(
    professors || []
  );
  const [currentRows, setCurrentRows] = useState<Professor[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newProfessor, setNewProfessor] = useState<ProfessorFormData>({
    name: "",
    email: "",
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showLoader = isDataLoading || internalIsLoading;
  const totalPages = Math.ceil(allProfessors.length / rowsPerPage);

  const columns = [
    { key: "name", label: "Nombre" },
    { key: "email", label: "Email" },
  ];

  // Efecto para actualizar los datos cuando cambia la prop professors
  useEffect(() => {
    if (professors && professors !== allProfessors) {
      setAllProfessors(professors);
    }
    if (professors === null && allProfessors.length > 0) {
      setAllProfessors([]);
    }
  }, [professors]);

  // Efecto para paginación
  useEffect(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    setCurrentRows(allProfessors.slice(start, end));

    // Ajustar página si es necesario
    const currentTotalPages = Math.ceil(allProfessors.length / rowsPerPage);
    if (currentPage > currentTotalPages && currentTotalPages > 0) {
      setCurrentPage(currentTotalPages);
    } else if (currentPage < 1 && currentTotalPages > 0) {
      setCurrentPage(1);
    } else if (allProfessors.length === 0) {
      setCurrentPage(1);
    }
  }, [currentPage, rowsPerPage, allProfessors]);

  // Función para crear un nuevo profesor
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalIsLoading(true);
    setError(null);

    try {
      // Validación básica del email
      if (!newProfessor.email.includes("@")) {
        throw new Error("El email debe ser válido");
      }

      const response = await customFetch(`${apiBaseUrl}/professors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProfessor.name,
          email: newProfessor.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear el profesor");
      }

      const createdProfessor: Professor = await response.json();
      setAllProfessors((prev) => [createdProfessor, ...prev]);
      setNewProfessor({ name: "", email: "" });
      setAddDialogOpen(false);
    } catch (err: any) {
      setError(err.message || "Error al agregar el profesor");
    } finally {
      setInternalIsLoading(false);
    }
  };

  // Función para actualizar un profesor
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfessor) return;

    setInternalIsLoading(true);
    setError(null);

    try {
      // Validación básica del email
      if (!editingProfessor.email.includes("@")) {
        throw new Error("El email debe ser válido");
      }

      const response = await customFetch(
        `${apiBaseUrl}/professors/${editingProfessor.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editingProfessor.name,
            email: editingProfessor.email,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el profesor");
      }

      const updatedProfessor: Professor = await response.json();
      setAllProfessors((prev) =>
        prev.map((p) => (p.id === updatedProfessor.id ? updatedProfessor : p))
      );
      setEditDialogOpen(false);
      setEditingProfessor(null);
    } catch (err: any) {
      setError(err.message || "Error al actualizar el profesor");
    } finally {
      setInternalIsLoading(false);
    }
  };

  // Función para eliminar (soft delete) un profesor
  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    setInternalIsLoading(true);
    setError(null);

    try {
      const response = await customFetch(
        `${apiBaseUrl}/professors/${deletingId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al desactivar el profesor");
      }

      // Actualizar el estado local para reflejar el cambio
      setAllProfessors(
        (prevProfessors) =>
          prevProfessors?.map((professor) =>
            professor.id === deletingId
              ? { ...professor, isActive: false }
              : professor
          ) || []
      );

      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (err: any) {
      setError(err.message || "Error al desactivar el profesor");
    } finally {
      setInternalIsLoading(false);
    }
  };

  return (
    <div
      className={`bg-background text-foreground min-h-screen p-4 ${
        showLoader ? "opacity-75" : ""
      }`}
    >
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-xl font-medium">Profesores</h1>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-card hover:bg-accent text-foreground"
              disabled={!professors || showLoader}
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar Profesor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Profesor</DialogTitle>
                <DialogDescription>
                  Complete los datos del nuevo profesor.
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
                      value={newProfessor[key as keyof ProfessorFormData] || ""}
                      onChange={(e) =>
                        setNewProfessor((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      className="col-span-3"
                      required
                      type={key === "email" ? "email" : "text"}
                    />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAddDialogOpen(false);
                    setError(null);
                    setNewProfessor({ name: "", email: "" });
                  }}
                  disabled={internalIsLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={internalIsLoading}>
                  {internalIsLoading ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla */}
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
            ) : allProfessors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >
                  No hay profesores disponibles.
                </TableCell>
              </TableRow>
            ) : (
              currentRows
                .filter((professor) => professor.isActive)
                .map((professor) => (
                  <TableRow key={professor.id}>
                    <TableCell>{professor.name}</TableCell>
                    <TableCell>{professor.email}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            disabled={internalIsLoading}
                          >
                            <span className="sr-only">Abrir menú</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingProfessor(professor);
                              setEditDialogOpen(true);
                            }}
                            disabled={internalIsLoading}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setDeletingId(professor.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-500 focus:text-red-600 focus:bg-red-100"
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

        {/* Paginación */}
        <div className="flex justify-between items-center p-4 text-sm border-t border-border">
          <div className="flex items-center gap-2">
            <span>Filas por página</span>
            <Select
              value={rowsPerPage.toString()}
              onValueChange={(value) => {
                setRowsPerPage(parseInt(value, 10));
                setCurrentPage(1);
              }}
              disabled={showLoader || allProfessors.length === 0}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder={rowsPerPage} />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 15, 20].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <span>
              Página {totalPages > 0 ? currentPage : 0} de {totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={
                  currentPage === 1 || showLoader || allProfessors.length === 0
                }
                variant="outline"
                size="icon"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={
                  currentPage === totalPages || totalPages === 0 || showLoader
                }
                variant="outline"
                size="icon"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Diálogo de Edición */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          {editingProfessor && (
            <form onSubmit={handleSaveEdit}>
              <DialogHeader>
                <DialogTitle>Editar Profesor</DialogTitle>
                <DialogDescription>
                  Modifique los campos del profesor según sea necesario.
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
                        editingProfessor[key as keyof Professor]?.toString() ||
                        ""
                      }
                      onChange={(e) =>
                        setEditingProfessor((prev) =>
                          prev ? { ...prev, [key]: e.target.value } : null
                        )
                      }
                      className="col-span-3"
                      required
                      type={key === "email" ? "email" : "text"}
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
                    setEditingProfessor(null);
                  }}
                  disabled={internalIsLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={internalIsLoading}>
                  {internalIsLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará al profesor. Podrá reactivarlo más tarde
              si es necesario.
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
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-destructive-foreground"
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
