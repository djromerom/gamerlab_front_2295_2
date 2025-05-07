import { Menu } from "lucide-react"; // Usa lucide-react para el ícono
import React from "react";

interface criteriabuttonProps {
  onClick?: () => void;
}

const criteriabutton: React.FC<criteriabuttonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-[#B2B5FF] bg-transparent p-1 hover:bg-[#e5e7eb] dark:hover:bg-[#1C1930] transition-colors"
    >
      <Menu className="text-[#B2B5FF] w-5 h-5" />
    </button>
  );
};

export default criteriabutton;
