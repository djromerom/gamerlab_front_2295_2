"use client"

import { useEffect, useState } from "react"
import { Check, Moon, Sun, ZapIcon } from "lucide-react"
import { useSidebar } from "./sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SidebarMenuButton } from "@/components/ui/sidebar"

type Theme = "light" | "dark" | "high-contrast"

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>("light")
    const { state, isMobile } = useSidebar()

    useEffect(() => {
        const storedTheme = localStorage.getItem("theme") as Theme | null
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

        if (storedTheme) {
            setTheme(storedTheme)
            applyTheme(storedTheme)
        } else if (prefersDark) {
            setTheme("dark")
            applyTheme("dark")
        }
    }, [])

    const applyTheme = (newTheme: Theme) => {
        const root = document.documentElement

        // Remove all theme classes first
        root.classList.remove("light", "dark", "high-contrast")

        // For high-contrast, first apply dark theme as base, then add high-contrast
        if (newTheme === "high-contrast") {
            root.classList.add("dark")
            root.classList.add("high-contrast")
        } else {
            // Add the new theme class
            root.classList.add(newTheme)
        }

        // Store the theme preference
        localStorage.setItem("theme", newTheme)
    }

    const changeTheme = (newTheme: Theme) => {
        setTheme(newTheme)
        applyTheme(newTheme)
    }

    // Get the current theme icon
    const ThemeIcon = {
        light: Sun,
        dark: Moon,
        "high-contrast": ZapIcon,
    }[theme]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="mt-auto mb-2 mx-2 px-2 w-[calc(100%-16px)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
                        <ThemeIcon className="h-4 w-4" />
                        {<span className="group-data-[collapsible=icon]:opacity-0">Tema</span>}
                </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align={isMobile ? "center" : state === "expanded" ? "end" : "start"}
                side={isMobile ? "bottom" : "right"}
                className="w-36"
            >
                <DropdownMenuItem onClick={() => changeTheme("light")}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Claro</span>
                    {theme === "light" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeTheme("dark")}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Oscuro</span>
                    {theme === "dark" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeTheme("high-contrast")}>
                    <ZapIcon className="mr-2 h-4 w-4" />
                    <span>Alto Contraste</span>
                    {theme === "high-contrast" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default ThemeToggle
