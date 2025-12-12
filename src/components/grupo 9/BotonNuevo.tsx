"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface BotonNuevoProps {
  onClick: () => void;
  label?: string;
}

export const BotonNuevo: React.FC<BotonNuevoProps> = ({
  onClick,
  label = "Agregar",
}) => {
  return (
    <Button
      onClick={onClick}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      <Plus className="mr-2 h-4 w-4" /> {label}
    </Button>
  );
};
