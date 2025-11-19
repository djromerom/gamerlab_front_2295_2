import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreVertical, Plus, Loader2, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TeamRowData, Props, NrcInfo, MateriaInfo } from "./teams-utils";
import TeamWizardDialog, { toInitialValuesFromTeam } from "./TeamWizardDialog";
import type { WizardValues } from "./validationTeamsAdmin";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";


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
  statusEmailLeader,
}) => {

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardInitial, setWizardInitial] = useState<Partial<WizardValues> | undefined>(undefined);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [internalIsLoading, setInternalIsLoading] = useState(false);

  const [nrcOptions] = useState<NrcInfo[]>([]);
  const [materiasOptions, setMateriasOptions] = useState<MateriaInfo[]>([]);
  const [openInfoTeamId, setOpenInfoTeamId] = useState<number | null>(null);

  // filtro (all | external | uninorte)
  const [externalFilter, setExternalFilter] = useState<"all" | "external" | "uninorte">("all");

  // Responsive header: detectar móvil para mostrar título + dropdown + agregar
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    try { return window.innerWidth < 768; } catch { return false; }
  });
  const handleResize = useCallback(() => setIsMobile(window.innerWidth < 768), []);
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  const showLoader = isDataLoading || internalIsLoading;
  const showError = (msg: string) => toast.error(msg);

  const safeFecha = (team: TeamRowData) => team?.fecha_registro ?? new Date().toISOString();


  const API_ENDPOINT = `${import.meta.env.VITE_ENDPOINT_BACKEND}/subjects`;

  useEffect(() => {
    const load = async () => {
      //setIsLoadingOptions(true);
      try {
        const res = await fetch(API_ENDPOINT, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          let errorMsg = `Error ${res.status}: Failed to fetch subjects`;
          try {
            const errorBody = await res.json();
            errorMsg = `Error ${res.status}: ${errorBody.message || errorMsg}`;
          } catch (e) {
            console.log(e);
          }
          throw new Error(errorMsg);
        }
        const apiResponseObject = await res.json();

        console.log("API Response for subjects:", apiResponseObject);

        const materiasData: MateriaInfo[] = apiResponseObject.data.map((materia: any) => ({
          id: materia.id ?? materia.id_materia,
          name: materia.name ?? materia.nombre,
          code: materia.code ?? materia.codigo,
          semester: materia.semester ?? materia.semestre,
        }));

        setMateriasOptions(materiasData);
        console.log("Fetched subjects:", materiasData);

      } catch (err) {
        console.error("Error fetching subjects:", err);
        console.log("Error fetching subjects:", err);
        setMateriasOptions([]);

      } finally {
        //setIsLoadingOptions(false);
      }
    };
    load();
  }, [API_ENDPOINT]);

  const updateTeamStatus = async (teamId: number, status: number) => {

    const body = {
      videogame: {
        videogameStatusId: status,
      },
    };

    const res = await fetch(`${apiBaseUrl}/teams/${teamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || "Error actualizando el equipo.");
    }
    // opcional: devolver body si el backend retorna el equipo actualizado
    return res.json().catch(() => null);
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
    if (internalIsLoading) return;
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
      renderCell: (team: TeamRowData) => {
        const logo = team.videojuego?.logo_url ?? "";
        const videojuegoNombre = team.videojuego?.nombre ?? "—";
        const equipoNombre = team.nombre_equipo ?? "Equipo";

        return (
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              {logo ? (
                <AvatarImage src={logo} alt={equipoNombre} />
              ) : (
                <AvatarFallback>{equipoNombre.charAt(0) ?? "?"}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="font-medium">{equipoNombre}</div>
              <div className="text-sm text-muted-foreground">{videojuegoNombre}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "memberInfo",
      label: "Información miembros",
      renderCell: (team: TeamRowData) => {
        const isOpen = openInfoTeamId === team.id_equipo;
        const logo = team.videojuego?.logo_url ?? "";
        const videojuegoNombre = team.videojuego?.nombre ?? "—";
        const equipoNombre = team.nombre_equipo ?? "Equipo";
        const members = team.integrantes ?? [];
        const tipoEquipo = (team as any).isExternal === true ? "Externo" : "Uninorte";

        return (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setOpenInfoTeamId(team.id_equipo)}
            >
              <Users className="w-3 h-3 mr-1" />
              Ver {members.length} miembro{members.length !== 1 ? "s" : ""} y datos académicos
            </Button>

            <div>
              <Badge variant={tipoEquipo === "Externo" ? "outline" : "outline"} className="mr-1">
                {tipoEquipo}
              </Badge>
            </div>

            <Dialog open={isOpen} onOpenChange={(open) => !open && setOpenInfoTeamId(null)}>
              <DialogContent className="max-w-lg w-full">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      {logo ? (
                        <AvatarImage src={logo} alt={equipoNombre} />
                      ) : (
                        <AvatarFallback>{equipoNombre.charAt(0) ?? "?"}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold">{equipoNombre}</span>
                      <span className="text-xs text-muted-foreground">{videojuegoNombre}</span>
                    </div>
                  </DialogTitle>
                  <DialogDescription>Detalles de miembros y datos académicos</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">

                  {/* NRCs Asociados */}
                  <div className="rounded-lg border">
                    <div className="px-3 py-2 text-sm font-medium border-b">
                      NRCs Asociados
                    </div>
                    <div className="max-h-64 overflow-y-auto p-3">
                      {/* badges inline, wrapables y con espacio entre ellas */}
                      <div className="flex flex-wrap gap-2 items-center">
                        {(() => {
                          const shownNrcs = new Set<string>();
                          return members
                            .flatMap((integrante) =>
                              (integrante.nrcs ?? []).map((nrc: NrcInfo) => ({
                                nrc,
                                integranteId:
                                  integrante.id_integrante ??
                                  `member-${Math.random().toString(36).slice(2, 7)}`,
                              }))
                            )
                            .map(({ nrc, integranteId }) => {
                              const materia = materiasOptions.find(
                                (m) =>
                                  (m as any).id_materia === nrc.id_materia ||
                                  (m as any).id === nrc.id_materia
                              );
                              const materiaNombre =
                                (materia as any)?.nombre ??
                                (materia as any)?.name ??
                                "Materia desconocida";

                              // clave para deduplicar (preferir id_nrc si viene, si no usar código + materia)
                              const nrcKey = String(nrc.id_nrc ?? `${nrc.codigo}-${nrc.id_materia}`);
                              if (shownNrcs.has(nrcKey)) return null;
                              shownNrcs.add(nrcKey);

                              const key = `${team.id_equipo}-${integranteId}-${nrcKey}`;
                              return (
                                <Badge key={key} className="text-xs">
                                  <b className="px-1">
                                    {nrc.codigo} - {materiaNombre}
                                  </b>
                                </Badge>
                              );
                            });
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Miembros */}
                  <div className="rounded-lg border">
                    <div className="px-3 py-2 text-sm font-medium border-b">
                      Miembros ({members.length})
                    </div>
                    <div className="max-h-64 overflow-y-auto p-3 space-y-2">
                      {members.map((integrante) => (
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
        statusEmailLeader = statusEmailLeader ?? (() => null);
        const cached = statusEmailLeader(primaryEmail);

        // estado no iniciado: mostrar indicador ligero
        if (cached === undefined || cached === null) {
          return (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">No consultado</Badge>
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          );
        }

        const rawLabel = cached?.confirmationStatus?.status ?? "No consultado";
        const label = String(rawLabel);

        const s = String(label).trim();
        const norm = s.charAt(0).toLocaleUpperCase() + s.slice(1).toLocaleLowerCase(); // normalizar

        const showResend = norm === "Pendiente" || norm === "Expirado";
        const variant =
          norm === "Confirmado" ? "default" : norm === "Pendiente" ? "secondary" : "destructive";

        return (
          <div className="flex items-center gap-2">
            <Badge variant={variant as any}>{norm}</Badge>

            <div className="flex items-center gap-2">
              {showResend && primaryEmail && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7"
                  onClick={() => primaryEmail && resendInvite(primaryEmail)}
                  disabled={!primaryEmail || internalIsLoading}
                >
                  Reenviar correo
                </Button>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Estado Videojuego",
      renderCell: (team: TeamRowData) => {
        const idEstadoVideojuego = team.videojuego?.id_estado_videojuego ?? 2;

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
                if (internalIsLoading) return;
                setInternalIsLoading(true);
                try {
                  await updateTeamStatus(team.id_equipo, numericStatus);
                  console.log("Estado anterior:", team.videojuego.id_estado_videojuego);
                  console.log("Estado actualizado en el backend");
                  console.log("Nuevo estado:", team.videojuego.id_estado_videojuego);
                  toast.success(
                    `Estado cambiado a ${estadoOptions.find(
                      (o) => o.id_estado === numericStatus
                    )?.estado || numericStatus}.`
                  );
                  refreshData();
                } catch (err: any) {
                  showError(err?.message || "Error al cambiar el estado.");
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
    {
      key: "createdAt",
      label: "Fecha de Registro",
      renderCell: (team: TeamRowData) => (
        <div className="text-sm">
          <div>{new Date(safeFecha(team)).toLocaleDateString()}</div>
          <div className="text-muted-foreground text-xs">
            {new Date(safeFecha(team)).toLocaleTimeString()}
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
    if (internalIsLoading) return;
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
      {/* Header (responsive): título visible junto al filtro desplegable y botón Agregar en móvil) */}
      <div className="flex justify-between items-center mb-6 px-4">
        {isMobile ? (
          <div className="flex items-center gap-2 w-full">
            <h1 className="text-lg font-medium truncate">Equipos Inscritos</h1>

            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8" disabled={showLoader}>
                    Filtro
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onClick={() => {
                      if (externalFilter === "all") return;
                      setExternalFilter("all");
                      try { onPageChange(1); } catch { }
                    }}
                  >
                    Todos
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (externalFilter === "external") return;
                      setExternalFilter("external");
                      try { onPageChange(1); } catch { }
                    }}
                  >
                    Externos
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (externalFilter === "uninorte") return;
                      setExternalFilter("uninorte");
                      try { onPageChange(1); } catch { }
                    }}
                  >
                    Uninorte
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                className="bg-card hover:bg-accent text-foreground"
                disabled={showLoader}
                onClick={handleOpenAdd}
              >
                <Plus className="mr-2 h-4 w-4" /> Agregar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-xl font-medium">Equipos Inscritos</h1>
              </div>

              {/* Filtro externo / uninorte — fila de 3 botones */}
              <div className="flex items-center gap-1 rounded-md p-1 bg-muted/10">
                <Button
                  size="sm"
                  variant={externalFilter === "all" ? "default" : "ghost"}
                  className="h-8 px-3 text-sm"
                  onClick={() => {
                    if (externalFilter === "all") return;
                    setExternalFilter("all");
                    try { onPageChange(1); } catch (e) { }
                  }}
                  disabled={showLoader}
                  aria-pressed={externalFilter === "all"}
                >
                  Todos
                </Button>

                <Button
                  size="sm"
                  variant={externalFilter === "external" ? "default" : "ghost"}
                  className="h-8 px-3 text-sm"
                  onClick={() => {
                    if (externalFilter === "external") return;
                    setExternalFilter("external");
                    try { onPageChange(1); } catch (e) { }
                  }}
                  disabled={showLoader}
                  aria-pressed={externalFilter === "external"}
                >
                  Externos
                </Button>

                <Button
                  size="sm"
                  variant={externalFilter === "uninorte" ? "default" : "ghost"}
                  className="h-8 px-3 text-sm"
                  onClick={() => {
                    if (externalFilter === "uninorte") return;
                    setExternalFilter("uninorte");
                    try { onPageChange(1); } catch (e) { }
                  }}
                  disabled={showLoader}
                  aria-pressed={externalFilter === "uninorte"}
                >
                  Uninorte
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
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
              {/* (TeamWizardDialog moved below so it's available en mobile también) */}
            </div>
          </>
        )}
      </div> {/* end header */}

      {/* TeamWizardDialog debe montarse siempre (móvil y desktop) */}
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
              // aplicar filtro cliente por isExternal
              (() => {
                const filteredTeams = teams?.filter((team) => {
                  if (!team) return false;
                  const isExt = (team as any).isExternal === true;
                  if (externalFilter === "all") return true;
                  if (externalFilter === "external") return isExt;
                  return !isExt; // uninorte
                }) ?? [];

                return filteredTeams.map((team) => (
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
                ));
              })()
            )}
          </TableBody>
        </Table>

        {/* Paginación */}
        {(() => {
          const itemsPerPage = paginationMeta?.itemsPerPage ?? 10;
          const currentPage = paginationMeta?.currentPage ?? 1;
          const totalPages = paginationMeta?.totalPages ?? 0;

          // Siempre renderizamos la barra de paginación (pero acciones deshabilitadas si no hay páginas)
          return (
            <div className="flex justify-between items-center p-4 text-sm border-t border-border">
              <div className="flex items-center gap-2">
                <span>Filas</span>
                <Select
                  value={String(itemsPerPage)}
                  onValueChange={(value) => onLimitChange(parseInt(value, 10))}
                  disabled={showLoader}
                >
                  <SelectTrigger className="w-[70px] cursor-pointer">
                    <SelectValue placeholder={itemsPerPage} />
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
                  {totalPages > 0 ? currentPage : 0} de {totalPages}
                </span>
                <div className="flex gap-1">
                  <Button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1 || totalPages === 0 || showLoader}
                    variant="outline"
                    size="icon"
                    className="cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages || totalPages === 0 || showLoader}
                    variant="outline"
                    size="icon"
                    className="cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
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

