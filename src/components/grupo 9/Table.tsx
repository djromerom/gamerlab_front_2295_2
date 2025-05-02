// TablaGenerica.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreVertical, Plus } from "lucide-react";
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
// Define a standard structure for rows, assuming an 'id' field
export interface RowData extends Record<string, any> {
  id: number | string; // Assuming a standard 'id' field exists
}

export interface Data {
  titulo: string;
  nombreTabla: string; // This will be used as the endpoint path segment
  nombreColumnas: Record<string, string>; // e.g., { 'firstName': 'First Name', 'lastName': 'Last Name' }
  filas: RowData[]; // Use the RowData interface
  primaryKey?: string; // Optional: Explicitly define the primary key column name (defaults to 'id')
}

interface CustomColumnConfig {
  [columna: string]: {
    tipo: "select" | "input";
    opciones?: { label: string; value: any }[]; // solo si es select
  };
}

interface Props {
  data: Data;
  apiBaseUrl: string; // e.g., "http://localhost:3001/api"
  columnasPersonalizadas?: CustomColumnConfig;
}

export const Tabla: React.FC<Props> = ({
  data,
  apiBaseUrl,
  columnasPersonalizadas,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [allRows, setAllRows] = useState<RowData[]>(data.filas); // Use RowData[]
  const [currentRows, setCurrentRows] = useState<RowData[]>([]); // Use RowData[]
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newRow, setNewRow] = useState<Record<string, any>>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<RowData | null>(null); // Use RowData | null
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(false); // Optional: Loading state
  const [error, setError] = useState<string | null>(null); // Optional: Error state

  const totalPages = Math.ceil(allRows.length / rowsPerPage);
  const primaryKeyField = data.primaryKey || "id"; // Default to 'id' if not provided

  // Helper function to construct API URLs
  const getApiUrl = (id?: number | string) => {
    let url = `${apiBaseUrl}/${data.nombreTabla}`;
    if (id !== undefined) {
      url += `/${id}`;
    }
    return url;
  };

  useEffect(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    setCurrentRows(allRows.slice(start, end));
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1 && totalPages > 0) {
      setCurrentPage(1); // Ensure current page is at least 1
    } else if (allRows.length === 0) {
      setCurrentPage(1); // Reset to page 1 if no rows
    }
  }, [currentPage, rowsPerPage, allRows, totalPages]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(getApiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRow),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        throw new Error(
          `Error ${response.status}: ${
            errorData.message || "Failed to add row"
          }`
        );
      }

      const addedRow: RowData = await response.json(); // Expect the backend to return the full row with ID
      setAllRows([addedRow, ...allRows]); // Add to the beginning
      setNewRow({});
      setAddDialogOpen(false);
      console.log("Fila agregada con éxito:", addedRow);
    } catch (err: any) {
      console.error("Error al agregar fila:", err);
      setError(err.message || "An unknown error occurred while adding.");
      // Optionally show error to user
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEdit = (row: RowData, index: number) => {
    setEditingRow({ ...row }); // Create a copy
    // Calculate the actual index in the allRows array
    const actualIndex = (currentPage - 1) * rowsPerPage + index;
    setEditingIndex(actualIndex);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow || editingIndex === -1) return;

    const idValue = editingRow[primaryKeyField];
    if (idValue === undefined) {
      console.error("Error: Primary key value is missing...");
      setError("Cannot save edit: Missing ID.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl(idValue), {
        // method: 'PUT', // <--- CHANGE THIS LINE
        method: "PATCH", // <--- TO THIS LINE
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingRow), // Send the whole row for PATCH in this case
      });

      // ... rest of the function remains the same ...

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        throw new Error(
          `Error ${response.status}: ${
            errorData.message || "Failed to update row"
          }`
        );
      }

      const updatedRow: RowData = await response.json();
      const updatedAllRows = [...allRows];
      updatedAllRows[editingIndex] = updatedRow;
      setAllRows(updatedAllRows);
      setEditDialogOpen(false);
      setEditingRow(null);
      setEditingIndex(-1);
      console.log("Fila editada con éxito:", updatedRow);
    } catch (err: any) {
      console.error("Error al editar fila:", err);
      setError(err.message || "An unknown error occurred while saving.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDelete = (index: number) => {
    // Calculate the actual index in the allRows array
    const actualIndex = (currentPage - 1) * rowsPerPage + index;
    setDeletingIndex(actualIndex);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingIndex === -1) return;

    const rowToDelete = allRows[deletingIndex];
    const idToDelete = rowToDelete?.[primaryKeyField];

    if (idToDelete === undefined) {
      console.error(
        "Error: No se encontró el ID de la fila a eliminar en el índice:",
        deletingIndex
      );
      setError("Cannot delete row: Missing ID.");
      setDeleteDialogOpen(false);
      setDeletingIndex(-1);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl(idToDelete), {
        method: "DELETE",
      });

      if (!response.ok) {
        // Handle potential JSON error response from backend
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMsg = `Error ${response.status}: ${
            errorData.message || response.statusText
          }`;
        } catch (jsonError) {
          // If response is not JSON or empty, use status text
        }
        throw new Error(errorMsg);
      }

      // Successfully deleted on the backend, now update frontend state
      const updatedAllRows = allRows.filter((_, i) => i !== deletingIndex);
      setAllRows(updatedAllRows);

      console.log("Fila eliminada con éxito (ID):", idToDelete);

      // Adjust current page if the last item on the page was deleted
      const newTotalPages = Math.ceil(updatedAllRows.length / rowsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      } else if (
        updatedAllRows.length > 0 &&
        currentRows.length === 1 &&
        currentPage > 1
      ) {
        // If it was the *last* remaining item on the current page (and not page 1)
        setCurrentPage(currentPage - 1);
      }
    } catch (err: any) {
      console.error("Error al eliminar fila:", err);
      setError(err.message || "An unknown error occurred while deleting.");
      // Optionally show error to user
    } finally {
      setDeleteDialogOpen(false);
      setDeletingIndex(-1);
      setIsLoading(false);
    }
  };

  // Effect to update rows if the initial data prop changes
  useEffect(() => {
    setAllRows(data.filas);
  }, [data.filas]);

  // Helper to get column keys excluding the primary key
  const displayColumnKeys = Object.keys(data.nombreColumnas).filter(
    (key) => key !== primaryKeyField
  );

  return (
    <div className="bg-background text-foreground min-h-screen p-4">
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-xl font-medium">{data.titulo}</h1>

        {/* Add Row Dialog */}
        {/* Add Row Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-card hover:bg-accent text-foreground"
              disabled={isLoading}
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Agregar {data.nombreTabla}</DialogTitle>
                <DialogDescription>
                  Ingrese los datos de la nueva fila.
                </DialogDescription>
              </DialogHeader>

              {/* MOVED ERROR DISPLAY HERE - Outside the fields grid */}
              {error && (
                <div className="px-6 py-2">
                  {" "}
                  {/* Add padding for spacing */}
                  <p className="text-sm text-red-600 dark:text-red-500">
                    {error}
                  </p>{" "}
                  {/* Removed col-span */}
                </div>
              )}

              {/* Fields Grid - Now only contains form rows */}
              <div className="grid gap-4 py-4 px-6">
                {" "}
                {/* Add padding */}
                {/* Filter out the primary key from the form */}
                {Object.entries(data.nombreColumnas)
                  .filter(([key]) => key !== primaryKeyField)
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
                        disabled={isLoading}
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
                  }}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Optional: Display a general loading indicator or error */}
      {/* {isLoading && <p className="text-center p-4">Loading...</p>} */}
      {/* {error && !addDialogOpen && !editDialogOpen && <p className="text-red-500 text-center p-4">Error: {error}</p>} */}

      {/* Table Card */}
      <Card className="rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-card border-b border-border">
            <TableRow>
              {/* Map over displayColumnKeys for headers */}
              {displayColumnKeys.map((key) => (
                <TableHead key={key}>{data.nombreColumnas[key]}</TableHead>
              ))}
              <TableHead className="w-[50px]" /> {/* Actions column */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRows.map((row, index) => (
              <TableRow key={row[primaryKeyField] ?? index}>
                {" "}
                {/* Use primary key for React key if available */}
                {/* Map over displayColumnKeys for cells */}
                {displayColumnKeys.map((key) => (
                  <TableCell key={key}>{row[key]}</TableCell>
                ))}
                <TableCell>
                  {/* Row Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        disabled={isLoading}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleOpenEdit(row, index)}
                        disabled={isLoading}
                      >
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenDelete(index)}
                        className="text-red-500 focus:text-red-600 focus:bg-red-100" // Adjusted styling
                        disabled={isLoading}
                      >
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {/* Display message if no rows */}
            {allRows.length === 0 && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={displayColumnKeys.length + 1}
                  className="h-24 text-center"
                >
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center p-4 text-sm border-t border-border">
          <div className="flex items-center gap-2">
            <span>Filas por página</span>
            <Select
              value={rowsPerPage.toString()}
              onValueChange={(value) => {
                setRowsPerPage(parseInt(value, 10));
                setCurrentPage(1); // Reset to first page on changing rows per page
              }}
              disabled={isLoading}
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
              Página {currentPage} de {totalPages || 1}
            </span>
            <div className="flex gap-1">
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                variant="outline"
                size="icon"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={
                  currentPage === totalPages || totalPages === 0 || isLoading
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

      {/* Edit Row Dialog */}
      {/* Edit Row Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          {/* Check if editingRow exists before rendering the form */}
          {editingRow && (
            <form onSubmit={handleSaveEdit}>
              <DialogHeader>
                <DialogTitle>Editar fila</DialogTitle>
                <DialogDescription>
                  Modifique los campos según sea necesario.
                </DialogDescription>
              </DialogHeader>

              {/* MOVED ERROR DISPLAY HERE - Outside the fields grid */}
              {error && (
                <div className="px-6 py-2">
                  {" "}
                  {/* Add padding for spacing */}
                  <p className="text-sm text-red-600 dark:text-red-500">
                    {error}
                  </p>{" "}
                  {/* Removed col-span */}
                </div>
              )}

              {/* Fields Grid - Now only contains form rows */}
              <div className="grid gap-4 py-4 px-6">
                {" "}
                {/* Add padding if needed */}
                {/* Filter out primary key from edit form */}
                {Object.entries(data.nombreColumnas)
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
                        value={editingRow[key] || ""}
                        onChange={(e) =>
                          setEditingRow((prev) =>
                            prev ? { ...prev, [key]: e.target.value } : null
                          )
                        }
                        className="col-span-3"
                        required
                        disabled={isLoading}
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
                  }}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              la fila seleccionada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {/* Display error message */}
          {error && <p className="text-red-500 text-sm ">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setError(null); // Clear error on cancel
              }}
              disabled={isLoading}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-destructive-foreground" // Use theme colors if available
              disabled={isLoading}
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
