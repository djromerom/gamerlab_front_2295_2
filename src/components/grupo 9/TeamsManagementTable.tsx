import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  Loader2,
  Users,
  ChevronDown,
  MailCheck,
  MailWarning,
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  TeamRowData,
  Props,
  EstadoVideojuego,
  NrcInfo,
  MateriaInfo,
} from "./teams-utils";

import TeamWizardDialog, {
  WizardValues,
  toInitialValuesFromTeam,
} from "./TeamWizardDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";

/* ────────────────────────────────────────────────────────────────────
   Tabla principal + uso del Wizard
──────────────────────────────────────────────────────────────────── */
export const TeamsManagementTable: React.FC<Props> = ({
  teams,
  paginationMeta,
  apiBaseUrl,
  isDataLoading = false,
  onPageChange,
  onLimitChange,
  refreshData,
}) => {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardInitial, setWizardInitial] = useState<
    Partial<WizardValues> | undefined
  >(undefined);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [expandedMembers, setExpandedMembers] = useState<Set<number>>(
    new Set()
  );

  const [estadosVideojuego, setEstadosVideojuego] = useState<
    EstadoVideojuego[]
  >([]);
  const [nrcOptions, setNrcOptions] = useState<NrcInfo[]>([]);
  const [materiasOptions, setMateriasOptions] = useState<MateriaInfo[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [openInfoTeamId, setOpenInfoTeamId] = useState<number | null>(null);


  const showLoader = isDataLoading || internalIsLoading;
  const showError = (msg: string) => toast.error(msg);

  useEffect(() => {
    const load = async () => {
      setIsLoadingOptions(true);
      try {
        // TODO: reemplazar por fetch reales a tu API
        await new Promise((r) => setTimeout(r, 300));
        setEstadosVideojuego([
          { id_estado: 1, estado: "confirmado", activo: true },
          { id_estado: 2, estado: "pendiente", activo: true },
          { id_estado: 3, estado: "rechazado", activo: true }
        ]);
        setNrcOptions([
          { id_nrc: 1, codigo: 12345, id_materia: 1, id_profesor: "prof_001" },
          { id_nrc: 2, codigo: 12346, id_materia: 1, id_profesor: "prof_001" },
          { id_nrc: 3, codigo: 12347, id_materia: 2, id_profesor: "prof_002" },
        ]);
        setMateriasOptions([
          {
            id_materia: 1,
            nombre: "Programación de Videojuegos",
            codigo: "PROG001",
            semestre: 6,
          },
          {
            id_materia: 2,
            nombre: "Desarrollo de Software",
            codigo: "DES001",
            semestre: 5,
          },
        ]);
      } finally {
        setIsLoadingOptions(false);
      }
    };
    load();
  }, []);

  const toggleMembersExpansion = (teamId: number) => {
    const s = new Set(expandedMembers);
    s.has(teamId) ? s.delete(teamId) : s.add(teamId);
    setExpandedMembers(s);
  };

  const getStatusBadge = (statusId: number) => {
    const map = {
      1: { variant: "default" as const, text: "Confirmado" },
      2: { variant: "secondary" as const, text: "Pendiente" },
      3: { variant: "destructive" as const, text: "Rechazado" },
    };
    const c = (map as any)[statusId] || map[2];
    return <Badge variant={c.variant}>{c.text}</Badge>;
  };

  async function resendInvite(email: string) {
    setInternalIsLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/resend-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "No se pudo reenviar el correo");
      }
      toast.success("Correo de confirmación reenviado");
    } catch (e: any) {
      toast.error(e?.message || "Error al reenviar");
    } finally {
      setInternalIsLoading(false);
    }
  }

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
            <div className="text-sm text-muted-foreground">
              {team.videojuego.nombre}
            </div>
          </div>
        </div>
      ),
    },
    // Reemplaza las columnas "members" y "academicInfo" por esta columna:
    {
      key: "memberInfo",
      label: "Información miembros",
      renderCell: (team: TeamRowData) => {
        const isOpen = openInfoTeamId === team.id_equipo;

        return (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setOpenInfoTeamId(team.id_equipo)}
            >
              <Users className="w-3 h-3 mr-1" />
              Ver {team.integrantes.length} miembro
              {team.integrantes.length !== 1 ? "s" : ""} y datos académicos
            </Button>

            <Dialog open={isOpen} onOpenChange={(open) => !open && setOpenInfoTeamId(null)}>
              <DialogContent className="max-w-lg w-full">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={team.videojuego.logo_url} alt={team.nombre_equipo} />
                      <AvatarFallback>{team.nombre_equipo.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold">{team.nombre_equipo}</span>
                      <span className="text-xs text-muted-foreground">{team.videojuego.nombre}</span>
                    </div>
                  </DialogTitle>
                  <DialogDescription>Detalles de miembros y datos académicos</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Información académica */}
                  <div className="rounded-lg border p-3">
                    <div className="text-sm space-y-1">
                      {team.nrc_info && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">NRC:</span>
                          <Badge variant="default">{team.nrc_info.codigo}</Badge>
                        </div>
                      )}
                      {team.materia_info && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Materia:</span>
                          <span>{team.materia_info.nombre}</span>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Edición: {team.id_edicion}
                      </div>
                    </div>
                  </div>

                  {/* Miembros */}
                  <div className="rounded-lg border">
                    <div className="px-3 py-2 text-sm font-medium border-b">
                      Miembros ({team.integrantes.length})
                    </div>
                    <div className="max-h-64 overflow-y-auto p-3 space-y-2">
                      {team.integrantes.map((integrante) => (
                        <div
                          key={integrante.id_integrante}
                          className="text-xs bg-muted/50 p-2 rounded"
                        >
                          <div className="font-medium">
                            {integrante.nombre} {integrante.apellido}
                          </div>
                          <div className="text-muted-foreground">{integrante.correo}</div>
                          {integrante.codigo_estudiantil && (
                            <div className="text-muted-foreground">
                              Código: {integrante.codigo_estudiantil}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenInfoTeamId(null)}>
                    Cerrar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        );
      },
    },

    {
      key: "emailConfirm",
      label: "Confirmación del Lider",
      renderCell: (team: TeamRowData) => {
        const primaryEmail = team.integrantes?.[0]?.correo;
        const confirmed = (team as any).id_estado_confirmacion;

        const confirmationLabel =
          confirmed === 1 ? "Confirmado" :
            confirmed === 2 ? "Pendiente" :
              confirmed === 3 ? "Expirado" :
                "Desconocido";

        return (
          <div className="flex items-center gap-2">
            <Badge variant={confirmed === 1 ? "default" : "secondary"}>
              {confirmationLabel}
            </Badge>

            <Button
              size="sm"
              variant="outline"
              className="h-7"
              onClick={() => resendInvite(primaryEmail)}
              disabled={internalIsLoading}
            >
              Reenviar correo
            </Button>

          </div>
        );
      },
    },
    // ...existing code...
    {
      key: "status",
      label: "Estado Videojuego",
      renderCell: (team: TeamRowData) => {
        const idEstadoVideojuego = team.videojuego.id_estado_videojuego;

        // Opciones fijas para el estado del videojuego (1:Confirmado, 2:Pendiente, 3:Rechazado)
        const estadoOptions = [
          { id_estado: 1, estado: "Confirmado" },
          { id_estado: 2, estado: "Pendiente" },
          { id_estado: 3, estado: "Rechazado" },
        ];

        return (
          <div className="space-y-2">
            {/* Mostrar badge basado en el id real del videojuego */}
            <div>{getStatusBadge(idEstadoVideojuego)}</div>

            <Select
              value={String(idEstadoVideojuego)}
              onValueChange={async (newStatus) => {
                const numericStatus = parseInt(newStatus, 10);
                setInternalIsLoading(true);
                try {
                  const res = await fetch(
                    `${apiBaseUrl}/teams/${team.id_equipo}/status`,
                    {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ estado: numericStatus }),
                    }
                  );
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err?.message || "Error al cambiar el estado.");
                  }
                  toast.success(`Estado cambiado a ${estadoOptions.find(o => o.id_estado === numericStatus)?.estado || numericStatus}.`);
                  refreshData();
                } catch (err: any) {
                  showError(err.message || "Error al cambiar el estado.");
                } finally {
                  setInternalIsLoading(false);
                }
              }}
              disabled={internalIsLoading}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {estadoOptions.map((estado) => (
                  <SelectItem key={estado.id_estado} value={String(estado.id_estado)}>
                    {estado.estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      },
    },
// ...existing code...,
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

  const handleOpenAdd = () => {
    setWizardInitial({
      mode: "add",
      isExternal: false,
      nombre_equipo: "",
      videojuego: {
        nombre: "",
        descripcion: "",
        logo_url: "",
        video_demo_url: "",
      },
      integrantes: [
        {
          nombre: "",
          apellido: "",
          correo: "",
          codigo_estudiantil: "",
          nrcIds: [],
        },
      ],
    });
    setWizardOpen(true);
  };

  const handleOpenEdit = (team: TeamRowData) => {
    const initial = toInitialValuesFromTeam(
      team,
      (team as any).isExternal ?? false
    );
    setWizardInitial(initial);
    setWizardOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setInternalIsLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/teams/${deletingId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Error al eliminar el equipo.");
      }
      setDeleteDialogOpen(false);
      setDeletingId(null);
      toast.success("Equipo eliminado exitosamente.");
      refreshData();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar el equipo.");
    } finally {
      setInternalIsLoading(false);
    }
  };

  return (
    <div
      className={`bg-background text-foreground min-h-screen p-4 ${showLoader ? "opacity-75" : ""
        }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-xl font-medium">Equipos Inscritos</h1>

        {/* Botón Agregar -> abre el Wizard */}
        <Button
          variant="outline"
          className="bg-card hover:bg-accent text-foreground"
          disabled={showLoader}
          onClick={handleOpenAdd}
        >
          <Plus className="mr-2 h-4 w-4" /> Agregar
        </Button>

        {/* Wizard (add/edit) */}
        <TeamWizardDialog
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          apiBaseUrl={apiBaseUrl}
          nrcOptions={nrcOptions}
          materiasOptions={materiasOptions}
          initialData={wizardInitial}
          onSuccess={() => {
            onPageChange(1);
            refreshData();
          }}
        />
      </div>

      {/* Tabla */}
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
                          onClick={() => handleOpenEdit(team)}
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

        {/* Paginación */}
        {paginationMeta && paginationMeta.totalItems > 0 && (
          <div className="flex justify-between items-center p-4 text-sm border-t border-border">
            <div className="flex items-center gap-2">
              <span>Filas por página</span>
              <Select
                value={paginationMeta.itemsPerPage.toString()}
                onValueChange={(value) => onLimitChange(parseInt(value, 10))}
                disabled={showLoader}
              >
                <SelectTrigger className="w-[70px] cursor-pointer">
                  <SelectValue placeholder={paginationMeta.itemsPerPage} />
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

      {/* Eliminar */}
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
