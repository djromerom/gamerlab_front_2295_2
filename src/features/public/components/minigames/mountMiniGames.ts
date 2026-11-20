/**
 * Sección «Minijuegos Arkad» de la landing (ARK-233): portadas, carga perezosa de cada juego y control de volumen.
 * Se ven las dos portadas; al elegir una, el juego se abre en el marco y «Minijuegos» vuelve a las portadas.
 * Three.js (y el código de cada juego) se descargan solo cuando la sección está cerca.
 * mountMiniGames devuelve cómo cerrar el juego abierto y cómo desmontarlo todo (listeners, observadores, bucles, WebGL y audio).
 */
import { closeAudio, setMasterVolume } from "./audio";
import type { GameContext, GameControl, GameId } from "./gameContext";

const NOMBRES: Record<GameId, string> = {
  arkadash: "Arkadash. Pulsa Espacio o toca para aletear.",
  jam: "Arkad Jam. Toca notas con las teclas 1 a 8 (semitonos del piano con Q, W, R, T e Y) y cambia de instrumento con G, P o B.",
};
const ERROR_CARGA = "No se pudo cargar el juego. Revisa la conexión y recarga la página.";
export const RECORD_KEY = "arkadash-record";
export const VOLUME_KEY = "arkad-volumen";
const ICONOS_VOLUMEN = {
  mudo: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/>',
  bajo: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5"/>',
  alto: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18.5 6.5a8 8 0 0 1 0 11"/>',
};

const leer = (clave: string) => {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null; // sin almacenamiento (modo privado): dura la visita
  }
};
const guardar = (clave: string, valor: string) => {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    /* sin almacenamiento: dura la visita */
  }
};
/** Volumen guardado (0 a 1); 0,8 si no hay o no es válido */
export function savedVolume(): number {
  const v = leer(VOLUME_KEY);
  const n = v === null ? NaN : Number(v);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.8;
}

/** Lo que la sección de React puede pedirle a los minijuegos */
export interface MiniGamesHandle {
  /** Cierra el minijuego abierto y vuelve a las portadas (al cambiar a la pestaña de los estudiantes) */
  closeGame(): void;
  /** Desmonta todo: listeners, observadores, bucles, WebGL y audio */
  unmount(): void;
}

