import "@/features/public/components/minigames/MiniGamesSection.css";
import { memo, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { mountMiniGames, type MiniGamesHandle } from "./mountMiniGames";
import StudentGamesPanel from "./StudentGamesPanel";
import GlobalRecordPanel from "./GlobalRecordPanel";
import GlobalRecordsBoard from "./GlobalRecordsBoard";

type CssVars = CSSProperties & Record<`--${string}`, string>;

// jsdom (pruebas) no tiene WebGL ni Web Audio: ahí solo se pinta el armazón
const sinMotor = typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent);

type Pestana = "arkad" | "estudiantes";
const PESTANAS: { id: Pestana; nombre: string; desc: string }[] = [
  {
    id: "arkad",
    nombre: "Minijuegos ARKAD",
    desc: "Juega con el personaje de Arkad: vuela entre torres de píxeles o arma tu propia banda con guitarra, piano y batería.",
  },
  {
    id: "estudiantes",
    nombre: "De los estudiantes",
    desc: "Los mejores videojuegos creados por los estudiantes en cada feria. Elige una edición y juega desde aquí.",
  },
];

/**
 * Sección de juegos de la landing (ARK-233), con dos pestañas que comparten la cabina:
 * - «Minijuegos ARKAD»: portadas animadas (solo CSS) de Arkadash y Arkad Jam; al elegir una, el juego se abre en el marco.
 *   React pinta el armazón una vez; los juegos (Three.js y Web Audio) se cargan al abrirlos y se desmontan con la landing.
 * - «De los estudiantes»: los destacados que elige el admin, con filtro por edición (StudentGamesPanel).
 */
