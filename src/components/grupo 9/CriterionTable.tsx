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

// Re-using CriterionRowData from CriteriaPage for consistency
// If CriterionTable has its own specific view model, define it here
// For now, assume it matches CriterionRowData from the page
import { CriterionRowData } from "@/app/criteria/page"; // Adjust import path if needed

interface CriterionFormData {
  name: string;
  description: string;
  weight: string; // Keep as string for form input, parse on submit
}

interface CreateCriterionPayload {
  name: string;
  description?: string;
  weight?: number;
}

interface UpdateCriterionPayload {
  name?: string;
  description?: string;
  weight?: number;
}


interface Props {
  criteria: CriterionRowData[] | null; // This is now the paginated data
  apiBaseUrl: string;
  isDataLoading?: boolean;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rows: number) => void;
  totalPages: number;
  totalItems: number;
  onDataChange: () => void;
  onCriterionUpdate: (criterion: CriterionRowData) => void;
}

export const CriterionTable: React.FC<Props> = ({
  criteria,
  apiBaseUrl,
  isDataLoading = false,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setRowsPerPage,
  totalPages,
  totalItems,
  onDataChange,
  onCriterionUpdate,
}) => {
  const customFetch = useFetch();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newCriterion, setNewCriterion] = useState<CriterionFormData>({
    name: "",
    description: "",
    weight: "",
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<CriterionRowData | null>(null);
  // For edit form, we can directly modify a copy of editingCriterion or use a separate form state
  const [editFormData, setEditFormData] = useState<Partial<UpdateCriterionPayload>>({});

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showLoader = isDataLoading || internalIsLoading;

  const columns = [
    { key: "name", label: "Nombre" },
    { key: "description", label: "Descripción" },
    { key: "weight", label: "Peso (0-1)" },
  ];

  const API_RESOURCE_PATH = "/criteria"; // Define resource path

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalIsLoading(true);
    setError(null);

    let weightValue: number | undefined = undefined;
    if (newCriterion.weight !== "") {
      weightValue = parseFloat(newCriterion.weight);
      if (isNaN(weightValue) || weightValue < 0 || weightValue > 1) {
        setError("El peso debe ser un número válido entre 0 y 1 (inclusive).");
        setInternalIsLoading(false);
        return;
      }
    }

    const payload: CreateCriterionPayload = {
      name: newCriterion.name,
      description: newCriterion.description || undefined, // Send undefined if empty
      weight: weightValue,
    };

    try {
      const response = await customFetch(`${apiBaseUrl}${API_RESOURCE_PATH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: "Error al crear el criterio" }));
        throw new Error(errorBody.message || `Error ${response.status}`);
      }

      await response.json(); // Consume response
      setNewCriterion({ name: "", description: "", weight: "" });
      setAddDialogOpen(false);
      onDataChange(); // Trigger refetch in parent
    } catch (err: any) {
      setError(err.message || "Error al agregar el criterio");
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleOpenEdit = (criterion: CriterionRowData) => {
    setEditingCriterion(criterion);
    // Pre-fill edit form data
    setEditFormData({
      name: criterion.name,
      description: criterion.description || "",
      weight: criterion.weight !== undefined ? criterion.weight : undefined,
    });
    setEditDialogOpen(true);
    setError(null);
  };


  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCriterion) return;

    setInternalIsLoading(true);
    setError(null);

    let weightValue: number | undefined = undefined;
    if (editFormData.weight !== undefined && editFormData.weight !== null && editFormData.weight.toString().trim() !== "") {
      weightValue = parseFloat(editFormData.weight.toString());
      if (isNaN(weightValue) || weightValue < 0 || weightValue > 1) {
        setError("El peso debe ser un número válido entre 0 y 1 (inclusive).");
        setInternalIsLoading(false);
        return;
      }
    }


    const payload: UpdateCriterionPayload = {
      name: editFormData.name,
      description: editFormData.description || undefined,
      weight: weightValue,
    };


    try {
      const response = await customFetch(
        `${apiBaseUrl}${API_RESOURCE_PATH}/${editingCriterion.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: "Error al actualizar el criterio" }));
        throw new Error(errorBody.message || `Error ${response.status}`);
      }

      const updatedCriterionFromApi: CriterionRowData = await response.json();
      onCriterionUpdate(updatedCriterionFromApi); // Optimistic update in parent
      setEditDialogOpen(false);
      setEditingCriterion(null);
      setEditFormData({});
    } catch (err: any) {
      setError(err.message || "Error al actualizar el criterio");
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleOpenDelete = (criterionId: number) => {
    setDeletingId(criterionId);
    setDeleteDialogOpen(true);
    setError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setInternalIsLoading(true);
    setError(null);

    try {
      const response = await customFetch(
        `${apiBaseUrl}${API_RESOURCE_PATH}/${deletingId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: "Error al desactivar el criterio" }));
        throw new Error(errorBody.message || `Error ${response.status}`);
      }

      onDataChange(); // Trigger refetch in parent
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (err: any) {
      setError(err.message || "Error al desactivar el criterio");
    } finally {
      setInternalIsLoading(false);
    }
  };

  const displayCriteria = criteria || [];

  return (
    <div
      className={`bg-background text-foreground min-h-screen p-4 ${isDataLoading && !internalIsLoading ? "opacity-75" : ""
        }`}
    >
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-xl font-medium">Criterios de Evaluación</h1>
        <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) { setError(null); setNewCriterion({ name: "", description: "", weight: "" }); } }}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-card hover:bg-accent text-foreground"
              disabled={showLoader}
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar Criterio
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
              {error && !internalIsLoading && (
                <div className="px-6 py-2">
                  <p className="text-sm text-red-600 dark:text-red-500">
                    {error}
                  </p>
                </div>
              )}
              <div className="grid gap-4 py-4 px-6">
                {/* Name Field */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-name" className="text-right">Nombre</Label>
                  <Input id="add-name" value={newCriterion.name}
                    onChange={(e) => setNewCriterion(prev => ({ ...prev, name: e.target.value }))}
                    className="col-span-3" required disabled={internalIsLoading} />
                </div>
                {/* Description Field */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-description" className="text-right">Descripción</Label>
                  <Input id="add-description" value={newCriterion.description}
                    onChange={(e) => setNewCriterion(prev => ({ ...prev, description: e.target.value }))}
                    className="col-span-3" disabled={internalIsLoading} />
                </div>
                {/* Weight Field */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-weight" className="text-right">Peso (0-1)</Label>
                  <Input id="add-weight" type="number" step="0.01" min="0" max="1" value={newCriterion.weight}
                    onChange={(e) => setNewCriterion(prev => ({ ...prev, weight: e.target.value }))}
                    className="col-span-3" disabled={internalIsLoading} placeholder="Ej: 0.25" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline"
                  onClick={() => { setAddDialogOpen(false); setError(null); setNewCriterion({ name: "", description: "", weight: "" }); }}
                  disabled={internalIsLoading}>
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
                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Cargando...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayCriteria.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                  No hay criterios disponibles.
                </TableCell>
              </TableRow>
            ) : (
              displayCriteria.map((criterion) => (
                <TableRow key={criterion.id}>
                  <TableCell>{criterion.name}</TableCell>
                  <TableCell>{criterion.description || "-"}</TableCell>
                  <TableCell>{criterion.weight !== undefined ? criterion.weight?.toFixed(2) : "-"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={internalIsLoading || isDataLoading}>
                          <span className="sr-only">Abrir menú</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(criterion)} disabled={internalIsLoading || isDataLoading}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenDelete(criterion.id)}
                          className="text-red-500 focus:text-red-600 focus:bg-red-100"
                          disabled={internalIsLoading || isDataLoading}>
                          Eliminar (Desactivar)
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
              <Button onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || showLoader || totalItems === 0}
                variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0 || showLoader}
                variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) { setError(null); setEditingCriterion(null); setEditFormData({}); } }}>
        <DialogContent>
          {editingCriterion && (
            <form onSubmit={handleSaveEdit}>
              <DialogHeader>
                <DialogTitle>Editar Criterio</DialogTitle>
                <DialogDescription>
                  Modifique los campos del criterio según sea necesario.
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
                {/* Name Field */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">Nombre</Label>
                  <Input id="edit-name" value={editFormData.name || ""}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="col-span-3" required disabled={internalIsLoading} />
                </div>
                {/* Description Field */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-description" className="text-right">Descripción</Label>
                  <Input id="edit-description" value={editFormData.description || ""}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="col-span-3" disabled={internalIsLoading} />
                </div>
                {/* Weight Field */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-weight" className="text-right">Peso (0-1)</Label>
                  <Input id="edit-weight" type="number" step="0.01" min="0" max="1" value={editFormData.weight?.toString() || ""}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, weight: e.target.value === "" ? undefined : parseFloat(e.target.value) }))}
                    className="col-span-3" disabled={internalIsLoading} placeholder="Ej: 0.25" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline"
                  onClick={() => { setEditDialogOpen(false); setError(null); setEditingCriterion(null); setEditFormData({}); }}
                  disabled={internalIsLoading}>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setError(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará el criterio como inactivo (soft delete).
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && !internalIsLoading && (
            <p className="text-sm text-red-600 dark:text-red-500 p-4 -mt-2 -mb-2">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteDialogOpen(false); setError(null); setDeletingId(null); }} disabled={internalIsLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-destructive-foreground"
              disabled={internalIsLoading}>
              {internalIsLoading ? "Desactivando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
