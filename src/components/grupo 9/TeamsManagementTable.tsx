"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  Loader2,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  TeamRowData, 
  Props, 
  TeamFormData, 
  EstadoConfirmacion, 
  NrcInfo,
  MateriaInfo 
} from "./teams-utils";

export const TeamsManagementTable: React.FC<Props> = ({
  teams,
  paginationMeta,
  apiBaseUrl,
  isDataLoading = false,
  onPageChange,
  onLimitChange,
  refreshData,
}) => {
  // const customFetch = useFetch(); // Comentado temporalmente para usar simulación
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTeam, setNewTeam] = useState<TeamFormData>({
    nombre_equipo: "",
    id_usuario: "admin_user", // Usuario administrador por defecto
    id_edicion: 1, // Edición actual
    id_estado_confirmacion: 1, // Estado pendiente por defecto
    integrantes: [{ 
      nombre: "", 
      apellido: "", 
      correo: "", 
      codigo_estudiantil: "" 
    }],
    videojuego: {
      nombre: "",
      descripcion: "",
      logo_url: "",
    },
    nrc_info: undefined,
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamRowData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  
  // Estados para miembros expandibles
  const [expandedMembers, setExpandedMembers] = useState<Set<number>>(new Set());
  
  // Estados para opciones de selects
  const [estadosConfirmacion, setEstadosConfirmacion] = useState<EstadoConfirmacion[]>([]);
  const [nrcOptions, setNrcOptions] = useState<NrcInfo[]>([]);
  const [materiasOptions, setMateriasOptions] = useState<MateriaInfo[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const showLoader = isDataLoading || internalIsLoading;

  const showError = (errorMessage: string) => {
    toast.error(errorMessage);
  };

  // Función para alternar la vista de miembros
  const toggleMembersExpansion = (teamId: number) => {
    const newExpanded = new Set(expandedMembers);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedMembers(newExpanded);
  };

  // Cargar opciones de selects al montar el componente
  useEffect(() => {
    const loadSelectOptions = async () => {
      setIsLoadingOptions(true);
      try {
        // Simular carga de opciones
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Estados de confirmación mock
        setEstadosConfirmacion([
          { id_estado: 1, estado: "pendiente", activo: true },
          { id_estado: 2, estado: "confirmado", activo: true },
          { id_estado: 3, estado: "expirado", activo: true },
          { id_estado: 4, estado: "rechazado", activo: true },
        ]);

        // NRCs mock
        setNrcOptions([
          { id_nrc: 1, codigo: 12345, id_materia: 1, id_profesor: "prof_001" },
          { id_nrc: 2, codigo: 12346, id_materia: 1, id_profesor: "prof_001" },
          { id_nrc: 3, codigo: 12347, id_materia: 2, id_profesor: "prof_002" },
        ]);

        // Materias mock
        setMateriasOptions([
          { id_materia: 1, nombre: "Programación de Videojuegos", codigo: "PROG001", semestre: 6 },
          { id_materia: 2, nombre: "Desarrollo de Software", codigo: "DES001", semestre: 5 },
        ]);
      } catch (err) {
        console.error("Error loading select options:", err);
      } finally {
        setIsLoadingOptions(false);
      }
    };
    
    loadSelectOptions();
  }, []);

  // Función para simular llamadas al API
  const simulateApiCall = async (endpoint: string, method: string, _data?: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    switch (method) {
      case 'POST':
        return {
          ok: true,
          status: 201,
          json: async () => ({ 
            message: "Equipo creado exitosamente",
            id_equipo: Math.floor(Math.random() * 1000) + 100
          })
        };
        
      case 'PATCH':
        if (endpoint.includes('/status')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ message: "Estado actualizado exitosamente" })
          };
        } else {
          return {
            ok: true,
            status: 200,
            json: async () => ({ message: "Equipo actualizado exitosamente" })
          };
        }
        
      case 'DELETE':
        return {
          ok: true,
          status: 200,
          json: async () => ({ message: "Equipo eliminado exitosamente" })
        };
        
      default:
        return {
          ok: false,
          status: 404,
          json: async () => ({ message: "Endpoint no encontrado" })
        };
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendiente: { variant: "secondary" as const, text: "Pendiente" },
      confirmado: { variant: "default" as const, text: "Confirmado" },
      expirado: { variant: "destructive" as const, text: "Expirado" },
      rechazado: { variant: "destructive" as const, text: "Rechazado" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendiente;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  // Función para cambiar estado de equipo
  const handleStatusChange = async (teamId: number, newStatus: string) => {
    setInternalIsLoading(true);
    try {
      const response = await simulateApiCall(
        `${apiBaseUrl}/teams/${teamId}/status`,
        'PATCH',
        { estado: newStatus }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al cambiar el estado.");
      }

      toast.success(`Estado cambiado a ${newStatus} exitosamente.`);
      refreshData();
    } catch (err: any) {
      showError(err.message || "Error al cambiar el estado.");
    } finally {
      setInternalIsLoading(false);
    }
  };

  const columnsToDisplay = [
    {
      key: "teamInfo",
      label: "Equipo",
      renderCell: (team: TeamRowData) => (
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={team.videojuego.logo_url} alt={team.nombre_equipo} />
            <AvatarFallback>{team.nombre_equipo.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{team.nombre_equipo}</div>
            <div className="text-sm text-muted-foreground">{team.videojuego.nombre}</div>
            <div className="text-xs text-muted-foreground">
              Registrado: {new Date(team.fecha_registro).toLocaleDateString()}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "members",
      label: "Miembros",
      renderCell: (team: TeamRowData) => {
        const isExpanded = expandedMembers.has(team.id_equipo);
        
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleMembersExpansion(team.id_equipo)}
                className="h-6 px-2 text-xs"
              >
                <Users className="w-3 h-3 mr-1" />
                {team.integrantes.length} miembro{team.integrantes.length !== 1 ? 's' : ''}
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3 ml-1" />
                ) : (
                  <ChevronDown className="w-3 h-3 ml-1" />
                )}
              </Button>
            </div>
            
            {isExpanded && (
              <div className="ml-4 space-y-1 max-h-32 overflow-y-auto">
                {team.integrantes.map((integrante) => (
                  <div key={integrante.id_integrante} className="text-xs bg-muted/50 p-2 rounded">
                    <div className="font-medium">
                      {integrante.nombre} {integrante.apellido}
                    </div>
                    <div className="text-muted-foreground">{integrante.correo}</div>
                    <div className="text-muted-foreground">
                      Código: {integrante.codigo_estudiantil}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "academicInfo",
      label: "Información Académica",
      renderCell: (team: TeamRowData) => (
        <div className="text-sm space-y-1">
          {team.nrc_info && (
            <div className="flex items-center gap-2">
              <span className="font-medium">NRC:</span>
              <Badge variant="default">
                {team.nrc_info.codigo}
              </Badge>
            </div>
          )}
          
          {team.materia_info && (
            <div>
              <span className="font-medium">Materia:</span> {team.materia_info.nombre}
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            Edición: {team.id_edicion}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Estado",
      renderCell: (team: TeamRowData) => (
        <div className="space-y-2">
          <div>{getStatusBadge(team.estado_nombre)}</div>
          
          <Select
            value={team.estado_nombre}
            onValueChange={(newStatus) => handleStatusChange(team.id_equipo, newStatus)}
            disabled={internalIsLoading}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {estadosConfirmacion.map((estado) => (
                <SelectItem key={estado.id_estado} value={estado.estado}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      estado.estado === 'confirmado' ? 'bg-green-500' :
                      estado.estado === 'pendiente' ? 'bg-gray-400' :
                      estado.estado === 'expirado' ? 'bg-red-500' :
                      'bg-red-600'
                    }`}></div>
                    {estado.estado}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Fecha de Registro",
      renderCell: (team: TeamRowData) => (
        <div className="text-sm">
          <div>{new Date(team.fecha_registro).toLocaleDateString()}</div>
          <div className="text-muted-foreground text-xs">
            {new Date(team.fecha_registro).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
  ];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalIsLoading(true);

    try {
      if (!newTeam.nombre_equipo.trim()) {
        throw new Error("El campo Nombre del Equipo es requerido.");
      }
      if (!newTeam.videojuego.nombre.trim()) {
        throw new Error("El campo Nombre del Videojuego es requerido.");
      }
      if (!newTeam.videojuego.descripcion.trim()) {
        throw new Error("El campo Descripción del Videojuego es requerido.");
      }

      // Simular llamada al API
      const response = await simulateApiCall(`${apiBaseUrl}/teams`, 'POST', newTeam);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear el equipo.");
      }

      // Resetear formulario
      setNewTeam({
        nombre_equipo: "",
        id_usuario: "admin_user",
        id_edicion: 1,
        id_estado_confirmacion: 1,
        integrantes: [{ 
          nombre: "", 
          apellido: "", 
          correo: "", 
          codigo_estudiantil: "" 
        }],
        videojuego: {
          nombre: "",
          descripcion: "",
          logo_url: "",
        },
        nrc_info: undefined,
      });
      
      setAddDialogOpen(false);
      toast.success("Equipo agregado exitosamente.");
      onPageChange(1);
      refreshData();
    } catch (err: any) {
      showError(err.message || "Error al agregar el equipo.");
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    setInternalIsLoading(true);

    try {
      if (!editingTeam.nombre_equipo.trim()) {
        throw new Error("El campo Nombre del Equipo es requerido.");
      }
      if (!editingTeam.videojuego.nombre.trim()) {
        throw new Error("El campo Nombre del Videojuego es requerido.");
      }

      // Simular llamada al API
      const response = await simulateApiCall(
        `${apiBaseUrl}/teams/${editingTeam.id_equipo}`,
        'PATCH',
        {
          nombre_equipo: editingTeam.nombre_equipo,
          videojuego: {
            nombre: editingTeam.videojuego.nombre,
            descripcion: editingTeam.videojuego.descripcion,
            logo_url: editingTeam.videojuego.logo_url,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el equipo.");
      }

      setEditDialogOpen(false);
      setEditingTeam(null);
      toast.success("Equipo actualizado exitosamente.");
      refreshData();
    } catch (err: any) {
      showError(err.message || "Error al actualizar el equipo.");
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setInternalIsLoading(true);
    try {
      // Simular llamada al API
      const response = await simulateApiCall(
        `${apiBaseUrl}/teams/${deletingId}/delete`,
        'PATCH'
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al eliminar el equipo.");
      }

      setDeleteDialogOpen(false);
      setDeletingId(null);
      toast.success("Equipo eliminado exitosamente.");
      refreshData();
    } catch (err: any) {
      showError(err.message || "Error al eliminar el equipo.");
    } finally {
      setInternalIsLoading(false);
    }
  };

  return (
    <div
      className={`bg-background text-foreground min-h-screen p-4 ${
        showLoader ? "opacity-75" : ""
      }`}
    >
      {/* Encabezado (Título y Botón Agregar) */}
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-xl font-medium">Equipos Inscritos</h1>

        {/* Botón Agregar */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-card hover:bg-accent text-foreground"
              disabled={showLoader}
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Equipo</DialogTitle>
                <DialogDescription>
                  Complete los datos del nuevo equipo.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 px-6">
                {/* Información del Equipo */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-teamName" className="text-right">
                    Nombre del Equipo
                  </Label>
                  <Input
                    id="add-teamName"
                    value={newTeam.nombre_equipo}
                    onChange={(e) =>
                      setNewTeam((prev) => ({
                        ...prev,
                        nombre_equipo: e.target.value,
                      }))
                    }
                    className="col-span-3"
                    required
                    disabled={internalIsLoading}
                  />
                </div>

                {/* Información del Videojuego */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-gameName" className="text-right">
                    Nombre del Videojuego
                  </Label>
                  <Input
                    id="add-gameName"
                    value={newTeam.videojuego.nombre}
                    onChange={(e) =>
                      setNewTeam((prev) => ({
                        ...prev,
                        videojuego: {
                          ...prev.videojuego,
                          nombre: e.target.value,
                        },
                      }))
                    }
                    className="col-span-3"
                    required
                    disabled={internalIsLoading}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-gameDescription" className="text-right">
                    Descripción
                  </Label>
                  <textarea
                    id="add-gameDescription"
                    value={newTeam.videojuego.descripcion}
                    onChange={(e) =>
                      setNewTeam((prev) => ({
                        ...prev,
                        videojuego: {
                          ...prev.videojuego,
                          descripcion: e.target.value,
                        },
                      }))
                    }
                    className="col-span-3 p-2 border rounded-md"
                    rows={3}
                    required
                    disabled={internalIsLoading}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-logoUrl" className="text-right">
                    URL del Logo
                  </Label>
                  <Input
                    id="add-logoUrl"
                    value={newTeam.videojuego.logo_url}
                    onChange={(e) =>
                      setNewTeam((prev) => ({
                        ...prev,
                        videojuego: {
                          ...prev.videojuego,
                          logo_url: e.target.value,
                        },
                      }))
                    }
                    className="col-span-3"
                    disabled={internalIsLoading}
                  />
                </div>

                {/* NRC */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-nrc" className="text-right">
                    NRC
                  </Label>
                  <Select
                    value={newTeam.nrc_info?.id_nrc.toString() || ""}
                    onValueChange={(value) =>
                      setNewTeam((prev) => ({
                        ...prev,
                        nrc_info: value ? { id_nrc: parseInt(value) } : undefined,
                      }))
                    }
                    disabled={internalIsLoading || isLoadingOptions}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona un NRC" />
                    </SelectTrigger>
                    <SelectContent>
                      {nrcOptions.map((nrc) => (
                        <SelectItem key={nrc.id_nrc} value={nrc.id_nrc.toString()}>
                          {nrc.codigo} - {materiasOptions.find(m => m.id_materia === nrc.id_materia)?.nombre || 'Materia'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Estado */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-status" className="text-right">
                    Estado
                  </Label>
                  <Select
                    value={newTeam.id_estado_confirmacion.toString()}
                    onValueChange={(value) =>
                      setNewTeam((prev) => ({
                        ...prev,
                        id_estado_confirmacion: parseInt(value),
                      }))
                    }
                    disabled={internalIsLoading || isLoadingOptions}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {estadosConfirmacion.map((estado) => (
                        <SelectItem key={estado.id_estado} value={estado.id_estado.toString()}>
                          {estado.estado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  className="cursor-pointer"
                  variant="outline"
                  onClick={() => {
                    setAddDialogOpen(false);
                    setNewTeam({
                      nombre_equipo: "",
                      id_usuario: "admin_user",
                      id_edicion: 1,
                      id_estado_confirmacion: 1,
                      integrantes: [{ 
                        nombre: "", 
                        apellido: "", 
                        correo: "", 
                        codigo_estudiantil: "" 
                      }],
                      videojuego: {
                        nombre: "",
                        descripcion: "",
                        logo_url: "",
                      },
                      nrc_info: undefined,
                    });
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
                  {internalIsLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {internalIsLoading ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Card de la Tabla */}
      <Card className="rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-card border-b border-border">
            <TableRow>
              {columnsToDisplay.map(({ key, label }) => (
                <TableHead key={key}>{label}</TableHead>
              ))}
              <TableHead className="w-[50px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showLoader && (!teams || teams.length === 0) ? (
              <TableRow>
                <TableCell
                  colSpan={columnsToDisplay.length + 1}
                  className="h-24 text-center"
                >
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Cargando...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : !showLoader && (!teams || teams.length === 0) ? (
              <TableRow>
                <TableCell
                  colSpan={columnsToDisplay.length + 1}
                  className="h-24 text-center"
                >
                  No hay equipos para mostrar en esta página.
                </TableCell>
              </TableRow>
            ) : (
              teams?.map((team) => (
                <TableRow key={team.id_equipo}>
                  {columnsToDisplay.map(({ key, renderCell }) => (
                    <TableCell key={key}>{renderCell(team)}</TableCell>
                  ))}
                  <TableCell className="text-right">
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
                            setEditingTeam(team);
                            setEditDialogOpen(true);
                          }}
                          disabled={internalIsLoading}
                          className="cursor-pointer"
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setDeletingId(team.id_equipo);
                            setDeleteDialogOpen(true);
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
        
        {/* Pagination Controls */}
        {paginationMeta && paginationMeta.totalItems > 0 && (
          <div className="flex justify-between items-center p-4 text-sm border-t border-border">
            <div className="flex items-center gap-2">
              <span>Filas por página</span>
              <Select
                value={paginationMeta.itemsPerPage.toString()}
                onValueChange={(value) => {
                  onLimitChange(parseInt(value, 10));
                }}
                disabled={showLoader}
              >
                <SelectTrigger className="w-[70px] cursor-pointer">
                  <SelectValue placeholder={paginationMeta.itemsPerPage} />
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
                Página{" "}
                {paginationMeta.totalPages > 0 ? paginationMeta.currentPage : 0}{" "}
                de {paginationMeta.totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  onClick={() => onPageChange(paginationMeta.currentPage - 1)}
                  disabled={paginationMeta.currentPage === 1 || showLoader}
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => onPageChange(paginationMeta.currentPage + 1)}
                  disabled={
                    paginationMeta.currentPage === paginationMeta.totalPages ||
                    paginationMeta.totalPages === 0 ||
                    showLoader
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
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          {editingTeam && (
            <form onSubmit={handleSaveEdit}>
              <DialogHeader>
                <DialogTitle>Editar Equipo</DialogTitle>
                <DialogDescription>
                  Modifique los datos del equipo.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 px-6">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-teamName" className="text-right">
                    Nombre del Equipo
                  </Label>
                  <Input
                    id="edit-teamName"
                    value={editingTeam.nombre_equipo || ""}
                    onChange={(e) =>
                      setEditingTeam((prev) =>
                        prev ? { ...prev, nombre_equipo: e.target.value } : null
                      )
                    }
                    className="col-span-3"
                    required
                    disabled={internalIsLoading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-gameName" className="text-right">
                    Nombre del Videojuego
                  </Label>
                  <Input
                    id="edit-gameName"
                    value={editingTeam.videojuego.nombre || ""}
                    onChange={(e) =>
                      setEditingTeam((prev) =>
                        prev ? { 
                          ...prev, 
                          videojuego: {
                            ...prev.videojuego,
                            nombre: e.target.value
                          }
                        } : null
                      )
                    }
                    className="col-span-3"
                    required
                    disabled={internalIsLoading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-gameDescription" className="text-right">
                    Descripción
                  </Label>
                  <textarea
                    id="edit-gameDescription"
                    value={editingTeam.videojuego.descripcion || ""}
                    onChange={(e) =>
                      setEditingTeam((prev) =>
                        prev ? { 
                          ...prev, 
                          videojuego: {
                            ...prev.videojuego,
                            descripcion: e.target.value
                          }
                        } : null
                      )
                    }
                    className="col-span-3 p-2 border rounded-md"
                    rows={3}
                    required
                    disabled={internalIsLoading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-logoUrl" className="text-right">
                    URL del Logo
                  </Label>
                  <Input
                    id="edit-logoUrl"
                    value={editingTeam.videojuego.logo_url || ""}
                    onChange={(e) =>
                      setEditingTeam((prev) =>
                        prev ? { 
                          ...prev, 
                          videojuego: {
                            ...prev.videojuego,
                            logo_url: e.target.value
                          }
                        } : null
                      )
                    }
                    className="col-span-3"
                    disabled={internalIsLoading}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setEditingTeam(null);
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
                  {internalIsLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {internalIsLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará (o desactivará) al equipo. Confirme para
              proceder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingId(null);
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
              {internalIsLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {internalIsLoading ? "Procesando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