function MiniGamesSection() {
  const seccionRef = useRef<HTMLElement>(null);
  const motorRef = useRef<MiniGamesHandle | null>(null);
  const [pestana, setPestana] = useState<Pestana>("arkad");

  useEffect(() => {
    if (!seccionRef.current || sinMotor) return;
    const motor = mountMiniGames(seccionRef.current);
    motorRef.current = motor;
    return () => {
      motorRef.current = null;
      motor.unmount();
    };
  }, []);

  function elegirPestana(p: Pestana) {
    if (p !== "arkad") motorRef.current?.closeGame(); // el minijuego abierto se cierra (deja de sonar y de dibujar)
    setPestana(p);
  }
  // flechas izquierda y derecha entre las pestañas (patrón de pestañas de ARIA)
  function alTeclearPestana(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const otra: Pestana = pestana === "arkad" ? "estudiantes" : "arkad";
    elegirPestana(otra);
    document.getElementById(`pestana-${otra}`)?.focus();
  }
  const actual = PESTANAS.find((p) => p.id === pestana)!;

  return (
    <section ref={seccionRef} className="juego" id="juego" aria-labelledby="juegoTitulo">
      <div className="juego-cabeza">
        <div>
          <p className="ceja">JUEGOS</p>
          <h2 id="juegoTitulo">Juega en la Feria Gamer</h2>
          <p className="desc">{actual.desc}</p>
          <div className="pestanas-juegos" role="tablist" aria-label="Juegos">
            {PESTANAS.map((p) => (
              <button
                key={p.id}
                id={`pestana-${p.id}`}
                type="button"
                role="tab"
                className="pestana-juego"
                aria-selected={pestana === p.id}
                aria-controls={`zona-${p.id}`}
                tabIndex={pestana === p.id ? 0 : -1}
                onClick={() => elegirPestana(p.id)}
                onKeyDown={alTeclearPestana}
              >
                {p.nombre}
              </button>
            ))}
          </div>
        </div>
        {/* controles de los minijuegos ARKAD (los maneja mountMiniGames) */}
        <div className="juego-derecha" hidden={pestana !== "arkad"}>
          {/* controles de la sección: volver a las portadas y volumen (los dos minijuegos tienen sonido) */}
          <div className="controles-juego">
            <button className="contorno volver" type="button" id="volverJuegos" hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              Minijuegos</button>
            <div className="volumen" id="volumen" hidden>
              <button className="boton-icono" type="button" id="silenciar" aria-pressed={false} aria-label="Silenciar (M)"></button>
              <input type="range" id="nivelVolumen" min="0" max="100" step="5" defaultValue={80} aria-label="Volumen" />
            </div>
          </div>
          <p className="teclas-ayuda solo-mouse" data-ayuda="arkadash" hidden><kbd>Espacio</kbd> o clic para aletear · <kbd>P</kbd> pausa · <kbd>M</kbd> silencio</p>
          <p className="teclas-ayuda solo-mouse" data-ayuda="jam" hidden><kbd>1</kbd>–<kbd>8</kbd> notas · <kbd>Q</kbd><kbd>W</kbd><kbd>R</kbd><kbd>T</kbd><kbd>Y</kbd> semitonos · <kbd>G</kbd><kbd>P</kbd><kbd>B</kbd> instrumento · <kbd>M</kbd> silencio</p>
        </div>
      </div>

      <div className="zona-juegos" id="zona-arkad" role="tabpanel" aria-labelledby="pestana-arkad" hidden={pestana !== "arkad"}>
        {/* portadas animadas (solo CSS): se elige un juego y se abre en el marco */}
        <div className="portadas" id="portadas">
          <button className="portada-juego p-dash" type="button" data-juego="arkadash" aria-label="Jugar Arkadash: vuela entre torres de píxeles">
            <span className="arte" aria-hidden="true">
              <span className="a-cielo"></span><span className="a-estrellas"></span>
              <svg className="a-luna" viewBox="0 0 49 32"><polygon points="47.96,30.55 33.38,25.48 36.94,23.41 29.71,11.49 22.48,23.41 26.05,25.48 11.46,30.55 29.71,0.96"/><polygon points="1.05,30.55 19.3,0.96 37.55,30.55 22.96,25.48 26.53,23.41 19.3,11.49 12.07,23.41 15.64,25.48"/></svg>
              <span className="a-ciudad"></span>
              <span className="a-suelo"><span className="a-rejilla"></span></span>
              <span className="a-torres"><span className="a-torre" style={{ '--d': '0s', '--h': '34%' } as CssVars}></span><span className="a-torre" style={{ '--d': '-2.2s', '--h': '18%' } as CssVars}></span><span className="a-torre" style={{ '--d': '-4.4s', '--h': '44%' } as CssVars}></span></span>
              <span className="a-gema"></span>
              <span className="a-heroe"><span className="a-estela"><i></i><i></i><i></i><i></i><i></i></span><svg className="arkad-svg" viewBox="0 0 49 32"><polygon points="47.96,30.55 33.38,25.48 36.94,23.41 29.71,11.49 22.48,23.41 26.05,25.48 11.46,30.55 29.71,0.96" fill="#7d9cff"/><polygon points="1.05,30.55 19.3,0.96 37.55,30.55 22.96,25.48 26.53,23.41 19.3,11.49 12.07,23.41 15.64,25.48" fill="#eef2ff"/><rect x="9.3" y="14.6" width="20" height="10.4" rx="3" fill="#050a24"/><g className="ojos-svg" fill="#d6e4ff"><rect x="13.7" y="15.8" width="1.6" height="1.6"/><rect x="12.1" y="17.4" width="4.8" height="4.8"/><rect x="13.7" y="22.2" width="1.6" height="1.6"/><rect x="23.3" y="15.8" width="1.6" height="1.6"/><rect x="21.7" y="17.4" width="4.8" height="4.8"/><rect x="23.3" y="22.2" width="1.6" height="1.6"/></g></svg></span>
            </span>
            <span className="info">
              <span className="chip">MINIJUEGO 01 · ARCADE<em id="portadaRecord"></em></span>
              <span className="titulo">Arkadash</span>
              <span className="bajada">Vuela entre torres de píxeles, junta cristales para tu escudo y no choques.</span>
              <span className="cta">Jugar <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z"/></svg></span>
            </span>
          </button>
          <button className="portada-juego p-jam" type="button" data-juego="jam" aria-label="Jugar Arkad Jam: toca guitarra, piano y batería">
            <span className="arte" aria-hidden="true">
              <span className="j-cielo"></span>
              <span className="j-haces"><i></i><i></i><i></i></span>
              <span className="j-eq"><i style={{ '--c': '#ff5d73', '--t': '0.45s', '--d': '-0.00s' } as CssVars}></i><i style={{ '--c': '#ff9a3d', '--t': '0.63s', '--d': '-0.23s' } as CssVars}></i><i style={{ '--c': '#ffd23f', '--t': '0.81s', '--d': '-0.46s' } as CssVars}></i><i style={{ '--c': '#5be37d', '--t': '0.54s', '--d': '-0.69s' } as CssVars}></i><i style={{ '--c': '#38d6c8', '--t': '0.72s', '--d': '-0.02s' } as CssVars}></i><i style={{ '--c': '#4c9bff', '--t': '0.45s', '--d': '-0.25s' } as CssVars}></i><i style={{ '--c': '#8a6bff', '--t': '0.63s', '--d': '-0.48s' } as CssVars}></i><i style={{ '--c': '#e35dff', '--t': '0.81s', '--d': '-0.71s' } as CssVars}></i></span>
              <span className="j-heroe"><svg className="arkad-svg" viewBox="0 0 49 32"><polygon points="47.96,30.55 33.38,25.48 36.94,23.41 29.71,11.49 22.48,23.41 26.05,25.48 11.46,30.55 29.71,0.96" fill="#7d9cff"/><polygon points="1.05,30.55 19.3,0.96 37.55,30.55 22.96,25.48 26.53,23.41 19.3,11.49 12.07,23.41 15.64,25.48" fill="#eef2ff"/><rect x="9.3" y="14.6" width="20" height="10.4" rx="3" fill="#050a24"/><g className="ojos-svg" fill="#d6e4ff"><rect x="13.7" y="15.8" width="1.6" height="1.6"/><rect x="12.1" y="17.4" width="4.8" height="4.8"/><rect x="13.7" y="22.2" width="1.6" height="1.6"/><rect x="23.3" y="15.8" width="1.6" height="1.6"/><rect x="21.7" y="17.4" width="4.8" height="4.8"/><rect x="23.3" y="22.2" width="1.6" height="1.6"/></g></svg></span>
              <span className="j-notas"><i style={{ '--x': '30%', '--c': '#ff5d73', '--d': '-0.0s', '--r': '-18deg' } as CssVars}>♪</i><i style={{ '--x': '44%', '--c': '#5be37d', '--d': '-1.1s', '--r': '14deg' } as CssVars}>♫</i><i style={{ '--x': '60%', '--c': '#4c9bff', '--d': '-2.2s', '--r': '-10deg' } as CssVars}>♪</i><i style={{ '--x': '70%', '--c': '#e35dff', '--d': '-0.6s', '--r': '20deg' } as CssVars}>♫</i></span>
              <span className="j-pista"><span className="j-carriles"><span style={{ '--c': '#ff5d73' } as CssVars}><b style={{ '--d': '-0.00s' } as CssVars}></b><b style={{ '--d': '-0.90s' } as CssVars}></b></span><span style={{ '--c': '#ffd23f' } as CssVars}><b style={{ '--d': '-1.06s' } as CssVars}></b><b style={{ '--d': '-0.16s' } as CssVars}></b></span><span style={{ '--c': '#38d6c8' } as CssVars}><b style={{ '--d': '-0.32s' } as CssVars}></b><b style={{ '--d': '-1.22s' } as CssVars}></b></span><span style={{ '--c': '#4c9bff' } as CssVars}><b style={{ '--d': '-0.85s' } as CssVars}></b><b style={{ '--d': '-1.75s' } as CssVars}></b></span><span style={{ '--c': '#e35dff' } as CssVars}><b style={{ '--d': '-0.11s' } as CssVars}></b><b style={{ '--d': '-1.01s' } as CssVars}></b></span></span></span>
            </span>
            <span className="info">
              <span className="chip">MINIJUEGO 02 · MÚSICA</span>
              <span className="titulo">Arkad Jam</span>
              <span className="bajada">Toca guitarra, piano y batería: sigue las canciones o improvisa en modo libre.</span>
              <span className="cta">Tocar <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z"/></svg></span>
            </span>
          </button>
        </div>
        {/* top 5 global de cada minijuego (HU-52); se oculta con un juego abierto (lo maneja mountMiniGames) */}
        <div className="records-zona" id="recordsGlobales">
          <GlobalRecordsBoard />
        </div>
      <div className="cabina" id="cabina" tabIndex={-1} role="application" aria-roledescription="juego" aria-label="Arkadash. Pulsa Espacio o toca para aletear." hidden>
        <div className="panel" id="panelArkadash" hidden>
        <canvas id="lienzoJuego" aria-hidden="true"></canvas>
        <div className="capa" id="jAvisos" aria-hidden="true"></div>
        <div className="destello" id="jDestello" aria-hidden="true"></div>
        <button className="detener pausar-dash" type="button" id="jPausar" aria-label="Pausar (P)" title="Pausar (P)" hidden><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1.5"/><rect x="14" y="4" width="5" height="16" rx="1.5"/></svg></button>
        <div className="hud" aria-hidden="true">
          <div className="marcador"><b id="jPuntos">0</b><small>RÉCORD <span id="jRecord">0</span></small></div>
          <div className="indicadores">
            <span className="pildora energia" id="jEnergia"><span className="txt">ENERGÍA</span><i></i><i></i><i></i><em>ESCUDO ACTIVO</em></span>        </div>
        </div>
        <div className="pantalla oculta" id="jInicio">
          <div className="tarjeta-juego">
            <p className="ceja">ARKADASH</p>
            <p className="titulo-juego">¿Hasta dónde llegas?</p>
            <ul className="reglas">
              <li><span className="ico ico-gema"></span>3 cristales cargan un escudo</li>
              <li><span className="ico ico-ras"></span>Pasa al ras de una torre y suma 1 extra</li>
            </ul>
            <button className="btn btn-blanco" type="button" id="jJugar">Jugar
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z"/></svg></button>
            <p className="tecla"><span className="solo-mouse">Pulsa <kbd>Espacio</kbd> o haz clic para aletear</span><span className="solo-tactil">Toca la pantalla para aletear</span></p>
          </div>
        </div>
        <div className="pantalla centro oculta" id="jPausa">
          <div className="tarjeta-juego">
            <p className="titulo-juego">En pausa</p>
            <button className="btn btn-blanco" type="button" id="jReanudar">Reanudar
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z"/></svg></button>
            <p className="tecla"><span className="solo-mouse">o pulsa <kbd>Espacio</kbd> para seguir</span><span className="solo-tactil">o toca la pantalla para seguir</span></p>
          </div>
        </div>
        <div className="pantalla centro oculta" id="jFin">
          <div className="tarjeta-juego">
            <p className="ceja">FIN DEL VUELO</p>
            <p className="titulo-juego" id="jFinTitulo">¡Choque!</p>
            <div className="resultado"><div><small>PUNTOS</small><b id="jFinPuntos">0</b></div><div><small>TU RÉCORD</small><b id="jFinRecord">0</b></div></div>
            <GlobalRecordPanel game="ARKADASH" />
            <button className="btn btn-blanco" type="button" id="jOtra">Jugar otra vez</button>
            <p className="tecla solo-mouse">o pulsa <kbd>Espacio</kbd></p>
          </div>
        </div>
        <div className="cargando" id="jCargando"><span className="giro"></span><span id="jCargaTxt">Cargando el juego…</span></div>
        </div>
        {/* Arkad Jam: el personaje toca guitarra (6 cuerdas), piano (con semitonos) o batería; modo libre o canciones estilo Guitar Hero */}
        <div className="panel" id="panelJam" hidden>
          <canvas id="lienzoJam" aria-hidden="true"></canvas>
          <canvas className="pista-notas" id="jamPista" aria-hidden="true"></canvas>
          <div className="capa" id="jamAvisos" aria-hidden="true"></div>
          <div className="jam-arriba">
            <div className="instrumentos" role="radiogroup" aria-label="Instrumento">
              <button className="instrumento" type="button" role="radio" aria-checked={true} data-instrumento="guitarra">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m20 4-6.5 6.5"/><path d="m18 2 4 4"/><path d="M11.5 8.5a4 4 0 0 0-5.7 1.3 3 3 0 0 1-2.6 1.6A3.3 3.3 0 0 0 4 18l2 2a3.3 3.3 0 0 0 6.6.8 3 3 0 0 1 1.6-2.6 4 4 0 0 0 1.3-5.7Z"/><circle cx="9" cy="15" r="1.2"/></svg>
                Guitarra <kbd>G</kbd></button>
              <button className="instrumento" type="button" role="radio" aria-checked={false} data-instrumento="piano" tabIndex={-1}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v9M12 4v16M16 4v9M8 13v7M16 13v7"/></svg>
                Piano <kbd>P</kbd></button>
              <button className="instrumento" type="button" role="radio" aria-checked={false} data-instrumento="bateria" tabIndex={-1}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><ellipse cx="12" cy="13" rx="8" ry="3"/><path d="M4 13v4c0 1.7 3.6 3 8 3s8-1.3 8-3v-4M7 3l4 8M17 3l-4 8"/></svg>
                Batería <kbd>B</kbd></button>
            </div>
            <div className="jam-modo">
              <div className="modos" role="radiogroup" aria-label="Modo de juego">
                <button className="modo" type="button" role="radio" aria-checked={true} data-modo="libre">Libre</button>
                <button className="modo" type="button" role="radio" aria-checked={false} data-modo="canciones" tabIndex={-1}>Canciones</button>
              </div>
              <div className="marcador-jam" id="jamMarcador" hidden>
                <span><small>PUNTOS</small><b id="jamPuntos">0</b></span>
                <span><small>COMBO</small><b id="jamCombo">×1</b></span>
                <button className="detener" type="button" id="jamDetener" aria-label="Pausar la canción (Esc)" title="Pausar (Esc)"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1.5"/><rect x="14" y="4" width="5" height="16" rx="1.5"/></svg></button>
              </div>
            </div>
          </div>
          <div className="jam-teclas" id="jamTeclas" aria-label="Notas"></div>
          <div className="cuenta" id="jamCuenta" aria-hidden="true"></div>
          <div className="pantalla centro oculta" id="jamCanciones">
            <div className="tarjeta-juego ancha">
              <div className="lista-cabeza">
                <div><p className="ceja">CANCIONES</p><p className="titulo-juego" id="jamListaTitulo">Guitarra</p></div>
                <p className="ayuda-lista">Toca cada nota cuando llegue a la línea</p>
              </div>
              <div className="niveles" id="jamNiveles" role="tablist" aria-label="Dificultad"></div>
              <div className="lista-canciones" id="jamLista" role="tabpanel"></div>
            </div>
          </div>
          <div className="pantalla centro oculta" id="jamPausa">
            <div className="tarjeta-juego">
              <p className="ceja" id="jamPausaCancion"></p>
              <p className="titulo-juego">En pausa</p>
              <div className="acciones-pausa">
                <button className="btn btn-blanco" type="button" id="jamReanudar">Reanudar
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z"/></svg></button>
                <button className="btn btn-vidrio" type="button" id="jamReiniciar">Empezar de nuevo</button>
                <button className="btn btn-vidrio" type="button" id="jamSalir">Elegir otra canción</button>
              </div>
              <p className="tecla solo-mouse">o pulsa <kbd>Esc</kbd> para seguir</p>
            </div>
          </div>
          <div className="pantalla centro oculta" id="jamResultado">
            <div className="tarjeta-juego">
              <p className="ceja" id="jamResCancion"></p>
              <p className="titulo-juego" id="jamResTitulo">¡Canción completa!</p>
              <p className="estrellas" id="jamEstrellas" aria-label=""></p>
              <div className="resultado"><div><small>PUNTOS</small><b id="jamResPuntos">0</b></div><div><small>PRECISIÓN</small><b id="jamResPrecision">0%</b></div></div>
              <p className="detalle" id="jamResDetalle"></p>
              <GlobalRecordPanel game="ARKAD_JAM" />
              <button className="btn btn-blanco" type="button" id="jamOtra">Tocar otra vez</button>
              <button className="btn btn-vidrio" type="button" id="jamOtraCancion">Elegir otra canción</button>
            </div>
          </div>
          <div className="cargando" id="jamCargando"><span className="giro"></span><span id="jamCargaTxt">Afinando instrumentos…</span></div>
        </div>
      </div>
      </div>
      <div className="zona-juegos" id="zona-estudiantes" role="tabpanel" aria-labelledby="pestana-estudiantes" hidden={pestana !== "estudiantes"}>
        <StudentGamesPanel active={pestana === "estudiantes"} />
      </div>
      <p className="sr" aria-live="polite" id="jAnuncio"></p>
      {/* créditos dentro de la última pantalla: al bajar del todo se ve solo el juego y esta línea */}
      <footer className="pie-pagina">© 2026 Arkad · Feria Gamer · Universidad del Norte</footer>
    </section>
  );
}

export default memo(MiniGamesSection);
