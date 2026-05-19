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
import { ProfessorRowData } from "@/pages/grupo 9/professorsPage"; // Adjust path as needed

interface ProfessorFormData {
  firstName: string;
  lastName: string;
  email: string;
}

interface PaginationMetadata {
  totalItems: number;
  itemsOnCurrentPage: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

interface Props {
  professors: ProfessorRowData[] | null; // Now receives only the current page's data
  paginationMeta: PaginationMetadata; // Receives pagination metadata from parent
  apiBaseUrl: string;
  isDataLoading?: boolean; // For the table to show a loader when parent is fetching
  onPageChange: (page: number) => void; // Callback to parent
  onLimitChange: (limit: number) => void; // Callback to parent
  refreshData: () => void; // Callback to parent
}

export const ProfessorsTable: React.FC<Props> = ({
  professors,
  paginationMeta,
  apiBaseUrl,
  isDataLoading = false,
  onPageChange,
  onLimitChange,
  refreshData,
}) => {
  const customFetch = useFetch();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newProfessor, setNewProfessor] = useState<ProfessorFormData>({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] =
    useState<ProfessorRowData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [internalIsLoading, setInternalIsLoading] = useState(false); // For CRUD operations

  // isDataLoading from props indicates parent is fetching (e.g., new page)
  // internalIsLoading is for this component's own async operations (add, edit, delete)
  const showLoader = isDataLoading || internalIsLoading;

  const showError = (errorMessage: string) => {
    toast.error(errorMessage);
  };

  const columnsToDisplay = [
    {
      key: "fullName",
      label: "Nombre",
      renderCell: (professor: ProfessorRowData) =>
        `${professor.firstName} ${professor.lastName}`,
    },
    {
      key: "email",
      label: "Email",
      renderCell: (professor: ProfessorRowData) => professor.email,
    },
    {
      key: "confirmationStatusId",
      label: "Estado de Confirmación",
      renderCell: (professor: ProfessorRowData) => {
        switch (professor.confirmationStatusId) {
          case 1:
            return "CONFIRMADO";
          case 2:
            return "PENDIENTE";
          case 3:
            return "EXPIRADO";
          default:
            return professor.confirmationStatusId?.toString() || "DESCONOCIDO";
        }
      },
    },
  ];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalIsLoading(true);

    try {
      if (!newProfessor.email.includes("@")) {
        throw new Error("El email debe ser válido.");
      }
      if (!newProfessor.firstName.trim()) {
        throw new Error("El campo Nombres es requerido.");
      }
      if (!newProfessor.lastName.trim()) {
        throw new Error("El campo Apellidos es requerido.");
      }

      const response = await customFetch(`${apiBaseUrl}/professors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newProfessor.firstName,
          lastName: newProfessor.lastName,
          email: newProfessor.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error al crear el profesor." }));
        throw new Error(errorData.message || "Error al crear el profesor.");
      }

      // const createdProfessor: ProfessorRowData = await response.json(); // Not strictly needed to update local state here
      setNewProfessor({ firstName: "", lastName: "", email: "" });
      setAddDialogOpen(false);
      toast.success("Profesor agregado exitosamente.");
      onPageChange(1); // Go to first page to see the new professor, or just refresh
      refreshData(); // Tell parent to refetch data
    } catch (err: any) {
      showError(err.message || "Error al agregar el profesor.");
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfessor) return;

    setInternalIsLoading(true);

    try {
      if (!editingProfessor.firstName.trim()) {
        throw new Error("El campo Nombres es requerido.");
      }
      if (!editingProfessor.lastName.trim()) {
        throw new Error("El campo Apellidos es requerido.");
      }
      // Email is typically not editable after creation or handled differently
      // For now, only first and last name are editable as per your original code.

      const response = await customFetch(
        `${apiBaseUrl}/professors/${editingProfessor.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: editingProfessor.firstName,
            lastName: editingProfessor.lastName,
            // email: editingProfessor.email, // If email is editable
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error al actualizar el profesor." }));
        throw new Error(
          errorData.message || "Error al actualizar el profesor."
        );
      }

      // const updatedProfessor: ProfessorRowData = await response.json(); // Not strictly needed here
      setEditDialogOpen(false);
      setEditingProfessor(null);
      toast.success("Profesor actualizado exitosamente.");
      refreshData(); // Tell parent to refetch data
    } catch (err: any) {
      showError(err.message || "Error al actualizar el profesor.");
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setInternalIsLoading(true);
    try {
      const response = await customFetch(
        `${apiBaseUrl}/professors/${deletingId}`, // This should be a DELETE or a PATCH to an /inactive endpoint
        {
          method: "DELETE", // Assuming hard delete, or PATCH for soft delete
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error al eliminar el profesor." }));
        throw new Error(errorData.message || "Error al eliminar el profesor.");
      }

      setDeleteDialogOpen(false);
      setDeletingId(null);
      toast.success("Profesor eliminado exitosamente.");
      refreshData(); // Tell parent to refetch, which handles page adjustment if needed
    } catch (err: any) {
      showError(err.message || "Error al eliminar el profesor.");
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleResendEmail = async (professorEmail: string) => {
    setInternalIsLoading(true);
    try {
      const response = await customFetch(
        `${apiBaseUrl}/auth/resend-confirmation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: professorEmail }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al reenviar el correo");
      }
      toast.success("Correo reenviado exitosamente");
      refreshData(); // Actualizar los datos si es necesario
    } catch (err: any) {
      showError(err.message || "Error al reenviar el correo de confirmación");
    } finally {
      setInternalIsLoading(false);
    }
  };

  return (
    <div
      className={`bg-background text-foreground min-h-screen p-4 ${
        showLoader ? "opacity-75 pointer-events-none" : "" // Added pointer-events-none
      }`}
    >
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-xl font-medium">Profesores</h1>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-card hover:bg-accent text-foreground cursor-pointer"
              disabled={showLoader} // Disable if any loading is happening
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar
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
              <div className="grid gap-4 py-4 px-6">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-firstName" className="text-right">
                    Nombres
                  </Label>
                  <Input
                    id="add-firstName"
                    value={newProfessor.firstName}
                    onChange={(e) =>
                      setNewProfessor((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    className="col-span-3"
                    required
                    disabled={internalIsLoading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-lastName" className="text-right">
                    Apellidos
                  </Label>
                  <Input
                    id="add-lastName"
                    value={newProfessor.lastName}
                    onChange={(e) =>
                      setNewProfessor((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    className="col-span-3"
                    required
                    disabled={internalIsLoading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="add-email"
                    type="email"
                    value={newProfessor.email}
                    onChange={(e) =>
                      setNewProfessor((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="col-span-3"
                    required
                    disabled={internalIsLoading}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  className="cursor-pointer"
                  variant="outline"
                  onClick={() => {
                    setAddDialogOpen(false);
                    setNewProfessor({ firstName: "", lastName: "", email: "" });
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
                  {internalIsLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
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
              {columnsToDisplay.map(({ key, label }) => (
                <TableHead key={key}>{label}</TableHead>
              ))}
              <TableHead className="w-[50px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showLoader && (!professors || professors.length === 0) ? ( // Show loader if loading and no rows yet for current page
              <TableRow>
                <TableCell
                  colSpan={columnsToDisplay.length + 1}
                  className="h-24 text-center"
                >
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Cargando...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : !showLoader && (!professors || professors.length === 0) ? ( // No data and not loading
              <TableRow>
                <TableCell
                  colSpan={columnsToDisplay.length + 1}
                  className="h-24 text-center"
                >
                  No hay profesores para mostrar en esta página.
                </TableCell>
              </TableRow>
            ) : (
              professors?.map(
                (
                  professor // Render rows if professors array is not null/empty
                ) => (
                  <TableRow key={professor.id}>
                    {columnsToDisplay.map(({ key, renderCell }) => (
                      <TableCell key={key}>{renderCell(professor)}</TableCell>
                    ))}
                    <TableCell className="text-right">
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
                              setEditingProfessor(professor);
                              setEditDialogOpen(true);
                            }}
                            disabled={internalIsLoading}
                            className="cursor-pointer"
                          >
                            Editar
                          </DropdownMenuItem>
                          {professor.confirmationStatusId === 2 && ( // Solo mostrar si el estado es PENDIENTE
                            <DropdownMenuItem
                              onClick={() => handleResendEmail(professor.email)}
                              disabled={internalIsLoading}
                              className="cursor-pointer text-blue-600 focus:text-blue-700 focus:bg-blue-50"
                            >
                              Reenviar correo
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setDeletingId(professor.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-500 focus:text-red-600 focus:bg-red-100 cursor-pointer"
                            disabled={internalIsLoading}
                          >
                            {professor.isActive
                              ? "Desactivar"
                              : "Eliminar Def."}{" "}
                            {/* Or just "Eliminar" */}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              )
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls - Driven by paginationMeta from props */}
        {paginationMeta && paginationMeta.totalItems > 0 && (
          <div className="flex justify-between items-center p-4 text-sm border-t border-border">
            <div className="flex items-center gap-2">
              <span>Filas por página</span>
              <Select
                value={paginationMeta.itemsPerPage.toString()}
                onValueChange={(value) => {
                  onLimitChange(parseInt(value, 10));
                }}
                disabled={showLoader}
              >
                <SelectTrigger className="w-[70px] cursor-pointer">
                  <SelectValue placeholder={paginationMeta.itemsPerPage} />
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
            <div className="flex items-center gap-4">
              <span>
                Página{" "}
                {paginationMeta.totalPages > 0 ? paginationMeta.currentPage : 0}{" "}
                de {paginationMeta.totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  onClick={() => onPageChange(paginationMeta.currentPage - 1)}
                  disabled={paginationMeta.currentPage === 1 || showLoader}
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => onPageChange(paginationMeta.currentPage + 1)}
                  disabled={
                    paginationMeta.currentPage === paginationMeta.totalPages ||
                    paginationMeta.totalPages === 0 ||
                    showLoader
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
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          {editingProfessor && (
            <form onSubmit={handleSaveEdit}>
              <DialogHeader>
                <DialogTitle>Editar Profesor</DialogTitle>
                <DialogDescription>
                  Modifique los datos del profesor. El email no se puede editar.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 px-6">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-firstName" className="text-right">
                    Nombres
                  </Label>
                  <Input
                    id="edit-firstName"
                    value={editingProfessor.firstName || ""}
                    onChange={(e) =>
                      setEditingProfessor((prev) =>
                        prev ? { ...prev, firstName: e.target.value } : null
                      )
                    }
                    className="col-span-3"
                    required
                    disabled={internalIsLoading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-lastName" className="text-right">
                    Apellidos
                  </Label>
                  <Input
                    id="edit-lastName"
                    value={editingProfessor.lastName || ""}
                    onChange={(e) =>
                      setEditingProfessor((prev) =>
                        prev ? { ...prev, lastName: e.target.value } : null
                      )
                    }
                    className="col-span-3"
                    required
                    disabled={internalIsLoading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingProfessor.email || ""}
                    className="col-span-3"
                    disabled // Email is typically not editable
                    readOnly
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setEditingProfessor(null);
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
                  {internalIsLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {internalIsLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete/Deactivate Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará (o desactivará) al profesor. Confirme para
              proceder.
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
              {internalIsLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {internalIsLoading ? "Procesando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
