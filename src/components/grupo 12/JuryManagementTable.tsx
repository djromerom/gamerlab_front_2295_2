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
import { RowData, Props, Jurado } from "./utils"; // Adjust path if needed

export const JuryManagementTable: React.FC<Props> = ({
  data,

  totalPages,
  page,
  limit,
  isLoading = false,
  setIsLoading,
  onPageChange,
  onLimitChange,
  apiBaseUrl,
  onRefresh,
}) => {
  // console.log("data", data);
  // <-- Recibe isLoading
  const customFetch = useFetch();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newRow, setNewRow] = useState<Record<string, any>>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<RowData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number>(-1);
  const [internalIsLoading, setInternalIsLoading] = useState(false); // <-- Renombrado para claridad
  const [error, setError] = useState<string | null>(null);

  // Combina el estado de carga inicial (prop) y el estado de carga interno (CRUD)
  const showLoader = isLoading || internalIsLoading;
  // Usa data?.primaryKey o 'id' como fallback de forma segura
  const primaryKeyField = data?.primaryKey || "id";

  // Obtén las columnas de forma segura, devuelve array vacío si data es null
  const columnEntries = data ? Object.entries(data.nombreColumnas) : [];
  const displayColumnKeys = columnEntries
    .filter(([key]) => key !== primaryKeyField)
    .map(([key]) => key);
  const columnNames = data?.nombreColumnas || {};

  const getApiUrl = (id?: number | string) => {
    // Asegúrate que data y data.nombreTabla existen antes de usarlos
    if (!data?.nombreTabla) return ""; // O maneja el error como prefieras
    let url = `${apiBaseUrl}/${data.nombreTabla}`;
    if (id !== undefined) {
      url += `/${id}`;
    }
    return url;
  };

  // --- Funciones handleAdd, handleOpenEdit, handleSaveEdit, handleOpenDelete, handleConfirmDelete ---
  // Asegúrate de usar setInternalIsLoading(true/false) en lugar de setIsLoading
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    // setInternalIsLoading(true); // Usa el estado interno
    setError(null);

    const apiUrl = getApiUrl();
    if (!apiUrl) {
      setError("Configuración de tabla inválida.");
      setInternalIsLoading(false);
      return;
    }

    // Validación de newRow
    const { firstName, lastName, email } = newRow;
    if (!firstName || !lastName || !email) {
      setError("Todos los campos (Nombre, Email) son requeridos.");
      setInternalIsLoading(false);
      return;
    }

    const dataToSend: { firstName: string; lastName: string; email: string } = {
      firstName,
      lastName,
      email,
    };

    if (!email.endsWith("@uninorte.edu.co")) {
      setError("El correo debe ser de la Universidad del Norte.");
      setInternalIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await customFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error("No se pudo agregar el elemento.");
      }

      onRefresh();
      setAddDialogOpen(false);
    } catch (err: any) {
      setError(err.message || "Error al agregar.");
      console.error("Error en handleAdd:", err);
    } finally {
      // setInternalIsLoading(false); // Usa el estado interno
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;

    // setInternalIsLoading(true);
    setError(null);

    const idValue = editingRow[primaryKeyField];
    const apiUrl = getApiUrl(idValue);
    if (!apiUrl || idValue === undefined) {
      setError("No se puede actualizar la fila (falta ID o configuración).");
      setInternalIsLoading(false);
      return;
    }

    // Validación
    const { firstName, lastName } = editingRow;
    if (!firstName || !lastName) {
      setError("Todos los campos (Nombre, email) son requeridos.");
      setInternalIsLoading(false);
      return;
    }

    const dataToSend: Partial<RowData> = {
      firstName,
      lastName,
    };

    try {
      setIsLoading(true);
      const response = await customFetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar la fila.");
      }

      onRefresh();
      setEditingRow(null);
    } catch (err: any) {
      setError(err.message || "Error al guardar cambios.");
      console.error("Error en handleSaveEdit:", err);
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingIndex < 0 || deletingIndex >= data.filas.length) {
      setError("Índice inválido para eliminar.");
      setDeleteDialogOpen(false); // Cierra si el índice es malo
      return;
    }

    const idToDelete = data.filas[deletingIndex]?.[primaryKeyField];
    const apiUrl = getApiUrl(
      typeof idToDelete === "string" || typeof idToDelete === "number"
        ? idToDelete
        : undefined
    );

    if (!apiUrl || idToDelete === undefined) {
      setError("No se puede eliminar la fila (falta ID o configuración).");
      setDeleteDialogOpen(false); // Cierra si falta info
      setDeletingIndex(-1);
      return;
    }

    setError(null);
    try {
      setIsLoading(true);
      // console.log("apiUrl:", apiUrl);
      const response = await customFetch(`${apiUrl}/delete`, {
        method: "PATCH",
      });
      if (!response.ok) {
        /* ... manejo de error ... */ throw new Error("...");
      }

      onRefresh();
    } catch (err: any) {
      setError(err.message || "Error al eliminar.");
      console.error("Error en handleConfirmDelete:", err);
      // No cierres el diálogo aquí si hay error, muestra el mensaje
    } finally {
      setDeletingIndex(-1);
    }
  };

  // --- Resto de funciones handleOpenEdit, handleOpenDelete (sin cambios lógicos importantes, pero asegúrate que usan `allRows` de forma segura) ---
  const handleOpenEdit = (row: RowData) => {
    setEditingRow({ ...row });
    setEditDialogOpen(true);
    setError(null);
  };

  const handleOpenDelete = (index: number) => {
    const actualIndex = index;
    setDeletingIndex(actualIndex);
    setDeleteDialogOpen(true);
    setError(null);
  };

  const handleSendEmail = async (row: RowData) => {
    const apiUrl = "http://localhost:3000/auth/resend-confirmation";
    if (!apiUrl) {
      setError("Configuración de tabla inválida.");
      return;
    }
    // console.log("apiURL", apiUrl);

    const dataToSend: { email: string } = {
      email: row.email,
    };
    try {
      const response = await customFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error("No se pudo reenviar el correo.");
      }
    } catch (err: any) {
      console.error("Error en handleSendEmail:", err);
    }
  };
  // console.log("data", data.filas);
  return (
    // Añade un contenedor div si data es null para mantener la estructura
    <div
      className={`bg-background text-foreground min-h-screen p-4 ${
        showLoader ? "opacity-75" : ""
      }`}
    >
      {/* Encabezado (Título y Botón Agregar) */}
      <div className="flex justify-between items-center mb-6 px-4">
        {/* Muestra título de forma segura */}
        <h1 className="text-xl font-medium">
          {data?.titulo || "Cargando Título..."}
        </h1>

        {/* Botón Agregar - Deshabilitado si data no existe o si está cargando */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-card hover:bg-accent text-foreground"
              disabled={!data || showLoader} // <-- Deshabilitar si no hay data O si está cargando
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar
            </Button>
          </DialogTrigger>
          <DialogContent>
            {/* Asegúrate que el form usa `internalIsLoading` */}
            {data /* Solo muestra el form si hay 'data' para obtener nombreTabla etc */ && (
              <form onSubmit={handleAdd}>
                <DialogHeader>
                  {/* Usa data?.nombreTabla de forma segura */}
                  <DialogTitle>Agregar Jurado</DialogTitle>
                  <DialogDescription>
                    Ingrese los datos del nuevo jurado.
                  </DialogDescription>
                </DialogHeader>
                {/* Muestra error del form */}
                {error &&
                  !showLoader /* No mostrar error del form mientras carga */ && (
                    <div className="px-6 py-2">
                      <p className="text-sm text-red-600 dark:text-red-500">
                        {error}
                      </p>
                    </div>
                  )}
                <div className="grid gap-4 py-4 px-6">
                  {/* Genera campos de forma segura */}
                  {columnEntries
                    .filter(
                      ([key]) =>
                        key === "firstName" ||
                        key === "lastName" ||
                        key === "email"
                    )
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
                          disabled={internalIsLoading} // Deshabilitar solo con carga interna
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

      {/* Card de la Tabla */}
      <Card className="rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-card border-b border-border">
            <TableRow>
              {/* Renderiza encabezados de forma segura */}
              {displayColumnKeys.map((key) => (
                <TableHead key={key}>{columnNames[key] || key}</TableHead>
              ))}
              <TableHead className="w-[50px]" /> {/* Actions */}
            </TableRow>
          </TableHeader>
          {/* ==================== TableBody Modificado ==================== */}
          <TableBody>
            {showLoader ? ( // <-- Usa la variable combinada
              // --- Estado de Carga (Inicial o CRUD) ---
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
            ) : data.filas && data.filas.length === 0 ? ( // <-- Verifica allRows explícitamente
              // --- Sin Resultados ---
              <TableRow>
                <TableCell
                  colSpan={displayColumnKeys.length + 1}
                  className="h-24 text-center"
                >
                  No hay resultados.
                </TableCell>
              </TableRow>
            ) : (
              // --- Filas de Datos (solo si allRows existe y tiene elementos) ---
              data.filas.map((row, index) => (
                <TableRow key={row.id ?? index}>
                  {displayColumnKeys.map((key) => (
                    // <TableCell key={key}>{row[key]}</TableCell>
                    <TableCell key={key}>
                      {key === "evaluatedCount" ||
                      key === "unevaluatedCount" ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="bg-card hover:bg-accent text-foreground"
                              disabled={!data || showLoader}
                            >
                              {row[key]}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="w-[400px]">
                            <DialogHeader>
                              <DialogTitle>{columnNames[key]}</DialogTitle>
                              <DialogDescription>
                                {`Jurado ${row.firstName} ${row.lastName}`}
                              </DialogDescription>
                            </DialogHeader>
                            <Table>
                              <TableBody>
                                {key === "evaluatedCount"
                                  ? row.evaluatedGameNames.map(
                                      (game, index) => (
                                        <TableRow key={index}>
                                          <TableCell>{game}</TableCell>
                                        </TableRow>
                                      )
                                    )
                                  : row.unevaluatedGameNames.map(
                                      (game, index) => (
                                        <TableRow key={index}>
                                          <TableCell>{game}</TableCell>
                                        </TableRow>
                                      )
                                    )}
                              </TableBody>
                            </Table>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        row[key as keyof Jurado]
                      )}
                    </TableCell>
                  ))}
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
                          onClick={() => handleSendEmail(row)}
                          disabled={internalIsLoading}
                        >
                          Reenviar correo
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenEdit(row)}
                          disabled={internalIsLoading}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDelete(index)}
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

        {/* Controles de Paginación - Deshabilitados si está cargando */}
        <div className="flex justify-between items-center p-4 text-sm border-t border-border">
          <div className="flex items-center gap-2">
            <span>Filas por página</span>
            <Select
              value={limit.toString()}
              onValueChange={(value) => {
                onLimitChange(parseInt(value, 10));
                onPageChange(1); // Reinicia a la primera página al cambiar el límite
              }}
              disabled={showLoader} // Deshabilitar si carga o no hay filas
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder={limit} />
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
          <div className="flex items-center gap-4 pr-8">
            {/* Muestra paginación de forma segura */}
            <span>
              Página {totalPages > 0 ? page : 0} de {totalPages || 0}
            </span>
            <div className="flex gap-1">
              <Button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1 || showLoader}
                variant="outline"
                size="icon"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages || totalPages === 0 || showLoader}
                variant="outline"
                size="icon"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Dialog Editar - Asegúrate que usa `internalIsLoading` y maneja `editingRow` null */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          {editingRow &&
            data && ( // Necesita data para los nombres de columna
              <form onSubmit={handleSaveEdit}>
                <DialogHeader>
                  <DialogTitle>Editar fila</DialogTitle>
                  <DialogDescription>
                    Modifique los campos según sea necesario.
                  </DialogDescription>
                </DialogHeader>
                {/* Muestra error del form */}
                {error && !showLoader && (
                  <div className="px-6 py-2">
                    <p className="text-sm text-red-600 dark:text-red-500">
                      {error}
                    </p>
                  </div>
                )}
                <div className="grid gap-4 py-4 px-6">
                  {columnEntries
                    .filter(
                      ([key]) => key === "firstName" || key === "lastName"
                    )
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
                          disabled={internalIsLoading} // Usa estado interno
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

      {/* Dialog Eliminar - Asegúrate que usa `internalIsLoading` */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              la fila seleccionada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {/* Muestra error del dialog */}
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
