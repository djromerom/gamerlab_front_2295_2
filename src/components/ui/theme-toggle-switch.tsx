"use client"

import { useEffect, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Moon, Sun } from "lucide-react"
import { useSidebar } from "./sidebar" // Asegúrate de importar el hook useSidebar
import {
    DropdownMenu,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggleSwitch() {
    const [isDark, setIsDark] = useState(false)
    const { state } = useSidebar() // Obtenemos el estado del sidebar

    useEffect(() => {
        const storedTheme = localStorage.getItem("theme")
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

        if (storedTheme === "dark" || (!storedTheme && prefersDark)) {
            document.documentElement.classList.add("dark")
            setIsDark(true)
        }
    }, [])

    const toggleTheme = (checked: boolean) => {
        const newTheme = checked ? "dark" : "light"
        document.documentElement.classList.toggle("dark", checked)
        localStorage.setItem("theme", newTheme)
        setIsDark(checked)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex flex-col items-center justify-center gap-1 py-2">
                    {state === "expanded" && (
                        <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4 text-muted-foreground" />
                            <Switch checked={isDark} onCheckedChange={toggleTheme} />
                            <Moon className="h-4 w-4 text-muted-foreground" />
                        </div>
                    )}
                    {state === "collapsed" && (
                        <>
                            {isDark ? (
                                <Moon className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <Sun className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Switch checked={isDark} onCheckedChange={toggleTheme} />
                        </>
                    )}
                </div>
            </DropdownMenuTrigger>
        </DropdownMenu>
    )
}

export default ThemeToggleSwitch;