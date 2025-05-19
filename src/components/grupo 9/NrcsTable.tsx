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

// --- Interfaces específicas para NRC ---
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

export interface ProfessorRowData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  confirmationStatusId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  professor: ProfessorRowData;
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
}

const getNestedValue = (obj: any, path: string): any => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

export const NrcsTable: React.FC<Props> = ({
  data,
  apiBaseUrl,
  isDataLoading = false,
}) => {
  const customFetch = useFetch();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [allRows, setAllRows] = useState<RowData[]>(data?.rows || []);
  const [currentRows, setCurrentRows] = useState<RowData[]>([]);
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
  const [professorsList, setProfessorsList] = useState<ProfessorRowData[]>([]);
  const [selectsLoading, setSelectsLoading] = useState(false);

  const showError = (errorMessage: string) => {
    toast.error(errorMessage);
  };

  const showSuccess = (successMessage: string) => {
    toast.success(successMessage);
  };

  useEffect(() => {
    const fetchSelectData = async () => {
      setSelectsLoading(true);
      try {
        const [subjectsRes, professorsRes] = await Promise.all([
          customFetch(`${apiBaseUrl}/subjects/select-options`),
          customFetch(`${apiBaseUrl}/professors/select-options`),
        ]);

        if (!subjectsRes.ok) {
          const err = await subjectsRes
            .json()
            .catch(() => ({ message: "Failed to load subjects for selects" }));
          throw new Error(err.message || "Failed to load subjects for selects");
        }
        if (!professorsRes.ok) {
          const err = await professorsRes
            .json()
            .catch(() => ({
              message: "Failed to load professors for selects",
            }));
          throw new Error(
            err.message || "Failed to load professors for selects"
          );
        }

        const subjectsData = await subjectsRes.json();
        const professorsData = await professorsRes.json();

        // Ensure data is an array, use .data if your API wraps arrays
        setSubjectsList(subjectsData.data || subjectsData || []);
        setProfessorsList(professorsData.data || professorsData || []);
      } catch (err: any) {
        console.error("Error fetching select data:", err);
        showError(err.message || "Error al cargar datos para formularios.");
        setError(err.message || "Error al cargar datos para formularios.");
      } finally {
        setSelectsLoading(false);
      }
    };
    fetchSelectData();
  }, [apiBaseUrl, customFetch]);

  const showLoader = isDataLoading || internalIsLoading || selectsLoading;
  const primaryKeyField = "id";
  const columnEntries = data ? Object.entries(data.columns) : [];
  const displayColumnKeys = columnEntries.map(([key]) => key);
  const columnNames = data?.columns || {};
  const totalPages = Math.ceil(allRows.length / rowsPerPage);

  const getApiUrl = (id?: number | string) => {
    if (!data?.TableName) return "";
    let url = `${apiBaseUrl}/${data.TableName}`;
    if (id !== undefined) {
      url += `/${id}`;
    }
    return url;
  };

  useEffect(() => {
    if (data?.rows && data.rows !== allRows) {
      setAllRows(data.rows);
    }
    if (data === null && allRows.length > 0) {
      setAllRows([]);
    }
  }, [data]);

  useEffect(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    setCurrentRows(allRows ? allRows.slice(start, end) : []);

    const currentTotalPages = Math.ceil((allRows?.length || 0) / rowsPerPage);
    if (currentPage > currentTotalPages && currentTotalPages > 0) {
      setCurrentPage(currentTotalPages);
    } else if (currentPage < 1 && currentTotalPages > 0) {
      setCurrentPage(1);
    } else if (allRows?.length === 0) {
      setCurrentPage(1);
    }
  }, [currentPage, rowsPerPage, allRows]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalIsLoading(true);
    setError(null);

    const apiUrl = getApiUrl();
    if (!apiUrl || !data?.TableName) {
      showError("Configuración de tabla inválida.");
      setError("Configuración de tabla inválida.");
      setInternalIsLoading(false);
      return;
    }

    const {
      code,
      subjectId: newSubjectId,
      professorId: newProfessorId,
    } = newRow;

    const codeValue = Number(code);
    if (!codeValue || !newSubjectId || !newProfessorId) {
      showError("Código, Materia y Profesor son requeridos.");
      setError("Código, Materia y Profesor son requeridos.");
      setInternalIsLoading(false);
      return;
    }

    const dataToSend: CreateNrcPayload = {
      code: codeValue,
      subjectId: newSubjectId,
      professorId: newProfessorId,
    };

    try {
      const response = await customFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        let errorMsg = `Error ${response.status}: Failed to add NRC`;
        try {
          const errorBody = await response.json();
          errorMsg = `Error ${response.status}: ${
            errorBody.message || errorMsg
          }`;
        } catch (e) {
          /* ignore */
        }
        throw new Error(errorMsg);
      }
      const addedRowData = await response.json();
      const addedRow = addedRowData.data || addedRowData; // Handle API response structure

      setAllRows((prevRows) => [addedRow, ...(prevRows || [])]);
      setNewRow({});
      setAddDialogOpen(false);
      showSuccess("NRC agregado exitosamente");
    } catch (err: any) {
      showError(err.message || "Error al agregar NRC.");
      setError(err.message || "Error al agregar NRC.");
      console.error("Error en handleAdd:", err);
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
    if (!editingRow || !editFormData) {
      showError("No hay fila seleccionada para editar.");
      setError("No hay fila seleccionada para editar.");
      return;
    }
    setInternalIsLoading(true);
    setError(null);

    const idValue = editingRow[primaryKeyField];
    const apiUrl = getApiUrl(idValue);

    if (!apiUrl || idValue === undefined) {
      showError("No se puede actualizar la fila (falta ID o configuración).");
      setError("No se puede actualizar la fila (falta ID o configuración).");
      setInternalIsLoading(false);
      return;
    }

    const {
      code,
      subjectId: editSubjectId,
      professorId: editProfessorId,
    } = editFormData;

    if (!code || !editSubjectId || !editProfessorId) {
      showError("Código, Materia y Profesor son requeridos.");
      setError("Código, Materia y Profesor son requeridos.");
      setInternalIsLoading(false);
      return;
    }

    if (isNaN(editSubjectId) || !editProfessorId) {
      showError("ID de Materia o Profesor inválido.");
      setError("ID de Materia o Profesor inválido.");
      setInternalIsLoading(false);
      return;
    }

    const dataToSend: UpdateNrcPayload = {
      code: code,
      subjectId: editSubjectId,
      professorId: editProfessorId,
    };

    try {
      const response = await customFetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        let errorMsg = `Error ${response.status}: Failed to update NRC`;
        try {
          const errorBody = await response.json();
          errorMsg = `Error ${response.status}: ${
            errorBody.message || errorMsg
          }`;
        } catch (e) {
          /* ignore */
        }
        throw new Error(errorMsg);
      }

      const updatedRowData = await response.json();
      const updatedRowFromApi = updatedRowData.data || updatedRowData; // Handle API response structure

      setAllRows((prevRows) =>
        (prevRows || []).map((row) =>
          row[primaryKeyField] === idValue ? updatedRowFromApi : row
        )
      );

      setEditDialogOpen(false);
      setEditingRow(null);
      setEditFormData({});
      showSuccess("NRC actualizado exitosamente");
    } catch (err: any) {
      showError(err.message || "Error al guardar cambios.");
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
    if (deletingRowId === null) {
      showError("No hay fila seleccionada para eliminar.");
      setError("No hay fila seleccionada para eliminar.");
      setDeleteDialogOpen(false);
      return;
    }

    const apiUrl = getApiUrl(deletingRowId);

    if (!apiUrl) {
      showError("No se puede eliminar la fila (configuración inválida).");
      setError("No se puede eliminar la fila (configuración inválida).");
      setDeleteDialogOpen(false);
      setDeletingRowId(null);
      return;
    }

    setInternalIsLoading(true);
    setError(null);
    let deleteSuccess = false;

    try {
      const response = await customFetch(apiUrl, { method: "DELETE" });

      if (!response.ok) {
        let errorMsg = `Error ${response.status}: Failed to delete NRC`;
        try {
          const errorBody = await response.json();
          errorMsg = `Error ${response.status}: ${
            errorBody.message || errorMsg
          }`;
        } catch (e) {
          /* ignore */
        }
        throw new Error(errorMsg);
      }

      setAllRows((prevRows) =>
        (prevRows || []).filter((row) => row[primaryKeyField] !== deletingRowId)
      );
      deleteSuccess = true;
      showSuccess("NRC eliminado exitosamente");

      const newTotalRows = (allRows?.length || 1) - 1;
      const newTotalPages = Math.ceil(newTotalRows / rowsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      } else if (newTotalRows === 0) {
        setCurrentPage(1);
      }
    } catch (err: any) {
      showError(err.message || "Error al eliminar NRC.");
      setError(err.message || "Error al eliminar NRC.");
      console.error("Error en handleConfirmDelete:", err);
    } finally {
      setInternalIsLoading(false);
      if (deleteSuccess) {
        setDeleteDialogOpen(false);
        setDeletingRowId(null);
      }
    }
  };

  return (
    <div
      className={`bg-background text-foreground min-h-screen p-4 ${
        showLoader ? "opacity-75" : ""
      }`}
    >
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-xl font-medium">
          {data?.title || "Cargando Título..."}
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
            {data && !selectsLoading && (
              <form onSubmit={handleAdd}>
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Nrc</DialogTitle>
                  <DialogDescription>
                    Ingrese los datos del nuevo NRC.
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
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="add-code" className="text-right">
                      Código
                    </Label>
                    <Input
                      id="add-code"
                      value={newRow.code || ""}
                      onChange={(e) =>
                        setNewRow((prev) => ({
                          ...prev,
                          code: Number(e.target.value),
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
                      disabled={internalIsLoading || subjectsList.length === 0}
                    >
                      <SelectTrigger className="col-span-3 w-full cursor-pointer">
                        <SelectValue placeholder="Seleccione una materia" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectsList.map((subject) => (
                          <SelectItem
                            key={subject.id}
                            className="cursor-pointer"
                            value={subject.id.toString()}
                          >
                            {subject.name} ({subject.code})
                          </SelectItem>
                        ))}
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
                          professorId: value, // professorId is string
                        }))
                      }
                      disabled={
                        internalIsLoading || professorsList.length === 0
                      }
                    >
                      <SelectTrigger className="col-span-3 w-full cursor-pointer">
                        <SelectValue placeholder="Seleccione un profesor" />
                      </SelectTrigger>
                      <SelectContent>
                        {professorsList.map((prof) => (
                          <SelectItem
                            className="cursor-pointer"
                            key={prof.id}
                            value={prof.id.toString()} // Ensure value is string
                          >
                            {prof.firstName} {prof.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
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
                    className="cursor-pointer bg-[var(--selected)] hover:bg-[var(--selected-hover)]"
                  >
                    {internalIsLoading ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </form>
            )}
            {selectsLoading && (
              <div className="p-6 text-center">Cargando opciones...</div>
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
              currentRows.map((row) => (
                <TableRow key={row[primaryKeyField]}>
                  {displayColumnKeys.map((key) => (
                    <TableCell key={key}>
                      {/* MODIFICATION FOR PROFESSOR NAME */}
                      {key === "professorFullName" && row.professor
                        ? `${row.professor.firstName} ${row.professor.lastName}`
                        : getNestedValue(row, key)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 cursor-pointer"
                          disabled={internalIsLoading || selectsLoading}
                        >
                          <span className="sr-only">Abrir menú</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleOpenEdit(row)}
                          className="cursor-pointer"
                          disabled={internalIsLoading || selectsLoading}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDelete(row)}
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
              Página {totalPages > 0 ? currentPage : 0} de {totalPages || 0}
            </span>
            <div className="flex gap-1">
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={
                  currentPage === 1 ||
                  showLoader ||
                  !allRows ||
                  allRows.length === 0
                }
                variant="outline"
                size="icon"
                className="cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={
                  currentPage === totalPages ||
                  totalPages === 0 ||
                  showLoader ||
                  !allRows ||
                  allRows.length === 0
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          {editingRow && data && !selectsLoading && (
            <form onSubmit={handleSaveEdit}>
              <DialogHeader>
                <DialogTitle>Editar {data.TableName || "Item"}</DialogTitle>
                <DialogDescription>
                  Modifique los campos según sea necesario.
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
                        code: e.target.value, // code is string here for form, API expects number
                      }))
                    }
                    className="col-span-3"
                    required
                    type="number" // ensure input type is number if API expects number
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
                    disabled={internalIsLoading || subjectsList.length === 0}
                  >
                    <SelectTrigger className="col-span-3 w-full cursor-pointer">
                      <SelectValue placeholder="Seleccione una materia" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectsList.map((subject) => (
                        <SelectItem
                          key={subject.id}
                          value={subject.id.toString()}
                          className="cursor-pointer"
                        >
                          {subject.name} ({subject.code})
                        </SelectItem>
                      ))}
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
                        professorId: value, // professorId is string
                      }))
                    }
                    disabled={internalIsLoading || professorsList.length === 0}
                  >
                    <SelectTrigger className="col-span-3 w-full cursor-pointer">
                      <SelectValue placeholder="Seleccione un profesor" />
                    </SelectTrigger>
                    <SelectContent>
                      {professorsList.map((prof) => (
                        <SelectItem
                          className="cursor-pointer"
                          key={prof.id}
                          value={prof.id.toString()} // Ensure value is string
                        >
                          {prof.firstName} {prof.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={internalIsLoading || selectsLoading}
                  className="cursor-pointer bg-[var(--selected)] hover:bg-[var(--selected-hover)]"
                >
                  {internalIsLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
          {selectsLoading && (
            <div className="p-6 text-center">Cargando opciones...</div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
              className="cursor-pointer"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-destructive-foreground cursor-pointer"
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
