"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreVertical, Plus } from "lucide-react";
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

export interface Data {
  titulo: string;
  nombreTabla: string;
  nombreColumnas: Record<string, string>;
  filas: Record<string, any>[];
}

interface CustomColumnConfig {
    [columna: string]: {
      tipo: "select" | "input";
      opciones?: { label: string; value: any }[]; // solo si es select
    };
  }
  
interface Props {
    data: Data;
    columnasPersonalizadas?: CustomColumnConfig;
}

export const JuryManagementTable: React.FC<Props> = ({ data, columnasPersonalizadas }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [allRows, setAllRows] = useState(data.filas);
    const [currentRows, setCurrentRows] = useState<Record<string, any>[]>([]);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newRow, setNewRow] = useState<Record<string, any>>({});
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<Record<string, any>>({});
    const [editingIndex, setEditingIndex] = useState<number>(-1);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingIndex, setDeletingIndex] = useState<number>(-1);
    const totalPages = Math.ceil(allRows.length / rowsPerPage);

    useEffect(() => {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        setCurrentRows(allRows.slice(start, end));
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      }, [currentPage, rowsPerPage, allRows, totalPages]);
    
    // Handler functions that don't do anything real, just to make the UI work
    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        setAddDialogOpen(false);
        // No real functionality here
        console.log("Add button clicked with data:", newRow);
    };

    const handleOpenEdit = (row: Record<string, any>, index: number) => {
        setEditingRow({...row});
        setEditingIndex(index);
        setEditDialogOpen(true);
        // No real functionality here
        console.log("Edit button clicked for row:", index);
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        setEditDialogOpen(false);
        // No real functionality here
        console.log("Save edit button clicked with data:", editingRow);
    };

    const handleOpenDelete = (index: number) => {
        setDeletingIndex(index);
        setDeleteDialogOpen(true);
        // No real functionality here
        console.log("Delete button clicked for row:", index);
    };

    const handleConfirmDelete = () => {
        setDeleteDialogOpen(false);
        // No real functionality here
        console.log("Confirm delete button clicked for row:", deletingIndex);
    };

    useEffect(() => {
        setAllRows(data.filas);
    }, [data.filas]);

    return (
        <div className="bg-background text-foreground min-h-screen p-4">
          <div className="flex justify-between items-center mb-6 px-4">
            <h1 className="text-xl font-medium">{data.titulo}</h1>
    
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-card hover:bg-accent text-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" /> Agregar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleAdd}>
                  <DialogHeader>
                    <DialogTitle>Agregar</DialogTitle>
                    <DialogDescription>
                      Ingrese los datos de la nueva fila.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {Object.entries(data.nombreColumnas).map(
                      ([key, label]) =>
                        key !== "id" && (
                          <div
                            key={key}
                            className="grid grid-cols-4 items-center gap-4"
                          >
                            <Label htmlFor={key} className="text-right">
                              {label}
                            </Label>
                            <Input
                              id={key}
                              value={newRow[key] || ""}
                              onChange={(e: any) =>
                                setNewRow((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                              className="col-span-3"
                              required
                            />
                          </div>
                        )
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit">Guardar</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
    
          <Card className="rounded-lg overflow-hidden bg-card">
            <Table>
              <TableHeader className="bg-card border-b border-border">
                <TableRow>
                  {Object.entries(data.nombreColumnas).map(
                    ([key, label]) =>
                      key !== "id" && <TableHead key={key}>{label}</TableHead>
                  )}
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRows.map((row, index) => (
                  <TableRow key={index}>
                    {Object.keys(data.nombreColumnas).map(
                      (key) =>
                        key !== "id" && <TableCell key={key}>{row[key]}</TableCell>
                    )}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(row, index)}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenDelete(index)}
                            className="text-red-500"
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
    
            <div className="flex justify-between items-center p-4 text-sm">
              <div className="flex items-center gap-2">
                <span>Filas por página</span>
                <Select
                  value={rowsPerPage.toString()}
                  onValueChange={(v: any) => {
                    setRowsPerPage(parseInt(v));
                    setCurrentPage(1);
                  }}
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
                  Página {currentPage} de {totalPages || 1}
                </span>
                <div className="flex gap-1">
                  <Button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    size="icon"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    size="icon"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
    
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <form onSubmit={handleSaveEdit}>
                <DialogHeader>
                  <DialogTitle>Editar fila</DialogTitle>
                  <DialogDescription>
                    Modifique los campos según sea necesario.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {Object.entries(data.nombreColumnas).map(
                    ([key, label]) =>
                      key !== "id" && (
                        <div
                          key={key}
                          className="grid grid-cols-4 items-center gap-4"
                        >
                          <Label htmlFor={`edit-${key}`} className="text-right">
                            {label}
                          </Label>
                          <Input
                            id={`edit-${key}`}
                            value={editingRow[key] || ""}
                            onChange={(e: any) =>
                              setEditingRow((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            className="col-span-3"
                            required
                          />
                        </div>
                      )
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit">Guardar cambios</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
    
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
    );
}