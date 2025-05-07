"use client"

import type React from "react"
import { useState, useRef } from "react"

interface DropdownMenuProps {
  children: React.ReactNode
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  return <div className="relative">{children}</div>
}

interface DropdownMenuTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ asChild = false, children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)

  // Propagar el estado al DropdownMenuContent más cercano
  const handleClick = () => {
    setIsOpen(!isOpen)

    // Buscar el DropdownMenuContent y actualizar su visibilidad
    const content = triggerRef.current?.nextElementSibling as HTMLElement
    if (content && content.classList.contains("dropdown-content")) {
      content.style.display = isOpen ? "none" : "block"
    }
  }

  return (
    <div ref={triggerRef} onClick={handleClick} className="cursor-pointer">
      {children}
    </div>
  )
}

interface DropdownMenuContentProps {
  className?: string
  children: React.ReactNode
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ className = "", children }) => {
  const baseStyles =
    "dropdown-content absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white text-white z-10 hidden"

  return <div className={`${baseStyles} ${className}`}>{children}</div>
}

interface DropdownMenuItemProps {
  className?: string
  onClick?: () => void
  children: React.ReactNode
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ className = "", onClick, children }) => {
  const baseStyles = "block px-4 py-2 text-sm hover:bg-[#2a2a40] cursor-pointer"

  return (
    <div className={`${baseStyles} ${className}`} onClick={onClick}>
      {children}
    </div>
  )
}
