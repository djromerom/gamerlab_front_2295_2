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
import { toast } from "sonner"; // Importamos toast de sonner
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

interface Criterion {
  id: number;
  name: string;
  description?: string;
  weight?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CriterionFormData {
  name: string;
  description: string;
  weight: string;
}

interface Props {
  criteria: Criterion[] | null;
  apiBaseUrl: string;
  isDataLoading?: boolean;
}

export const CriterionTable: React.FC<Props> = ({
  criteria,
  apiBaseUrl,
  isDataLoading = false,
}) => {
  const customFetch = useFetch();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [allCriteria, setAllCriteria] = useState<Criterion[]>(criteria || []);
  const [currentRows, setCurrentRows] = useState<Criterion[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newCriterion, setNewCriterion] = useState<CriterionFormData>({
    name: "",
    description: "",
    weight: "",
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [internalIsLoading, setInternalIsLoading] = useState(false);

  const showLoader = isDataLoading || internalIsLoading;
  const totalPages = Math.ceil(allCriteria.length / rowsPerPage);

  // Función para mostrar errores como toast
  const showError = (errorMessage: string) => {
    toast.error(errorMessage);
  };

  const columns = [
    { key: "name", label: "Nombre" },
    { key: "description", label: "Descripción" },
    { key: "weight", label: "Peso" },
  ];

  // Efecto para actualizar los datos cuando cambia la prop criteria
  useEffect(() => {
    if (criteria && criteria !== allCriteria) {
      setAllCriteria(criteria);
    }
    if (criteria === null && allCriteria.length > 0) {
      setAllCriteria([]);
    }
  }, [criteria]);

  // Efecto para paginación
  useEffect(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    setCurrentRows(allCriteria.slice(start, end));

    // Ajustar página si es necesario
    const currentTotalPages = Math.ceil(allCriteria.length / rowsPerPage);
    if (currentPage > currentTotalPages && currentTotalPages > 0) {
      setCurrentPage(currentTotalPages);
    } else if (currentPage < 1 && currentTotalPages > 0) {
      setCurrentPage(1);
    } else if (allCriteria.length === 0) {
      setCurrentPage(1);
    }
  }, [currentPage, rowsPerPage, allCriteria]);

  // Función para crear un nuevo criterio
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalIsLoading(true);

    try {
      if (newCriterion.weight === "" || isNaN(parseFloat(newCriterion.weight))) {
        throw new Error("El peso debe ser un número válido");
      }
  
      const weightValue = parseFloat(newCriterion.weight);
      if (weightValue < 0 || weightValue > 1) {
        throw new Error("El peso debe estar entre 0 y 1");
      }

      const response = await customFetch(`${apiBaseUrl}/criteria`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCriterion.name,
          description: newCriterion.description,
          weight: weightValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear el criterio");
      }

      const createdCriterion: Criterion = await response.json();
      setAllCriteria((prev) => [createdCriterion, ...prev]);
      setNewCriterion({ name: "", description: "", weight: "" });
      setAddDialogOpen(false);
      toast.success("Criterio agregado exitosamente");
    } catch (err: any) {
      showError(err.message || "Error al agregar el criterio");
    } finally {
      setInternalIsLoading(false);
    }
  };

  // Función para actualizar un criterio
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCriterion) return;

    setInternalIsLoading(true);

