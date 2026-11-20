/**
 * Lo que la sección de minijuegos le pasa a cada juego (ARK-233): acceso a sus elementos, qué juego está abierto y cómo
 * registrar listeners, observadores y limpiezas que se deshacen al desmontar la landing.
 */
export type GameId = "arkadash" | "jam";

export interface GameControl {
  activar(): void;
  desactivar(): void;
}

type Destino = Window | Document | HTMLElement;
type Mapa<T> = T extends Window ? WindowEventMap : T extends Document ? DocumentEventMap : HTMLElementEventMap;

export interface GameContext {
  /** Elemento de la sección por su id */
  $j<T extends HTMLElement = HTMLElement>(id: string): T;
  /** Marco donde se abre el juego */
  cabina: HTMLElement;
  juegoActivo(): GameId | null;
  /** Cada juego, al cargar, registra cómo activarse y desactivarse */
  controles: Partial<Record<GameId, GameControl>>;
  /** El marco está en pantalla (más de la mitad): solo entonces el teclado controla los juegos */
  enVista(): boolean;
  /** Hay un campo de texto con el foco: el teclado no va a los juegos */
  escribiendo(): boolean;
  /** El visor de fotos de la galería está abierto: el teclado es suyo */
  visorAbierto(): boolean;
  /** addEventListener que se quita solo al desmontar */
  on<D extends Destino, K extends keyof Mapa<D> & string>(
    destino: D,
    tipo: K,
    fn: (e: Mapa<D>[K]) => void,
    opciones?: AddEventListenerOptions,
  ): void;
  /** Observador que se desconecta al desmontar */
  vigilar<O extends { disconnect(): void }>(o: O): O;
  /** Limpieza que corre al desmontar */
  alDestruir(fn: () => void): void;
  /** false después de desmontar (para cargas que terminan tarde) */
  vivo(): boolean;
}
