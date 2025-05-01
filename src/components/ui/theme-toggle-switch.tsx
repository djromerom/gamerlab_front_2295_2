"use client"

import { useEffect, useState } from "react"
import { Moon, Sun, Eye } from "lucide-react" // Eye como icono de alto contraste
import { useSidebar } from "./sidebar"
import {
    DropdownMenu,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const THEMES = {
    LIGHT: "light",
    DARK: "dark",
    HIGH_CONTRAST: "high-contrast",
}

export function ThemeToggleSwitch() {
    const [theme, setTheme] = useState(THEMES.LIGHT)
    const { state } = useSidebar()

    useEffect(() => {
        const storedTheme = localStorage.getItem("theme")
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

        if (storedTheme === THEMES.DARK || (!storedTheme && prefersDark)) {
            document.documentElement.classList.add("dark")
            setTheme(THEMES.DARK)
        } else if (storedTheme === THEMES.HIGH_CONTRAST) {
            document.documentElement.classList.add("dark", "high-contrast") // Activamos dark junto con high-contrast
            setTheme(THEMES.HIGH_CONTRAST)
        } else {
            document.documentElement.classList.remove("dark", "high-contrast")
            setTheme(THEMES.LIGHT)
        }
    }, [])

    const applyTheme = (selected: string) => {
        document.documentElement.classList.remove("dark", "high-contrast")
        
        if (selected === THEMES.DARK) {
            document.documentElement.classList.add("dark")
        } else if (selected === THEMES.HIGH_CONTRAST) {
            document.documentElement.classList.add("dark", "high-contrast") // Activamos dark y high-contrast
        }

        localStorage.setItem("theme", selected)
        setTheme(selected)
    }

    const renderButton = (mode: string, label: string, Icon: any) => (
        <button
            onClick={() => applyTheme(mode)}
            className={`flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors ${
                theme === mode
                    ? "bg-[var(--selected)] text-[var(--selected-foreground)] hover:bg-[var(--selected-hover)] hover:text-[var(--selected-foreground)] font-semibold"
                    : "hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
        >
            <Icon 
                className={`h-4 w-4 transition-colors ${
                    theme === mode
                        ? "text-[var(--selected-foreground)]"  
                        : "text-[var(--foreground)]"  
                }`} 
            />
            {state === "expanded" && <span>{label}</span>}
        </button>
    )
    

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex flex-col gap-1 px-2 py-2">
                    {renderButton(THEMES.LIGHT, "Claro", Sun)}
                    {renderButton(THEMES.DARK, "Oscuro", Moon)}
                    {renderButton(THEMES.HIGH_CONTRAST, "Alto Contraste", Eye)}
                </div>
            </DropdownMenuTrigger>
        </DropdownMenu>
    )
}

export default ThemeToggleSwitch
