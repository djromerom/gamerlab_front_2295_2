import React, { ReactNode } from 'react';

interface PurpleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function purpleButton({ 
  children, 
  onClick, 
  className = "" 
}: PurpleButtonProps): React.ReactElement {
  return (
    <button
      className={`relative py-2 px-3 rounded-lg font-medium text-sm bg-gradient-to-b from-[#190d2e] to-[#541ab8] shadow-[0px_0px_12px_#8c45ff] 
        transition-all duration-300 ease-in-out 
        hover:saturate-100 hover:brightness-125 
        ${className}`}
      onClick={onClick}
    >
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        {/* Borde superior con esquinas redondeadas */}
        <div className="rounded-lg border border-white/20 absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]"></div>

        {/* Borde inferior con esquinas redondeadas */}
        <div className="rounded-lg border border-white/40 absolute inset-0 [mask-image:linear-gradient(to_top,black,transparent)]"></div>

        {/* Sombra interior con esquinas redondeadas */}
        <div className="absolute inset-0 shadow-[inset_0_0_10px_rgb(140,69,255,0.7)] rounded-lg"></div>
      </div>
      <span className="relative z-10 text-white">{children}</span>
    </button>
  );
}