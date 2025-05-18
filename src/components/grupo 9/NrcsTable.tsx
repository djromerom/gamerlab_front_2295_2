"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  Loader2, // Asegúrate que Loader2 está importado
} from "lucide-react";
import { useFetch } from "@/hooks/useFetch"; // Asume que este hook existe y funciona
import { toast } from "sonner"; // Importamos la biblioteca toast
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
  name: string; // Parece duplicado con firstName/lastName? Ajustar si es necesario
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
  isActive: boolean; // Añadido isActive por si acaso se necesita en el futuro
  semester: number; // Añadido semester por si acaso se necesita en el futuro
}

// RowData específica para NRC
export interface RowData {
  id: number; // Clave primaria
  code: string;
  professorId: string;
  subjectId: number;
  professor: Professor; // Objeto anidado
  subject: Subject; // Objeto anidado
  members: Member[]; // Array anidado (no se usa directamente en columnas pero existe)
  createdAt: string;
  updatedAt: string;
  // No hay 'isActive' aquí, como se solicitó
}

// Payload para Crear NRC
interface CreateNrcPayload {
  code: number;
  professorId: string;
  subjectId: number;
}

// Payload para Actualizar NRC
interface UpdateNrcPayload {
  code?: string;
  professorId?: string;
  subjectId?: number;
}

// Data específica pasada desde NrcsPage
export interface Data {
  title: string; // antes titulo
  TableName: string; // antes nombreTabla (debe ser "nrcs")
  columns: Record<string, string>; // antes nombreColumnas
  rows: RowData[]; // antes filas
  // No hay primaryKey explícito, usaremos 'id' por defecto
}

interface Props {
  data: Data | null;
  apiBaseUrl: string;
  isDataLoading?: boolean; // Recibe estado de carga inicial
}

// --- Helper para obtener valores anidados ---
const getNestedValue = (obj: any, path: string): any => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};
// --- Fin Helper ---

