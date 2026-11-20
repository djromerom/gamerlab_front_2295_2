/**
 * Arkad Jam (ARK-233): la pista del modo canciones, en un lienzo 2D entre la barra de arriba y las teclas. Va en perspectiva:
 * se angosta hacia el fondo y las notas se acercan y crecen hasta la línea de golpe; abajo, cada carril coincide con su tecla.
 * z = 0 es la línea de golpe y z = 1 el fondo (lo que falta para la nota / anticipo).
 */
import type { Lane } from "./songs";

export interface TrackNote {
  t: number;
  carril: number;
  /** 0 pendiente, 1 acertada, 2 fallada */
  estado: number;
  golpe: number;
  /** duración de la cola (0 si no es sostenida) */
  sost: number;
  /** 0 pendiente, 1 sosteniendo, 2 completa, 3 cortada */
  sostEstado: number;
  corte?: number;
}
export interface TrackSong {
  spb: number;
  sig: number;
  notas: TrackNote[];
  sost: Record<number, TrackNote>;
}
export interface TrackState {
  /** densidad de píxeles del lienzo */
  d: number;
  carriles: Lane[];
  carrilX: number[];
  carrilAncho: number[];
  cancion: TrackSong | null;
  /** tiempo de la canción (o del reloj, sin canción) en segundos */
  t: number;
  /** destello de cada objetivo (se apaga solo) */
  destellos: Float32Array;
  /** segundos que una nota está a la vista antes de llegar a la línea */
  anticipo: number;
}

