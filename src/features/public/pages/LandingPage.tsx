"use client"

import type React from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, ChevronDown } from "lucide-react"
import "@/index.css"
import "@/features/public/pages/LandingPage.css"
import LandingHeader, { LANDSCAPE_SHORT } from "@/features/public/components/LandingHeader"
import { ArkadBackground } from "@/components/background/ArkadBackground"
import FairGallery from "@/features/public/components/gallery/FairGallery"
import MiniGamesSection from "@/features/public/components/minigames/MiniGamesSection"
import { TextSizeControl } from "@/components/TextSizeControl"
import { DiscordButton } from "@/components/DiscordButton"

const DISCORD_SOPORTE = "https://discord.gg/RzAvUdspaT"

/**
 * Landing pública (ARK-222, ARK-233; mockup aprobado: mockups/landing-galeria-ferias.html). Tres pantallas:
 * la portada, la galería de las ferias pasadas y los minijuegos Arkadash y Arkad Jam (con los créditos al pie).
 * Cada sección mide una pantalla menos la barra (--cab) y el scroll se ajusta a su inicio. En celular horizontal la barra
 * se esconde mientras la galería o los minijuegos llenan la pantalla y vuelve al subir a la portada.
 */
function LandingPage(): React.ReactElement {
  const navigate = useNavigate()
  const [barraEscondida, setBarraEscondida] = useState(false)
  const raizRef = useRef<HTMLDivElement>(null)
  const cabeceraRef = useRef<HTMLElement>(null)
  const [juegosEnPantalla, setJuegosEnPantalla] = useState(false)

  useEffect(() => {
    document.documentElement.classList.remove("light", "high-contrast")
    document.documentElement.classList.add("dark")
    return () => {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  // Scroll con ajuste a cada sección (en <html>) y alto de la barra (--cab), antes del primer pintado
  useLayoutEffect(() => {
    const html = document.documentElement
    const cabecera = cabeceraRef.current
    html.classList.add("landing-arkad")
    const medir = () => {
      const alto = `${cabecera?.offsetHeight ?? 81}px`
      html.style.setProperty("--cab", alto)
      raizRef.current?.style.setProperty("--cab", alto)
    }
    medir()
    const observador = typeof ResizeObserver === "function" && cabecera ? new ResizeObserver(medir) : null
    if (observador && cabecera) observador.observe(cabecera)
    return () => {
      observador?.disconnect()
      html.classList.remove("landing-arkad")
      html.style.removeProperty("--cab")
    }
  }, [])

  // Celular en horizontal: la barra se esconde mientras la galería o los minijuegos llenan la pantalla
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return
    const horizontalBajo = window.matchMedia(LANDSCAPE_SHORT)
    const revisar = () => {
      const galeria = document.getElementById("galeria")
      setBarraEscondida(horizontalBajo.matches && !!galeria && galeria.getBoundingClientRect().top < window.innerHeight * 0.5)
    }
    window.addEventListener("scroll", revisar, { passive: true })
    window.addEventListener("resize", revisar)
    horizontalBajo.addEventListener("change", revisar)
    revisar()
    return () => {
      window.removeEventListener("scroll", revisar)
      window.removeEventListener("resize", revisar)
      horizontalBajo.removeEventListener("change", revisar)
    }
  }, [])

  // Con los minijuegos llenando la pantalla, el fondo casi no se ve: se congela y la GPU queda libre para el juego
  useEffect(() => {
    const juegos = document.getElementById("juego")
    if (!juegos || typeof IntersectionObserver !== "function") return
    const observador = new IntersectionObserver(([e]) => setJuegosEnPantalla(e.intersectionRatio > 0.6), { threshold: [0, 0.6, 1] })
    observador.observe(juegos)
    return () => observador.disconnect()
  }, [])

  return (
    <div ref={raizRef} className="arkad-landing">
      {/* Escena del fondo: túnel y logo 3D a la derecha de la portada; se queda en la portada al bajar */}
      <ArkadBackground modo="vivo" centro={[0.7, 0.5]} opacidadLogo={1} conScroll pausada={juegosEnPantalla} />
      <LandingHeader ref={cabeceraRef} sticky concealed={barraEscondida} />

      <main>
        <section className="portada" id="portada">
          <div className="velo" aria-hidden="true" />
          <div className="contenido">
            <p className="ceja">VI EDICIÓN · UNIVERSIDAD DEL NORTE</p>
            <h1>
              FERIA
              <br />
              GAMER
            </h1>
            <p className="lema">USO SALUDABLE DE LAS REDES SOCIALES</p>
            <p className="lead">
              La exhibición de los mejores videojuegos creados por estudiantes. Inscribe a tu equipo, presenta tu proyecto ante el
              jurado y compite por el podio.
            </p>
            <div className="botones">
              {/* Siempre visible: si las inscripciones están cerradas, /registro-equipo muestra "Inscripciones cerradas" */}
              <button type="button" className="btn btn-blanco" onClick={() => navigate("/registro-equipo")}>
                Inscribir equipo
                <ArrowRight className="size-[18px]" aria-hidden />
              </button>
              <Link to="/equipos" className="btn btn-vidrio">
                Ver videojuegos
              </Link>
            </div>
          </div>
          <a className="bajar" href="#galeria">
            REVIVE LAS FERIAS
            <ChevronDown size={18} aria-hidden />
          </a>
        </section>

        <FairGallery />
        <MiniGamesSection />
      </main>

      {/* Botones flotantes: en celular y tablet se apartan mientras los minijuegos están a la vista (sobre-juego) */}
      <div className="flotantes-landing">
        <TextSizeControl />
        <DiscordButton discordUrl={DISCORD_SOPORTE} />
      </div>
    </div>
  )
}

export default LandingPage
