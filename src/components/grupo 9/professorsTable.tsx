"use client";

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
import { ProfessorRowData } from "@/pages/grupo 9/professorsPage";

interface ProfessorFormData {
  name: string;
  email: string;
}

interface Props {
  professors: ProfessorRowData[] | null;
  apiBaseUrl: string;
  isDataLoading?: boolean;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rows: number) => void;
  totalPages: number;
  totalItems: number;
  onDataChange: () => void;
  onProfessorUpdate: (professor: ProfessorRowData) => void;
}

export const ProfessorsTable: React.FC<Props> = ({
  professors,
  apiBaseUrl,
  isDataLoading = false,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setRowsPerPage,
  totalPages,
  totalItems,
  onDataChange,
  onProfessorUpdate,
}) => {
  const customFetch = useFetch();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newProfessor, setNewProfessor] = useState<ProfessorFormData>({
    name: "",
    email: "",
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] =
    useState<ProfessorRowData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showLoader = isDataLoading || internalIsLoading;

  const columns = [
    { key: "name", label: "Nombre" },
    { key: "email", label: "Email" },
    {
      key: "confirmationStatusId",
      label: "Estado de Confirmación",
      render: (value: number) => {
        switch (value) {
          case 1:
            return "CONFIRMADO";
          case 2:
            return "PENDIENTE";
          case 3:
            return "EXPIRADO";
          default:
            return "DESCONOCIDO";
        }
      },
    },
  ];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalIsLoading(true);
    setError(null);

    try {
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

      await response.json();
      setNewProfessor({ name: "", email: "" });
      setAddDialogOpen(false);
      onDataChange();
    } catch (err: any) {
      setError(err.message || "Error al agregar el profesor");
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfessor) return;

    setInternalIsLoading(true);
    setError(null);

    try {
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

      const updatedProfessor: ProfessorRowData = await response.json();
      onProfessorUpdate(updatedProfessor);
      setEditDialogOpen(false);
      setEditingProfessor(null);
    } catch (err: any) {
      setError(err.message || "Error al actualizar el profesor");
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
        `${apiBaseUrl}/professors/${deletingId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al desactivar el profesor");
      }

      onDataChange();
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (err: any) {
      setError(err.message || "Error al desactivar el profesor");
    } finally {
      setInternalIsLoading(false);
    }
  };

  const displayProfessors = professors || [];

  return (
    <div
      className={`bg-background text-foreground min-h-screen p-4 ${showLoader && !internalIsLoading ? "opacity-75" : ""
        }`}
    >
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-xl font-medium">Profesores</h1>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-card hover:bg-accent text-foreground"
              disabled={showLoader}
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
              {error && !internalIsLoading && (
                <div className="px-6 py-2">
                  <p className="text-sm text-red-600 dark:text-red-500">
                    {error}
                  </p>
                </div>
              )}
              <div className="grid gap-4 py-4 px-6">
                {columns
                  .filter((c) => c.key !== "confirmationStatusId")
                  .map(({ key, label }) => (
                    <div
                      key={key}
                      className="grid grid-cols-4 items-center gap-4"
                    >
                      <Label htmlFor={`add-${key}`} className="text-right">
                        {label}
                      </Label>
                      <Input
                        id={`add-${key}`}
                        value={
                          newProfessor[key as keyof ProfessorFormData] || ""
                        }
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
            {isDataLoading && !internalIsLoading ? (
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
            ) : displayProfessors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >
                  No hay profesores disponibles.
                </TableCell>
              </TableRow>
            ) : (
              displayProfessors.map((professor) => (
                <TableRow key={professor.id}>
                  {columns.map(({ key, render }) => (
                    <TableCell key={key}>
                      {render
                        ? render(
                          professor[key as keyof ProfessorRowData] as number
                        )
                        : professor[
                          key as keyof ProfessorRowData
                        ]?.toString()}
                    </TableCell>
                  ))}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          disabled={internalIsLoading || isDataLoading}
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
                            setError(null);
                          }}
                          disabled={internalIsLoading || isDataLoading}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setDeletingId(professor.id);
                            setDeleteDialogOpen(true);
                            setError(null);
                          }}
                          className="text-red-500 focus:text-red-600 focus:bg-red-100"
                          disabled={internalIsLoading || isDataLoading}
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

        <div className="flex justify-between items-center p-4 text-sm border-t border-border">
          <div className="flex items-center gap-2">
            <span>Filas por página</span>
            <Select
              value={rowsPerPage.toString()}
              onValueChange={(value) => {
                setRowsPerPage(parseInt(value, 10));
              }}
              disabled={showLoader || totalItems === 0}
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
                  currentPage === 1 || showLoader || totalItems === 0
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
              {error && !internalIsLoading && (
                <div className="px-6 py-2">
                  <p className="text-sm text-red-600 dark:text-red-500">
                    {error}
                  </p>
                </div>
              )}
              <div className="grid gap-4 py-4 px-6">
                {columns
                  .filter((c) => c.key === "name")
                  .map(({ key, label }) => (
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
                          editingProfessor[
                            key as keyof ProfessorRowData
                          ]?.toString() || ""
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
                {/* Email field for editing, assuming it's also editable */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="edit-email"
                    value={editingProfessor.email || ""}
                    onChange={(e) =>
                      setEditingProfessor((prev) =>
                        prev ? { ...prev, email: e.target.value } : null
                      )
                    }
                    className="col-span-3"
                    required
                    type="email"
                  />
                </div>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará al profesor. No podrá deshacer esta acción directamente aquí.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && !internalIsLoading && (
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
