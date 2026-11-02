"use client"

import { Shield, ArrowLeft, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function UnauthorizedPage() {
  const navigate = useNavigate()

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
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#110D20] border-2 border-[#AC7CFF]">
                <Shield className="h-10 w-10 text-[#AC7CFF]" strokeWidth={1.5} />
              </div>

              <h1 className="mt-6 text-3xl font-bold tracking-tight text-[#AC7CFF] sm:text-4xl">
                Acceso No Autorizado
              </h1>

              <div className="mt-4 flex items-center justify-center space-x-2 bg-[#110D20] px-4 py-2 rounded-full">
                <Lock className="h-5 w-5 text-[#AC7CFF]" />
                <p className="text-sm font-medium text-gray-300">Error 403</p>
              </div>

              <p className="mt-6 text-base leading-7 text-gray-300">
                Lo sentimos, no tienes los permisos necesarios para acceder a esta página. Por favor, contacta con el
                administrador si crees que esto es un error.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button
                  onClick={() => navigate("/")}
                  className="px-6 py-3 bg-[#AC7CFF] hover:bg-[#ba93fe] text-[#060312] font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al inicio
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Efectos de blur contenidos dentro del viewport */}
      <div className="blur-effect h-40 w-40 left-[10%] bottom-[10%]" />
      <div className="blur-effect h-40 w-40 right-[10%] bottom-[10%]" />
    </div>
  )
}
