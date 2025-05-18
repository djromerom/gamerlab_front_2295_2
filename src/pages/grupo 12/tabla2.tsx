"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreVertical, Plus, Loader2 } from "lucide-react"
import { useFetch } from "@/hooks/useFetch"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface RowData extends Record<string, any> {
  id: number | string
}

export interface Data {
  titulo: string
  nombreTabla: string
  nombreColumnas: Record<string, string>
  filas: RowData[]
  primaryKey?: string
}

interface Props {
  data: Data | null
  apiBaseUrl: string
  isDataLoading?: boolean
}

export const JuryManagementTable: React.FC<Props> = ({ data, apiBaseUrl, isDataLoading = false }) => {
  const customFetch = useFetch()
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [allRows, setAllRows] = useState<RowData[]>(data?.filas || [])
  const [currentRows, setCurrentRows] = useState<RowData[]>([])
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newRow, setNewRow] = useState<Record<string, any>>({})
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<RowData | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingIndex, setDeletingIndex] = useState<number>(-1)
  const [internalIsLoading, setInternalIsLoading] = useState(false)

  // Combina el estado de carga inicial (prop) y el estado de carga interno (CRUD)
  const showLoader = isDataLoading || internalIsLoading

  // Función para mostrar errores como toast en lugar de AlertDialog
  const showError = (errorMessage: string) => {
    toast.error(errorMessage)
  }

  // Usa data?.primaryKey o 'id' como fallback de forma segura
  const primaryKeyField = data?.primaryKey || "id"

  // Obtén las columnas de forma segura, devuelve array vacío si data es null
  const columnEntries = data ? Object.entries(data.nombreColumnas) : []
  const displayColumnKeys = columnEntries.filter(([key]) => key !== primaryKeyField).map(([key]) => key)
  const columnNames = data?.nombreColumnas || {}

  const totalPages = Math.ceil(allRows.length / rowsPerPage)

  const getApiUrl = (id?: number | string) => {
    // Asegúrate que data y data.nombreTabla existen antes de usarlos
    if (!data?.nombreTabla) return "" // O maneja el error como prefieras
    let url = `${apiBaseUrl}/${data.nombreTabla}`
    if (id !== undefined) {
      url += `/${id}`
    }
    return url
  }

  // Effect para actualizar allRows cuando la prop `data` cambie (después de la carga inicial)
  useEffect(() => {
    // Solo actualiza si data existe y data.filas es diferente de allRows (evita bucles)
    // Comprobación simple por referencia o longitud puede ser suficiente aquí
    if (data?.filas && data.filas !== allRows) {
      setAllRows(data.filas)
      // Resetea la página a 1 si los datos cambian completamente (opcional)
      // setCurrentPage(1);
    }
    // Si data se vuelve null (quizás por un error en el padre), limpia las filas
    if (data === null && allRows.length > 0) {
      setAllRows([])
    }
  }, [data]) // Depende de la prop data

  // Effect para paginación (sin cambios, ya depende de allRows)
  useEffect(() => {
    const start = (currentPage - 1) * rowsPerPage
    const end = start + rowsPerPage
    // Asegura que allRows exista antes de rebanar
    setCurrentRows(allRows ? allRows.slice(start, end) : [])

    // Ajusta la página actual si es necesario (sin cambios)
    const currentTotalPages = Math.ceil((allRows?.length || 0) / rowsPerPage)
    if (currentPage > currentTotalPages && currentTotalPages > 0) {
      setCurrentPage(currentTotalPages)
    } else if (currentPage < 1 && currentTotalPages > 0) {
      setCurrentPage(1)
    } else if (allRows?.length === 0) {
      setCurrentPage(1)
    }
  }, [currentPage, rowsPerPage, allRows]) // Depende de allRows

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setInternalIsLoading(true)

    const apiUrl = getApiUrl()
    if (!apiUrl) {
      showError("Configuración de tabla inválida.")
      setInternalIsLoading(false)
      return
    }

    // Validación de newRow
    const { name, email } = newRow
    if (!name || !email) {
      showError("Todos los campos (Nombre, Email) son requeridos.")
      setInternalIsLoading(false)
      return
    }

    const dataToSend: { name: string; email: string } = {
      name,
      email,
    }

    try {
      const response = await customFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        throw new Error("No se pudo agregar el elemento.")
      }

      const addedRow: RowData = await response.json()
      switch (addedRow.confirmationStatusId) {
        case 1:
          addedRow.confirmationStatusId = "Aceptado"
          break
        case 2:
          addedRow.confirmationStatusId = "Pendiente"
          break
        default:
          addedRow.confirmationStatusId = "Expirado"
      }

      addedRow.lastSignInAt = new Date(addedRow.lastSignInAt).toLocaleString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })

      setAllRows((prevRows) => [addedRow, ...(prevRows || [])])
      setNewRow({})
      setAddDialogOpen(false)
      
      // Notificación de éxito al agregar
      toast.success("Jurado agregado correctamente")
    } catch (err: any) {
      showError(err.message || "Error al agregar.")
      console.error("Error en handleAdd:", err)
    } finally {
      setInternalIsLoading(false)
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRow) return

    setInternalIsLoading(true)

    const idValue = editingRow[primaryKeyField]
    const apiUrl = getApiUrl(idValue)
    if (!apiUrl || idValue === undefined) {
      showError("No se puede actualizar la fila (falta ID o configuración).")
      setInternalIsLoading(false)
      return
    }

    // Validación
    const { name, email } = editingRow
    if (!name || !email) {
      showError("Todos los campos (Nombre, email) son requeridos.")
      setInternalIsLoading(false)
      return
    }

    const dataToSend: Partial<RowData> = {
      name,
      email,
    }

    try {
      const response = await customFetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar la fila.")
      }

      const updatedRowFromApi: RowData = await response.json()

      switch (updatedRowFromApi.confirmationStatusId) {
        case 1:
          updatedRowFromApi.confirmationStatusId = "Aceptado"
          break
        case 2:
          updatedRowFromApi.confirmationStatusId = "Pendiente"
          break
        default:
          updatedRowFromApi.confirmationStatusId = "Expirado"
      }

      updatedRowFromApi.lastSignInAt = new Date(updatedRowFromApi.lastSignInAt).toLocaleString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })

      setAllRows((prevRows) =>
        (prevRows || []).map((row) => (row[primaryKeyField] === idValue ? updatedRowFromApi : row)),
      )
      setEditDialogOpen(false)
      setEditingRow(null)
      
      // Notificación de éxito al editar
      toast.success("Jurado actualizado correctamente")
    } catch (err: any) {
      showError(err.message || "Error al guardar cambios.")
      console.error("Error en handleSaveEdit:", err)
    } finally {
      setInternalIsLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (deletingIndex < 0 || !allRows || deletingIndex >= allRows.length) {
      showError("Índice inválido para eliminar.")
      setDeleteDialogOpen(false)
      return
    }

    const idToDelete = allRows[deletingIndex]?.[primaryKeyField]
    const apiUrl = getApiUrl(idToDelete)

    if (!apiUrl || idToDelete === undefined) {
      showError("No se puede eliminar la fila (falta ID o configuración).")
      setDeleteDialogOpen(false)
      setDeletingIndex(-1)
      return
    }

    setInternalIsLoading(true)

    let deleteSuccess = false
    try {
      const response = await customFetch(`${apiUrl}/delete`, {
        method: "PATCH",
      })
      if (!response.ok) {
        throw new Error("Error al eliminar el elemento.")
      }

      // Éxito
      setAllRows((prevRows) => (prevRows || []).filter((_, i) => i !== deletingIndex))
      deleteSuccess = true

      // Notificación de éxito al eliminar
      toast.success("Jurado eliminado correctamente")

      // Ajustar paginación si es necesario
      const newTotalRows = (allRows?.length || 1) - 1
      const newTotalPages = Math.ceil(newTotalRows / rowsPerPage)
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages)
      } else if (newTotalRows === 0) {
        setCurrentPage(1)
      }
    } catch (err: any) {
      showError(err.message || "Error al eliminar.")
      console.error("Error en handleConfirmDelete:", err)
    } finally {
      setInternalIsLoading(false)
      if (deleteSuccess) {
        setDeleteDialogOpen(false)
        setDeletingIndex(-1)
      }
    }
  }

  const handleOpenEdit = (row: RowData) => {
    setEditingRow({ ...row })
    setEditDialogOpen(true)
  }

  const handleOpenDelete = (index: number) => {
    const actualIndex = (currentPage - 1) * rowsPerPage + index
    setDeletingIndex(actualIndex)
    setDeleteDialogOpen(true)
  }

  return (
    <div className={`bg-background text-foreground min-h-screen p-4 ${showLoader ? "opacity-75" : ""}`}>
      {/* Encabezado (Título y Botón Agregar) */}
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-xl font-medium">{data?.titulo || "Cargando Título..."}</h1>

        {/* Botón Agregar - Deshabilitado si data no existe o si está cargando */}
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
                  <DialogTitle>Agregar Nuevo Jurado</DialogTitle>
                  <DialogDescription>Ingrese los datos de la nueva fila.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 px-6">
                  {columnEntries
                    .filter(([key]) => key === "name" || key === "email")
                    .map(([key, label]) => (
                      <div key={key} className="grid grid-cols-4 items-center gap-4">
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
                    variant="outline"
                    onClick={() => {
                      setAddDialogOpen(false)
                      setNewRow({})
                    }}
                    disabled={internalIsLoading}
                    className="cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button className="cursor-pointer" type="submit" disabled={internalIsLoading}>
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
                <TableCell colSpan={displayColumnKeys.length + 1} className="h-24 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Cargando...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : allRows && allRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={displayColumnKeys.length + 1} className="h-24 text-center">
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
                        <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer" disabled={internalIsLoading}>
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

        {/* Controles de Paginación - Deshabilitados si está cargando */}
        <div className="flex justify-between items-center p-4 text-sm border-t border-border">
          <div className="flex items-center gap-2">
            <span>Filas por página</span>
            <Select
              value={rowsPerPage.toString()}
              onValueChange={(value) => {
                setRowsPerPage(Number.parseInt(value, 10))
                setCurrentPage(1)
              }}
              disabled={showLoader || !allRows || allRows.length === 0}
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
              Página {totalPages > 0 ? currentPage : 0} de {totalPages || 0}
            </span>
            <div className="flex gap-1">
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || showLoader || !allRows || allRows.length === 0}
                variant="outline"
                size="icon"
                className="cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={
                  currentPage === totalPages || totalPages === 0 || showLoader || !allRows || allRows.length === 0
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

      {/* Dialog Editar */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          {editingRow && data && (
            <form onSubmit={handleSaveEdit}>
              <DialogHeader>
                <DialogTitle>Editar fila</DialogTitle>
                <DialogDescription>Modifique los campos según sea necesario.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 px-6">
                {columnEntries
                  .filter(([key]) => key === "name" || key === "email")
                  .map(([key, label]) => (
                    <div key={key} className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`edit-${key}`} className="text-right">
                        {label}
                      </Label>
                      <Input
                        id={`edit-${key}`}
                        value={editingRow[key] || ""}
                        onChange={(e) => setEditingRow((prev) => (prev ? { ...prev, [key]: e.target.value } : null))}
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
                    setEditDialogOpen(false)
                    setEditingRow(null)
                  }}
                  disabled={internalIsLoading}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button className="cursor-pointer" type="submit" disabled={internalIsLoading}>
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente la fila seleccionada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeletingIndex(-1)
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
  )
}

