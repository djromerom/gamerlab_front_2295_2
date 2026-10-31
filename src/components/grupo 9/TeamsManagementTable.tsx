import { apiFetch } from "@/lib/api";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreVertical, Plus, Loader2, Users, Mail, Award, Search } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TeamRowData, NrcInfo, MateriaInfo } from "./teams-utils";
import TeamWizardDialog, { toInitialValuesFromTeam } from "./TeamWizardDialog";
import { TeamVerificationCodeDialog } from "./TeamVerificationCodeDialog";
import { isCollegeTeamCode } from "@/fetchs/teamVerification";
import type { WizardValues } from "./validationTeamsAdmin";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";


/* ────────────────────────────────────────────────────────────────────
   Tabla principal + uso del Wizard
──────────────────────────────────────────────────────────────────── */
export const TeamsManagementTable = ({
  teams,
  paginationMeta,
  apiBaseUrl,
  isDataLoading = false,
  onPageChange,
  onLimitChange,
  refreshData,
  allTeams,
  statusEmailLeader,
}) => {

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardInitial, setWizardInitial] = useState<Partial<WizardValues> | undefined>(undefined);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // HU-19: equipo cuyo código de verificación se está consultando
  const [verificationTeam, setVerificationTeam] = useState<{ id: number; name: string; teamCode?: string } | null>(null);

  const [internalIsLoading, setInternalIsLoading] = useState(false);


  const [nrcOptions] = useState<NrcInfo[]>([]);
  const [materiasOptions, setMateriasOptions] = useState<MateriaInfo[]>([]);
  const [openInfoTeamId, setOpenInfoTeamId] = useState<number | null>(null);
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [resendTarget, setResendTarget] = useState<{
    teamId: number | null;
    email: string;
    type?: string;
  }>({ teamId: null, email: "", type: undefined });
  const [rejectionReason, setRejectionReason] = useState<string>("");

  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [certType, setCertType] = useState<"PARTICIPATION_CERTIFICATE" | "1ST_PLACE_CERTIFICATE" | "2ND_PLACE_CERTIFICATE" | "3RD_PLACE_CERTIFICATE">("PARTICIPATION_CERTIFICATE");
  const [certSearchTerm, setCertSearchTerm] = useState<string>("");
  const [debouncedCertSearchTerm, setDebouncedCertSearchTerm] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCertSearchTerm(certSearchTerm), 200);
    return () => clearTimeout(timer);
  }, [certSearchTerm]);

  const [certSelectedTeamIds, setCertSelectedTeamIds] = useState<string[]>([]);
  const [certSelectAll, setCertSelectAll] = useState<boolean>(false);
  const filteredCertTeams = (teams ?? []).filter((t) =>
    (t.nombre_equipo ?? "").toLowerCase().includes(debouncedCertSearchTerm.toLowerCase())
  );

  const [externalFilter, setExternalFilter] = useState<"all" | "external" | "uninorte">("all");
  // REPLACE ABOVE WITH NEW CATEGORY FILTER
  // const [categoryFilter, setCategoryFilter] = useState<"all" | "sem1" | "sem2" | "sem3" | "sem4" | "Externos">("all");

  // Function to categorize by teamCode / isExternal
  // const categorizeTeam = (team: TeamRowData): "sem1" | "sem2" | "sem3" | "sem4" | "Externos" | undefined => {
  //   if ((team as any)?.isExternal) return "Externos";
  //   const rawCode: string = (team as any)?.teamCode ?? "";
  //   const prefix = rawCode.slice(0, 2).toUpperCase(); // N1, N2, N3, N4
  //   switch (prefix) {
  //     case "N1": return "sem1";
  //     case "N2": return "sem2";
  //     case "N3": return "sem3";
  //     case "N4": return "sem4";
  //     default: return undefined;
  //   }
  // };

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleFilterChange = useCallback((filter: "all" | "uninorte" | "external") => {
    if (externalFilter === filter) return;
    setTimeout(() => {
      setExternalFilter(filter);
      try { onPageChange(1); } catch { }
    }, 300);
  }, [externalFilter, onPageChange]);

  const filteredTeamsGlobal = useMemo(() => {
    const filteredByExternal = (teams ?? []).filter((team) => {
      if (!team) return false;
      if (externalFilter === "all") return true;
      const isExt = (team as any)?.isExternal === true;
      return externalFilter === "external" ? isExt : !isExt;
    });

    const term = debouncedSearchTerm.trim().toLowerCase();
    return term
      ? filteredByExternal.filter((t) => {
        const teamName = (t.nombre_equipo ?? "").toLowerCase();
        const gameName = (t.videojuego?.nombre ?? "").toLowerCase();
        const teamCode = (t.teamCode ?? "").toLowerCase();
        return teamName.includes(term) || gameName.includes(term) || teamCode.includes(term);
      })
      : filteredByExternal;
  }, [teams, externalFilter, debouncedSearchTerm]);

  // Counters
  // allTeams trae el total real cuando existe; teams suele venir paginado desde backend.
  const datasetForCounts = allTeams?.length ? allTeams : teams ?? [];
  const totalTeamsCount = datasetForCounts.length;
  const uninorteCount = datasetForCounts.filter(t => !(t as any)?.isExternal).length;
  const externalCount = datasetForCounts.filter(t => (t as any)?.isExternal).length;

  const showLoader = isDataLoading || internalIsLoading;
  const showError = (msg: string) => toast.error(msg);

  const safeFecha = (team: TeamRowData) => team?.fecha_registro ?? new Date().toISOString();


  const API_ENDPOINT = `${import.meta.env.VITE_ENDPOINT_BACKEND}/subjects`;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(API_ENDPOINT, {
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
          }
          throw new Error(errorMsg);
        }
        const apiResponseObject = await res.json();


        const materiasData: MateriaInfo[] = apiResponseObject.data.map((materia: any) => ({
          id: materia.id ?? materia.id_materia,
          name: materia.name ?? materia.nombre,
          code: materia.code ?? materia.codigo,
          semester: materia.semester ?? materia.semestre,
        }));

        setMateriasOptions(materiasData);

      } catch (err) {
        console.error("Error fetching subjects:", err);
        setMateriasOptions([]);

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

    const res = await apiFetch(`${apiBaseUrl}/teams/${teamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || "Error actualizando estado del videojuego.");
    }

    return res.json().catch(() => null);
  };

  const resendTeamEmail = async (email: string, typeOfEmail: string, reason?: string) => {
    if (internalIsLoading) return;
    setInternalIsLoading(true);
    try {
      const body: any = { email, typeOfEmail };
      if (reason) body.rejectionReason = reason;

      const res = await apiFetch(`${apiBaseUrl}/email/resend-team-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Error reenviando correo.");
      }

      toast.success("Correo enviado correctamente a " + email);
    } catch (e: any) {
      toast.error(e?.message || "Error al enviar correo.");
    } finally {
      setInternalIsLoading(false);
    }
  };

  const sendCertificateEmails = async () => {
    if (internalIsLoading) return;
    if (!certSelectedTeamIds || certSelectedTeamIds.length === 0) {
      showError("Seleccione al menos un equipo para enviar certificados.");
      return;
    }

    setInternalIsLoading(true);
    try {
      const targets = certSelectedTeamIds.map((teamCode) => {
        const team = teams?.find((t) => String(t.teamCode ?? t.id_equipo) === teamCode);
        const email = team?.integrantes?.[0]?.correo ?? "";
        return { teamCode, email };
      });

      const sendPromises = targets.map(({ teamCode, email }) => (async () => {
        if (!email) return { ok: false, email: "(sin correo)", teamCode, error: "No hay correo del líder" };
        try {
          const body: any = { email, typeOfEmail: certType, certificate: "" };
          const res = await apiFetch(`${apiBaseUrl}/email/resend-certificate-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return { ok: false, email, teamCode, error: err?.message || `Error ${res.status}` };
          }

          return { ok: true, email, teamCode };
        } catch (e: any) {
          return { ok: false, email, teamCode, error: e?.message || "Error de red" };
        }
      })());

      // Run in parallel and wait for results
      const settled = await Promise.allSettled(sendPromises as Promise<any>[]);
      const results = settled.map((s) => (s.status === "fulfilled" ? s.value : { ok: false, email: "(unknown)", error: s.reason }));

      const successCount = results.filter((r) => r.ok).length;
      const failItems = results.filter((r) => !r.ok);

      if (successCount > 0) toast.success(`Certificados enviados: ${successCount}`);
      if (failItems.length > 0) {
        toast.error(`Fallaron ${failItems.length} envíos. Revise la consola para más detalles.`);
        console.error("Errores envío certificados:", failItems);
      }

      // close dialog and clear selection
      setCertDialogOpen(false);
      setCertSelectedTeamIds([]);
      setCertSelectAll(false);
      setCertSearchTerm("");
    } catch (e: any) {
      toast.error(e?.message || "Error enviando certificados.");
    } finally {
      setInternalIsLoading(false);
    }
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
      const res = await apiFetch(`${apiBaseUrl}/auth/resend-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "No se pudo enviar el correo de confirmación.");
      }
      toast.success("Correo de confirmación enviado a " + email);
    } catch (e: any) {
      toast.error(e?.message || "Error al enviar a " + email);
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
              {/* HU-19: el número identifica al equipo sin ambigüedad (lo ven el estudiante y el jurado) */}
              {team.teamCode && (
                <div className="text-xs text-muted-foreground font-mono">{team.teamCode}</div>
              )}
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
        const primaryEmail = (team.integrantes?.[0]?.correo)?.toLowerCase() ?? "";
        statusEmailLeader = statusEmailLeader ?? (() => null);
        const cached = statusEmailLeader(primaryEmail);

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
        const norm = s.charAt(0).toLocaleUpperCase() + s.slice(1).toLocaleLowerCase(); // normalize

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
                  Enviar correo
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

        const estadoOptions = [
          { id_estado: 1, estado: "Confirmado" },
          { id_estado: 2, estado: "Pendiente" },
          { id_estado: 3, estado: "Rechazado" },
        ];

        const primaryEmail = team.integrantes?.[0]?.correo ?? "";

        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getStatusBadge(idEstadoVideojuego)}

              {/* Botón pequeño para reenviar según el estado actual */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={async () => {
                        const email = primaryEmail;
                        if (!email) {
                          showError("No se encontró correo del líder para enviar.");
                          return;
                        }

                        if (idEstadoVideojuego === 1) {
                          await resendTeamEmail(email, "VIDEOGAME_APPROVED");
                        } else if (idEstadoVideojuego === 3) {
                          setResendTarget({ teamId: team.id_equipo, email, type: "VIDEOGAME_REJECTED" });
                          setRejectionReason("");
                          setResendDialogOpen(true);
                        } else {
                          // Pending or others -> send info update
                          await resendTeamEmail(email, "UPDATE_VIDEOGAME_INFO");
                        }
                      }}
                      aria-label="Reenviar según estado"
                      disabled={!primaryEmail || internalIsLoading}
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{idEstadoVideojuego === 1 ? "Reenviar correo (Aprobado)" : idEstadoVideojuego === 3 ? "Reenviar correo (Rechazado)" : "Enviar correo (Actualizar info)"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <Select
              value={String(idEstadoVideojuego)}
              onValueChange={async (newStatus) => {
                const numericStatus = parseInt(newStatus, 10);
                if (internalIsLoading) return;
                setInternalIsLoading(true);
                try {
                  await updateTeamStatus(team.id_equipo, numericStatus);
                  toast.success(
                    `Estado cambiado a ${estadoOptions.find(
                      (o) => o.id_estado === numericStatus
                    )?.estado || numericStatus}.`
                  );
                  refreshData();

                  if (numericStatus === 1) {
                    if (!primaryEmail) {
                      showError("No se encontró correo del líder para enviar.");
                    } else {
                      try {
                        await resendTeamEmail(primaryEmail, "VIDEOGAME_APPROVED");
                      } catch (e) {
                      }
                    }
                  } else if (numericStatus === 3) {
                    setResendTarget({ teamId: team.id_equipo, email: primaryEmail, type: "VIDEOGAME_REJECTED" });
                    setRejectionReason("");
                    setResendDialogOpen(true);
                  }
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

            <div className="flex items-center gap-2"></div>
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
        additionalImages: [],
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
      const res = await apiFetch(`${apiBaseUrl}/teams/${deletingId}`, {
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
      className={`bg-background text-foreground min-h-screen p-4 ${showLoader ? "opacity-75" : ""}`}
    >
      <div className="flex flex-col gap-4 mb-6 px-4">
        {/* Fila 1: Título */}
        <div>
          <h1 className="text-lg md:text-xl font-medium">Equipos Inscritos</h1>
        </div>

        {/* Fila 2: Filtros, Buscador y Botones */}
        <div className="flex items-center justify-between gap-4 w-full">

          <div className="flex items-center gap-2 shrink-0">
            {/* Filtro Dropdown (Móvil) */}
            <div className="block lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 w-10 flex items-center justify-center shrink-0" disabled={showLoader} aria-label="Filtros">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="2 0 20 20" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 block m-auto" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 5.5l5 6v4l1 1v-5.5l5-6H7z" opacity="0.99" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuItem
                    className={
                      externalFilter === "all"
                        ? "bg-primary text-primary-foreground focus:bg-primary focus:text-primary-foreground"
                        : ""
                    }
                    onClick={() => handleFilterChange("all")}
                  >
                    Todos ({totalTeamsCount})
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={
                      externalFilter === "uninorte"
                        ? "bg-primary text-primary-foreground focus:bg-primary focus:text-primary-foreground"
                        : ""
                    }
                    onClick={() => handleFilterChange("uninorte")}
                  >
                    Uninorte ({uninorteCount})
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={
                      externalFilter === "external"
                        ? "bg-primary text-primary-foreground focus:bg-primary focus:text-primary-foreground"
                        : ""
                    }
                    onClick={() => handleFilterChange("external")}
                  >
                    Externos ({externalCount})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Filtro Botones (Desktop) */}
            <div className="hidden lg:flex items-center gap-1 rounded-md p-1 bg-muted/10">
              <Button size="sm" variant={externalFilter === "all" ? "default" : "ghost"} className="h-8 px-3 text-sm" onClick={() => handleFilterChange("all")} disabled={showLoader}>
                Todos ({totalTeamsCount})
              </Button>
              <Button size="sm" variant={externalFilter === "uninorte" ? "default" : "ghost"} className="h-8 px-3 text-sm" onClick={() => handleFilterChange("uninorte")} disabled={showLoader}>
                Uninorte ({uninorteCount})
              </Button>
              <Button size="sm" variant={externalFilter === "external" ? "default" : "ghost"} className="h-8 px-3 text-sm" onClick={() => handleFilterChange("external")} disabled={showLoader}>
                Externos ({externalCount})
              </Button>
            </div>
          </div>
          {/* Parte derecha: Buscador y Botones */}
          <div className="flex-1 flex items-center gap-4 min-w-0">
            <div className="flex-1 flex items-center gap-2 border rounded px-3 h-10 min-w-0">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                className="bg-transparent outline-none text-sm w-full min-w-0 placeholder:text-muted-foreground"
                placeholder="Buscar equipo, código o videojuego..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="outline"
                className="bg-card hover:bg-accent text-foreground whitespace-nowrap shrink-0 h-10 px-3 sm:px-4"
                disabled={showLoader}
                onClick={handleOpenAdd}
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Agregar</span>
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-card hover:bg-accent text-foreground h-10 w-10 flex items-center justify-center shrink-0"
                      disabled={showLoader}
                      onClick={() => setCertDialogOpen(true)}
                      aria-label="Enviar certificados"
                    >
                      <Award className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Enviar certificados</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
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
            {showLoader && filteredTeamsGlobal.length === 0 ? (
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
            ) : !showLoader && filteredTeamsGlobal.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnsToDisplay.length + 1}
                  className="h-24 text-center"
                >
                  No hay equipos para mostrar con el filtro seleccionado.
                </TableCell>
              </TableRow>
            ) : (
              // filtro por tipo + búsqueda
              // apply client-side filter: only all / uninorte / external
              (() => {
                // La paginación la controla el backend.
                // Aquí NO se hace slice porque teams ya representa la página actual.
                const pageItems = filteredTeamsGlobal;

                if (pageItems.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={columnsToDisplay.length + 1} className="h-24 text-center">
                        No hay equipos que coincidan con la búsqueda o filtros.
                      </TableCell>
                    </TableRow>
                  );
                }

                return pageItems.map((team) => (
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
                          {/* Los equipos de colegios (N0) no tienen código de verificación */}
                          {!isCollegeTeamCode(team.teamCode) && (
                            <DropdownMenuItem
                              onClick={() =>
                                setVerificationTeam({
                                  id: team.id_equipo,
                                  name: team.nombre_equipo ?? "Equipo",
                                  teamCode: team.teamCode,
                                })
                              }
                              className="cursor-pointer"
                            >
                              Código de verificación
                            </DropdownMenuItem>
                          )}
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

          return (
            <div className="flex justify-between items-center p-4 text-sm border-t border-border gap-2">
              <div className="flex items-center gap-1 min-[450px]:gap-2">
                <span className="w-12 min-[450px]:w-auto text-center min-[450px]:text-left leading-tight break-words">Filas</span>
                <Select
                  value={String(itemsPerPage)}
                  onValueChange={(value) => {
                    const newLimit = value === "all" ? 999999 : parseInt(value, 10);

                    try { onPageChange(1); } catch { }
                    onLimitChange(newLimit);
                  }}
                  disabled={showLoader}
                >
                  <SelectTrigger className="w-[100px] cursor-pointer">
                    <SelectValue placeholder={itemsPerPage === 999999 ? "Todos" : String(itemsPerPage)} />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 15, 20].map((n) => (
                      <SelectItem className="cursor-pointer" key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                    <SelectItem className="cursor-pointer" value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 min-[450px]:gap-4 shrink-0">
                <span className="text-center min-[450px]:text-left leading-tight">
                  <span className="block min-[450px]:inline">Página </span>
                  <span className="block min-[450px]:inline">
                    {totalPages === 0 ? 0 : currentPage} de {totalPages}
                  </span>
                </span>
                <div className="flex gap-1 shrink-0">
                  <Button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1 || showLoader || totalPages === 0}
                    variant="outline"
                    size="icon"
                    className="cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages || showLoader || totalPages === 0}
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

      <Dialog open={resendDialogOpen} onOpenChange={setResendDialogOpen}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Enviar correo a líder del equipo</DialogTitle>
            <DialogDescription>
              Ingrese la razón del rechazo que se incluirá en el correo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="text-sm">Correo destino: <b>{resendTarget.email}</b></div>
            <div>
              <textarea
                className="w-full p-2 border rounded h-28"
                placeholder="Motivo del rechazo..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResendDialogOpen(false);
                setResendTarget({ teamId: null, email: "", type: undefined });
                setRejectionReason("");
              }}
              disabled={internalIsLoading}
            >
              Cancelar
            </Button>

            <Button
              onClick={async () => {
                const email = resendTarget.email;
                const type = resendTarget.type || "VIDEOGAME_REJECTED";
                if (!email) {
                  showError("No hay correo destino para enviar.");
                  return;
                }
                await resendTeamEmail(email, type, rejectionReason || undefined);
                setResendDialogOpen(false);
                setResendTarget({ teamId: null, email: "", type: undefined });
                setRejectionReason("");
              }}
              disabled={internalIsLoading || !rejectionReason}
            >
              {internalIsLoading ? "Procesando..." : "Enviar"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
        <DialogContent className="w-full max-w-[92vw] sm:max-w-2xl h-auto max-h-[90vh] flex flex-col text-sm">
          <DialogHeader>
            <DialogTitle>Enviar certificados</DialogTitle>
            <DialogDescription>
              Seleccione los equipos destinatarios y el tipo de certificado a enviar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex gap-2 items-center">
              <div className="w-50">
                <Select value={certType} onValueChange={(v) => setCertType(v as any)}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PARTICIPATION_CERTIFICATE">Certificado de Participación</SelectItem>
                    <SelectItem value="1ST_PLACE_CERTIFICATE">Certificado 1º Puesto</SelectItem>
                    <SelectItem value="2ND_PLACE_CERTIFICATE">Certificado 2º Puesto</SelectItem>
                    <SelectItem value="3RD_PLACE_CERTIFICATE">Certificado 3º Puesto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 relative">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input
                    className="w-full p-2 border rounded"
                    placeholder="Buscar equipo por nombre..."
                    value={certSearchTerm}
                    onChange={(e) => setCertSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between ">
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={certSelectAll}
                    onChange={(e) => {
                      const checked = (e.target as HTMLInputElement).checked;
                      setCertSelectAll(checked);
                      if (checked) {
                        const ids = filteredCertTeams.map((t) => String(t.teamCode ?? t.id_equipo));
                        setCertSelectedTeamIds(ids);
                      } else {
                        setCertSelectedTeamIds([]);
                      }
                    }}
                  />
                  <span>Seleccionar todos</span>
                </label>
              </div>
              <div className="text-sm text-muted-foreground">Seleccionados: {certSelectedTeamIds.length}</div>
            </div>

            <div className="overflow-y-auto border rounded max-h-[60vh] lg:h-[220px]">
              {filteredCertTeams.map((team) => {
                const leaderEmail = team.integrantes?.[0]?.correo ?? "";
                const code = String(team.teamCode ?? team.id_equipo);
                const checked = certSelectedTeamIds.includes(code);
                return (
                  <label key={code} className="flex items-center justify-between p-3 border-b">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={checked}
                        onChange={(e) => {
                          const ch = (e.target as HTMLInputElement).checked;
                          setCertSelectedTeamIds((prev) => {
                            if (ch) return Array.from(new Set([...prev, code]));
                            return prev.filter((id) => id !== code);
                          });
                          if (!ch) setCertSelectAll(false);
                        }}
                      />
                      <div>
                        <div className="font-medium">{team.nombre_equipo}</div>
                        <div className="text-xs text-muted-foreground">{leaderEmail || "Sin correo del líder"}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">TeamCode: {code}</div>
                  </label>
                );
              })}
            </div>

          </div>

          <DialogFooter className="pt-0 pb-0 mt-auto">
            <Button variant="outline" onClick={() => setCertDialogOpen(false)} disabled={internalIsLoading}>Cancelar</Button>
            <Button onClick={sendCertificateEmails} disabled={internalIsLoading || certSelectedTeamIds.length === 0}>
              {internalIsLoading ? "Enviando..." : "Enviar certificados"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TeamVerificationCodeDialog
        team={verificationTeam}
        onClose={() => setVerificationTeam(null)}
      />

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
