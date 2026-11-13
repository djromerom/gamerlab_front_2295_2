/**
 * Escena del fondo de Arkad (ARK-222), dibujada en un <canvas> 2D sin librerías.
 * Portada del mockup aprobado (mockups/feria-gamer-vistas.html).
 *
 * - "vivo":   landing. Túnel, partículas y logo 3D; el cursor orienta el logo.
 * - "lento":  páginas públicas de lectura. La misma escena a ~1/16 de velocidad y con poca respuesta al cursor.
 * - "quieto": paneles en celular. Degradado difuminado que casi no se mueve (en PC los paneles no llevan escena).
 * En pantallas de menos de 768 px (salvo la landing) la escena se cambia por un degradado difuminado.
 * En alto contraste no se dibuja nada, y con prefers-reduced-motion se dibuja un solo cuadro.
 *
 * Rendimiento: el fondo fijo (color, halo y líneas del túnel) se pinta una vez en un canvas aparte y cada cuadro
 * solo lo copia desplazado; las partículas se trazan en pocos grupos y el brillo del logo es un degradado,
 * no un shadowBlur (que obliga a desenfocar en cada cuadro).
 */

export type ModoFondo = "vivo" | "lento" | "quieto";

export interface OpcionesEscena {
  modo: ModoFondo;
  /** Centro de la escena en fracciones de la ventana (x, y). */
  centro?: [number, number];
  /** Opacidad del logo 3D (0 lo oculta). */
  opacidadLogo?: number;
}

interface Paleta {
  bg: string; halo: string; haloK: number; halo2: string; haloFin: string;
  linea: string; marco: string; estrella: string; atras: string;
  c0: number[]; c1: number[]; f0: string; f1: string; f2: string; brillo: string; anillo: string;
}

const OSCURO: Paleta = {
  bg: "#050A24", halo: "76,116,255", haloK: 1, halo2: "rgba(43,80,232,0.14)", haloFin: "rgba(5,10,36,0)",
  linea: "143,168,255", marco: "160,185,255", estrella: "220,230,255", atras: "#0B1A6B",
  c0: [20, 42, 140], c1: [150, 185, 255], f0: "#FFFFFF", f1: "#C9D6FF", f2: "#A9C4FF",
  brillo: "110,145,255", anillo: "rgba(201,214,255,0.45)",
};
const CLARO: Paleta = {
  bg: "#EEF2FF", halo: "120,150,255", haloK: 0.6, halo2: "rgba(120,150,255,0.08)", haloFin: "rgba(238,242,255,0)",
  linea: "43,80,232", marco: "43,80,232", estrella: "43,80,232", atras: "#9DB4FF",
  c0: [110, 140, 235], c1: [205, 218, 255], f0: "#8FB0FF", f1: "#4C74FF", f2: "#6E91FF",
  brillo: "76,116,255", anillo: "rgba(43,80,232,0.35)",
};

// Los dos picos del logo como polígonos (coordenadas de public/Arkad.svg)
const PICO_ATRAS = [[47.96, 30.55], [33.38, 25.48], [36.94, 23.41], [29.71, 11.49], [22.48, 23.41], [26.05, 25.48], [11.46, 30.55], [29.71, 0.96]];
const PICO_FRENTE = [[1.05, 30.55], [19.3, 0.96], [37.55, 30.55], [22.96, 25.48], [26.53, 23.41], [19.3, 11.49], [12.07, 23.41], [15.64, 25.48]];

// Fondo de celular: manchas de color grandes y difuminadas que se desplazan despacio
const MANCHAS = [
  { c: "43,80,232", a: 0.55, r: 0.75, x: 0.2, y: 0.18, sx: 0.7, sy: 0.5, p: 0 },
  { c: "76,116,255", a: 0.42, r: 0.65, x: 0.85, y: 0.45, sx: 0.5, sy: 0.8, p: 2.1 },
  { c: "28,52,170", a: 0.6, r: 0.85, x: 0.35, y: 0.85, sx: 0.6, sy: 0.4, p: 4.2 },
  { c: "127,190,255", a: 0.16, r: 0.5, x: 0.7, y: 0.1, sx: 0.9, sy: 0.6, p: 1.3 },
];

