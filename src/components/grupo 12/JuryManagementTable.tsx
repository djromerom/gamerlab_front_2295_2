"use client";


import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreVertical, Plus, Loader2, UserIcon, UserPen, BadgeXIcon, Download } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JurorRowData, Props, JurorFormData, EMPTY_JUROR_FORM, DEFAULT_JUROR_CATEGORY, DEFAULT_JUROR_TYPE, getApiErrorMessage } from "./utils"; // Adjust path if needed
import { juryManagement } from "@/hooks/juryManagement";
import { getJurorCategoryLabel, getJurorTypeLabel } from "@/types/jurados";
import { JurorCategoryTypeFields } from "./JurorCategoryTypeFields";

export const JuryManagementTable: React.FC<Props> = ({ jurors, paginationMeta, apiBaseUrl, isDataLoading = false, onPageChange, onLimitChange, refreshData }) => {
  // 
  // <-- Recibe isLoading
  const customFetch = useFetch();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newJuror, setNewJuror] = useState<JurorFormData>(EMPTY_JUROR_FORM);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingJuror, setEditingJuror] = useState<JurorRowData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [internalIsLoading, setInternalIsLoading] = useState(false); // For CRUD operations
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState(null)
  const [valueFormAssignTeam, setValueFormAssignTeam] = useState({ id: "", name: "", videogame: "" })
  const [teamsByJuror, setTeamsByJuror] = useState([{ id: "", name: "", videogame: "" }])
  const [valueDeleteTeam, setValueDeleteTeam] = useState({ id: "", name: "", videogame: "" })
  const [searchTerm, setSearchTerm] = useState("");
  const [allJurors, setAllJurors] = useState<JurorRowData[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {

    const arrayTeams = async () => {
      try {
        const data: any = await juryManagement.getIncompleteJurors();
        const getTeams: [{ id: string, name: string, videogame: string }] | null = [data.map((team) => {
          return { id: team.id, name: team.nombre, videogame: team.videojuego }
        })]
        setTeams(getTeams)
      } catch (error) {
        toast.error(error, { id: 111 })
      }
    }
    arrayTeams()
  }, []);
  // Combina el estado de carga inicial (prop) y el estado de carga interno (CRUD)
  const showLoader = isDataLoading || internalIsLoading;

  const [exportLoading, setExportLoading] = useState(false);

  const exportJurors = async () => {
    if (exportLoading) return;
    if (!jurors || jurors.length === 0) {
      toast.info("No hay jurados para exportar.");
      return;
    }

    setExportLoading(true);
    try {
      const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/reports/exportJurados`;
      const res = await apiFetch(endpoint, { method: "GET", credentials: "include" });
      if (!res.ok) {
        let msg = "No se pudo exportar la asignación de jurados.";
        try {
          const body = await res.json();
          msg = body?.message || msg;
        } catch {
        }
        throw new Error(msg);
      }

      const blob = await res.blob();

      // Try to extract filename from content-disposition header
      const disposition = res.headers.get("content-disposition") || "";
      let filename = "jurados_export";
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const fallback = `jurados_${yyyy}_${mm}_${dd}.xlsx`;

      const filenameMatch = disposition.match(/filename\*=UTF-8''([^;\n\r]+)/i) || disposition.match(/filename="?([^";]+)"?/i);
      if (filenameMatch) {
        try {
          filename = decodeURIComponent(filenameMatch[1]);
        } catch {
          filename = filenameMatch[1];
        }
      } else {
        filename = fallback;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Descarga iniciada: ${filename}`);
    } catch (e: any) {
      console.error("Export jurors failed:", e);
      toast.error(e?.message || "Error al exportar jurados.");
    } finally {
      setExportLoading(false);
    }
  };

  const filteredJurors = (() => {
    // If there's a search term, prefer the full jurors list (ignore pagination)
    const q = (searchTerm || "").trim().toLowerCase();
    const source = q ? allJurors : jurors;
    if (!source) return [] as any[];
    if (!q) return source;
    return source.filter((j: any) => {
      const name = `${j.firstName ?? ""} ${j.lastName ?? ""}`.toLowerCase();
      const email = (j.email ?? "").toLowerCase();
      return name.includes(q) || email.includes(q) || String(j.id).includes(q);
    });
  })();

  // Fetch all jurors when a search is active so we can ignore pagination
  useEffect(() => {
    let cancelled = false;
    const q = (searchTerm || "").trim();
    if (!q) {
      // clear previously loaded full list when search is cleared
      setAllJurors(null);
      return; // nothing to do
    }
    if (allJurors) return; // already loaded

    (async () => {
      setSearchLoading(true);
      try {
        const data = await juryManagement.getAllJuries();
        if (cancelled) return;
        setAllJurors(data);
      } catch (err: any) {
        console.error("Failed to fetch all jurors for search:", err);
        toast.error(err?.message || "Error loading jurados para búsqueda");
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchTerm]);

  const showError = (errorMessage: string) => {
    toast.error(errorMessage);
  };

  const columnsToDisplay = [
    {
      key: "fullName",
      label: "Nombre",
      renderCell: (juror: JurorRowData) =>
        `${juror.firstName} ${juror.lastName}`,
    },
    {
      key: "email",
      label: "Email",
      renderCell: (juror: JurorRowData) => juror.email,
    },
    {
      key: "jurorCategory",
      label: "Categoría",
      renderCell: (juror: JurorRowData) => getJurorCategoryLabel(juror.jurorCategory),
    },
    {
      key: "jurorType",
      label: "Tipo",
      renderCell: (juror: JurorRowData) => getJurorTypeLabel(juror.jurorType),
    },
    {
      key: "confirmationStatusId",
      label: "Estado",
      renderCell: (juror: JurorRowData) => {
        switch (juror.confirmationStatusId) {
          case 1:
            return "CONFIRMADO";
          case 2:
            return "PENDIENTE";
          case 3:
            return "EXPIRADO";
          default:
            return juror.confirmationStatusId?.toString() || "DESCONOCIDO";
        }
      },
    },
    {
      key: "lastSignInAt",
      label: "Última conexión",
      renderCell: (juror: JurorRowData) => juror.lastSignInAt || "Nunca",
    },
    {
      key: "evaluatedCount",
      label: "Juegos revisados",
      align: "center",
      renderCell: (juror: JurorRowData) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-card hover:bg-accent text-foreground cursor-pointer"
              disabled={showLoader}
            >
              {juror.evaluatedCount || 0}
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[400px]">
            <DialogHeader>
              <DialogTitle>Juegos Revisados</DialogTitle>
              <DialogDescription>
                {`Jurado ${juror.firstName} ${juror.lastName}`}
              </DialogDescription>
            </DialogHeader>
            <Table>
              <TableBody>
                {juror.evaluatedGameNames?.map((game, index) => (
                  <TableRow key={index}>
                    <TableCell>{game}</TableCell>
                  </TableRow>
                )) || (
                    <TableRow>
                      <TableCell>No hay juegos revisados</TableCell>
                    </TableRow>
                  )}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      ),
    },
    {
      key: "unevaluatedCount",
      label: "Juegos pendientes",
      align: "center",
      renderCell: (juror: JurorRowData) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-card hover:bg-accent text-foreground cursor-pointer"
              disabled={showLoader}
            >
              {juror.unevaluatedCount || 0}
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[400px]">
            <DialogHeader>
              <DialogTitle>Juegos Pendientes</DialogTitle>
              <DialogDescription>
                {`Jurado ${juror.firstName} ${juror.lastName}`}
              </DialogDescription>
            </DialogHeader>
            <Table>
              <TableBody>
                {juror.unevaluatedGameNames?.map((game, index) => (
                  <TableRow key={index}>
                    <TableCell>{game}</TableCell>
                  </TableRow>
                )) || (
                    <TableRow>
                      <TableCell>No hay juegos pendientes</TableCell>
                    </TableRow>
                  )}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      ),
    },
    {
      key: "manualAssigment",
      label: "Asignar equipo",
      align: "center",
      renderCell: (juror: JurorRowData) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant={"home"}
              size="sm"
            >
              Asignar equipo
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Asignar equipo a {juror.firstName}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 mt-2">
              <div className="flex w-full relative">
                <select
                  className="
                    w-full appearance-none rounded-lg 
                    border border-gray-300
                    bg-white dark:bg-transparent 
                    text-gray-900 dark:text-gray-100
                    px-4 py-2 pr-10 text-sm shadow-sm 
                    transition 
                    cursor-pointer
                  "
                  defaultValue={""}
                  onChange={(e) => {
                    const value = e.target.value
                    const result = teams?.[0].find(team => team.name === value);
                    setValueFormAssignTeam(result)
                  }}
                >
                  <option value="" disabled className="bg-white dark:bg-[#120e21]">
                    Seleccione un equipo...
                  </option>
                  {teams ? teams[0].map((team, index) => (
                    <option key={index} value={team.name} className="bg-white dark:bg-[#120e21]">
                      {team.name}
                    </option>
                  )) || (
                      <option value="opcion1" className="bg-white dark:bg-[#120e21]">
                        No hay equipos
                      </option>
                    ) : []}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300">
                  ▼
                </div>
              </div>

              <div className="flex justify-between items-center w-full gap-2">
                <Input
                  placeholder="Nombre del videojuego"
                  disabled
                  value={valueFormAssignTeam?.videogame || ""}
                />
              </div>
              <Button
                variant={"home"}
                onClick={async () => {
                  const res = await juryManagement.manualAssignment(juror.id, valueFormAssignTeam.id)
                  toast.message(res.message)
                  if (res.success) {
                    setTimeout(() => {
                      window.location.reload();
                    }, 500)
                  }
                }}
                className="w-full"
              >
                Asignar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )
    },
    {
      key: "manualDelete",
      label: "Quitar un equipo",
      align: "center",
      renderCell: (juror: JurorRowData) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              onClick={async () => {
                const teamsByJuror = await juryManagement.getTeamsByJuror(juror.id)
                setTeamsByJuror(teamsByJuror)
              }}
              variant={"destructive"}
              size="sm"
            >
              <BadgeXIcon />
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Quitar equipo a {juror.firstName}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 mt-2">
              <div className="flex w-full relative">
                <select
                  className="
                    w-full appearance-none rounded-lg 
                    border border-gray-300
                    bg-white dark:bg-transparent 
                    text-gray-900 dark:text-gray-100
                    px-4 py-2 pr-10 text-sm shadow-sm 
                    transition 
                    cursor-pointer
                  "
                  defaultValue={""}
                  onChange={(e) => {
                    const value = e.target.value
                    const result = teamsByJuror?.find(team => team.name === value);
                    setValueDeleteTeam(result)
                  }}
                >
                  <option value="" disabled className="bg-white dark:bg-[#120e21]">
                    Seleccione un equipo...
                  </option>
                  {teamsByJuror ? teamsByJuror.map((team, index) => (
                    <option key={index} value={team.name} className="bg-white dark:bg-[#120e21]">
                      {team.name}
                    </option>
                  )) || (
                      <option value="opcion1" className="bg-white dark:bg-[#120e21]">
                        No hay equipos
                      </option>
                    ) : []}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300">
                  ▼
                </div>
              </div>

              <div className="flex justify-between items-center w-full">
                <Input
                  placeholder="Nombre del videojuego"
                  disabled
                  value={valueDeleteTeam?.videogame || ""}
                />
              </div>
              <Button
                variant={"destructive"}
                onClick={async () => {
                  const res = await juryManagement.deleteAnAssignment(juror.id, valueDeleteTeam.id)
                  toast.message(res.message)
                  if (res.success) {
                    setTimeout(() => {
                      window.location.reload();
                    }, 500)
                  }
                }}
                className="w-full"
              >
                Quitar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )
    }
  ];

  // --- Funciones handleAdd, handleOpenEdit, handleSaveEdit, handleOpenDelete, handleConfirmDelete ---
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalIsLoading(true);

    try {
      if (!newJuror.email.includes("@")) {
        throw new Error("El email debe ser válido.");
      }
      if (!newJuror.firstName.trim()) {
        throw new Error("El campo Nombres es requerido.");
      }
      if (!newJuror.lastName.trim()) {
        throw new Error("El campo Apellidos es requerido.");
      }

      const response = await customFetch(`${apiBaseUrl}/juror`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newJuror.firstName,
          lastName: newJuror.lastName,
          email: newJuror.email,
          jurorCategory: newJuror.jurorCategory,
          jurorType: newJuror.jurorType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(getApiErrorMessage(errorData, "Error al crear el jurado."));
      }

      setNewJuror(EMPTY_JUROR_FORM);
      setAddDialogOpen(false);
      toast.success("Jurado agregado exitosamente.");
      onPageChange(1); // Go to first page to see the new juror
      refreshData(); // Tell parent to refetch data
    } catch (err: any) {
      showError(err.message || "Error al agregar el jurado.");
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJuror) return;

    setInternalIsLoading(true);

    try {
      if (!editingJuror.firstName.trim()) {
        throw new Error("El campo Nombres es requerido.");
      }
      if (!editingJuror.lastName.trim()) {
        throw new Error("El campo Apellidos es requerido.");
      }

      const response = await customFetch(
        `${apiBaseUrl}/juror/${editingJuror.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: editingJuror.firstName,
            lastName: editingJuror.lastName,
            jurorCategory: editingJuror.jurorCategory ?? DEFAULT_JUROR_CATEGORY,
            jurorType: editingJuror.jurorType ?? DEFAULT_JUROR_TYPE,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(getApiErrorMessage(errorData, "Error al actualizar el jurado."));
      }

      setEditDialogOpen(false);
      setEditingJuror(null);
      toast.success("Jurado actualizado exitosamente.");
      refreshData(); // Tell parent to refetch data
    } catch (err: any) {
      showError(err.message || "Error al actualizar el jurado.");
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setInternalIsLoading(true);
    try {
      const response = await customFetch(
        `${apiBaseUrl}/juror/${deletingId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error al eliminar el jurado." }));
        throw new Error(errorData.message || "Error al eliminar el jurado.");
      }

      setDeleteDialogOpen(false);
      setDeletingId(null);
      toast.success("Jurado eliminado exitosamente.");
      refreshData(); // Tell parent to refetch, which handles page adjustment if needed
    } catch (err: any) {
      showError(err.message || "Error al eliminar el jurado.");
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleResendEmail = async (jurorEmail: string) => {

    setInternalIsLoading(true);
    try {
      const response = await customFetch(
        `${apiBaseUrl}/auth/resend-confirmation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: jurorEmail }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al reenviar el correo");
      }
      toast.success("Correo reenviado exitosamente");
      refreshData(); // Actualizar los datos si es necesario
    } catch (err: any) {
      showError(err.message || "Error al reenviar el correo de confirmación");
    } finally {
      setInternalIsLoading(false);
    }
  };

  const automaticAssignment = async () => {
    try {
      if (loading) {
        toast.loading('Asignando equipos', { id: 111 })
      }
      const response = await juryManagement.automaticAssignment()
      if (response.success) {
        setLoading(false)
        toast.success(response.message)
        setTimeout(() => {
          window.location.reload();
        }, 500)
      } else {
        setLoading(false)
        toast.error(response.message)
      }
    } catch (error) {
      setLoading(false)
      toast.error(error, { id: 111 })
    }
  }

  return (
    // Añade un contenedor div si data es null para mantener la estructura
    <div
      className={`bg-background text-foreground min-h-screen min-w-[350px] p-4 ${showLoader ? "opacity-75" : ""
        }`}
    >
      {/* Encabezado (Título y Botón Agregar) */}
      <div className="flex flex-col gap-4 mb-6 px-4">
        {/* Fila 1: Título */}
        <div>
          <h1 className="text-xl font-medium">Jurados</h1>
        </div>

        {/* Fila 2: Buscador y Botones de acción */}
        <div className="flex items-center justify-between gap-2 md:gap-4 w-full">
          <Input
            placeholder="Buscar jurado por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[80px] md:max-w-md text-sm"
            disabled={showLoader}
          />
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <Button
              variant="destructive"
              disabled={loading} // <-- Deshabilitar si no hay data O si está cargando
              className="flex justify-center items-center cursor-pointer gap-1.5 px-2.5 lg:px-4"
              onClick={() => { setLoading(true); juryManagement.deleteAllAssignments(setLoading) }}
            >
              <BadgeXIcon className="h-4 w-4" />
              <p className="hidden lg:block">
                Desasignar todos
              </p>
            </Button>
            <Button
              variant="default"
              disabled={loading} // <-- Deshabilitar si no hay data O si está cargando
              className="flex justify-center items-center cursor-pointer gap-1.5 px-2.5 lg:px-4"
              onClick={() => { setLoading(true); automaticAssignment() }}
            >
              <UserPen className="h-4 w-4" />
              <p className="hidden lg:block">
                Asignar todos
              </p>
            </Button>

            {/* Botón Exportar con tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex justify-center cursor-pointer"
                    onClick={exportJurors}
                    disabled={showLoader || exportLoading || !jurors || jurors.length === 0}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exportar Jurados</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Botón Agregar - Deshabilitado si data no existe o si está cargando */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex justify-center cursor-pointer"
                        disabled={showLoader}
                        aria-label="Agregar nuevo jurado"
                      >
                        <Plus className="h-4 w-4" />
                        <UserIcon className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Agregar nuevo jurado</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DialogContent>
                <form onSubmit={handleAdd}>
                  <DialogHeader>
                    <DialogTitle>Agregar Nuevo Jurado</DialogTitle>
                    <DialogDescription>
                      Complete los datos del nuevo jurado.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 py-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="add-firstName" className="text-left font-medium">
                        Nombres
                      </Label>
                      <Input
                        id="add-firstName"
                        value={newJuror.firstName}
                        onChange={(e) =>
                          setNewJuror((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        className="w-full"
                        required
                        disabled={internalIsLoading}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="add-lastName" className="text-left font-medium">
                        Apellidos
                      </Label>
                      <Input
                        id="add-lastName"
                        value={newJuror.lastName}
                        onChange={(e) =>
                          setNewJuror((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        className="w-full"
                        required
                        disabled={internalIsLoading}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="add-email" className="text-left font-medium">
                        Email
                      </Label>
                      <Input
                        id="add-email"
                        type="email"
                        value={newJuror.email}
                        onChange={(e) =>
                          setNewJuror((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="w-full"
                        required
                        disabled={internalIsLoading}
                      />
                    </div>
                    <JurorCategoryTypeFields
                      idPrefix="add"
                      jurorCategory={newJuror.jurorCategory}
                      jurorType={newJuror.jurorType}
                      onCategoryChange={(jurorCategory) =>
                        setNewJuror((prev) => ({ ...prev, jurorCategory }))
                      }
                      onTypeChange={(jurorType) =>
                        setNewJuror((prev) => ({ ...prev, jurorType }))
                      }
                      disabled={internalIsLoading}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      className="cursor-pointer"
                      variant="outline"
                      onClick={() => {
                        setAddDialogOpen(false);
                        setNewJuror(EMPTY_JUROR_FORM);
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
        </div>
      </div>

      {/* Card de la Tabla */}
      <Card className="rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-card border-b border-border">
            <TableRow>
              {columnsToDisplay.map(({ key, label, align }) => (
                <TableHead key={key} className={align === "center" ? "text-center" : ""}>
                  {label}
                </TableHead>
              ))}
              <TableHead className="w-[50px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showLoader && (!jurors || jurors.length === 0) ? (
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
            ) : !showLoader && (!filteredJurors || filteredJurors.length === 0) ? (
              <TableRow>
                <TableCell
                  colSpan={columnsToDisplay.length + 1}
                  className="h-24 text-center"
                >
                  No hay jurados para mostrar.
                </TableCell>
              </TableRow>
            ) : (
              filteredJurors?.map((juror) => (
                <TableRow key={juror.id}>
                  {columnsToDisplay.map(({ key, renderCell, align }) => (
                    <TableCell key={key} className={align === "center" ? "text-center" : ""}>
                      <div className={align === "center" ? "flex justify-center" : ""}>
                        {renderCell(juror)}
                      </div>
                    </TableCell>
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
                            setEditingJuror(juror);
                            setEditDialogOpen(true);
                          }}
                          disabled={internalIsLoading}
                          className="cursor-pointer"
                        >
                          Editar
                        </DropdownMenuItem>
                        {!(juror.confirmationStatusId === "Confirmado") && (
                          <DropdownMenuItem
                            onClick={() => handleResendEmail(juror.email)}
                            disabled={internalIsLoading}
                            className="cursor-pointer"
                          >
                            Reenviar correo
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => { setLoading(true); juryManagement.deleteAllAsignmentsByJury(juror.id, setLoading) }}
                          disabled={internalIsLoading}
                          className="cursor-pointer"
                        >
                          Quitar equipos
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setDeletingId(juror.id);
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
        {/* Pagination Controls (hidden while searching) */}
        {!searchTerm && paginationMeta && paginationMeta.totalItems > 0 && (
          <div className="flex justify-between items-center p-4 text-sm border-t border-border gap-2">
            <div className="flex items-center gap-1 min-[450px]:gap-2">
              <span className="w-12 min-[450px]:w-auto text-center min-[450px]:text-left leading-tight break-words">
                Filas por página
              </span>
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
            <div className="flex items-center gap-2 min-[450px]:gap-4 shrink-0">
              <span className="text-center min-[450px]:text-left leading-tight">
                <span className="block min-[450px]:inline">Página </span>
                <span className="block min-[450px]:inline">
                  {paginationMeta.totalPages > 0 ? paginationMeta.currentPage : 0} de {paginationMeta.totalPages}
                </span>
              </span>
              <div className="flex gap-1 shrink-0">
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
          {editingJuror && (
            <form onSubmit={handleSaveEdit}>
              <DialogHeader>
                <DialogTitle>Editar Jurado</DialogTitle>
                <DialogDescription>
                  Modifique los datos del jurado. El email no se puede editar.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-firstName" className="text-left font-medium">
                    Nombres
                  </Label>
                  <Input
                    id="edit-firstName"
                    value={editingJuror.firstName || ""}
                    onChange={(e) =>
                      setEditingJuror((prev) =>
                        prev ? { ...prev, firstName: e.target.value } : null
                      )
                    }
                    className="w-full"
                    required
                    disabled={internalIsLoading}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-lastName" className="text-left font-medium">
                    Apellidos
                  </Label>
                  <Input
                    id="edit-lastName"
                    value={editingJuror.lastName || ""}
                    onChange={(e) =>
                      setEditingJuror((prev) =>
                        prev ? { ...prev, lastName: e.target.value } : null
                      )
                    }
                    className="w-full"
                    required
                    disabled={internalIsLoading}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-email" className="text-left font-medium">
                    Email
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingJuror.email || ""}
                    className="w-full"
                    disabled
                    readOnly
                  />
                </div>
                <JurorCategoryTypeFields
                  idPrefix="edit"
                  jurorCategory={editingJuror.jurorCategory ?? DEFAULT_JUROR_CATEGORY}
                  jurorType={editingJuror.jurorType ?? DEFAULT_JUROR_TYPE}
                  onCategoryChange={(jurorCategory) =>
                    setEditingJuror((prev) => (prev ? { ...prev, jurorCategory } : null))
                  }
                  onTypeChange={(jurorType) =>
                    setEditingJuror((prev) => (prev ? { ...prev, jurorType } : null))
                  }
                  disabled={internalIsLoading}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setEditingJuror(null);
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
              Esta acción eliminará (o desactivará) al jurado. Confirme para
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
