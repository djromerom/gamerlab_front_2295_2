"use client"

import { type ReactNode, useEffect, useState } from "react"
import { lazy, Suspense } from "react"

// Importamos MaintenancePage de forma lazy para evitar errores de carga
const MaintenancePage = lazy(() => import("@/pages/MaintenancePage"))

// Componente de fallback simple mientras se carga MaintenancePage
const LoadingFallback = () => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#060312",
      color: "white",
    }}
  >
    Cargando...
  </div>
)

// Componente de error para capturar errores en MaintenancePage
const ErrorFallback = () => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#060312",
      color: "white",
      padding: "1rem",
      textAlign: "center",
    }}
  >
    <div>
      <h1 style={{ color: "#AC7CFF", marginBottom: "1rem" }}>Sitio en Mantenimiento</h1>
      <p>Estamos trabajando para mejorar tu experiencia.</p>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: "1rem",
          backgroundColor: "#AC7CFF",
          color: "#060312",
          border: "none",
          padding: "0.5rem 1rem",
          borderRadius: "0.375rem",
          cursor: "pointer",
        }}
      >
        Recargar página
      </button>
    </div>
  </div>
)

interface MaintenanceCheckerProps {
  children: ReactNode
}

export default function MaintenanceChecker({ children }: MaintenanceCheckerProps) {
  const [isInMaintenance, setIsInMaintenance] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    try {
      // Verificar la variable de entorno de forma más segura
      const maintenanceMode = typeof import.meta.env !== "undefined" && import.meta.env.VITE_MAINTENANCE_MODE === "true"

      console.log("Maintenance mode:", maintenanceMode) // Para depuración
      setIsInMaintenance(maintenanceMode)
    } catch (err) {
      console.error("Error al verificar el modo mantenimiento:", err)
      setError(true)
    }
  }, [])

  // Si hay un error en la verificación, mostramos el fallback de error
  if (error) {
    return <ErrorFallback />
  }

  // Renderizado condicional con manejo de errores
  if (isInMaintenance) {
    try {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <MaintenancePage />
        </Suspense>
      )
    } catch (err) {
      console.error("Error al renderizar MaintenancePage:", err)
      return <ErrorFallback />
    }
  }

  return <>{children}</>
}
