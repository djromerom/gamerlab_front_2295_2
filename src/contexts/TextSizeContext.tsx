"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type TextSizeContextType = {
  fontSize: number
  increaseFontSize: () => void
  decreaseFontSize: () => void
  resetFontSize: () => void
}

const TextSizeContext = createContext<TextSizeContextType | undefined>(undefined)

const DEFAULT_FONT_SIZE = 16
const MIN_FONT_SIZE = 12
const MAX_FONT_SIZE = 24
const STEP_SIZE = 2
const STORAGE_KEY = "app-font-size"

export function TextSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE)
  const [isInitialized, setIsInitialized] = useState(false)

  // Cargar el tamaño de fuente guardado al iniciar
  useEffect(() => {
    // Evitar la hidratación incorrecta usando un efecto para inicializar
    const savedFontSize = localStorage.getItem(STORAGE_KEY)
    if (savedFontSize) {
      setFontSize(Number(savedFontSize))
    }
    setIsInitialized(true)
  }, [])

  // Guardar el tamaño de fuente cuando cambie y aplicarlo
  useEffect(() => {
    if (!isInitialized) return

    localStorage.setItem(STORAGE_KEY, fontSize.toString())

    // Aplicar el tamaño de fuente a nivel de documento
    document.documentElement.style.fontSize = `${fontSize}px`

    // También podemos aplicar una clase para facilitar el CSS
    document.documentElement.dataset.fontSize = fontSize.toString()
  }, [fontSize, isInitialized])

  const increaseFontSize = () => {
    setFontSize((prevSize) => (prevSize < MAX_FONT_SIZE ? prevSize + STEP_SIZE : prevSize))
  }

  const decreaseFontSize = () => {
    setFontSize((prevSize) => (prevSize > MIN_FONT_SIZE ? prevSize - STEP_SIZE : prevSize))
  }

  const resetFontSize = () => {
    setFontSize(DEFAULT_FONT_SIZE)
  }

  return (
    <TextSizeContext.Provider
      value={{
        fontSize,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
      }}
    >
      {children}
    </TextSizeContext.Provider>
  )
}

export function useTextSize() {
  const context = useContext(TextSizeContext)
  if (context === undefined) {
    throw new Error("useTextSize must be used within a TextSizeProvider")
  }
  return context
}