export const NrcsTable: React.FC<Props> = ({
  data,
  apiBaseUrl,
  isDataLoading = false,
}) => {
  const customFetch = useFetch();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  // Usa los nombres de props de la interfaz Data: data?.rows
  const [allRows, setAllRows] = useState<RowData[]>(data?.rows || []);
  const [currentRows, setCurrentRows] = useState<RowData[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  // Estado para el formulario de agregar (usará IDs)
  const [newRow, setNewRow] = useState<Partial<CreateNrcPayload>>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  // Estado para el formulario de editar (RowData completa + cambios)
  const [editingRow, setEditingRow] = useState<RowData | null>(null);
  // Estado temporal para los campos de edición (usará IDs)
  const [editFormData, setEditFormData] = useState<Partial<UpdateNrcPayload>>(
    {}
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRowId, setDeletingRowId] = useState<number | null>(null); // Guarda el ID a eliminar
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Listas para Selects (¡IMPORTANTE!) ---
  // Necesitarás obtener estas listas de alguna manera para los formularios Add/Edit
  // Aquí hay placeholders, DEBES implementar la carga real
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [professorsList, setProfessorsList] = useState<Professor[]>([]);
  const [selectsLoading, setSelectsLoading] = useState(false);

  // Función para mostrar errores como toast
  const showError = (errorMessage: string) => {
    toast.error(errorMessage);
  };

  // Función para mostrar mensajes de éxito como toast
  const showSuccess = (successMessage: string) => {
    toast.success(successMessage);
  };

  // TODO: Implementar fetch para subjects y professors al montar o al abrir diálogos
  useEffect(() => {
    const fetchSelectData = async () => {
      setSelectsLoading(true);
      try {
        // Asume que tienes endpoints para obtener listas activas
        const [subjectsRes, professorsRes] = await Promise.all([
          customFetch(`${apiBaseUrl}/subjects/select-options`), // O como obtengas solo activos
          customFetch(`${apiBaseUrl}/professors/select-options`), // O como obtengas solo activos
        ]);

        if (!subjectsRes.ok || !professorsRes.ok) {
          throw new Error("Failed to load data for selects");
        }

        const subjectsData: Subject[] = await subjectsRes.json();
        const professorsData: Professor[] = await professorsRes.json();

        setSubjectsList(subjectsData || []);
        setProfessorsList(professorsData || []);
      } catch (err: any) {
        console.error("Error fetching select data:", err);
        showError("Error al cargar datos para formularios."); // Usamos toast para mostrar errores
        setError("Error al cargar datos para formularios."); // Mantén el estado de error para los formularios
      } finally {
        setSelectsLoading(false);
      }
    };
    fetchSelectData();
  }, [apiBaseUrl, customFetch]); // Dependencias

  const showLoader = isDataLoading || internalIsLoading || selectsLoading; // Incluir selectsLoading

  // La clave primaria es 'id' según la interfaz RowData
  const primaryKeyField = "id";

  // Usa los nombres de props de la interfaz Data: data?.columns
  const columnEntries = data ? Object.entries(data.columns) : [];
  const displayColumnKeys = columnEntries.map(([key]) => key); // Todas las keys definidas en columns
  const columnNames = data?.columns || {};

  const totalPages = Math.ceil(allRows.length / rowsPerPage);

  const getApiUrl = (id?: number | string) => {
    // Usa los nombres de props de la interfaz Data: data?.TableName
    if (!data?.TableName) return "";
    let url = `${apiBaseUrl}/${data.TableName}`; // TableName debe ser "nrcs"
    if (id !== undefined) {
      url += `/${id}`;
    }
    return url;
  };

  // Efecto para actualizar allRows cuando data?.rows cambie
  useEffect(() => {
    // Usa los nombres de props de la interfaz Data: data?.rows
    if (data?.rows && data.rows !== allRows) {
      setAllRows(data.rows);
    }
    if (data === null && allRows.length > 0) {
      setAllRows([]);
    }
  }, [data]); // Depende de la prop data

  // Efecto para paginación (sin cambios lógicos, solo usa allRows)
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
      setCurrentPage(1); // Reset a 1 si no hay filas
    }
  }, [currentPage, rowsPerPage, allRows]);

  // --- Funciones CRUD Adaptadas ---

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

    // Validación
    const {
      code,
      subjectId: newSubjectId,
      professorId: newProfessorId,
    } = newRow;

    const codeValue = Number(code); // Asegúrate de que sea un número
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
      const addedRow: RowData = await response.json();
      // Añadir al PRINCIPIO de la lista para visibilidad inmediata
      setAllRows((prevRows) => [addedRow, ...(prevRows || [])]);
      setNewRow({}); // Resetear formulario
      setAddDialogOpen(false);
      showSuccess("NRC agregado exitosamente"); // Notificación de éxito
    } catch (err: any) {
      showError(err.message || "Error al agregar NRC.");
      setError(err.message || "Error al agregar NRC.");
      console.error("Error en handleAdd:", err);
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleOpenEdit = (row: RowData) => {
    setEditingRow(row); // Guarda la fila original completa
    // Pre-popula el estado del formulario con los datos actuales (IDs)
    setEditFormData({
      code: row.code,
      subjectId: row.subjectId,
      professorId: row.professorId,
    });
    setEditDialogOpen(true);
    setError(null); // Limpia errores previos
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

    const idValue = editingRow[primaryKeyField]; // ID del NRC a editar
    const apiUrl = getApiUrl(idValue);

    if (!apiUrl || idValue === undefined) {
      showError("No se puede actualizar la fila (falta ID o configuración).");
      setError("No se puede actualizar la fila (falta ID o configuración).");
      setInternalIsLoading(false);
      return;
    }

    // Validación (similar a handleAdd)
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

    // Crear payload solo con los campos necesarios para PATCH
    const dataToSend: UpdateNrcPayload = {
      code: code, // Siempre enviar código? o solo si cambia? Depende de API
      subjectId: editSubjectId,
      professorId: editProfessorId,
    };

    try {
      const response = await customFetch(apiUrl, {
        method: "PATCH", // o PUT si reemplaza todo el recurso
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

      const updatedRowFromApi: RowData = await response.json();

      // Actualizar la fila en allRows
      setAllRows((prevRows) =>
        (prevRows || []).map((row) =>
          row[primaryKeyField] === idValue ? updatedRowFromApi : row
        )
      );

      setEditDialogOpen(false);
      setEditingRow(null); // Limpiar fila en edición
      setEditFormData({}); // Limpiar datos del form de edición
      showSuccess("NRC actualizado exitosamente"); // Notificación de éxito
    } catch (err: any) {
      showError(err.message || "Error al guardar cambios.");
      setError(err.message || "Error al guardar cambios.");
      console.error("Error en handleSaveEdit:", err);
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleOpenDelete = (row: RowData) => {
    setDeletingRowId(row[primaryKeyField]); // Guarda el ID de la fila a eliminar
    setDeleteDialogOpen(true);
    setError(null); // Limpia errores previos
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

      // Éxito - eliminar de allRows por ID
      setAllRows((prevRows) =>
        (prevRows || []).filter((row) => row[primaryKeyField] !== deletingRowId)
      );
      deleteSuccess = true;
      console.log("NRC eliminado (ID):", deletingRowId);
      showSuccess("NRC eliminado exitosamente"); // Notificación de éxito

      // Reajustar paginación si es necesario
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
        setDeletingRowId(null); // Limpiar ID a eliminar
      }
      // Si hay error, el diálogo permanece abierto para mostrarlo
    }
  };

  // --- Renderizado del Componente ---
  return (
    <div
      className={`bg-background text-foreground min-h-screen p-4 ${
        showLoader ? "opacity-75" : ""
      }`}
    >
      {/* Encabezado (Título y Botón Agregar) */}
      <div className="flex justify-between items-center mb-6 px-4">
        {/* Usa data?.title */}
        <h1 className="text-xl font-medium">
          {data?.title || "Cargando Título..."}
        </h1>

        {/* Botón Agregar */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-card hover:bg-accent text-foreground cursor-pointer"
              // Deshabilitar si no hay datos O si está cargando (inicial, crud o selects)
              disabled={!data || showLoader}
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar
            </Button>
          </DialogTrigger>
          <DialogContent>
            {/* Solo muestra si hay data (para TableName) y las listas de selects están cargadas */}
            {data && !selectsLoading && (
              <form onSubmit={handleAdd}>
                <DialogHeader>
                  {/* Usa data?.TableName */}
                  <DialogTitle>Agregar Nuevo Nrc</DialogTitle>
                  <DialogDescription>
                    Ingrese los datos del nuevo NRC.
                  </DialogDescription>
                </DialogHeader>
                {/* Error del formulario */}
                {error && !internalIsLoading && (
                  <div className="px-6 py-2">
                    <p className="text-sm text-red-600 dark:text-red-500">
                      {error}
                    </p>
                  </div>
                )}
                <div className="grid gap-4 py-4 px-6">
                  {/* Campo Código */}
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
                      disabled={internalIsLoading}
                    />
                  </div>
                  {/* Campo Materia (Select) */}
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
                  {/* Campo Profesor (Select) */}
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
                      disabled={
                        internalIsLoading || professorsList.length === 0
                      }
                    >
                      <SelectTrigger className="col-span-3 w-full cursor-pointer">
                        <SelectValue placeholder="Seleccione un profesor" />
                      </SelectTrigger>
                      <SelectContent>
                        {professorsList.map((prof) => (
                          <SelectItem className="cursor-pointer" key={prof.id} value={prof.id.toString()}>
                            {prof.name}
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
            {/* Mensaje si los selects aún están cargando */}
            {selectsLoading && (
              <div className="p-6 text-center">Cargando opciones...</div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Card de la Tabla */}
      <Card className="rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-card border-b border-border">
            <TableRow>
              {/* Renderiza encabezados usando displayColumnKeys y columnNames */}
              {displayColumnKeys.map((key) => (
                <TableHead key={key}>{columnNames[key] || key}</TableHead>
              ))}
              <TableHead className="w-[50px]" /> {/* Actions */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {showLoader ? ( // Loader combinado (inicial, crud, selects)
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
            ) : allRows && allRows.length === 0 ? ( // Sin resultados
              <TableRow>
                <TableCell
                  colSpan={displayColumnKeys.length + 1}
                  className="h-24 text-center"
                >
                  No hay resultados.
                </TableCell>
              </TableRow>
            ) : (
              // Filas de datos
              currentRows.map((row) => (
                // Usa primaryKeyField para la key
                <TableRow key={row[primaryKeyField]}>
                  {/* Itera sobre las *keys* definidas en columns */}
                  {displayColumnKeys.map((key) => (
                    // Usa el helper para obtener valor (simple o anidado)
                    <TableCell key={key}>{getNestedValue(row, key)}</TableCell>
                  ))}
                  <TableCell>
                    {/* Menú de Acciones */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 cursor-pointer"
                          disabled={internalIsLoading || selectsLoading} // Deshabilitar si carga CRUD o selects
                        >
                          <span className="sr-only">Abrir menú</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleOpenEdit(row)}
                          className="cursor-pointer"
                          disabled={internalIsLoading || selectsLoading} // Deshabilitar si carga
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDelete(row)}
                          className="text-red-500 focus:text-red-600 focus:bg-red-100 cursor-pointer"
                          disabled={internalIsLoading} // Solo deshabilitar en carga CRUD
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
                setCurrentPage(1); // Volver a pág 1 al cambiar tamaño
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

      {/* Dialog Editar */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          {/* Necesita editingRow, data (para TableName) y listas cargadas */}
          {editingRow && data && !selectsLoading && (
            <form onSubmit={handleSaveEdit}>
              <DialogHeader>
                <DialogTitle>Editar {data.TableName || "Item"}</DialogTitle>
                <DialogDescription>
                  Modifique los campos según sea necesario.
                </DialogDescription>
              </DialogHeader>
              {/* Error del formulario */}
              {error && !internalIsLoading && (
                <div className="px-6 py-2">
                  <p className="text-sm text-red-600 dark:text-red-500">
                    {error}
                  </p>
                </div>
              )}
              <div className="grid gap-4 py-4 px-6">
                {/* Campo Código */}
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
                    disabled={internalIsLoading}
                  />
                </div>
                {/* Campo Materia (Select) */}
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
                {/* Campo Profesor (Select) */}
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
                    disabled={internalIsLoading || professorsList.length === 0}
                  >
                    <SelectTrigger className="col-span-3 w-full cursor-pointer">
                      <SelectValue placeholder="Seleccione un profesor" />
                    </SelectTrigger>
                    <SelectContent>
                      {professorsList.map((prof) => (
                        <SelectItem className="cursor-pointer" key={prof.id} value={prof.id.toString()}>
                          {prof.name}
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
                    setEditingRow(null); // Limpiar fila original
                    setEditFormData({}); // Limpiar form data
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
          {/* Mensaje si los selects aún están cargando */}
          {selectsLoading && (
            <div className="p-6 text-center">Cargando opciones...</div>
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
              el NRC seleccionado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {/* Muestra error del dialog */}
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
                setDeletingRowId(null); // Limpia ID
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
