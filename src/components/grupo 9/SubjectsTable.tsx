// TablaGenerica.tsx (imported as SubjectsTable)
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

// This RowData is specific to this table's needs, primarily for the 'id'
export interface RowData extends Record<string, any> {
  id: number | string;
}

interface UpdateMateriaPayload {
  name?: string;
  code?: string;
  semester?: number;
}

interface CreateMateriaPayload {
  name: string;
  code: string;
  semester: number;
}

// This is the structure of the 'data' prop passed to THIS table component
export interface Data {
  titulo: string;
  nombreTabla: string;
  nombreColumnas: Record<string, string>;
  filas: RowData[]; // These are the rows for the current page
  primaryKey?: string;
}

interface Props {
  data: Data | null;
  apiBaseUrl: string;
  isDataLoading?: boolean; // From parent, for initial load or page change
  currentPage: number;
  setCurrentPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (size: number) => void;
  totalPages: number;
  totalItems: number;
  onDataChange: () => void; // Callback to parent to refetch data (for C/D)
  onRowUpdate: (updatedRow: RowData) => void; // Callback to parent for optimistic update (for U)
}

export const SubjectsTable: React.FC<Props> = ({
  data,
  apiBaseUrl,
  isDataLoading = false,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setRowsPerPage,
  totalPages,
  totalItems,
  onDataChange,
  onRowUpdate,
}) => {
  const customFetch = useFetch();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newRow, setNewRow] = useState<Record<string, any>>({}); // For add form
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<RowData | null>(null); // For pre-filling edit form
  const [editFormData, setEditFormData] = useState<Partial<UpdateMateriaPayload>>({}); // For edit form changes
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRowId, setDeletingRowId] = useState<number | string | null>(null);
  const [internalIsLoading, setInternalIsLoading] = useState(false); // For C/U/D operations within this component
  const [error, setError] = useState<string | null>(null);

  const showLoader = isDataLoading || internalIsLoading; // Combined loader state

  const primaryKeyField = data?.primaryKey || "id";
  const columnEntries = data ? Object.entries(data.nombreColumnas) : [];
  const displayColumnKeys = columnEntries
    .filter(([key]) => key !== primaryKeyField) // Exclude primary key from display columns
    .map(([key]) => key);
  const columnNames = data?.nombreColumnas || {};

  const getApiUrl = (id?: number | string) => {
    if (!data?.nombreTabla) return "";
    let url = `${apiBaseUrl}/${data.nombreTabla}`;
    if (id !== undefined) {
      url += `/${id}`;
    }
    return url;
  };

  // No local 'allRows' or 'currentRows' state needed as 'data.filas' comes paginated from parent.
  // No useEffect for client-side pagination needed.

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalIsLoading(true);
    setError(null);
    const apiUrl = getApiUrl();
    if (!apiUrl || !data?.nombreTabla) {
      setError("Configuración de tabla inválida.");
      setInternalIsLoading(false);
      return;
    }

    const { name, code, semester: semesterStr } = newRow;
    if (!name || !code || !semesterStr) {
      setError("Todos los campos (Nombre, Código, Semestre) son requeridos.");
      setInternalIsLoading(false);
      return;
    }
    const semesterAsNumber = parseInt(semesterStr, 10);
    if (isNaN(semesterAsNumber) || semesterAsNumber < 1) {
      setError("El semestre debe ser un número válido mayor o igual a 1.");
      setInternalIsLoading(false);
      return;
    }
    const dataToSend: CreateMateriaPayload = {
      name,
      code,
      semester: semesterAsNumber,
    };

    try {
      const response = await customFetch(apiUrl, {
        body: JSON.stringify(dataToSend),
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Error ${response.status}` }));
        throw new Error(errorData.message || "Error al agregar la materia.");
      }
      // await response.json(); // Consume if needed, but we refetch
      setNewRow({});
      setAddDialogOpen(false);
      onDataChange(); // Notify parent to refetch data
    } catch (err: any) {
      setError(err.message || "Error al agregar.");
      console.error("Error en handleAdd:", err);
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleOpenEdit = (row: RowData) => {
    setEditingRow(row); // Store the original row for its ID
    setEditFormData({ // Set form data for editing
      name: row.name,
      code: row.code,
      semester: row.semester,
    });
    setEditDialogOpen(true);
    setError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow || !editFormData) return;
    setInternalIsLoading(true);
    setError(null);

    const idValue = editingRow[primaryKeyField];
    const apiUrl = getApiUrl(idValue);
    if (!apiUrl || idValue === undefined) {
      setError("No se puede actualizar la fila (falta ID o configuración).");
      setInternalIsLoading(false);
      return;
    }

    const { name, code, semester: semesterStr } = editFormData;
    if (!name || !code || semesterStr === undefined || semesterStr === null || String(semesterStr).trim() === "") {
      setError("Todos los campos (Nombre, Código, Semestre) son requeridos.");
      setInternalIsLoading(false);
      return;
    }
    const semesterAsNumber = parseInt(String(semesterStr), 10);
    if (isNaN(semesterAsNumber) || semesterAsNumber < 1) {
      setError("El semestre debe ser un número válido mayor o igual a 1.");
      setInternalIsLoading(false);
      return;
    }
    const dataToSend: UpdateMateriaPayload = {
      name,
      code,
      semester: semesterAsNumber,
    };

    try {
      const response = await customFetch(apiUrl, {
        body: JSON.stringify(dataToSend),
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Error ${response.status}` }));
        throw new Error(errorData.message || "Error al guardar los cambios.");
      }
      const updatedRowFromApi: RowData = await response.json();
      onRowUpdate(updatedRowFromApi); // Notify parent for optimistic update
      setEditDialogOpen(false);
      setEditingRow(null);
      setEditFormData({});
    } catch (err: any) {
      setError(err.message || "Error al guardar cambios.");
      console.error("Error en handleSaveEdit:", err);
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleOpenDelete = (row: RowData) => {
    setDeletingRowId(row[primaryKeyField]);
    setDeleteDialogOpen(true);
    setError(null);
  };

  const handleConfirmDelete = async () => {
    if (deletingRowId === null) return;
    setInternalIsLoading(true);
    setError(null);

    const apiUrl = getApiUrl(deletingRowId);
    if (!apiUrl) {
      setError("Configuración inválida para eliminar.");
      setInternalIsLoading(false);
      setDeleteDialogOpen(false);
      return;
    }
    let deleteSuccess = false;
    try {
      const response = await customFetch(apiUrl, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Error ${response.status}` }));
        throw new Error(errorData.message || "Error al eliminar la materia.");
      }
      deleteSuccess = true;
      onDataChange(); // Notify parent to refetch data
    } catch (err: any) {
      setError(err.message || "Error al eliminar.");
      console.error("Error en handleConfirmDelete:", err);
    } finally {
      setInternalIsLoading(false);
      if (deleteSuccess) {
        setDeleteDialogOpen(false);
        setDeletingRowId(null);
      }
    }
  };

  const displayRows = data?.filas || [];


  return (
    <div
      className={`bg-background text-foreground min-h-screen p-4 ${showLoader && !internalIsLoading ? "opacity-75" : "" // Opacity for parent loading
        }`}
    >
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-xl font-medium">
          {data?.titulo || (isDataLoading ? "Cargando Título..." : "Tabla")}
        </h1>
        <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) setError(null); }}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-card hover:bg-accent text-foreground"
              disabled={showLoader || !data}
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar
            </Button>
          </DialogTrigger>
          <DialogContent>
            {data && (
              <form onSubmit={handleAdd}>
                <DialogHeader>
                  <DialogTitle>
                    Agregar {data?.nombreTabla || "Item"}
                  </DialogTitle>
                  <DialogDescription>
                    Ingrese los datos de la nueva fila.
                  </DialogDescription>
                </DialogHeader>
                {error && !internalIsLoading && (addDialogOpen) && (
                  <div className="px-6 py-2">
                    <p className="text-sm text-red-600 dark:text-red-500">
                      {error}
                    </p>
                  </div>
                )}
                <div className="grid gap-4 py-4 px-6">
                  {columnEntries
                    .filter(([key]) => key !== primaryKeyField) // Don't create input for primary key
                    .map(([key, label]) => (
                      <div
                        key={key}
                        className="grid grid-cols-4 items-center gap-4"
                      >
                        <Label htmlFor={`add-${key}`} className="text-right">
                          {label}
                        </Label>
                        <Input
                          id={`add-${key}`}
                          value={newRow[key] || ""}
                          onChange={(e) =>
                            setNewRow((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          className="col-span-3"
                          required
                          type={key === "semester" ? "number" : "text"}
                          disabled={internalIsLoading}
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
                      setNewRow({});
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
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-card border-b border-border">
            <TableRow>
              {displayColumnKeys.map((key) => (
                <TableHead key={key}>{columnNames[key] || key}</TableHead>
              ))}
              <TableHead className="w-[50px]" /> {/* Actions */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isDataLoading && !internalIsLoading ? ( // Show main loader from parent
              <TableRow>
                <TableCell
                  colSpan={displayColumnKeys.length + 1}
                  className="h-24 text-center"
                >
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Cargando...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={displayColumnKeys.length + 1}
                  className="h-24 text-center"
                >
                  {totalItems > 0 ? "No hay resultados en esta página." : "No hay resultados."}
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map((row) => ( // data.filas are the current page's rows
                <TableRow key={row[primaryKeyField] ?? Math.random()}> {/* Fallback key if id is somehow missing */}
                  {displayColumnKeys.map((key) => (
                    <TableCell key={key}>{row[key]}</TableCell>
                  ))}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          disabled={showLoader} // Disable if parent is loading OR internal CUD is happening
                        >
                          <span className="sr-only">Abrir menú</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleOpenEdit(row)}
                          disabled={showLoader}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDelete(row)}
                          className="text-red-500 focus:text-red-600 focus:bg-red-100"
                          disabled={showLoader}
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
              onValueChange={(value) => setRowsPerPage(parseInt(value, 10))}
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
              Página {totalPages > 0 ? currentPage : 0} de {totalPages || 0}
            </span>
            <div className="flex gap-1">
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || showLoader || totalItems === 0}
                variant="outline"
                size="icon"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0 || showLoader || totalItems === 0}
                variant="outline"
                size="icon"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setError(null); }}>
        <DialogContent>
          {editingRow && data && (
            <form onSubmit={handleSaveEdit}>
              <DialogHeader>
                <DialogTitle>Editar {data.nombreTabla || "Item"}</DialogTitle>
                <DialogDescription>
                  Modifique los campos según sea necesario.
                </DialogDescription>
              </DialogHeader>
              {error && !internalIsLoading && (editDialogOpen) && (
                <div className="px-6 py-2">
                  <p className="text-sm text-red-600 dark:text-red-500">
                    {error}
                  </p>
                </div>
              )}
              <div className="grid gap-4 py-4 px-6">
                {columnEntries
                  .filter(([key]) => key !== primaryKeyField)
                  .map(([key, label]) => (
                    <div
                      key={key}
                      className="grid grid-cols-4 items-center gap-4"
                    >
                      <Label htmlFor={`edit-${key}`} className="text-right">
                        {label}
                      </Label>
                      <Input
                        id={`edit-${key}`}
                        value={editFormData[key as keyof UpdateMateriaPayload] || ""}
                        onChange={(e) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        className="col-span-3"
                        required
                        type={key === "semester" ? "number" : "text"}
                        disabled={internalIsLoading}
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
                    setEditingRow(null);
                    setEditFormData({});
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setError(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              la fila seleccionada.
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
                setDeletingRowId(null);
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
              {internalIsLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