export function mountMiniGames(seccion: HTMLElement): MiniGamesHandle {
  const abortar = new AbortController();
  const limpiezas: (() => void)[] = [];
  let vivo = true;
  let juegoActivo: GameId | null = null;
  const controles: Partial<Record<GameId, GameControl>> = {};

  const $j = <T extends HTMLElement = HTMLElement>(id: string) => seccion.querySelector<T>(`#${id}`)!;
  const cabina = $j("cabina"), portadas = $j("portadas"), volver = $j("volverJuegos");

  const ctx: GameContext = {
    $j,
    cabina,
    juegoActivo: () => juegoActivo,
    controles,
    enVista: () => {
      const r = cabina.getBoundingClientRect();
      return r.height > 0 && (Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / r.height >= 0.55;
    },
    escribiendo: () => {
      const a = document.activeElement as HTMLInputElement | null;
      return /^(INPUT|TEXTAREA|SELECT)$/.test(a?.tagName || "") && a.type !== "range";
    },
    visorAbierto: () => !!document.querySelector(".arkad-landing .visor.abierto"),
    on: (destino, tipo, fn, opciones) =>
      destino.addEventListener(tipo, fn as EventListener, { ...opciones, signal: abortar.signal }),
    vigilar: (o) => {
      limpiezas.push(() => o.disconnect());
      return o;
    },
    alDestruir: (fn) => limpiezas.push(fn),
    vivo: () => vivo,
  };
  const { on, vigilar } = ctx;

  // con la sección a la vista: los botones flotantes se apartan (CSS, solo donde taparían el juego)
  // y, si la sección no se ve, las animaciones de las portadas se pausan (no gastan nada fuera de pantalla)
  function revisarSeccion() {
    const r = seccion.getBoundingClientRect(), visible = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
    document.querySelector(".flotantes-landing")?.classList.toggle("sobre-juego", visible / Math.min(r.height, innerHeight) > 0.35);
    portadas.classList.toggle("pausadas", visible <= 0);
  }
  vigilar(new IntersectionObserver(revisarSeccion, { threshold: [0, 0.35, 0.6] })).observe(seccion);
  on(window, "scroll", revisarSeccion, { passive: true });
  on(window, "resize", revisarSeccion);
  revisarSeccion();

  function pintarRecordPortada() {
    const r = Number(leer(RECORD_KEY)) || 0;
    $j("portadaRecord").textContent = r ? `· RÉCORD ${r}` : "";
  }
  pintarRecordPortada();

  function abrirJuego(id: GameId | null, enfocar = true) {
    if (id === juegoActivo) return;
    const anterior = juegoActivo;
    if (anterior) controles[anterior]?.desactivar();
    juegoActivo = id;
    portadas.hidden = !!id;
    $j("recordsGlobales").hidden = !!id; // el top 5 global va con las portadas
    cabina.hidden = !id;
    volver.hidden = !id;
    $j("volumen").hidden = !id;
    $j("panelArkadash").hidden = id !== "arkadash";
    $j("panelJam").hidden = id !== "jam";
    seccion.querySelectorAll<HTMLElement>("[data-ayuda]").forEach((a) => {
      a.hidden = a.dataset.ayuda !== id;
    });
    if (!id) {
      if (enfocar) portadas.querySelector<HTMLElement>(`[data-juego="${anterior}"]`)?.focus({ preventScroll: true });
      pintarRecordPortada();
      return;
    }
    cabina.setAttribute("aria-label", NOMBRES[id]);
    cargar(id);
    controles[id]?.activar();
    cabina.focus({ preventScroll: true });
  }
  portadas.querySelectorAll<HTMLElement>(".portada-juego").forEach((b) => on(b, "click", () => abrirJuego(b.dataset.juego as GameId)));
  on(volver, "click", () => abrirJuego(null));

  // cada juego se descarga y se arma la primera vez que se abre
  const pedidos = new Set<GameId>();
  function cargar(id: GameId) {
    if (pedidos.has(id)) return;
    pedidos.add(id);
    const modulo = id === "jam" ? import("./arkadJam").then((m) => m.mountArkadJam) : import("./arkadash").then((m) => m.mountArkadash);
    modulo
      .then((montar) => {
        if (vivo) montar(ctx);
      })
      .catch((err) => {
        console.error(err);
        if (!vivo) return;
        const pre = id === "jam" ? "jam" : "j";
        $j(`${pre}CargaTxt`).textContent = ERROR_CARGA;
        $j(`${pre}Cargando`).querySelector<HTMLElement>(".giro")!.style.display = "none";
        pedidos.delete(id);
      });
  }
  // con la sección cerca se descarga Three.js (sin armar nada): al abrir un juego, arranca enseguida
  let precargado = false;
  function precargar() {
    if (precargado) return;
    precargado = true;
    window.removeEventListener("scroll", cercaDelJuego);
    import("three").catch(() => {
      precargado = false;
    });
  }
  function cercaDelJuego() {
    const r = seccion.getBoundingClientRect();
    if (r.top < innerHeight * 2 && r.bottom > -innerHeight) precargar();
  }
  vigilar(
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) precargar();
    }, { rootMargin: "100% 0px" }),
  ).observe(seccion);
  on(window, "scroll", cercaDelJuego, { passive: true });
  cercaDelJuego();

  // ── Volumen: control deslizante (0–100), botón de silencio y tecla M; se recuerda entre visitas ──
  const rangoVolumen = $j<HTMLInputElement>("nivelVolumen"), botonSilencio = $j("silenciar");
  let volumen = savedVolume(), silenciado = false;
  function aplicarVolumen() {
    const efectivo = silenciado ? 0 : volumen;
    setMasterVolume(efectivo);
    rangoVolumen.value = String(Math.round(volumen * 100));
    rangoVolumen.style.setProperty("--v", `${efectivo * 100}%`);
    rangoVolumen.setAttribute("aria-valuetext", efectivo ? `${Math.round(volumen * 100)} %` : "Silenciado");
    botonSilencio.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONOS_VOLUMEN[!efectivo ? "mudo" : volumen < 0.5 ? "bajo" : "alto"]}</svg>`;
    botonSilencio.setAttribute("aria-pressed", String(!efectivo));
    botonSilencio.setAttribute("aria-label", efectivo ? "Silenciar (M)" : "Activar sonido (M)");
    botonSilencio.title = botonSilencio.getAttribute("aria-label")!;
  }
  function alternarSilencio() {
    if (volumen === 0) {
      volumen = 0.5;
      silenciado = false;
      guardar(VOLUME_KEY, String(volumen));
    } else silenciado = !silenciado;
    aplicarVolumen();
  }
  on(rangoVolumen, "input", () => {
    volumen = Number(rangoVolumen.value) / 100;
    silenciado = false;
    guardar(VOLUME_KEY, String(volumen));
    aplicarVolumen();
  });
  on(botonSilencio, "click", alternarSilencio);
  on(window, "keydown", (e) => {
    if (e.key?.toLowerCase() !== "m" || e.repeat || e.ctrlKey || e.metaKey || e.altKey || !juegoActivo || !ctx.enVista() || ctx.escribiendo()) return;
    e.preventDefault();
    alternarSilencio();
  });
  aplicarVolumen();

  const unmount = () => {
    vivo = false;
    juegoActivo = null; // los bucles de los juegos se detienen en su próximo cuadro
    abortar.abort();
    for (const fn of limpiezas.splice(0)) {
      try {
        fn();
      } catch (err) {
        console.error(err);
      }
    }
    closeAudio();
    if (import.meta.env.DEV) {
      // ganchos de prueba de cada juego (solo en desarrollo)
      const w = window as unknown as Record<string, unknown>;
      delete w.arkadash;
      delete w.arkadJam;
    }
  };
  return { closeGame: () => abrirJuego(null, false), unmount };
}
