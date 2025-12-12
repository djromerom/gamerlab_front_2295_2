"use client"

import { Settings, Clock, ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function MaintenancePage() {
  const navigate = useNavigate()

  // Estado para el contador de tiempo estimado (en minutos)
  const [timeRemaining, setTimeRemaining] = useState(
    // Obtener el tiempo estimado de la variable de entorno o usar 60 minutos por defecto
    Number.parseInt(import.meta.env.VITE_MAINTENANCE_ESTIMATED_TIME || "60"),
  )

  // Estilos para el borde luminoso y correcciones de layout
  const customStyles = `
    @property --angle{
      syntax: "<angle>";
      initial-value: 0deg;
      inherits: false;
    }

    @keyframes spin{
      from{
        --angle: 0deg;
      }
      to{
        --angle: 360deg;
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    /* Resetear estilos globales para evitar bordes blancos */
    html, body {
      margin: 0;
      padding: 0;
      overflow-x: hidden;
      background-color: #060312;
    }

    /* Asegurar que el contenedor principal ocupe todo el viewport sin scroll */
    .full-viewport {
      min-height: 100vh;
      width: 100vw;
      overflow: hidden;
      position: relative;
    }

    .gradient-border {
      position: relative;
      z-index: 0;
      border-radius: 8px;
      overflow: hidden;
    }

    .gradient-border::after, .gradient-border::before{
      content: '';
      position: absolute;
      height: 100%;
      width: 100%;
      background-image: conic-gradient(from var(--angle), #ff4545, #00ff99, #006aff, #ff0095, #ff4545);
      top: 50%;
      left: 50%;
      translate: -50% -50%;
      z-index: -1;
      border-radius: 8px;
      animation: 3s spin linear infinite;
    }
    
    .gradient-border::before{
      filter: blur(1.5rem);
      opacity: 0.5;
    }

    .gradient-border-inner {
      position: absolute;
      inset: 3px;
      background: #060312;
      border-radius: 6px;
      z-index: 1;
    }

    .gradient-border-purple::after, .gradient-border-purple::before {
      background-image: conic-gradient(
        from var(--angle),
        #6A0DAD,
        #8E2DE2,
        #A55EEA,
        #C084FC,
        #3C1361,
        #6A0DAD
      );
    }

    /* Asegurar que los efectos de blur no causen overflow */
    .blur-effect {
      position: absolute;
      border-radius: 50%;
      background-color: rgba(168, 85, 247, 0.2);
      filter: blur(3rem);
      z-index: 0;
    }

    .floating-gear {
      animation: float 3s ease-in-out infinite;
    }

    .pulse-effect {
      animation: pulse 2s ease-in-out infinite;
    }
  `

  // Inyectar los estilos CSS en el documento
  useEffect(() => {
    const styleElement = document.createElement("style")
    styleElement.innerHTML = customStyles
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  // Simular una cuenta regresiva
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 60000) // Actualizar cada minuto

    return () => clearInterval(timer)
  }, [])

  // Obtener el mensaje personalizado de la variable de entorno o usar un mensaje predeterminado
  const maintenanceMessage =
    import.meta.env.VITE_MAINTENANCE_MESSAGE ||
    "Estamos realizando mejoras en nuestro sitio para ofrecerte una mejor experiencia. Por favor, vuelve más tarde. Lamentamos las molestias ocasionadas."

  return (
    <div className="full-viewport flex items-center justify-center bg-[#060312]">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.webp')" }}
      />

      <div className="relative z-10 mx-auto w-full max-w-md px-4 py-8 sm:px-6 lg:max-w-lg lg:px-8">
        <div className="relative gradient-border gradient-border-purple p-0">
          <div className="gradient-border-inner"></div>
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#110D20] border-2 border-[#AC7CFF]">
                  <Settings className="h-12 w-12 text-[#AC7CFF] floating-gear" strokeWidth={1.5} />
                </div>
                <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#110D20] border-2 border-[#AC7CFF]">
                  <RefreshCw className="h-4 w-4 text-[#AC7CFF] pulse-effect" strokeWidth={1.5} />
                </div>
              </div>

              <h1 className="mt-6 text-3xl font-bold tracking-tight text-[#AC7CFF] sm:text-4xl">
                Sitio en Mantenimiento
              </h1>

              <div className="mt-4 flex items-center justify-center space-x-2 bg-[#110D20] px-4 py-2 rounded-full">
                <Clock className="h-5 w-5 text-[#AC7CFF]" />
                <p className="text-sm font-medium text-gray-300">Tiempo estimado: {timeRemaining} minutos</p>
              </div>

              <p className="mt-6 text-base leading-7 text-gray-300">{maintenanceMessage}</p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button
                  onClick={() => navigate("/")}
                  className=" cursor-pointer px-6 py-3 bg-[#AC7CFF] hover:bg-[#ba93fe] text-[#060312] font-medium rounded-lg transition-colors"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al inicio
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="cursor-pointer px-6 py-3 border bg-[#110D20] hover:bg-[#110D20] border-[#AC7CFF] text-[#AC7CFF]  hover:text-[#AC7CF4] font-medium rounded-lg transition-colors"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Intentar nuevamente
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Efectos de blur contenidos dentro del viewport */}
      <div className="blur-effect h-40 w-40 left-[10%] bottom-[10%]" />
      <div className="blur-effect h-40 w-40 right-[10%] bottom-[10%]" />
      <div className="blur-effect h-32 w-32 left-[20%] top-[20%]" />
      <div className="blur-effect h-32 w-32 right-[20%] top-[20%]" />
    </div>
  )
}

