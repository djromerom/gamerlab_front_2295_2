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
import { useFetch } from "@/hooks/useFetch"; // <-- IMPORT YOUR HOOK (adjust path if needed)
// Define a standard structure for rows, assuming an 'id' field
export interface RowData extends Record<string, any> {
  id: number | string; // Assuming a standard 'id' field exists
}

interface UpdateMateriaPayload {
  name?: string;
  code?: string;
  semester?: number; // API expects number
}

// Define the expected full Materia object (likely already defined)
interface Materia {
  id: number | string;
  name: string;
  code: string;
  semester: number;
}

// Define the structure coming from the edit form state
interface MateriaFormData {
  name: string; // Assuming these are always strings from the form state
  code: string;
  semester: string;
}

interface CreateMateriaPayload {
  // Represents the data structure for the POST request
  name: string;
  code: string;
  semester: number; // API expects a number
}

interface Materia extends CreateMateriaPayload {
  // Represents the full object returned by API (includes ID)
  id: number | string;
}

export interface Data {
  titulo: string;
  nombreTabla: string; // This will be used as the endpoint path segment
  nombreColumnas: Record<string, string>; // e.g., { 'firstName': 'First Name', 'lastName': 'Last Name' }
  filas: RowData[]; // Use the RowData interface
  primaryKey?: string; // Optional: Explicitly define the primary key column name (defaults to 'id')
}

interface Props {
  data: Data;
  apiBaseUrl: string; // e.g., "http://localhost:3001/api"
}

export const Tabla: React.FC<Props> = ({ data, apiBaseUrl }) => {
  const customFetch = useFetch(); // <-- CALL THE HOOK HERE
  const [isSubmitting, setIsSubmitting] = useState(false); // Local state for loading indicator
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
  const [editFormData, setEditFormData] = useState<MateriaFormData | null>(
    null
  ); // State for edit form data

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
    setIsSubmitting(true); // Use isSubmitting if you have it, otherwise setIsLoading
    setError(null);

    // 1. Extract data from state (potential strings)
    const { name, code, semester: semesterStr } = newRow; // Destructure from your form state

    // 2. Validate required fields
    if (!name || !code || !semesterStr) {
      setError("Todos los campos (Nombre, Código, Semestre) son requeridos.");
      setIsSubmitting(false);
      return; // Stop execution
    }

    // 3. Convert and validate semester type
    const semesterAsNumber = parseInt(semesterStr, 10);
    if (isNaN(semesterAsNumber) || semesterAsNumber < 1) {
      setError("El semestre debe ser un número válido mayor o igual a 1.");
      setIsSubmitting(false);
      return; // Stop execution
    }

    // 4. Create the correctly typed payload object
    const dataToSend: CreateMateriaPayload = {
      name: name,
      code: code,
      semester: semesterAsNumber, // Use the converted number
    };

    try {
      // Use customFetch instead of fetch
      const response = await customFetch(getApiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // 5. Send the correctly typed and validated object
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        throw new Error(
          `Error ${response.status}: ${
            errorData.message || "Error al agregar la fila"
          }` // Use more specific message
        );
      }

      // Ensure the received row matches the expected full Materia type
      const addedRow: Materia = await response.json();

      // Update state (assuming allRows expects Materia objects)
      setAllRows((prevRows) => [addedRow, ...prevRows]); // Ensure prevRows also expects Materia[]
      setNewRow({}); // Reset form state
      setAddDialogOpen(false);
      console.log("Fila agregada con éxito:", addedRow);
    } catch (err: any) {
      console.error("Error al agregar fila:", err);
      setError(err.message || "Ocurrió un error desconocido al agregar.");
    } finally {
      setIsSubmitting(false); // Use isSubmitting if applicable
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
    const editFormData = { ...editingRow }; // Create a copy of the current row data// 1. Check if we have the necessary data in state
    if (!editFormData || !editingRow) {
      console.error("Edit attempt without necessary data.");
      setError("No se pueden guardar los cambios, falta información.");
      return;
    }

    setIsSubmitting(true); // Or setIsLoading(true)
    setError(null);

    const { name, code, semester: semesterStr } = editFormData;

    // 3. Validate required fields (from form data)
    if (!name || !code || !semesterStr) {
      setError("Todos los campos (Nombre, Código, Semestre) son requeridos.");
      setIsSubmitting(false);
      return;
    }

    // 4. Convert and validate semester type
    const semesterAsNumber = parseInt(semesterStr, 10);
    if (isNaN(semesterAsNumber) || semesterAsNumber < 1) {
      setError("El semestre debe ser un número válido mayor o igual a 1.");
      setIsSubmitting(false);
      return;
    }

    // 5. Create the correctly typed payload object for PATCH
    // Assuming the API accepts all fields for PATCH
    const dataToSend: UpdateMateriaPayload = {
      name: name,
      code: code,
      semester: semesterAsNumber, // Use the converted number
    };

    try {
      const idValue = editingRow[primaryKeyField]; // Get ID from the original row data

      const response = await customFetch(getApiUrl(idValue), {
        method: "PATCH", // Or PUT, depending on your API design
        headers: {
          "Content-Type": "application/json",
        },
        // 6. Send the correctly typed and validated object
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        throw new Error(
          `Error ${response.status}: ${
            errorData.message || "Error al actualizar la fila"
          }`
        );
      }

      // 7. Ensure the received row matches the expected full Materia type
      const updatedRow: RowData = await response.json();

      // 8. Update state (assuming allRows expects Materia objects)
      setAllRows((prevRows) =>
        prevRows.map((row) =>
          row[primaryKeyField] === updatedRow[primaryKeyField]
            ? updatedRow
            : row
        )
      );

      setEditDialogOpen(false);
      setEditingRow(null);
      setEditFormData(null);
      // setEditingIndex(-1); // No longer needed if updating by ID map

      console.log("Fila editada con éxito:", updatedRow);
    } catch (err: any) {
      console.error("Error al editar fila:", err);
      setError(err.message || "Ocurrió un error desconocido al guardar.");
      // Keep the dialog open on error, don't reset editFormData/editingRow
    } finally {
      setIsSubmitting(false); // Or setIsLoading(false)
    }
  };

  const handleOpenDelete = (index: number) => {
    // Calculate the actual index in the allRows array
    const actualIndex = (currentPage - 1) * rowsPerPage + index;
    setDeletingIndex(actualIndex);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    // ... (checks for deletingIndex, idToDelete) ...
    setIsLoading(true);
    setError(null);
    try {
      const idToDelete = allRows[deletingIndex]?.[primaryKeyField];
      const response = await customFetch(getApiUrl(idToDelete), {
        // <-- Use customFetch
        method: "DELETE",
        // No headers or body usually needed for DELETE
        // No need for Authorization or credentials here
      });

      if (!response.ok) {
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
          // Try to parse specific error message from backend
          const errorData = await response.json();
          errorMsg = `Error ${response.status}: ${
            errorData.message || response.statusText
          }`;
        } catch (jsonError) {
          /* Ignore if response not JSON */
        }
        throw new Error(errorMsg);
      }
      // ... (rest of success logic) ...
      const updatedAllRows = allRows.filter((_, i) => i !== deletingIndex);
      setAllRows(updatedAllRows);
      console.log("Fila eliminada con éxito (ID):", idToDelete);
      // ... (pagination adjustment logic) ...
    } catch (err: any) {
      console.error("Error al eliminar fila:", err);
      setError(err.message || "An unknown error occurred while deleting.");
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
