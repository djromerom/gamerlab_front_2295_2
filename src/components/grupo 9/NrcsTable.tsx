// NrcsTable.tsx
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

export interface Member {
  id: number;
  firstName: string;
  name: string;
  lastName: string;
  email: string;
  studentCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Professor {
  confirmationStatusId: number;
  username: string | null;
  roleId: number;
  id: string;
  name: string;
  isActive: boolean;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  semester: number;
}

export interface RowData {
  id: number;
  code: string;
  professorId: string;
  subjectId: number;
  professor: Professor;
  subject: Subject;
  members: Member[];
  createdAt: string;
  updatedAt: string;
}

interface CreateNrcPayload {
  code: number;
  professorId: string;
  subjectId: number;
}

interface UpdateNrcPayload {
  code?: string;
  professorId?: string;
  subjectId?: number;
}

export interface Data {
  title: string;
  TableName: string;
  columns: Record<string, string>;
  rows: RowData[];
}

interface Props {
  data: Data | null;
  apiBaseUrl: string;
  isDataLoading?: boolean;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rows: number) => void;
  totalPages: number;
  totalItems: number;
  onDataChange: () => void;
  onNrcUpdate: (nrc: RowData) => void;
}

const getNestedValue = (obj: any, path: string): any => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

export const NrcsTable: React.FC<Props> = ({
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
  onNrcUpdate,
}) => {
  const customFetch = useFetch();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newRow, setNewRow] = useState<Partial<CreateNrcPayload>>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<RowData | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<UpdateNrcPayload>>(
    {}
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRowId, setDeletingRowId] = useState<number | null>(null);
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [professorsList, setProfessorsList] = useState<Professor[]>([]);
  const [selectsLoading, setSelectsLoading] = useState(false);

  useEffect(() => {
    const fetchSelectData = async () => {
      setSelectsLoading(true);
      setError(null); // Clear previous select errors
      try {
        const [subjectsRes, professorsRes] = await Promise.all([
          customFetch(`${apiBaseUrl}/subjects/select-options`),
          customFetch(`${apiBaseUrl}/professors/select-options`),
        ]);

        if (!subjectsRes.ok) throw new Error(`Failed to load subjects: ${subjectsRes.status}`);
        if (!professorsRes.ok) throw new Error(`Failed to load professors: ${professorsRes.status}`);

        const subjectsData = await subjectsRes.json();
        const professorsData = await professorsRes.json();

        setSubjectsList(subjectsData.data || subjectsData || []); // Adjust if wrapper like { data: [] }
        setProfessorsList(professorsData.data || professorsData || []); // Adjust if wrapper

      } catch (err: any) {
        console.error("Error fetching select data:", err);
        setError("Error al cargar datos para formularios. " + err.message);
      } finally {
        setSelectsLoading(false);
      }
    };
    if (addDialogOpen || editDialogOpen) { // Fetch only when dialogs are opened to save resources
      fetchSelectData();
    }
  }, [apiBaseUrl, customFetch, addDialogOpen, editDialogOpen]);

  const showLoader = isDataLoading || internalIsLoading || (selectsLoading && (addDialogOpen || editDialogOpen));
  const primaryKeyField = "id";
  const columnEntries = data ? Object.entries(data.columns) : [];
  const displayColumnKeys = columnEntries.map(([key]) => key);
  const columnNames = data?.columns || {};

  const getApiUrl = (id?: number | string) => {
    if (!data?.TableName) return "";
    let url = `${apiBaseUrl}/${data.TableName}`;
    if (id !== undefined) {
      url += `/${id}`;
    }
    return url;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalIsLoading(true);
    setError(null);

    const apiUrl = getApiUrl();
    if (!apiUrl || !data?.TableName) {
      setError("Configuración de tabla inválida.");
      setInternalIsLoading(false);
      return;
    }

    const { code, subjectId, professorId } = newRow;
    const codeValue = Number(code);
    if (!codeValue || !subjectId || !professorId) {
      setError("Código, Materia y Profesor son requeridos.");
      setInternalIsLoading(false);
      return;
    }

    const dataToSend: CreateNrcPayload = { code: codeValue, subjectId, professorId };

    try {
      const response = await customFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: "Error al crear NRC" }));
        throw new Error(errorBody.message || `Error ${response.status}`);
      }
      await response.json(); // Consume response body
      setNewRow({});
      setAddDialogOpen(false);
      onDataChange(); // Trigger refetch in parent
    } catch (err: any) {
      setError(err.message || "Error al agregar NRC.");
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleOpenEdit = (row: RowData) => {
    setEditingRow(row);
    setEditFormData({
      code: row.code,
      subjectId: row.subjectId,
      professorId: row.professorId,
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
      setError("No se puede actualizar la fila.");
      setInternalIsLoading(false);
      return;
    }

    const { code, subjectId, professorId } = editFormData;
    if (!code || !subjectId || !professorId) {
      setError("Código, Materia y Profesor son requeridos.");
      setInternalIsLoading(false);
      return;
    }

    const dataToSend: UpdateNrcPayload = { code, subjectId, professorId };

    try {
      const response = await customFetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: "Error al actualizar NRC" }));
        throw new Error(errorBody.message || `Error ${response.status}`);
      }
      const updatedRowFromApi: RowData = await response.json();
      onNrcUpdate(updatedRowFromApi); // Optimistic update in parent
      setEditDialogOpen(false);
      setEditingRow(null);
      setEditFormData({});
    } catch (err: any) {
      setError(err.message || "Error al guardar cambios.");
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

    try {
      const response = await customFetch(apiUrl, { method: "DELETE" });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: "Error al eliminar NRC" }));
        throw new Error(errorBody.message || `Error ${response.status}`);
      }
      onDataChange(); // Trigger refetch in parent
      setDeleteDialogOpen(false);
      setDeletingRowId(null);
    } catch (err: any) {
      setError(err.message || "Error al eliminar NRC.");
      // Keep dialog open to show error
    } finally {
      setInternalIsLoading(false);
    }
  };

  const displayRows = data?.rows || [];

  return (
    <div
      className={`bg-background text-foreground min-h-screen p-4 ${isDataLoading && !internalIsLoading ? "opacity-75" : "" // Main page loader opacity
        }`}
    >
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-xl font-medium">
          {data?.title || "Cargando Título..."}
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
                  <DialogTitle>Agregar {data?.TableName || "Item"}</DialogTitle>
                  <DialogDescription>
                    Ingrese los datos del nuevo NRC.
                  </DialogDescription>
                </DialogHeader>
                {(error && !internalIsLoading && (addDialogOpen || editDialogOpen)) && (
                  <div className="px-6 py-2">
                    <p className="text-sm text-red-600 dark:text-red-500">
                      {error}
                    </p>
                  </div>
                )}
                {selectsLoading && (addDialogOpen || editDialogOpen) && <div className="p-6 text-center"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Cargando opciones...</div>}
                {!selectsLoading && (
                  <div className="grid gap-4 py-4 px-6">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="add-code" className="text-right">
                        Código
                      </Label>
                      <Input
                        id="add-code"
                        value={newRow.code?.toString() || ""}
                        onChange={(e) =>
                          setNewRow((prev) => ({
                            ...prev,
                            code: Number(e.target.value) || undefined,
                          }))
                        }
                        className="col-span-3"
                        required
                        type="number"
                        disabled={internalIsLoading}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="add-subjectId" className="text-right">
                        Materia
                      </Label>
                      <Select
                        value={newRow.subjectId?.toString() || ""}
                        onValueChange={(value) =>
                          setNewRow((prev) => ({
                            ...prev,
                            subjectId: Number(value),
                          }))
                        }
                        disabled={internalIsLoading || subjectsList.length === 0 || selectsLoading}
                      >
                        <SelectTrigger className="col-span-3 w-full">
                          <SelectValue placeholder="Seleccione una materia" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjectsList.map((subject) => (
                            <SelectItem
                              key={subject.id}
                              value={subject.id.toString()}
                            >
                              {subject.name} ({subject.code})
                            </SelectItem>
                          ))}
                          {subjectsList.length === 0 && <SelectItem value="loading" disabled>Cargando materias...</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="add-professorId" className="text-right">
                        Profesor
                      </Label>
                      <Select
                        value={newRow.professorId?.toString() || ""}
                        onValueChange={(value) =>
                          setNewRow((prev) => ({
                            ...prev,
                            professorId: value,
                          }))
                        }
                        disabled={internalIsLoading || professorsList.length === 0 || selectsLoading}
                      >
                        <SelectTrigger className="col-span-3 w-full">
                          <SelectValue placeholder="Seleccione un profesor" />
                        </SelectTrigger>
                        <SelectContent>
                          {professorsList.map((prof) => (
                            <SelectItem key={prof.id} value={prof.id.toString()}>
                              {prof.name}
                            </SelectItem>
                          ))}
                          {professorsList.length === 0 && <SelectItem value="loading" disabled>Cargando profesores...</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
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
                  <Button
                    type="submit"
                    disabled={internalIsLoading || selectsLoading}
                  >
                    {internalIsLoading || selectsLoading ? "Guardando..." : "Guardar"}
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
            {isDataLoading && !internalIsLoading ? (
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
                  No hay resultados.
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map((row) => (
                <TableRow key={row[primaryKeyField]}>
                  {displayColumnKeys.map((key) => (
                    <TableCell key={key}>{getNestedValue(row, key)}</TableCell>
                  ))}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          disabled={internalIsLoading || isDataLoading || (selectsLoading && (addDialogOpen || editDialogOpen))}
                        >
                          <span className="sr-only">Abrir menú</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleOpenEdit(row)}
                          disabled={internalIsLoading || isDataLoading || (selectsLoading && (addDialogOpen || editDialogOpen))}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDelete(row)}
                          className="text-red-500 focus:text-red-600 focus:bg-red-100"
                          disabled={internalIsLoading || isDataLoading}
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
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={
                  currentPage === 1 || showLoader || totalItems === 0
                }
                variant="outline"
                size="icon"
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
                <DialogTitle>Editar {data.TableName || "Item"}</DialogTitle>
                <DialogDescription>
                  Modifique los campos según sea necesario.
                </DialogDescription>
              </DialogHeader>
              {(error && !internalIsLoading && (addDialogOpen || editDialogOpen)) && (
                <div className="px-6 py-2">
                  <p className="text-sm text-red-600 dark:text-red-500">
                    {error}
                  </p>
                </div>
              )}
              {selectsLoading && (addDialogOpen || editDialogOpen) && <div className="p-6 text-center"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Cargando opciones...</div>}
              {!selectsLoading && (
                <div className="grid gap-4 py-4 px-6">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-code" className="text-right">
                      Código
                    </Label>
                    <Input
                      id="edit-code"
                      value={editFormData.code || ""}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          code: e.target.value,
                        }))
                      }
                      className="col-span-3"
                      required
                      type="number"
                      disabled={internalIsLoading}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-subjectId" className="text-right">
                      Materia
                    </Label>
                    <Select
                      value={editFormData.subjectId?.toString() || ""}
                      onValueChange={(value) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          subjectId: Number(value),
                        }))
                      }
                      disabled={internalIsLoading || subjectsList.length === 0 || selectsLoading}
                    >
                      <SelectTrigger className="col-span-3 w-full">
                        <SelectValue placeholder="Seleccione una materia" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectsList.map((subject) => (
                          <SelectItem
                            key={subject.id}
                            value={subject.id.toString()}
                          >
                            {subject.name} ({subject.code})
                          </SelectItem>
                        ))}
                        {subjectsList.length === 0 && <SelectItem value="loading" disabled>Cargando materias...</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-professorId" className="text-right">
                      Profesor
                    </Label>
                    <Select
                      value={editFormData.professorId?.toString() || ""}
                      onValueChange={(value) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          professorId: value,
                        }))
                      }
                      disabled={internalIsLoading || professorsList.length === 0 || selectsLoading}
                    >
                      <SelectTrigger className="col-span-3 w-full">
                        <SelectValue placeholder="Seleccione un profesor" />
                      </SelectTrigger>
                      <SelectContent>
                        {professorsList.map((prof) => (
                          <SelectItem key={prof.id} value={prof.id.toString()}>
                            {prof.name}
                          </SelectItem>
                        ))}
                        {professorsList.length === 0 && <SelectItem value="loading" disabled>Cargando profesores...</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
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
                <Button
                  type="submit"
                  disabled={internalIsLoading || selectsLoading}
                >
                  {internalIsLoading || selectsLoading ? "Guardando..." : "Guardar Cambios"}
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
              el NRC seleccionado.
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