const ANCHO_CELULAR = 768;
// Fuera de la landing la escena casi no se mueve: se dibuja a menos cuadros por segundo y gasta menos batería
const INTERVALO_LENTO_MS = 1000 / 30;
const INTERVALO_CELULAR_MS = 1000 / 20;
// Margen del fondo pre-pintado: alcanza para el desplazamiento máximo que provoca el cursor
const MARGEN = 0.05;
// Grupos de partículas por brillo: unos pocos trazos por cuadro en lugar de uno por partícula
const GRUPOS = 8;

function preparar(poligono: number[][]) {
  const pts = poligono.map((p) => [p[0] - 24.5, p[1] - 15.75]);
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const q = pts[(i + 1) % pts.length];
    area += pts[i][0] * q[1] - q[0] * pts[i][1];
  }
  return { pts, signo: area > 0 ? 1 : -1 };
}

function mezclar(a: number[], b: number[], k: number) {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`;
}

export interface Escena {
  actualizar(opciones: OpcionesEscena): void;
  destruir(): void;
}

export function crearEscena(canvas: HTMLCanvasElement, inicial: OpcionesEscena): Escena {
  // alpha:false evita componer la transparencia del canvas con la página en cada cuadro
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
  if (!ctx) return { actualizar() {}, destruir() {} };

  const raiz = document.documentElement;
  const reducir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const atras = preparar(PICO_ATRAS);
  const frente = preparar(PICO_FRENTE);
  const estrellas = Array.from({ length: 150 }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() }));
  const grupos: number[][] = Array.from({ length: GRUPOS }, () => []);

  // Capa fija pre-pintada (color, halo y líneas radiales del túnel)
  const base = document.createElement("canvas");
  const ctxBase = base.getContext("2d");

  let op: OpcionesEscena = inicial;
  let W = 0, H = 0, dpr = 1;
  let mx = 0, my = 0, rx = 0, ry = 0, fase = 0.4, t = 0, tb = 0;
  let cx0 = 0, cy0 = 0; // centro de la escena sin el desplazamiento del cursor
  let P: Paleta = OSCURO;
  let oculto = false;
  let raf = 0, ultimo = 0, ultimoDibujo = 0;

  const vivo = () => op.modo === "vivo";
  const celular = () => !vivo() && window.innerWidth < ANCHO_CELULAR;
  // Ritmo: la landing a velocidad normal; las páginas de lectura a ~1/16 y con poca respuesta al cursor
  const velocidad = () => (vivo() ? 1 : 0.06);
  const amplitud = () => (vivo() ? 1 : 0.3);
  const opacidadLogo = () => op.opacidadLogo ?? 0.3;

  function leerTema() {
    // Paleta según el tema: oscuro, claro, o sin escena en alto contraste (queda a la vista el fondo liso del tema)
    P = raiz.classList.contains("dark") ? OSCURO : CLARO;
    oculto = raiz.classList.contains("high-contrast");
    canvas.style.display = oculto ? "none" : "";
    canvas.style.opacity = op.modo === "quieto" ? (P === CLARO ? "0.8" : "0.6") : "1";
  }

  function redimensionar() {
    // Resolución: la landing hasta 1,5x; el resto a 1x (casi no se mueve y el degradado no necesita más)
    dpr = vivo() ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;
    W = Math.round(window.innerWidth * dpr);
    H = Math.round(window.innerHeight * dpr);
    canvas.width = W;
    canvas.height = H;
  }

  function calcularCentro() {
    const centro = op.centro ?? [0.5, 0.5];
    // En pantallas angostas una escena descentrada (la landing) pasa al centro
    const angosta = W / dpr < 760 && centro[0] !== 0.5;
    cx0 = W * (angosta ? 0.5 : centro[0]);
    cy0 = H * (angosta ? 0.34 : centro[1]);
  }

  function pintarBase() {
    if (!ctxBase) return;
    const m = Math.round(Math.max(W, H) * MARGEN);
    base.width = W + 2 * m;
    base.height = H + 2 * m;
    const c = ctxBase;
    const bx = cx0 + m, by = cy0 + m;
    c.fillStyle = P.bg;
    c.fillRect(0, 0, base.width, base.height);
    const halo = c.createRadialGradient(bx, by, 0, bx, by, Math.max(W, H) * 0.34);
    halo.addColorStop(0, `rgba(${P.halo},${0.42 * P.haloK})`);
    halo.addColorStop(0.5, P.halo2);
    halo.addColorStop(1, P.haloFin);
    c.fillStyle = halo;
    c.fillRect(0, 0, base.width, base.height);
    c.lineWidth = dpr;
    c.strokeStyle = `rgba(${P.linea},0.13)`;
    c.beginPath();
    const lejos = Math.max(W, H) * 1.3;
    for (let i = 0; i < 24; i++) {
      const an = (i / 24) * Math.PI * 2 + 0.13;
      c.moveTo(bx + Math.cos(an) * W * 0.035, by + Math.sin(an) * W * 0.035 * 0.5625);
      c.lineTo(bx + Math.cos(an) * lejos, by + Math.sin(an) * lejos * 0.5625);
    }
    c.stroke();
  }

  function rectRedondeado(x: number, y: number, w: number, h: number, r: number) {
    const c = ctx!;
    c.beginPath();
    c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }

  function dibujarManchas(dt: number) {
    const c = ctx!;
    tb += dt;
    const claro = P === CLARO;
    c.globalAlpha = 1;
    c.fillStyle = P.bg;
    c.fillRect(0, 0, W, H);
    const lado = Math.max(W, H);
    for (const m of MANCHAS) {
      const x = W * (m.x + 0.22 * Math.sin(tb * m.sx + m.p));
      const y = H * (m.y + 0.16 * Math.cos(tb * m.sy + m.p));
      const g = c.createRadialGradient(x, y, 0, x, y, lado * m.r);
      g.addColorStop(0, `rgba(${m.c},${claro ? m.a * 0.45 : m.a})`);
      g.addColorStop(1, `rgba(${m.c},0)`);
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
  }

  function dibujarEscena(dt: number) {
    const c = ctx!;
    t += dt * 0.6;
    fase += dt * 0.03;
    const desX = rx * W * 0.03, desY = ry * H * 0.04;
    const cx = cx0 - desX, cy = cy0 - desY;
    const angosta = W / dpr < 760 && (op.centro ?? [0.5, 0.5])[0] !== 0.5;

    // Fondo fijo: una sola copia desplazada según el cursor
    c.globalAlpha = 1;
    const m = (base.width - W) / 2;
    c.drawImage(base, -m - desX, -m - desY);

    // Marcos del túnel que vienen hacia la cámara
    const N = 16;
    for (let k = 0; k < N; k++) {
      const zz = (((k / N - fase) % 1) + 1) % 1;
      const w = (W * 0.075) / (0.035 + zz);
      const alfa = Math.min(1, (1 - zz) * 4) * Math.min(1, zz * 9) * 0.5;
      if (alfa < 0.01) continue;
      c.strokeStyle = `rgba(${P.marco},${alfa.toFixed(3)})`;
      c.lineWidth = (1 + (1 - zz) * 1.6) * dpr;
      rectRedondeado(cx - w / 2, cy - (w * 0.5625) / 2, w, w * 0.5625, w * 0.075);
      c.stroke();
    }

    // Partículas con profundidad, agrupadas por brillo (más tenues en las páginas de lectura)
    for (const g of grupos) g.length = 0;
    for (const e of estrellas) {
      e.z -= dt * 0.04;
      if (e.z <= 0.03) { e.z = 1; e.x = Math.random() * 2 - 1; e.y = Math.random() * 2 - 1; }
      const x1 = cx + (e.x / e.z) * W * 0.32, y1 = cy + (e.y / e.z) * H * 0.32;
      if (x1 < -50 || x1 > W + 50 || y1 < -50 || y1 > H + 50) { e.z = 0; continue; }
      const z0 = e.z + 0.004;
      const grupo = Math.min(GRUPOS - 1, Math.floor((1 - e.z) * GRUPOS));
      grupos[grupo].push(cx + (e.x / z0) * W * 0.32, cy + (e.y / z0) * H * 0.32, x1, y1);
    }
    c.lineCap = "round";
    const brilloMax = vivo() ? 0.85 : 0.4;
    for (let gi = 0; gi < GRUPOS; gi++) {
      const pts = grupos[gi];
      if (!pts.length) continue;
      const cercania = (gi + 0.5) / GRUPOS;
      c.strokeStyle = `rgba(${P.estrella},${(cercania * brilloMax).toFixed(3)})`;
      c.lineWidth = (0.4 + cercania * 2) * dpr;
      c.beginPath();
      for (let i = 0; i < pts.length; i += 4) { c.moveTo(pts[i], pts[i + 1]); c.lineTo(pts[i + 2], pts[i + 3]); }
      c.stroke();
    }

    // Logo 3D extruido
    const alfaLogo = angosta ? Math.min(opacidadLogo(), 0.4) : opacidadLogo();
    if (alfaLogo <= 0) return;
    const yaw = rx * 0.75 + Math.sin(t * 0.5) * 0.14;
    const pitch = -ry * 0.45 + Math.sin(t * 0.37) * 0.05;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const anchoLogo = Math.max(170, Math.min((W / dpr) * 0.25, 390)) * dpr;
    const S = anchoLogo / 49.5, F = 150, elevacion = Math.sin(t * 0.8) * 0.7;
    c.globalAlpha = alfaLogo;

    // Brillo detrás del logo (degradado en lugar de shadowBlur)
    const brillo = c.createRadialGradient(cx, cy, 0, cx, cy, anchoLogo * 0.7);
    brillo.addColorStop(0, `rgba(${P.brillo},0.55)`);
    brillo.addColorStop(1, `rgba(${P.brillo},0)`);
    c.fillStyle = brillo;
    c.fillRect(cx - anchoLogo * 0.7, cy - anchoLogo * 0.7, anchoLogo * 1.4, anchoLogo * 1.4);

    const R = anchoLogo * 0.86;
    c.lineWidth = dpr;
    c.strokeStyle = P.anillo;
    c.setLineDash([3 * dpr, 7 * dpr]);
    c.lineDashOffset = -t * 14 * dpr;
    c.beginPath();
    c.ellipse(cx, cy, R * Math.abs(cyw), R * Math.abs(cp), 0, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);

    const proyectar = (x: number, y: number, z: number) => {
      const xa = x * cyw + z * syw, za = -x * syw + z * cyw;
      const ya = (y + elevacion) * cp - za * sp, zb = (y + elevacion) * sp + za * cp, p = F / (F + zb);
      return [cx + xa * p * S, cy + ya * p * S, zb];
    };
    const prisma = (forma: { pts: number[][]; signo: number }, zc: number, grosor: number, luz: string) => {
      const n = forma.pts.length, Fv: number[][] = [], Bv: number[][] = [];
      for (const [x, y] of forma.pts) { Fv.push(proyectar(x, y, zc - grosor / 2)); Bv.push(proyectar(x, y, zc + grosor / 2)); }
      c.beginPath();
      for (const v of Bv) c.lineTo(v[0], v[1]);
      c.closePath();
      c.fillStyle = P.atras;
      c.fill();
      const caras: { i: number; j: number; z: number; color: string }[] = [];
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const dx = forma.pts[j][0] - forma.pts[i][0], dy = forma.pts[j][1] - forma.pts[i][1], largo = Math.hypot(dx, dy);
        const nx = (forma.signo * dy) / largo, ny = (-forma.signo * dx) / largo;
        const nx1 = nx * cyw, nz1 = -nx * syw, ny1 = ny * cp - nz1 * sp, nz2 = ny * sp + nz1 * cp;
        if (nz2 >= 0) continue; // solo los cantos que miran a la cámara
        const luzDifusa = Math.max(0, nx1 * -0.45 + ny1 * -0.75 + nz2 * -0.48);
        caras.push({ i, j, z: (Fv[i][2] + Fv[j][2] + Bv[i][2] + Bv[j][2]) / 4, color: mezclar(P.c0, P.c1, 0.15 + 0.85 * luzDifusa) });
      }
      caras.sort((a, b) => b.z - a.z);
      c.lineWidth = 0.6 * dpr;
      for (const q of caras) {
        c.beginPath();
        c.moveTo(Fv[q.i][0], Fv[q.i][1]); c.lineTo(Fv[q.j][0], Fv[q.j][1]);
        c.lineTo(Bv[q.j][0], Bv[q.j][1]); c.lineTo(Bv[q.i][0], Bv[q.i][1]);
        c.closePath();
        c.fillStyle = q.color; c.strokeStyle = q.color;
        c.fill(); c.stroke();
      }
      const arriba = proyectar(0, -15, zc - grosor / 2), abajo = proyectar(0, 15, zc - grosor / 2);
      const degradado = c.createLinearGradient(arriba[0], arriba[1], abajo[0], abajo[1]);
      degradado.addColorStop(0, P.f0);
      degradado.addColorStop(1, luz);
      c.beginPath();
      for (const v of Fv) c.lineTo(v[0], v[1]);
      c.closePath();
      c.fillStyle = degradado;
      c.fill();
    };
    // el pico que queda más lejos de la cámara se dibuja primero
    if (yaw > 0.42) { prisma(frente, -2, 7, P.f1); prisma(atras, 6, 7, P.f2); }
    else { prisma(atras, 6, 7, P.f2); prisma(frente, -2, 7, P.f1); }
    c.globalAlpha = 1;
  }

  /** Dibuja un cuadro fijo (movimiento reducido o tras un cambio de tamaño, tema u opciones). */
  function dibujarFijo() {
    if (oculto) return;
    if (celular()) dibujarManchas(0);
    else dibujarEscena(0);
  }

  function preparar_todo() {
    leerTema();
    redimensionar();
    calcularCentro();
    pintarBase();
    dibujarFijo();
  }

  function bucle(ahora: number) {
    raf = requestAnimationFrame(bucle);
    const dt = Math.min(0.05, (ahora - ultimo) / 1000 || 0.016);
    ultimo = ahora;
    if (oculto || reducir) return;
    if (celular()) {
      if (ahora - ultimoDibujo < INTERVALO_CELULAR_MS) return;
      dibujarManchas(Math.min(0.1, (ahora - ultimoDibujo) / 1000) * 0.04);
      ultimoDibujo = ahora;
      return;
    }
    rx += (mx * amplitud() - rx) * Math.min(1, dt * 5);
    ry += (my * amplitud() - ry) * Math.min(1, dt * 5);
    if (!vivo()) {
      if (ahora - ultimoDibujo < INTERVALO_LENTO_MS) return;
      dibujarEscena(Math.min(0.1, (ahora - ultimoDibujo) / 1000) * velocidad());
      ultimoDibujo = ahora;
      return;
    }
    dibujarEscena(dt * velocidad());
  }

  let pendienteTamano = 0;
  function alCambiarTamano() {
    // agrupa los eventos de resize: se re-prepara una vez por cuadro como mucho
    if (pendienteTamano) return;
    pendienteTamano = requestAnimationFrame(() => { pendienteTamano = 0; preparar_todo(); });
  }
  const alMover = (e: PointerEvent) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  };

  // Cambios de tema (clases dark / high-contrast en <html>)
  const observador = new MutationObserver(preparar_todo);
  observador.observe(raiz, { attributes: true, attributeFilter: ["class"] });

  preparar_todo();
  window.addEventListener("resize", alCambiarTamano);
  window.addEventListener("pointermove", alMover, { passive: true });
  raf = requestAnimationFrame(bucle);

  return {
    actualizar(nuevas: OpcionesEscena) {
      op = nuevas;
      preparar_todo();
    },
    destruir() {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(pendienteTamano);
      observador.disconnect();
      window.removeEventListener("resize", alCambiarTamano);
      window.removeEventListener("pointermove", alMover);
    },
  };
}
