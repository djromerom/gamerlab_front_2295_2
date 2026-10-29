import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { type BadgeCategory, type JurorBadge } from "@/fetchs/jurorBadges";

interface JurorBadgesTableProps {
  badges: JurorBadge[];
  selectedIds: Set<string>;
  onToggle: (jurorId: string) => void;
  onToggleAll: (checked: boolean) => void;
  onRegenerate: (badge: JurorBadge) => void;
  regeneratingId: string | null;
}

const categoryVariant: Record<BadgeCategory, "default" | "secondary" | "outline"> = {
  Senior: "default",
  Junior: "secondary",
  "Sin categoría": "outline",
};

export const JurorBadgesTable: React.FC<JurorBadgesTableProps> = ({
  badges,
  selectedIds,
  onToggle,
  onToggleAll,
  onRegenerate,
  regeneratingId,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const allSelected = badges.length > 0 && badges.every((b) => selectedIds.has(b.jurorId));

  const toggleExpanded = (jurorId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jurorId)) next.delete(jurorId);
      else next.add(jurorId);
      return next;
    });
  };

  return (
    <Card className="rounded-lg overflow-hidden bg-card border-border shadow-none">
      <Table>
        <TableHeader className="bg-card border-b border-border">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[50px]">
              <label className="flex items-center cursor-pointer">
                <Checkbox
                  checked={allSelected}
                  disabled={badges.length === 0}
                  onChange={(e) => onToggleAll((e.target as HTMLInputElement).checked)}
                  aria-label="Seleccionar todas"
                />
              </label>
            </TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="w-[120px]">Vista previa</TableHead>
            <TableHead className="w-[140px] text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {badges.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                No hay escarapelas generadas para la edición activa.
              </TableCell>
            </TableRow>
          ) : (
            badges.map((badge) => {
              const expanded = expandedIds.has(badge.jurorId);
              return (
              <React.Fragment key={badge.jurorId}>
              <TableRow>
                <TableCell>
                  <label className="flex items-center cursor-pointer">
                    <Checkbox
                      checked={selectedIds.has(badge.jurorId)}
                      onChange={() => onToggle(badge.jurorId)}
                      aria-label={`Seleccionar ${badge.name}`}
                    />
                  </label>
                </TableCell>
                <TableCell className="font-medium">{badge.name}</TableCell>
                <TableCell>
                  <Badge variant={categoryVariant[badge.category] ?? "outline"}>
                    {badge.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(badge.jurorId)}
                    aria-expanded={expanded}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {expanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span className="ml-1">{expanded ? "Ocultar" : "Ver QR"}</span>
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRegenerate(badge)}
                    disabled={regeneratingId !== null}
                    title="Regenerar escarapela"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {regeneratingId === badge.jurorId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span className="ml-1">Regenerar</span>
                  </Button>
                </TableCell>
              </TableRow>
              {expanded && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="bg-muted/30">
                    <div className="flex items-center gap-6 py-2">
                      {/* Fondo blanco fijo para que el QR sea legible también en modo oscuro */}
                      <div className="bg-white p-3 rounded-md border border-border">
                        <QRCodeSVG value={badge.token} size={140} level="M" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">{badge.name}</p>
                        <Badge variant={categoryVariant[badge.category] ?? "outline"}>
                          {badge.category}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </Card>
  );
};
