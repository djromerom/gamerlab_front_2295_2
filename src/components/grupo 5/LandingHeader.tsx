import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, User, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ENLACES = [
  { to: "/equipos", label: "Videojuegos" },
  { to: "/ranking", label: "Ranking" },
  { to: "/informacion", label: "Información" },
  { to: "/ediciones-pasadas", label: "Ediciones pasadas" },
  { to: "/contribuidores", label: "Contribuidores" },
];

const botonContorno =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[rgba(201,214,255,0.5)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[rgba(169,196,255,0.12)] md:px-[22px] cursor-pointer";

/**
 * Barra superior de la landing con el diseño de ARK-222. Conserva lo que hace NavBar:
 * enlaces públicos, "Inicia sesión" o el menú del usuario (Mi dashboard / Cerrar sesión) y el menú de celular.
 */
export default function LandingHeader() {
  const { user, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [usuarioAbierto, setUsuarioAbierto] = useState(false);
  const usuarioRef = useRef<HTMLDivElement>(null);
  const nombreCorto = user ? `${user.firstName} ${user.lastName.charAt(0)}.` : "";

  useEffect(() => {
    function alClicFuera(e: MouseEvent) {
      if (usuarioRef.current && !usuarioRef.current.contains(e.target as Node)) setUsuarioAbierto(false);
    }
    function alCambiarTamano() {
      if (window.innerWidth >= 768) setMenuAbierto(false);
    }
    document.addEventListener("mousedown", alClicFuera);
    window.addEventListener("resize", alCambiarTamano);
    return () => {
      document.removeEventListener("mousedown", alClicFuera);
      window.removeEventListener("resize", alCambiarTamano);
    };
  }, []);

  return (
    <header className="relative z-30 flex flex-wrap items-center justify-between gap-x-8 border-b border-[rgba(201,214,255,0.16)] bg-[rgba(5,10,36,0.78)] px-5 py-3 md:px-[clamp(20px,5vw,72px)] md:py-[18px]">
      <Link to="/" aria-label="Arkad, inicio" className="flex min-h-11 items-center gap-3 text-white">
        <img src="/Arkad.svg" alt="" className="h-auto w-[38px] md:w-[46px]" />
        <span className="font-unbounded text-xs font-medium tracking-[0.22em] md:text-sm md:tracking-[0.34em]">ARKAD</span>
      </Link>

      <nav aria-label="Principal" className="hidden flex-wrap gap-x-8 gap-y-1 text-sm font-medium tracking-[0.02em] md:flex">
        {ENLACES.map((e) => (
          <Link key={e.to} to={e.to} className="py-3 text-[#C9D6FF] transition-colors hover:text-white">
            {e.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        {!user ? (
          <Link to="/login" className={botonContorno}>
            Inicia sesión
          </Link>
        ) : (
          <div className="relative" ref={usuarioRef}>
            <button type="button" className={botonContorno} onClick={() => setUsuarioAbierto(!usuarioAbierto)} aria-expanded={usuarioAbierto}>
              <User size={16} aria-hidden />
              <span className="max-w-[120px] truncate">{nombreCorto}</span>
            </button>
            {usuarioAbierto && (
              <div className="absolute right-0 z-20 mt-2 w-44 rounded-[10px] border border-[rgba(201,214,255,0.18)] bg-[rgba(8,15,48,0.92)] py-2 shadow-lg">
                <Link
                  to="/inicio"
                  className="block px-4 py-2 text-sm text-[#D5DDFA] transition hover:bg-white/10"
                  onClick={() => setUsuarioAbierto(false)}
                >
                  Mi dashboard
                </Link>
                <button
                  type="button"
                  className="w-full cursor-pointer px-4 py-2 text-left text-sm text-red-300 transition hover:bg-white/10"
                  onClick={async () => {
                    setUsuarioAbierto(false);
                    await logout();
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          className="inline-flex size-11 cursor-pointer items-center justify-center rounded-[10px] border border-[rgba(201,214,255,0.5)] text-white md:hidden"
          aria-label="Menú"
          aria-expanded={menuAbierto}
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          {menuAbierto ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
        </button>
      </div>

      {/* Menú de celular: cae con animación debajo de la barra */}
      <nav
        aria-label="Principal (celular)"
        className={`flex w-full flex-col overflow-hidden text-base transition-[max-height,opacity,margin,padding] duration-[450ms] ease-in-out md:hidden ${
          menuAbierto ? "mt-2.5 max-h-80 border-t border-[rgba(201,214,255,0.16)] py-1.5 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {ENLACES.map((e) => (
          <Link
            key={e.to}
            to={e.to}
            tabIndex={menuAbierto ? 0 : -1}
            className="py-3 text-[#C9D6FF] transition-colors hover:text-white"
            onClick={() => setMenuAbierto(false)}
          >
            {e.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
