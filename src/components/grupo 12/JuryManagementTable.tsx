"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreVertical, Plus, Loader2, UserIcon, UserPen, BadgeXIcon } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JurorRowData, Props, JurorFormData } from "./utils"; // Adjust path if needed
import { juryManagement } from "@/hooks/juryManagement";

export const JuryManagementTable: React.FC<Props> = ({ jurors, paginationMeta, apiBaseUrl, isDataLoading = false, onPageChange, onLimitChange, refreshData }) => {
  // 
  // <-- Recibe isLoading
  const customFetch = useFetch();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newJuror, setNewJuror] = useState<JurorFormData>({ firstName: "", lastName: "", email: "" });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingJuror, setEditingJuror] = useState<JurorRowData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [internalIsLoading, setInternalIsLoading] = useState(false); // For CRUD operations
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState(null)
  const [valueFormAssignTeam, setValueFormAssignTeam] = useState({id: "", teamCode: "", name: "", videogame: ""})
  const [teamsByJuror, setTeamsByJuror] = useState([{id: "", name: "", videogame: ""}])
  const [valueDeleteTeam, setValueDeleteTeam] = useState({id: "", name: "", videogame: ""})
  
  useEffect(() => {

    const arrayTeams = async () => {
      try {
        const data: any = await juryManagement.getTeams();
        const getTeams:[{ id: string, teamCode: string, name:string, videogame: string }] | null  = [data.map((team) => {
            return { id: team.id, teamCode: team.teamCode, name: team.teamName, videogame: team.videogame.name }
          })]
          setTeams(getTeams)
      }catch (error) {
        toast.error(error, {id: 111})
      }
    }
    arrayTeams()
}, []);
  // Combina el estado de carga inicial (prop) y el estado de carga interno (CRUD)
  const showLoader = isDataLoading || internalIsLoading;

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
                    placeholder="Team code"
                    disabled
                    value={valueFormAssignTeam?.teamCode || ""}
                    // onChange={(e) =>
                    //     setNuevoEquipo({
                    //         ...nuevoEquipo,
                    //         id: e.target.value,
                    //     })
                    // }
                  />
                  <Input
                    placeholder="Nombre del videojuego"
                    disabled
                    value={valueFormAssignTeam?.videogame || ""}
                    // onChange={(e) =>
                    //     setNuevoEquipo({
                    //         ...nuevoEquipo,
                    //         nombre: e.target.value,
                    // })}
                  />
              </div>
              <Button
                variant={"home"}
                onClick={async ()=>{
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
                <BadgeXIcon/>
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
                onClick={async ()=>{
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
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error al crear el jurado." }));
        throw new Error(errorData.message || "Error al crear el jurado.");
      }

      setNewJuror({ firstName: "", lastName: "", email: "" });
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
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error al actualizar el jurado." }));
        throw new Error(errorData.message || "Error al actualizar el jurado.");
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
        `${apiBaseUrl}/juror/${deletingId}/delete`,
        {
          method: "PATCH",
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

  const handleResendEmail = async (jurorId: string) => {
    
    setInternalIsLoading(true);
    try {
      const response = await customFetch(
        `${apiBaseUrl}/auth/reset-token-expiration`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: jurorId }),
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
        toast.loading('Asignando equipos', {id: 111})
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
      toast.error(error, {id: 111})
    }
  }

  return (
    // Añade un contenedor div si data es null para mantener la estructura
    <div
      className={`bg-background text-foreground min-h-screen min-w-[350px] p-4 ${
        showLoader ? "opacity-75" : ""
      }`}
    >
      {/* Encabezado (Título y Botón Agregar) */}
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-xl font-medium">Jurados</h1>
        <div className="flex gap-2">
          <Button
              variant="destructive"
              disabled={loading} // <-- Deshabilitar si no hay data O si está cargando
              className="flex justify-center items-center cursor-pointer"
              onClick={() => {setLoading(true); juryManagement.deleteAllAssignments(setLoading)}}
              
          >
            <p className="hidden lg:flex">
              Desasignar todos
            </p>
          </Button>
          <Button
              variant="default"
              disabled={loading} // <-- Deshabilitar si no hay data O si está cargando
              className="flex justify-center items-center cursor-pointer"
              onClick={() => {setLoading(true); automaticAssignment()}}
              
          >
            <UserPen className="h-4 w-4" />
            <p className="hidden lg:flex">
              Asignar a todos
            </p>
          </Button>

          {/* Botón Agregar - Deshabilitado si data no existe o si está cargando */}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex justify-center cursor-pointer"
                disabled={showLoader} // <-- Deshabilitar si no hay data O si está cargando
              >
                <Plus className="h-4 w-4" />
                <UserIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAdd}>
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Jurado</DialogTitle>
                  <DialogDescription>
                    Complete los datos del nuevo jurado.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 px-6">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="add-firstName" className="text-right">
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
                      className="col-span-3"
                      required
                      disabled={internalIsLoading}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="add-lastName" className="text-right">
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
                      className="col-span-3"
                      required
                      disabled={internalIsLoading}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="add-email" className="text-right">
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
                      className="col-span-3"
                      required
                      disabled={internalIsLoading}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    className="cursor-pointer"
                    variant="outline"
                    onClick={() => {
                      setAddDialogOpen(false);
                      setNewJuror({ firstName: "", lastName: "", email: "" });
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
            ) : !showLoader && (!jurors || jurors.length === 0) ? (
              <TableRow>
                <TableCell
                  colSpan={columnsToDisplay.length + 1}
                  className="h-24 text-center"
                >
                  No hay jurados para mostrar en esta página.
                </TableCell>
              </TableRow>
            ) : (
              jurors?.map((juror) => (
                <TableRow key={juror.id}>
                  {columnsToDisplay.map(({ key, renderCell }) => (
                    <TableCell key={key}>{renderCell(juror)}</TableCell>
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
                            onClick={() => handleResendEmail(juror.id)}
                            disabled={internalIsLoading}
                            className="cursor-pointer"
                          >
                            Reenviar correo
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            onClick={() => {}}
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
          {editingJuror && (
            <form onSubmit={handleSaveEdit}>
              <DialogHeader>
                <DialogTitle>Editar Jurado</DialogTitle>
                <DialogDescription>
                  Modifique los datos del jurado. El email no se puede editar.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 px-6">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-firstName" className="text-right">
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
                    className="col-span-3"
                    required
                    disabled={internalIsLoading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-lastName" className="text-right">
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
                    className="col-span-3"
                    required
                    disabled={internalIsLoading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingJuror.email || ""}
                    className="col-span-3"
                    disabled
                    readOnly
                  />
                </div>
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
