/**
 * Galería de las ferias pasadas (ARK-233): carrusel 3D a lo ancho con parallax, pestañas por feria, arrastre o deslizamiento,
 * teclado (flechas con la galería a la vista) y un visor para ampliar la foto. Las fotos se cargan perezosamente y aparecen
 * (con un fundido) cuando ya están decodificadas.
 */
import type { GalleryFair } from "./fairs";

type Tarjeta = HTMLDivElement & { img: HTMLImageElement; brillo: HTMLElement };

const foto = (f: GalleryFair, n: string) => `${f.ruta}/${n}.jpg`;
const miniatura = (f: GalleryFair, n: string) => `${f.ruta}/tira/${n}.jpg`;

/** Arma la galería dentro de la sección (pestañas, carril y controles) y el visor; devuelve la función que la desmonta. */
export function mountFairGallery(seccion: HTMLElement, visor: HTMLElement, FAIRS: GalleryFair[]): () => void {
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const puntero = { cx: -1, cy: -1 };
  const abortar = new AbortController(), observadores: IntersectionObserver[] = [];
  let temporizador = 0;
  // listeners y observadores que se quitan al desmontar
  const on = <E extends Event>(destino: EventTarget, tipo: string, fn: (e: E) => void, opciones: AddEventListenerOptions = {}) =>
    destino.addEventListener(tipo, fn as EventListener, { ...opciones, signal: abortar.signal });
  const vigilar = (o: IntersectionObserver) => { observadores.push(o); return o; };

  const $ = <T extends HTMLElement = HTMLElement>(id: string) => (seccion.querySelector<T>(`#${id}`) || visor.querySelector<T>(`#${id}`))!;
  const escenario = $('escenario'), carril = $('carril');
  const VISIBLES = 2; // a cada lado: 5 fotos en pantalla como mucho
  let feria = 0, actual = 0, tarjetas: Tarjeta[] = [], enVista = false;
  const celular = () => innerWidth < 768;
  const paso = () => (tarjetas[0]?.offsetWidth || 600) * (celular() ? .74 : .64);

  // Tamaño de las fotos según el alto que le queda al escenario (la sección mide una pantalla)
  function medir() {
    const h = escenario.clientHeight;
    const ancho = celular() ? Math.min(innerWidth * .82, h * .94 * 4 / 3) : Math.min(innerWidth * .5, 740, h * .95 * 1.5);
    escenario.style.setProperty('--ancho', Math.max(160, ancho).toFixed(0) + 'px');
  }

  // ── Pestañas ──
  FAIRS.forEach((f, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'feria vidrio'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(i === feria));
    b.innerHTML = `<img src="${miniatura(f, f.fotos[0])}" alt="" /><span><b>${f.titulo}</b><small>${f.periodo} · ${f.fotos.length} fotos</small></span>`;
    on(b, 'click', () => cambiarFeria(i));
    $('ferias').appendChild(b);
  });

  function construir() {
    const f = FAIRS[feria];
    carril.innerHTML = '';
    tarjetas = f.fotos.map((n, i) => {
      const t = document.createElement('div') as Tarjeta;
      t.className = 'tarjeta';
      t.setAttribute('role', 'group'); t.setAttribute('aria-roledescription', 'foto'); t.setAttribute('aria-label', `Foto ${i + 1} de ${f.fotos.length}`);
      t.innerHTML = `<div class="marco"><img alt="${f.titulo}, ${f.periodo.toLowerCase()}, foto ${i + 1}" decoding="async" draggable="false" /><div class="oscuro"></div><div class="brillo"></div>
        <div class="pie"><span>${f.titulo} · ${f.periodo}</span><span class="ampliar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>Ampliar</span></div></div>`;
      t.dataset.src = foto(f, n); t.dataset.nombre = n;
      t.img = t.querySelector('img'); t.brillo = t.querySelector('.brillo');
      carril.appendChild(t);
      return t;
    });
    $('nombreFeria').textContent = `${f.titulo} · ${f.periodo}`;
    $('barra').setAttribute('aria-valuemax', String(tarjetas.length));
  }

  // la foto aparece (fundido) recién cuando está decodificada: no hay tirones al decodificar en medio de una transición
  function cargarFoto(t: Tarjeta) {
    const img = t.img; img.src = t.dataset.src;
    const listo = () => img.classList.add('cargada');
    (typeof img.decode === 'function' ? img.decode() : Promise.resolve()).then(listo, listo);
  }

  function distancia(i: number) { const n = tarjetas.length; let d = i - actual; if (d > n / 2) d -= n; else if (d < -n / 2) d += n; return d; }

  function colocar(desfase = 0) {
    const p = paso(), fondo = celular() ? 170 : 240, giro = celular() ? 34 : 36;
    tarjetas.forEach((t, i) => {
      const d = distancia(i) - desfase, ad = Math.abs(d);
      // las lejanas salen del render; la siguiente capa (vecinas) queda lista pero invisible, para entrar con transición
      t.classList.toggle('fuera', ad > VISIBLES + 1.5);
      t.classList.toggle('en-escena', ad <= VISIBLES + 1.5);
      if (ad > VISIBLES + .5) { if (t.style.visibility !== 'hidden') { t.style.visibility = 'hidden'; t.style.opacity = '0'; } if (ad > VISIBLES + 1.5) return; }
      if (!t.img.src) cargarFoto(t); // carga perezosa (también de las vecinas, para que entren ya decodificadas)
      if (ad > VISIBLES + .5) { t.style.transform = `translate3d(${(Math.sign(d) * (VISIBLES + 1) * p * .85).toFixed(1)}px,0,${(-(VISIBLES + 1) * fondo).toFixed(1)}px) rotateY(${(-Math.sign(d) * giro).toFixed(2)}deg)`; return; }
      const x = d * p * (ad > 1 ? .8 + .2 / ad : 1), lado = Math.sign(d) * Math.min(ad, 1);
      t.style.visibility = 'visible';
      t.style.opacity = String(ad > VISIBLES - .5 ? Math.max(0, VISIBLES + .5 - ad) : 1);
      t.style.zIndex = String(100 - Math.round(ad * 10));
      t.style.transform = `translate3d(${x.toFixed(1)}px,0,${(-ad * fondo).toFixed(1)}px) rotateY(${(-lado * giro).toFixed(2)}deg)`;
      t.classList.toggle('activa', i === actual && Math.abs(desfase) < .5);
    });
  }

  function ir(i: number, anunciar = true) {
    const n = tarjetas.length;
    tarjetas[actual].img.style.transform = ''; // el parallax interno solo mueve la foto activa
    actual = (i + n) % n;
    colocar();
    $('num').innerHTML = String(actual + 1).padStart(2, '0') + ' <small>/ ' + String(n).padStart(2, '0') + '</small>';
    $('relleno').style.transform = `scaleX(${(actual + 1) / n})`;
    $('barra').setAttribute('aria-valuenow', String(actual + 1));
    if (anunciar) $('anuncio').textContent = `Foto ${actual + 1} de ${n}, ${FAIRS[feria].titulo}`;
    moverParallax(true);
  }

  function marcarPestanas() { seccion.querySelectorAll('.feria').forEach((b, k) => b.setAttribute('aria-selected', String(k === feria))); }
  function cambiarFeria(i: number) {
    if (i === feria) return;
    feria = i; marcarPestanas();
    carril.classList.add('cambiando');
    temporizador = window.setTimeout(() => { construir(); actual = 0; carril.classList.remove('cambiando'); colocar(2.5); requestAnimationFrame(() => requestAnimationFrame(() => ir(0))); }, reducir ? 0 : 350);
  }

  // ── Parallax: el carril gira hacia el mouse, la foto activa se desplaza al revés y el brillo la recorre (solo transform) ──
  let vx = 0, vy = 0, ox = 0, oy = 0, rafP = 0;
  function moverParallax(forzar = false) { if (!reducir && enVista && (!rafP || forzar)) { cancelAnimationFrame(rafP); rafP = requestAnimationFrame(pasoParallax); } }
  function pasoParallax() {
    const r = escenario.getBoundingClientRect();
    if (puntero.cx >= 0 && puntero.cy > r.top - 120 && puntero.cy < r.bottom + 120) {
      ox = Math.max(-1, Math.min(1, ((puntero.cx - r.left) / r.width) * 2 - 1));
      oy = Math.max(-1, Math.min(1, ((puntero.cy - r.top) / r.height) * 2 - 1));
    } else { ox = 0; oy = 0; }
    vx += (ox - vx) * .1; vy += (oy - vy) * .1;
    const activa = tarjetas[actual];
    carril.style.transform = `rotateX(${(-vy * 5).toFixed(2)}deg) rotateY(${(vx * 8).toFixed(2)}deg)`;
    activa.img.style.transform = `translate3d(${(-vx * 14).toFixed(1)}px,${(-vy * 9).toFixed(1)}px,0)`;
    activa.brillo.style.transform = `translate3d(${(vx * 28).toFixed(1)}%,${(vy * 28).toFixed(1)}%,0)`;
    rafP = (Math.abs(ox - vx) > .002 || Math.abs(oy - vy) > .002) ? requestAnimationFrame(pasoParallax) : 0;
  }
  on(window, 'pointermove', (e: PointerEvent) => { if (e.pointerType !== 'mouse') return; puntero.cx = e.clientX; puntero.cy = e.clientY; moverParallax(); }, { passive: true });
  on(window, 'scroll', () => moverParallax(), { passive: true });
  vigilar(new IntersectionObserver(([e]) => { enVista = e.isIntersecting; if (enVista) moverParallax(true); }, { threshold: 0 })).observe(escenario);

  // ── Controles ──
  on($('ant'), 'click', () => ir(actual - 1));
  on($('sig'), 'click', () => ir(actual + 1));
  on($('barra'), 'click', (e: MouseEvent) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); ir(Math.floor((e.clientX - r.left) / r.width * tarjetas.length)); });
  on($('barra'), 'keydown', (e: KeyboardEvent) => { if (e.key === 'Home') ir(0); if (e.key === 'End') ir(tarjetas.length - 1); });
  let teclado = false;
  vigilar(new IntersectionObserver(([e]) => { teclado = e.intersectionRatio > .5; }, { threshold: [0, .5, 1] })).observe(escenario);
  on(window, 'keydown', (e: KeyboardEvent) => {
    if (visor.classList.contains('abierto')) {
      if (e.key === 'Escape') cerrarVisor();
      if (e.key === 'ArrowLeft') { ir(actual - 1); pintarVisor(); }
      if (e.key === 'ArrowRight') { ir(actual + 1); pintarVisor(); }
      return;
    }
    if (!teclado) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual + 1); }
    if (e.key === 'Enter' && document.activeElement === escenario) abrirVisor();
  });

  // ── Arrastre y clic ──
  let x0 = 0, arrastre: number | null = null, movido = false, tocada: Tarjeta | null = null;
  on(escenario, 'pointerdown', (e: PointerEvent) => {
    if (e.button !== 0) return;
    tocada = (e.target as Element).closest<Tarjeta>('.tarjeta'); arrastre = e.pointerId; x0 = e.clientX; movido = false;
    escenario.setPointerCapture(e.pointerId);
  });
  on(escenario, 'pointermove', (e: PointerEvent) => {
    if (arrastre !== e.pointerId) return;
    const dx = e.clientX - x0;
    if (!movido && Math.abs(dx) < 6) return;
    movido = true; escenario.classList.add('arrastrando');
    colocar(-dx / paso());
  });
  function soltar(e: PointerEvent) {
    if (arrastre !== e.pointerId) return;
    arrastre = null; escenario.classList.remove('arrastrando');
    if (!movido) { const i = tarjetas.indexOf(tocada); if (i === actual) abrirVisor(); else if (i >= 0) ir(i); return; }
    const dx = e.clientX - x0, p = paso(), saltos = Math.round(-dx / p) || (Math.abs(dx) > p * .15 ? -Math.sign(dx) : 0);
    ir(actual + saltos);
  }
  on(escenario, 'pointerup', soltar);
  on(escenario, 'pointercancel', (e: PointerEvent) => { if (arrastre === e.pointerId) { arrastre = null; escenario.classList.remove('arrastrando'); colocar(); } });

  // ── Visor ──
  let antesDelVisor: HTMLElement | null = null;
  function pintarVisor() {
    $<HTMLImageElement>('vImg').src = tarjetas[actual].dataset.src;
    $<HTMLImageElement>('vImg').alt = tarjetas[actual].img.alt;
    $('vPie').textContent = `${FAIRS[feria].titulo} · ${FAIRS[feria].periodo} — ${actual + 1} / ${tarjetas.length}`;
  }
  function abrirVisor() { antesDelVisor = document.activeElement as HTMLElement; pintarVisor(); visor.classList.add('abierto'); document.documentElement.style.overflow = 'hidden'; $('cerrar').focus(); }
  function cerrarVisor() { visor.classList.remove('abierto'); document.documentElement.style.overflow = ''; (antesDelVisor || escenario).focus({ preventScroll: true }); }
  on($('cerrar'), 'click', cerrarVisor);
  on($('vAnt'), 'click', () => { ir(actual - 1); pintarVisor(); });
  on($('vSig'), 'click', () => { ir(actual + 1); pintarVisor(); });
  on(visor, 'click', (e: MouseEvent) => { if (e.target === visor) cerrarVisor(); });
  on(visor, 'keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const f = [...visor.querySelectorAll('button')], i = f.indexOf(document.activeElement as HTMLButtonElement);
    e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
  });

  let pend = 0; on(window, 'resize', () => { if (!pend) pend = requestAnimationFrame(() => { pend = 0; medir(); colocar(); }); });
  medir(); construir(); ir(0, false);
  document.fonts?.ready.then(() => { if (!abortar.signal.aborted) { medir(); colocar(); } });

  return () => {
    abortar.abort();
    observadores.forEach((o) => o.disconnect());
    cancelAnimationFrame(rafP); cancelAnimationFrame(pend); clearTimeout(temporizador);
    if (visor.classList.contains('abierto')) { visor.classList.remove('abierto'); document.documentElement.style.overflow = ''; }
    $('ferias').innerHTML = ''; carril.innerHTML = '';
  };
}