export function drawTrack(ctx2: CanvasRenderingContext2D, { d, carriles: carr, carrilX, carrilAncho, cancion, t, destellos, anticipo: ANTICIPO }: TrackState, dt: number) {
  const pastilla = (x: number, y: number, w: number, h: number, r: number) => { ctx2.beginPath(); if (ctx2.roundRect) ctx2.roundRect(x, y, w, h, r); else ctx2.rect(x, y, w, h); };
  // pista en perspectiva (como en la portada): se angosta hacia el fondo y las notas se acercan y crecen hasta la línea.
  // Abajo, cada carril coincide con su tecla; z = 0 es la línea de golpe y z = 1 el fondo (lo que falta para la nota / ANTICIPO).
  const W = ctx2.canvas.width, H = ctx2.canvas.height; ctx2.clearRect(0, 0, W, H);
  const n = carr.length; if (!carrilX.length) return;
  const izq = (carrilX[0] - carrilAncho[0] / 2) * d, der = (carrilX[n - 1] + carrilAncho[n - 1] / 2) * d, ancho = der - izq, cx = (izq + der) / 2;
  const yGolpe = H - 22 * d, yFondo = H * .03, F = .28, K = 1 / F - 1;
  const esc = (z) => 1 / (1 + z * K), Y = (z) => yFondo + (yGolpe - yFondo) * (esc(z) - F) / (1 - F), X = (u, z) => cx + (u - .5) * ancho * esc(z);
  const u = carrilX.slice(0, n).map(x => (x * d - izq) / ancho), anchoU = carrilAncho.slice(0, n).map(w => w * d / ancho);
  // cuerpo de la pista: degradado azul que se apaga hacia el fondo, con bordes de neón y separadores
  const zAbajo = -.06;
  ctx2.beginPath(); ctx2.moveTo(X(0, 1), Y(1)); ctx2.lineTo(X(1, 1), Y(1)); ctx2.lineTo(X(1, zAbajo), Y(zAbajo)); ctx2.lineTo(X(0, zAbajo), Y(zAbajo)); ctx2.closePath();
  const gr = ctx2.createLinearGradient(0, yFondo, 0, yGolpe); gr.addColorStop(0, 'rgba(76,116,255,0)'); gr.addColorStop(1, 'rgba(76,116,255,.3)'); ctx2.fillStyle = gr; ctx2.fill();
  const linea = (u1, z1, u2, z2) => { ctx2.beginPath(); ctx2.moveTo(X(u1, z1), Y(z1)); ctx2.lineTo(X(u2, z2), Y(z2)); ctx2.stroke(); };
  ctx2.lineWidth = 2 * d; ctx2.strokeStyle = 'rgba(169,196,255,.45)'; linea(0, 1, 0, zAbajo); linea(1, 1, 1, zAbajo);
  ctx2.lineWidth = d; ctx2.strokeStyle = 'rgba(169,196,255,.16)';
  for (let i = 1; i < n; i++) { const m = (u[i - 1] + u[i]) / 2; linea(m, 1, m, zAbajo); }
  const spb = cancion ? cancion.spb : .6;
  // líneas de compás que avanzan hacia el jugador (dan sensación de velocidad)
  for (let b = Math.ceil(t / spb); ; b++) { const z = (b * spb - t) / ANTICIPO; if (z > 1) break; if (z < 0) continue;
    ctx2.globalAlpha = .18 * (1 - z); ctx2.strokeStyle = '#a9c4ff'; linea(0, z, 1, z); }
  ctx2.globalAlpha = 1;
  // objetivos sobre la línea de golpe: un rectángulo redondeado con el color de la nota, que destella al tocar
  for (let i = 0; i < n; i++) {
    destellos[i] = Math.max(0, destellos[i] - dt * 4);
    if (cancion?.sost[i]) destellos[i] = Math.max(destellos[i], .5 + .2 * Math.sin(performance.now() / 45)); // sosteniendo: el objetivo late
    const w = anchoU[i] * ancho * .88, x = X(u[i], 0), h = 30 * d;
    ctx2.strokeStyle = ctx2.fillStyle = carr[i].color;
    ctx2.globalAlpha = .25 + destellos[i] * .3; ctx2.lineWidth = 10 * d; pastilla(x - w / 2, yGolpe - h / 2, w, h, 10 * d); ctx2.stroke(); // brillo
    ctx2.globalAlpha = .95; ctx2.lineWidth = 4 * d; pastilla(x - w / 2, yGolpe - h / 2, w, h, 10 * d); ctx2.stroke();
    if (destellos[i] > 0) { ctx2.globalAlpha = destellos[i] * .55; ctx2.fill(); }
  }
  ctx2.globalAlpha = 1;
  if (!cancion) return;
  // notas: de la más lejana a la más cercana, para que las cercanas queden encima
  let ultima = cancion.sig; while (ultima < cancion.notas.length && cancion.notas[ultima].t - t <= ANTICIPO) ultima++;
  // colas de las notas sostenidas, debajo de todas las notas: llegan hasta donde termina la nota según el ritmo
  for (let k = ultima - 1; k >= Math.max(0, cancion.sig - 8); k--) {
    const nota = cancion.notas[k]; if (!nota.sost || nota.sostEstado === 2) continue;
    const i = nota.carril, color = carr[i]?.color; if (!color) continue;
    const sosteniendo = nota.sostEstado === 1, roto = nota.sostEstado === 3 || nota.estado === 2;
    const z0 = sosteniendo ? 0 : Math.max(nota.sostEstado === 3 ? (nota.corte - t) / ANTICIPO : (nota.t - t) / ANTICIPO, zAbajo * 3);
    const z1 = Math.min(1, (nota.t + nota.sost - t) / ANTICIPO); if (z1 <= z0) continue;
    const hw = anchoU[i] * .17, a = roto ? .22 : sosteniendo ? 1 : .8 * Math.min(1, (1 - Math.max(z0, 0)) * 5);
    const cola = (f) => { ctx2.beginPath(); ctx2.moveTo(X(u[i] - hw * f, z0), Y(z0)); ctx2.lineTo(X(u[i] + hw * f, z0), Y(z0));
      ctx2.lineTo(X(u[i] + hw * f, z1), Y(z1)); ctx2.lineTo(X(u[i] - hw * f, z1), Y(z1)); ctx2.closePath(); ctx2.fill(); };
    ctx2.fillStyle = roto ? '#8b93a8' : color;
    if (!roto) { ctx2.globalAlpha = a * (sosteniendo ? .45 : .25); cola(2.2); } // brillo
    ctx2.globalAlpha = a; cola(1);
    if (!roto) { ctx2.fillStyle = '#fff'; ctx2.globalAlpha = a * (sosteniendo ? .75 : .35); cola(.28); } // hilo central
  }
  for (let k = ultima - 1; k >= Math.max(0, cancion.sig - 8); k--) {
    const nota = cancion.notas[k], i = nota.carril, color = carr[i]?.color; if (!color) continue;
    const z = (nota.t - t) / ANTICIPO, x = X(u[i], Math.max(z, zAbajo * 3)), s = esc(Math.max(z, zAbajo * 3));
    if (nota.estado === 1) { // acierto: el objetivo se abre en un anillo
      const k2 = (t - nota.golpe) / .3; if (k2 > 1) continue; const w = anchoU[i] * ancho * .88 + k2 * 34 * d, h = 30 * d + k2 * 22 * d;
      ctx2.globalAlpha = 1 - k2; ctx2.strokeStyle = color; ctx2.lineWidth = 4 * d; pastilla(x - w / 2, yGolpe - h / 2, w, h, 12 * d); ctx2.stroke(); continue;
    }
    if (z < zAbajo * 3) continue;
    // notas gruesas (casi el doble que antes), con borde blanco y un brillo amplio: se distinguen bien aun en celular
    const y = Y(z), w = anchoU[i] * ancho * .84 * s, h = 30 * d * (.4 + .6 * s), r = 10 * d * s, a = Math.min(1, (1 - z) * 5) * (nota.estado === 2 ? .3 : 1);
    ctx2.fillStyle = color; ctx2.globalAlpha = a * .35; pastilla(x - w / 2 - 8 * d * s, y - h / 2 - 8 * d * s, w + 16 * d * s, h + 16 * d * s, r + 6 * d * s); ctx2.fill(); // brillo
    ctx2.globalAlpha = a; pastilla(x - w / 2, y - h / 2, w, h, r); ctx2.fill();
    ctx2.strokeStyle = '#fff'; ctx2.lineWidth = Math.max(1, 2.5 * d * s); ctx2.globalAlpha = a * .9; ctx2.stroke();
    ctx2.fillStyle = '#fff'; ctx2.globalAlpha = a * .45; pastilla(x - w / 2 + 5 * d * s, y - h / 2 + 4 * d * s, w - 10 * d * s, 5 * d * s, 3 * d * s); ctx2.fill();
  }
  ctx2.globalAlpha = 1;
}
