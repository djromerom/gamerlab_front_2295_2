"use client"

import { pageLabel } from "@/lib/pagination";
import { AlertDialogFooter } from "@/components/ui/alert-dialog"

import type React from "react"

import { useState } from "react"
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
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Criterion {
  id: number
  name: string
  description?: string
  weight?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface CriterionFormData {
  name: string
  description: string
  weight: string
}

interface PaginationMetadata {
  totalItems: number
  itemsOnCurrentPage: number
  currentPage: number
  itemsPerPage: number
  totalPages: number
  totalWeight: number // Nuevo campo
}

interface Props {
  criteria: Criterion[] | null
  pagination: PaginationMetadata
  apiBaseUrl: string
  isDataLoading?: boolean
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  refreshData: () => void
}

export const CriterionTable: React.FC<Props> = ({
  criteria,
  pagination,
  apiBaseUrl,
  isDataLoading = false,
  onPageChange,
  onLimitChange,
  refreshData,
}) => {
  const customFetch = useFetch()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newCriterion, setNewCriterion] = useState<CriterionFormData>({
    name: "",
    description: "",
    weight: "",
  })
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [internalIsLoading, setInternalIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showLoader = isDataLoading || internalIsLoading
  const showWarning = Math.abs(pagination.totalWeight - 1) > 0.0001

  const columns = [
    { key: "name", label: "Nombre" },
    { key: "description", label: "Descripción" },
    { key: "weight", label: "Peso" },
  ]

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setInternalIsLoading(true)
    setError(null)

    try {
      if (newCriterion.weight === "" || isNaN(Number.parseFloat(newCriterion.weight))) {
        throw new Error("El peso debe ser un número válido")
      }

      const weightValue = Number.parseFloat(newCriterion.weight)
      if (weightValue <= 0 || weightValue > 1) {
        throw new Error("El peso debe ser mayor a 0 y menor o igual a 1")
      }

      if (pagination.totalWeight + weightValue > 1) {
        throw new Error(`La suma de los pesos no puede exceder 1. Actual: ${pagination.totalWeight.toFixed(4)}`)
      }

      const response = await customFetch(`${apiBaseUrl}/criteria`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCriterion.name,
          description: newCriterion.description,
          weight: weightValue,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al crear el criterio")
      }

      onPageChange(1)
      setNewCriterion({ name: "", description: "", weight: "" })
      setAddDialogOpen(false)
      refreshData()
      toast.success("Criterio agregado exitosamente")
    } catch (err: any) {
      setError(err.message || "Error al agregar el criterio")
      toast.error(err.message || "Error al agregar el criterio")
    } finally {
      setInternalIsLoading(false)
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCriterion) return
    setInternalIsLoading(true)
    setError(null)

    try {
      const weightValue = Number.parseFloat(editingCriterion.weight?.toString() || "0")
      if (isNaN(weightValue)) {
        throw new Error("El peso debe ser un número válido")
      }
      if (weightValue <= 0 || weightValue > 1) {
        throw new Error("El peso debe ser mayor a 0 y menor o igual a 1")
      }

      const oldWeight = editingCriterion.weight || 0
      const newTotal = pagination.totalWeight - oldWeight + weightValue

      if (newTotal > 1) {
        throw new Error(`La suma de los pesos no puede exceder 1. Actual: ${pagination.totalWeight.toFixed(4)}`)
      }

      const response = await customFetch(`${apiBaseUrl}/criteria/${editingCriterion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingCriterion.name,
          description: editingCriterion.description,
          weight: weightValue,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al actualizar el criterio")
      }

      refreshData()
      setEditDialogOpen(false)
      setEditingCriterion(null)
      toast.success("Criterio actualizado exitosamente")
    } catch (err: any) {
      setError(err.message || "Error al actualizar el criterio")
      toast.error(err.message || "Error al actualizar el criterio")
    } finally {
      setInternalIsLoading(false)
    }
  }

  // [Resto del código permanece igual...]
  const handleConfirmDelete = async () => {
    if (!deletingId) return
    setInternalIsLoading(true)
    setError(null)

    try {
      const response = await customFetch(`${apiBaseUrl}/criteria/${deletingId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al desactivar el criterio")
      }

      // Verificar si la página actual quedará vacía después de eliminar
      const willPageBeEmpty = criteria && criteria.length === 1

      refreshData()
      setDeleteDialogOpen(false)
      setDeletingId(null)
      toast.success("Criterio eliminado exitosamente")

      // Si la página quedará vacía y no es la primera página, retroceder
      if (willPageBeEmpty && pagination.currentPage > 1) {
        onPageChange(pagination.currentPage - 1)
      }
    } catch (err: any) {
      setError(err.message || "Error al desactivar el criterio")
      toast.error(err.message || "Error al desactivar el criterio")
    } finally {
      setInternalIsLoading(false)
    }
  }

  return (
    <div className={`md:bg-background text-foreground min-h-screen p-4 ${showLoader ? "opacity-75" : ""}`}>
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
                <DialogDescription>Complete los datos del nuevo criterio de evaluación.</DialogDescription>
              </DialogHeader>
              {error && !showLoader && (
                <div className="px-6 py-2">
                  <p className="text-sm text-red-600 dark:text-red-500">{error}</p>
                </div>
              )}
              <div className="grid gap-4 py-4 px-6">
                {columns.map(({ key, label }) => (
                  <div key={key} className="grid grid-cols-4 items-center gap-4">
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
                    setAddDialogOpen(false)
                    setError(null)
                    setNewCriterion({ name: "", description: "", weight: "" })
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
                  {internalIsLoading ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {showWarning && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md border border-yellow-200">
          <div className="flex items-start">
            <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-medium">Advertencia</p>
              <p>
                La suma total de los pesos es {pagination.totalWeight.toFixed(4)}, debe ser exactamente 1 para que el
                sistema funcione correctamente.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card className="rounded-lg bg-card">
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
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
                    <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span>Cargando...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : criteria?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                      No hay criterios disponibles.
                    </TableCell>
                  </TableRow>
                ) : (
                  criteria
                    ?.filter((criterion) => criterion.isActive)
                    .map((criterion) => (
                      <TableRow key={criterion.id}>
                        <TableCell>{criterion.name}</TableCell>
                        {/* MODIFICATION HERE: Apply styles for text truncation */}
                        <TableCell className="max-w-[300px]">
                          <div className="whitespace-normal break-words">{criterion.description || "-"}</div>
                        </TableCell>
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
                                  setEditingCriterion(criterion)
                                  setEditDialogOpen(true)
                                }}
                                disabled={internalIsLoading}
                                className="cursor-pointer"
                              >
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setDeletingId(criterion.id)
                                  setDeleteDialogOpen(true)
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
          </div>
        </div>
      </Card>

      <div className="flex justify-between items-center p-4 text-sm border-t border-border gap-2">
        <div className="flex items-center gap-1 min-[450px]:gap-2">
          <span className="w-12 min-[450px]:w-auto text-center min-[450px]:text-left leading-tight break-words">
            Filas por página
          </span>
          <Select
            value={pagination.itemsPerPage.toString()}
            onValueChange={(value) => {
              onLimitChange(Number.parseInt(value, 10))
            }}
            disabled={showLoader || !criteria?.length}
          >
            <SelectTrigger className="w-[70px] cursor-pointer">
              <SelectValue placeholder={pagination.itemsPerPage} />
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
        <div className="flex items-center gap-2 min-[450px]:gap-4 shrink-0">
          <span className="text-center min-[450px]:text-left leading-tight">
            <span className="block min-[450px]:inline">Página </span>
            <span className="block min-[450px]:inline">
              {pageLabel(pagination.currentPage, pagination.totalPages)}
            </span>
          </span>
          <div className="flex gap-1 shrink-0">
            <Button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1 || showLoader || !criteria?.length}
              variant="outline"
              size="icon"
              className="cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={
                pagination.currentPage >= pagination.totalPages ||
                pagination.totalPages === 0 ||
                showLoader ||
                !criteria?.length
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          {editingCriterion && (
            <form onSubmit={handleSaveEdit}>
              <DialogHeader>
                <DialogTitle>Editar Criterio</DialogTitle>
                <DialogDescription>Modifique los campos del criterio según sea necesario.</DialogDescription>
              </DialogHeader>
              {error && !showLoader && (
                <div className="px-6 py-2">
                  <p className="text-sm text-red-600 dark:text-red-500">{error}</p>
                </div>
              )}
              <div className="grid gap-4 py-4 px-6">
                {columns.map(({ key, label }) => (
                  <div key={key} className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={`edit-${key}`} className="text-right">
                      {label}
                    </Label>
                    <Input
                      id={`edit-${key}`}
                      value={editingCriterion[key as keyof Criterion]?.toString() || ""}
                      onChange={(e) =>
                        setEditingCriterion((prev) => (prev ? { ...prev, [key]: e.target.value } : null))
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
                    setEditDialogOpen(false)
                    setError(null)
                    setEditingCriterion(null)
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
              Esta acción marcará el criterio como inactivo. Podrá reactivarlo más tarde si es necesario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && !showLoader && <p className="text-sm text-red-600 dark:text-red-500 p-4 -mt-2 -mb-2">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false)
                setError(null)
                setDeletingId(null)
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
  )
}
