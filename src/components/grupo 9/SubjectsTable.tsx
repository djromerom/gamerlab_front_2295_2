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

// --- Interfaces (RowData, Payloads, Materia, Data) sin cambios ---
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

export interface Data {
  titulo: string;
  nombreTabla: string;
  nombreColumnas: Record<string, string>;
  filas: RowData[];
  primaryKey?: string;
}

interface Props {
  data: Data | null;
  apiBaseUrl: string;
  isDataLoading?: boolean;
}

export const SubjectsTable: React.FC<Props> = ({
  data,
  apiBaseUrl,
  isDataLoading = false,
}) => {
  const customFetch = useFetch();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  // Inicializa allRows con data?.filas o un array vacío si data es null
  const [allRows, setAllRows] = useState<RowData[]>(data?.filas || []);
  const [currentRows, setCurrentRows] = useState<RowData[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newRow, setNewRow] = useState<Record<string, any>>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<RowData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number>(-1);
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Combina el estado de carga inicial (prop) y el estado de carga interno (CRUD)
  const showLoader = isDataLoading || internalIsLoading;

  // Usa data?.primaryKey o 'id' como fallback de forma segura
  const primaryKeyField = data?.primaryKey || "id";

  // Obtén las columnas de forma segura, devuelve array vacío si data es null
  const columnEntries = data ? Object.entries(data.nombreColumnas) : [];
  const displayColumnKeys = columnEntries
    .filter(([key]) => key !== primaryKeyField)
    .map(([key]) => key);
  const columnNames = data?.nombreColumnas || {};

  const totalPages = Math.ceil(allRows.length / rowsPerPage);

  // Función para mostrar errores como toast
  const showError = (errorMessage: string) => {
    toast.error(errorMessage);
    setError(errorMessage);
  };

  // Función para mostrar mensajes de éxito como toast
  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const getApiUrl = (id?: number | string) => {
    // Asegúrate que data y data.nombreTabla existen antes de usarlos
    if (!data?.nombreTabla) return ""; // O maneja el error como prefieras
    let url = `${apiBaseUrl}/${data.nombreTabla}`;
    if (id !== undefined) {
      url += `/${id}`;
    }
    return url;
  };

  // Effect para actualizar allRows cuando la prop `data` cambie (después de la carga inicial)
  useEffect(() => {
    // Solo actualiza si data existe y data.filas es diferente de allRows (evita bucles)
    // Comprobación simple por referencia o longitud puede ser suficiente aquí
    if (data?.filas && data.filas !== allRows) {
      setAllRows(data.filas);
      // Resetea la página a 1 si los datos cambian completamente (opcional)
      // setCurrentPage(1);
    }
    // Si data se vuelve null (quizás por un error en el padre), limpia las filas
    if (data === null && allRows.length > 0) {
      setAllRows([]);
    }
  }, [data]); // Depende de la prop data

  // Effect para paginación (sin cambios, ya depende de allRows)
  useEffect(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    // Asegura que allRows exista antes de rebanar
    setCurrentRows(allRows ? allRows.slice(start, end) : []);

    // Ajusta la página actual si es necesario (sin cambios)
    const currentTotalPages = Math.ceil((allRows?.length || 0) / rowsPerPage);
    if (currentPage > currentTotalPages && currentTotalPages > 0) {
      setCurrentPage(currentTotalPages);
    } else if (currentPage < 1 && currentTotalPages > 0) {
      setCurrentPage(1);
    } else if (allRows?.length === 0) {
      setCurrentPage(1);
    }
  }, [currentPage, rowsPerPage, allRows]); // Depende de allRows

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalIsLoading(true);
    setError(null);
    
    const apiUrl = getApiUrl();
    if (!apiUrl) {
      showError("Configuración de tabla inválida.");
      setInternalIsLoading(false);
      return;
    }

    const { name, code, semester: semesterStr } = newRow;
    if (!name || !code || !semesterStr) {
      showError("Todos los campos (Nombre, Código, Semestre) son requeridos.");
      setInternalIsLoading(false);
      return;
    }
    const semesterAsNumber = parseInt(semesterStr, 10);
    if (isNaN(semesterAsNumber) || semesterAsNumber < 1) {
      showError("El semestre debe ser un número válido mayor o igual a 1.");
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
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear la materia");
      }
      const addedRow: RowData = await response.json();
      setAllRows((prevRows) => [addedRow, ...(prevRows || [])]);
      setNewRow({});
      setAddDialogOpen(false);
      showSuccess("Materia agregada exitosamente");
    } catch (err: any) {
      showError(err.message || "Error al agregar la materia.");
      console.error("Error en handleAdd:", err);
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) {
      return;
    }
    setInternalIsLoading(true);
    setError(null);

    const idValue = editingRow[primaryKeyField];
    const apiUrl = getApiUrl(idValue);
    if (!apiUrl || idValue === undefined) {
      showError("No se puede actualizar la fila (falta ID o configuración).");
      setInternalIsLoading(false);
      return;
    }

    const { name, code, semester: semesterStr } = editingRow;
    if (
      !name ||
      !code ||
      semesterStr === undefined ||
      semesterStr === null ||
      semesterStr === ""
    ) {
      showError("Todos los campos (Nombre, Código, Semestre) son requeridos.");
      setInternalIsLoading(false);
      return;
    }
    const semesterAsNumber = parseInt(String(semesterStr), 10);
    if (isNaN(semesterAsNumber) || semesterAsNumber < 1) {
      showError("El semestre debe ser un número válido mayor o igual a 1.");
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
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar la materia");
      }
      const updatedRowFromApi: RowData = await response.json();
      setAllRows((prevRows) =>
        (prevRows || []).map(
          (row) => (row[primaryKeyField] === idValue ? updatedRowFromApi : row)
        )
      );
      setEditDialogOpen(false);
      setEditingRow(null);
      showSuccess("Materia actualizada exitosamente");
    } catch (err: any) {
      showError(err.message || "Error al guardar cambios.");
      console.error("Error en handleSaveEdit:", err);
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingIndex < 0 || !allRows || deletingIndex >= allRows.length) {
      showError("Índice inválido para eliminar.");
      setDeleteDialogOpen(false);
      return;
    }

    const idToDelete = allRows[deletingIndex]?.[primaryKeyField];
    console.log(idToDelete);
    const apiUrl = getApiUrl(idToDelete);

    if (!apiUrl || idToDelete === undefined) {
      showError("No se puede eliminar la fila (falta ID o configuración).");
      setDeleteDialogOpen(false);
      setDeletingIndex(-1);
      return;
    }

    setInternalIsLoading(true);
    setError(null);

    let deleteSuccess = false;
    try {
      const response = await customFetch(apiUrl, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al eliminar la materia");
      }

      setAllRows((prevRows) =>
        (prevRows || []).filter((_, i) => i !== deletingIndex)
      );
      deleteSuccess = true;
      console.log("Fila eliminada (ID):", idToDelete);
      
      const newTotalRows = (allRows?.length || 1) - 1;
      const newTotalPages = Math.ceil(newTotalRows / rowsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      } else if (newTotalRows === 0) {
        setCurrentPage(1);
      }
      
      showSuccess("Materia eliminada exitosamente");
    } catch (err: any) {
      showError(err.message || "Error al eliminar la materia.");
      console.error("Error en handleConfirmDelete:", err);
    } finally {
      setInternalIsLoading(false);
      if (deleteSuccess) {
        setDeleteDialogOpen(false);
        setDeletingIndex(-1);
      }
    }
  };

  const handleOpenEdit = (row: RowData) => {
    setEditingRow({ ...row });
    setEditDialogOpen(true);
    setError(null);
  };

  const handleOpenDelete = (index: number) => {
    const actualIndex = (currentPage - 1) * rowsPerPage + index;
    setDeletingIndex(actualIndex);
    setDeleteDialogOpen(true);
    setError(null);
  };

  return (
    <div
      className={`bg-background text-foreground min-h-screen p-4 ${
        showLoader ? "opacity-75" : ""
      }`}
    >
      {/* Encabezado (Título y Botón Agregar) */}
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-xl font-medium">
          {data?.titulo || "Cargando Título..."}
        </h1>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-card hover:bg-accent text-foreground cursor-pointer"
              disabled={!data || showLoader}
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar
            </Button>
          </DialogTrigger>
          <DialogContent>
            {data && (
              <form onSubmit={handleAdd}>
                <DialogHeader>
                  <DialogTitle>
                    Agregar Nueva Materia
                  </DialogTitle>
                  <DialogDescription>
                    Ingrese los datos de la nueva fila.
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
                  {columnEntries
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
                          disabled={internalIsLoading}
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
                      setNewRow({});
                    }}
                    disabled={internalIsLoading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="cursor-pointer" disabled={internalIsLoading}>
                    {internalIsLoading ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Card de la Tabla */}
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
            {showLoader ? (
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
            ) : allRows && allRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={displayColumnKeys.length + 1}
                  className="h-24 text-center"
                >
                  No hay resultados.
                </TableCell>
              </TableRow>
            ) : (
              currentRows.map((row, index) => (
                <TableRow key={row[primaryKeyField] ?? index}>
                  {displayColumnKeys.map((key) => (
                    <TableCell key={key}>{row[key]}</TableCell>
                  ))}
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
                          onClick={() => handleOpenEdit(row)}
                          disabled={internalIsLoading}
                          className="cursor-pointer"
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDelete(index)}
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

        {/* Controles de Paginación */}
        <div className="flex justify-between items-center p-4 text-sm border-t border-border">
          <div className="flex items-center gap-2">
            <span>Filas por página</span>
            <Select
              value={rowsPerPage.toString()}
              onValueChange={(value) => {
                setRowsPerPage(parseInt(value, 10));
                setCurrentPage(1);
              }}
              disabled={showLoader || !allRows || allRows.length === 0}
            >
              <SelectTrigger className="w-[70px] cursor-pointer">
                <SelectValue placeholder={rowsPerPage} />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 15, 20].map((n) => (
                  <SelectItem key={n} value={n.toString()} className="cursor-pointer">
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
                className="cursor-pointer"
                disabled={
                  currentPage === 1 ||
                  showLoader ||
                  !allRows ||
                  allRows.length === 0
                }
                variant="outline"
                size="icon"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                className="cursor-pointer"
                disabled={
                  currentPage === totalPages ||
                  totalPages === 0 ||
                  showLoader ||
                  !allRows ||
                  allRows.length === 0
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

      {/* Dialog Editar */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          {editingRow && data && (
            <form onSubmit={handleSaveEdit}>
              <DialogHeader>
                <DialogTitle>Editar fila</DialogTitle>
                <DialogDescription>
                  Modifique los campos según sea necesario.
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
                        value={editingRow[key] || ""}
                        onChange={(e) =>
                          setEditingRow((prev) =>
                            prev ? { ...prev, [key]: e.target.value } : null
                          )
                        }
                        className="col-span-3"
                        required
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
                  }}
                  disabled={internalIsLoading}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={internalIsLoading} className="cursor-pointer">
                  {internalIsLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              la fila seleccionada.
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
                setDeletingIndex(-1);
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
              {internalIsLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