    try {
      if (
        editingCriterion.weight === undefined ||
        isNaN(parseFloat(editingCriterion.weight?.toString() || ""))
      ) {
        throw new Error("El peso debe ser un número válido");
      }

      const weightValue = parseFloat(
        editingCriterion.weight?.toString() || "0"
      );
      
      if (weightValue < 0 || weightValue > 1) {
        throw new Error("El peso debe estar entre 0 y 1");
      }

      const response = await customFetch(
        `${apiBaseUrl}/criteria/${editingCriterion.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editingCriterion.name,
            description: editingCriterion.description,
            weight: weightValue,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el criterio");
      }

      const updatedCriterion: Criterion = await response.json();
      setAllCriteria((prev) =>
        prev.map((c) => (c.id === updatedCriterion.id ? updatedCriterion : c))
      );
      setEditDialogOpen(false);
      setEditingCriterion(null);
      toast.success("Criterio actualizado exitosamente");
    } catch (err: any) {
      showError(err.message || "Error al actualizar el criterio");
    } finally {
      setInternalIsLoading(false);
    }
  };

  // Función para eliminar (soft delete) un criterio
  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    setInternalIsLoading(true);

    try {
      // 1. Enviar solicitud de soft delete al backend
      const response = await customFetch(
        `${apiBaseUrl}/criteria/${deletingId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al desactivar el criterio");
      }

      // 2. Actualizar el estado local para reflejar el cambio
      setAllCriteria(
        (prevCriteria) =>
          prevCriteria?.map((criterion) =>
            criterion.id === deletingId
              ? { ...criterion, isActive: false } // Marcar como inactivo
              : criterion
          ) || []
      );

      setDeleteDialogOpen(false);
      setDeletingId(null);
      toast.success("Criterio eliminado exitosamente");
    } catch (err: any) {
      showError(err.message || "Error al desactivar el criterio");
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
        <h1 className="text-xl font-medium">Criterios de Evaluación</h1>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-card hover:bg-accent text-foreground cursor-pointer"
              disabled={!criteria || showLoader}
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Criterio</DialogTitle>
                <DialogDescription>
                  Complete los datos del nuevo criterio de evaluación.
                </DialogDescription>
              </DialogHeader>
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
                      value={newCriterion[key as keyof CriterionFormData] || ""}
                      onChange={(e) =>
                        setNewCriterion((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      className="col-span-3"
                      required={key !== "description"}
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
                    setNewCriterion({ name: "", description: "", weight: "" });
                  }}
                  disabled={internalIsLoading}
                >
                  Cancelar
                </Button>
                <Button className="cursor-pointer bg-[var(--selected)] hover:bg-[var(--selected-hover)]" type="submit" disabled={internalIsLoading}>
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
            ) : allCriteria.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >
                  No hay criterios disponibles.
                </TableCell>
              </TableRow>
            ) : (
              currentRows
                .filter((criterion) => criterion.isActive)
                .map((criterion) => (
                  <TableRow key={criterion.id}>
                    <TableCell>{criterion.name}</TableCell>
                    <TableCell>{criterion.description || "-"}</TableCell>
                    <TableCell>{criterion.weight || "0"}</TableCell>
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
                              setEditingCriterion(criterion);
                              setEditDialogOpen(true);
                            }}
                            disabled={internalIsLoading}
                            className="cursor-pointer"
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setDeletingId(criterion.id);
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
              disabled={showLoader || allCriteria.length === 0}
            >
              <SelectTrigger className="w-[70px] cursor-pointer">
                <SelectValue placeholder={rowsPerPage} />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 15, 20].map((n) => (
                  <SelectItem className="cursor-pointer" key={n} value={n.toString()}>
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
                  currentPage === 1 || showLoader || allCriteria.length === 0
                }
                variant="outline"
                size="icon"
                className="cursor-pointer"
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
                className="cursor-pointer"
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
          {editingCriterion && (
            <form onSubmit={handleSaveEdit}>
              <DialogHeader>
                <DialogTitle>Editar Criterio</DialogTitle>
                <DialogDescription>
                  Modifique los campos del criterio según sea necesario.
                </DialogDescription>
              </DialogHeader>
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
                        editingCriterion[key as keyof Criterion]?.toString() ||
                        ""
                      }
                      onChange={(e) =>
                        setEditingCriterion((prev) =>
                          prev ? { ...prev, [key]: e.target.value } : null
                        )
                      }
                      className="col-span-3"
                      required={key !== "description"}
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
                    setEditingCriterion(null);
                  }}
                  disabled={internalIsLoading}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button className="cursor-pointer bg-[var(--selected)] hover:bg-[var(--selected-hover)]" type="submit" disabled={internalIsLoading}>
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
              Esta acción marcará el criterio como inactivo. Podrá reactivarlo
              más tarde si es necesario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
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
