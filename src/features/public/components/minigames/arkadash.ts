/**
 * Minijuego «Arkadash» (ARK-233): estilo flappy en 3D con Three.js. El logo de Arkad (con visor y ojos de píxeles) aletea entre
 * torres de cubos que se arman al aparecer; 3 cristales cargan un escudo que aguanta un choque y pasar al ras de una torre da +1.
 * Rendimiento: se dibuja directo a pantalla, sin posproceso (el neón son halos con mezcla aditiva), el bucle se detiene fuera
 * de pantalla y, si el equipo va lento, la resolución baja sola (1,5× → 1× → 0,75×).
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createArkadCharacter, disposeScene, neonHelpers } from "./arkadCharacter";
import { createArkadashScenery } from "./arkadashScenery";
import { startAudio, dashSounds } from "./audio";
import type { GameContext } from "./gameContext";

type Valores = Record<string, number>;
interface Torre {
  s: number; activa: boolean; n: number; c: Valores[];
  x?: number; gy?: number; gap?: number; nacio?: number; libre?: number; estallo?: number;
  pasada?: boolean; estallada?: boolean; golpe?: boolean; limpia?: boolean;
}
interface Gema { activa: boolean; x?: number; y?: number; nacio?: number }

export function mountArkadash(c: GameContext) {
  const { $j, cabina, on } = c;
  const lienzo = $j<HTMLCanvasElement>('lienzoJuego');
  const textoCarga = (t: string) => { $j('jCargaTxt').textContent = t; $j('jCargando').querySelector<HTMLElement>('.giro').style.display = 'none'; };
  const M = THREE.MathUtils, azar = (a, b) => a + Math.random() * (b - a), hdr = (hex, k) => new THREE.Color(hex).multiplyScalar(k);
  const reducirMov = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Renderizador (directo a pantalla, con antialiasing del propio lienzo), cámara y luces ──
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance', stencil: false }); }
  catch { textoCarga('Tu navegador no puede mostrar gráficos 3D (WebGL): el juego no está disponible.'); return; }
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  // resolución inicial: hasta 1,5× en computador y 1,25× en pantallas táctiles (celulares con densidad 3× pagarían 2 a 6 veces más píxeles)
  let pr = Math.min(devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.25 : 1.5);
  const { FIN, matHalo } = neonHelpers(THREE);
  const escena = new THREE.Scene();
  const NIEBLA = new THREE.Color(0x0b1758);
  escena.fog = new THREE.FogExp2(NIEBLA.clone(), .013);
  const FOV = 40, camara = new THREE.PerspectiveCamera(FOV, 1, .1, 320);
  const pmrem = new THREE.PMREMGenerator(renderer);
  escena.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture; pmrem.dispose();
  escena.add(new THREE.HemisphereLight(0xa9c4ff, 0x0b1a6b, .65));
  const sol = new THREE.DirectionalLight(0xffffff, 2); sol.position.set(-8, 12, 14); escena.add(sol);
  const contra = new THREE.DirectionalLight(0x4c74ff, 2.6); contra.position.set(10, 3, -12); escena.add(contra);

  const PISO = -9.2, TECHO = 9.2, ALTO_VISTA = 10.3, G = 40, ALETEO = 13.2, CAIDA = 21, ESPACIO = 9.6, PASO = 1 / 120, MEDIO = 1.2;
  const CERO = new THREE.Matrix4().makeScale(0, 0, 0), mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), v = new THREE.Vector3(), esc = new THREE.Vector3();
  const VERT_UV = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;

  const { luna, datosEd, edificios, despRejilla, escalaPuntos, nube, estrellas, velE, NE } = createArkadashScenery(escena, { FIN, VERT_UV, niebla: NIEBLA, piso: PISO, techo: TECHO });

  const NP = 560, chispa = nube(NP);
  const pv = new Float32Array(NP * 3), pvida = new Float32Array(NP), pmax = new Float32Array(NP), ptam = new Float32Array(NP), prgb = new Float32Array(NP * 3), pgrav = new Float32Array(NP);
  let pSig = 0;
  function emitir(x, y, z, vx, vy, vz, vida, tam, c, grav = 0) {
    const i = pSig; pSig = (pSig + 1) % NP;
    chispa.pos[i * 3] = x; chispa.pos[i * 3 + 1] = y; chispa.pos[i * 3 + 2] = z; pv[i * 3] = vx; pv[i * 3 + 1] = vy; pv[i * 3 + 2] = vz;
    pvida[i] = pmax[i] = vida; ptam[i] = tam; prgb[i * 3] = c.r; prgb[i * 3 + 1] = c.g; prgb[i * 3 + 2] = c.b; pgrav[i] = grav;
  }
  function rafaga(x, y, c, n, fuerza = 7, grav = 0) {
    for (let i = 0; i < n; i++) { const a = azar(0, Math.PI * 2), r = azar(.35, 1) * fuerza;
      emitir(x, y, azar(-.4, .4), Math.cos(a) * r - vel, Math.sin(a) * r, azar(-2, 2), azar(.4, .8), azar(.16, .34), c, grav); }
  }
  function moverChispas(dt) {
    const roce = Math.exp(-dt * 1.6);
    for (let i = 0; i < NP; i++) {
      if (pvida[i] <= 0) { if (chispa.tam[i]) { chispa.tam[i] = 0; chispa.col[i * 4 + 3] = 0; } continue; }
      pvida[i] -= dt; const k = Math.max(0, pvida[i] / pmax[i]), j = i * 3;
      pv[j + 1] -= pgrav[i] * dt; pv[j] *= roce; pv[j + 1] *= roce; pv[j + 2] *= roce;
      chispa.pos[j] += pv[j] * dt; chispa.pos[j + 1] += pv[j + 1] * dt; chispa.pos[j + 2] += pv[j + 2] * dt;
      chispa.tam[i] = ptam[i] * (.35 + .65 * k);
      chispa.col[i * 4] = prgb[j]; chispa.col[i * 4 + 1] = prgb[j + 1]; chispa.col[i * 4 + 2] = prgb[j + 2]; chispa.col[i * 4 + 3] = k;
    }
    chispa.subir();
  }

  // ── Personaje: el logo 3D con visor y ojos de píxeles (compartido con Arkad Jam) ──
  const personaje = new THREE.Group(), giro = new THREE.Group(), { cuerpo, pintarOjos, haloOjos } = createArkadCharacter(THREE, matHalo, 4.2);
  personaje.add(giro); giro.add(cuerpo); escena.add(personaje);
  // escudo: burbuja con brillo en los bordes (fresnel)
  const escudoMat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uAlfa: { value: 0 }, uColor: { value: new THREE.Color(.35, 1.1, 2.8) } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vP = position; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uT, uAlfa; uniform vec3 uColor; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ float f = pow(1. - abs(dot(normalize(vN), normalize(vV))), 2.); float b = .5 + .5 * sin(vP.y * 7. + vP.x * 2. - uT * 5.);
        gl_FragColor = vec4(uColor * (.5 + f * 1.4), (f * .85 + .04 + f * b * .35) * uAlfa);${FIN}}` });
  const escudoMalla = new THREE.Mesh(new THREE.SphereGeometry(2.3, 40, 24), escudoMat);
  escudoMalla.scale.set(1, .8, .8); escudoMalla.visible = false; personaje.add(escudoMalla);

  // ── Torres de cubos: cada una se arma con cubos que llegan volando y tiene tapas de neón en el hueco ──
  const MAXT = 7, CPT = 76;
  // cubos con bisel de un solo segmento (96 vértices cada uno en vez de 216): con ~500 cubos la diferencia se nota
  const cubos = new THREE.InstancedMesh(new RoundedBoxGeometry(.94, .94, .94, 1, .1), new THREE.MeshStandardMaterial({ roughness: .3, metalness: .5, envMapIntensity: .6 }), MAXT * CPT);
  const tapas = new THREE.InstancedMesh(new THREE.BoxGeometry(2.25, .2, 2.25), new THREE.MeshBasicMaterial({ color: hdr(0x8fb0ff, 1.6), fog: false }), MAXT * 2);
  const halosTapa = new THREE.InstancedMesh(new THREE.PlaneGeometry(5.2, 2), matHalo(0x5b86ff, .7), MAXT * 2);
  for (let i = 0; i < MAXT * 2; i++) halosTapa.setMatrixAt(i, CERO);
  const cBorde = new THREE.Color(0x5b80ff), cMedio = new THREE.Color(0x22379b), cFondo = new THREE.Color(0x111c5c), cLuz = new THREE.Color(0xc9d6ff), colTmp = new THREE.Color();
  for (let i = 0; i < MAXT * CPT; i++) { cubos.setMatrixAt(i, CERO); cubos.setColorAt(i, cFondo); }
  for (let i = 0; i < MAXT * 2; i++) tapas.setMatrixAt(i, CERO);
  for (const m of [cubos, tapas, halosTapa]) { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; escena.add(m); }
  const torres: Torre[] = Array.from({ length: MAXT }, (_, s) => ({ s, activa: false, n: 0, c: Array.from({ length: CPT }, () => ({})) }));
  function armarTorre(t) {
    const arriba = t.gy + t.gap / 2, abajo = t.gy - t.gap / 2; t.n = 0;
    const fila = (y, k) => { for (const ox of [-.5, .5]) for (const oz of [-.5, .5]) { if (t.n >= CPT) return; const c = t.c[t.n++];
      Object.assign(c, { ox, oy: y, oz, dx: azar(-1, 3.5), dy: azar(-2.5, 2.5) + (y > t.gy ? 3 : -3), dz: azar(-7, 1), rx: azar(-3, 3), ry: azar(-3, 3), rz: azar(-3, 3), retraso: azar(0, .4) + k * .015 });
      const base = k === 0 ? cBorde : k < 3 ? colTmp.copy(cBorde).lerp(cMedio, k / 3) : colTmp.copy(cMedio).lerp(cFondo, Math.min(1, (k - 3) / 5));
      cubos.setColorAt(t.s * CPT + t.n - 1, Math.random() < .07 ? cLuz : base); } };
    for (let y = arriba + .5, k = 0; y < TECHO + 1.6; y++, k++) fila(y, k);
    for (let y = abajo - .5, k = 0; y > PISO - 1.6; y--, k++) fila(y, k);
    for (let i = t.n; i < CPT; i++) cubos.setMatrixAt(t.s * CPT + i, CERO);
    cubos.instanceColor.needsUpdate = true;
  }
  function estallar(t) {
    t.estallada = true; t.estallo = reloj;
    for (let i = 0; i < t.n; i++) { const c = t.c[i], dx = c.ox + t.x, dy = c.oy - py, d = Math.hypot(dx, dy) || 1, f = azar(6, 15);
      Object.assign(c, { px: t.x + c.ox, py: c.oy, pz: c.oz, vx: dx / d * f, vy: dy / d * f + 3, vz: azar(-6, 6), ax: 0, ay: 0, wx: azar(-9, 9), wy: azar(-9, 9) }); }
  }

  // ── Cristales de energía y pedazos del choque ──
  const MAXG = 8, gemas: Gema[] = Array.from({ length: MAXG }, () => ({ activa: false }));
  const mallaGemas = new THREE.InstancedMesh(new THREE.OctahedronGeometry(.5, 0),
    new THREE.MeshStandardMaterial({ color: 0xc8f4ff, emissive: 0x2fa8ff, emissiveIntensity: 1.9, roughness: .12, metalness: .3, flatShading: true }), MAXG);
  const halosGema = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.6, 2.6), matHalo(0x38b6ff, .75), MAXG);
  for (let i = 0; i < MAXG; i++) { mallaGemas.setMatrixAt(i, CERO); halosGema.setMatrixAt(i, CERO); }
  for (const m of [mallaGemas, halosGema]) { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; escena.add(m); }
  const crearGema = (x, y) => { const g = gemas.find(o => !o.activa); if (g) Object.assign(g, { activa: true, x, y, nacio: reloj }); };

  const ND = 28, restos = new THREE.InstancedMesh(new RoundedBoxGeometry(.32, .32, .32, 1, .06), new THREE.MeshStandardMaterial({ roughness: .3, metalness: .2 }), ND);
  const datosR: Valores[] = Array.from({ length: ND }, () => ({}));
  const paleta = [0xf4f7ff, 0xc9d6ff, 0xa9c4ff, 0x4c74ff, 0x7d9cff].map(c => new THREE.Color(c));
  for (let i = 0; i < ND; i++) { restos.setMatrixAt(i, CERO); restos.setColorAt(i, paleta[i % paleta.length]); }
  restos.frustumCulled = false; escena.add(restos);

  // ── Encuadre: el personaje queda a ~30 % del ancho; se ven ±10 unidades de alto en cualquier pantalla ──
  let D = 28, medioAncho = 10, tx = 4, bordeDer = 20, bordeIzq = -10;
  const celular = () => lienzo.clientWidth < 600;
  function ajustar() {
    const w = lienzo.clientWidth, h = lienzo.clientHeight; if (!w || !h) return;
    renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
    camara.aspect = w / h; camara.updateProjectionMatrix();
    const tan = Math.tan(M.degToRad(FOV / 2)); D = ALTO_VISTA / tan;
    medioAncho = ALTO_VISTA * camara.aspect; tx = Math.min(medioAncho * .42, 11);
    bordeDer = tx + medioAncho + 2; bordeIzq = tx - medioAncho - 3;
    escalaPuntos.value = h * pr / (2 * tan);
    luna.position.x = tx + medioAncho * .55;
  }
  c.vigilar(new ResizeObserver(ajustar)).observe(lienzo);

  // ── Estado del juego ──
  const CLAVE = 'arkadash-record';
  const leerRecord = () => { try { return +localStorage.getItem(CLAVE) || 0; } catch { return 0; } };
  const guardarRecord = () => { try { localStorage.setItem(CLAVE, String(record)); } catch { /* sin almacenamiento: el récord dura la visita */ } };
  let estado = 'cargando', puntos = 0, record = leerRecord(), nuevoRecord = false, energia = 0, escudo = false, invulnerable = 0;
  let py = 0, vy = 0, vel = 3, recorrido = 0, siguienteX = 15, nTorres = 0, gyAnt = 0, reloj = 0, acum = 0, tMuerte = 0, tFin = 0, restosVida = 0;
  let temblor = 0, estirar = 0, vEstirar = 0, giroMuerte = 0, alfaEscudo = 0;
  let piloto = false, caraTemp = 'normal', caraHasta = 0, proximoParpadeo = 2, miradaMouse = 1, tMirada = -1e9, estelaAcum = 0;
  const ponerCara = (c, seg) => { caraTemp = c; caraHasta = reloj + seg; };
  const pInicio = $j('jInicio'), pPausa = $j('jPausa'), pFin = $j('jFin'), capaAvisos = $j('jAvisos'), vProy = new THREE.Vector3();
  const mostrar = (el, si) => el.classList.toggle('oculta', !si);
  // colores de las partículas: moderados, porque se suman entre sí (mezcla aditiva) y un exceso satura el brillo
  const cPluma = new THREE.Color(.4, .55, 1.5), cCian = new THREE.Color(.25, 1, 2), cOro = new THREE.Color(2, 1.4, .4), cChoque = new THREE.Color(2, 1, 1.3);

  function aviso(texto, x, y, clase = '') {
    vProy.set(x, y, 0).project(camara);
    const el = document.createElement('span'); el.className = 'aviso ' + clase; el.textContent = texto;
    el.style.left = ((vProy.x * .5 + .5) * 100).toFixed(2) + '%'; el.style.top = ((-vProy.y * .5 + .5) * 100).toFixed(2) + '%';
    capaAvisos.appendChild(el); setTimeout(() => el.remove(), 950);
  }
  function cartel(texto, clase) { const el = document.createElement('div'); el.className = 'banner ' + clase; el.textContent = texto; capaAvisos.appendChild(el); setTimeout(() => el.remove(), 1450); }
  function destello() { const d = $j('jDestello'); d.classList.remove('activo'); void d.offsetWidth; d.classList.add('activo'); }

  const hud = { puntos: $j('jPuntos'), record: $j('jRecord'), energia: $j('jEnergia') }, pips = [...hud.energia.querySelectorAll('i')];
  let hudP = -1, hudR = -1, hudE = -1, hudEsc = null, hudPausa = null;
  const botonPausa = $j('jPausar');
  function pintarHud() {
    const jugando = estado === 'jugando'; if (jugando !== hudPausa) { botonPausa.hidden = !jugando; hudPausa = jugando; } // el botón de pausa, solo en vuelo
    if (puntos !== hudP) { hud.puntos.textContent = String(puntos); if (puntos > hudP && hudP >= 0) { hud.puntos.classList.remove('sube'); void hud.puntos.offsetWidth; hud.puntos.classList.add('sube'); } hudP = puntos; }
    const r = Math.max(record, puntos); if (r !== hudR) { hud.record.textContent = String(r); hudR = r; }
    if (energia !== hudE || escudo !== hudEsc) { pips.forEach((el, i) => el.classList.toggle('llena', i < energia)); hud.energia.classList.toggle('activo', escudo); hudE = energia; hudEsc = escudo; }
  }

  function empezar() {
    const foco = pInicio.contains(document.activeElement) || pFin.contains(document.activeElement);
    torres.forEach(t => { t.activa = false; }); gemas.forEach(g => { g.activa = false; }); restosVida = 0;
    if (estado === 'fin') py = 0;
    puntos = 0; energia = 0; escudo = false; invulnerable = 0; vy = 0; nTorres = 0; gyAnt = 0; giroMuerte = 0; nuevoRecord = false; siguienteX = 15;
    estado = 'jugando'; [pInicio, pFin, pPausa].forEach(p => mostrar(p, false));
    if (foco) cabina.focus({ preventScroll: true });
    pintarHud();
  }
  function aletear() {
    vy = ALETEO; vEstirar = Math.min(vEstirar + 3.4, 4); dashSounds.aleteo();
    for (let i = 0; i < 10; i++) emitir(azar(-.8, .6), py - 1.1, azar(-.6, .6), azar(-4, 1) - vel * .4, -azar(1.5, 5), azar(-1, 1), azar(.3, .5), azar(.16, .28), cPluma);
  }
  function pausar() { if (estado !== 'jugando') return; estado = 'pausa'; mostrar(pPausa, true); }
  function accion() {
    startAudio(); // el sonido se habilita con el primer toque o tecla (lo exigen los navegadores)
    if (estado === 'listo') { empezar(); aletear(); }
    else if (estado === 'jugando') aletear();
    else if (estado === 'pausa') { estado = 'jugando'; mostrar(pPausa, false); dashSounds.pausa(false); aletear(); }
    else if (estado === 'fin' && performance.now() - tFin > 450) { empezar(); aletear(); }
  }

  function generar(x) {
    const t = torres.find(o => !o.activa); if (!t) return;
    nTorres++;
    const gap = Math.max(5.6, 7 - puntos * .05), lim = TECHO - gap / 2 - 1.4, gy = M.clamp(gyAnt + azar(-3.6, 3.6), -lim, lim);
    Object.assign(t, { activa: true, x, gy, gap, nacio: reloj, pasada: false, libre: 9, estallada: false, golpe: false });
    armarTorre(t);
    const xm = x - ESPACIO / 2, ym = (gy + gyAnt) / 2;
    if (Math.random() < .45) crearGema(x, gy);
    else if (nTorres > 1 && Math.random() < .35) crearGema(xm, M.clamp(ym + azar(-1.2, 1.2), -6, 6));
    gyAnt = gy;
  }
  // el personaje se aproxima con tres círculos: el cuerpo y las dos esquinas de abajo de los picos
  const CIRC = [[0, -.11, 1.05], [-1.27, -.6, .6], [1.27, -.6, .6]];
  function golpeaTorre(t) {
    const arriba = t.gy + t.gap / 2, abajo = t.gy - t.gap / 2;
    for (const [ox, oy, r] of CIRC) {
      const cy = py + oy, ddx = ox - M.clamp(ox, t.x - 1, t.x + 1), r2 = r * r - ddx * ddx;
      if (r2 <= 0) continue;
      if (cy + Math.sqrt(r2) > arriba || cy - Math.sqrt(r2) < abajo) return true;
    }
    return false;
  }
  function revisar() {
    for (const t of torres) {
      if (!t.activa || t.estallada) continue;
      if (Math.abs(t.x) < 3 && !t.golpe && golpeaTorre(t) && invulnerable <= 0) {
        t.golpe = true;
        if (escudo) { romperEscudo(); estallar(t); } else return morir();
      }
      if (Math.abs(t.x) < 1) t.libre = Math.min(t.libre, py - MEDIO - (t.gy - t.gap / 2), t.gy + t.gap / 2 - (py + MEDIO));
      if (!t.pasada && t.x < -2.2) { t.pasada = true; puntos += 1; if (!t.golpe && t.libre > 0 && t.libre < .45) alRas(); else dashSounds.punto(puntos); }
    }
    if (py - MEDIO < PISO || py + MEDIO > TECHO) {
      if (!escudo && invulnerable <= 0) return morir();
      py = M.clamp(py, PISO + MEDIO, TECHO - MEDIO); vy = (py < 0 ? 1 : -1) * ALETEO * .8;
      if (escudo) romperEscudo();
    }
    for (const g of gemas) if (g.activa && Math.hypot(g.x, g.y - py) < 1.4) recoger(g);
  }
  function alRas() {
    puntos += 1; aviso('¡AL RAS! +1', 0, py + 2.4, 'ras'); ponerCara('sorpresa', .5); dashSounds.punto(puntos); dashSounds.alRas();
    for (let i = 0; i < 12; i++) emitir(azar(-1, 1), py, azar(-.5, .5), azar(-6, -2), azar(-3, 3), azar(-1, 1), .5, .2, cOro);  }
  function recoger(g) {
    g.activa = false; rafaga(g.x, g.y, cCian, 18, 6); ponerCara('feliz', .55);
    if (escudo) { puntos += 1; aviso('+1', g.x, g.y + 1.4, 'gema'); dashSounds.cristal(4); return; }
    energia++; dashSounds.cristal(energia);
    if (energia >= 3) { energia = 0; escudo = true; cartel('¡ESCUDO ACTIVO!', 'escudo'); dashSounds.escudo(); } else aviso('+ENERGÍA', g.x, g.y + 1.4, 'gema');
  }
  function romperEscudo() {
    escudo = false; invulnerable = .9; temblor = reducirMov ? 0 : .32; rafaga(0, py, cCian, 34, 10); dashSounds.escudoRoto();
    aviso('¡ESCUDO ROTO!', 0, py + 2.6, 'gema');
  }
  function morir() {
    estado = 'muerto'; tMuerte = reloj; vy = 9; temblor = reducirMov ? 0 : .6; destello(); dashSounds.choque();
    rafaga(0, py, cChoque, 36, 11, 8);
    for (const r of datosR) { const a = azar(0, Math.PI * 2), f = azar(4, 11);
      Object.assign(r, { x: azar(-1.4, 1.4), y: py + azar(-.8, .8), z: azar(-.5, .8), vx: Math.cos(a) * f, vy: Math.sin(a) * f + 4, vz: azar(-4, 4), ax: 0, ay: 0, wx: azar(-12, 12), wy: azar(-12, 12) }); }
    restosVida = 1.6;
    nuevoRecord = puntos > record; if (nuevoRecord) { record = puntos; guardarRecord(); }
  }
  function mostrarFin() {
    estado = 'fin'; tFin = performance.now();
    $j('jFinPuntos').textContent = String(puntos); $j('jFinRecord').textContent = String(record);
    $j('jFinTitulo').textContent = nuevoRecord ? '¡Nuevo récord!' : '¡Choque!';
    mostrar(pFin, true); $j('jOtra').focus({ preventScroll: true }); dashSounds.fin(nuevoRecord && puntos > 0);
    $j('jAnuncio').textContent = `Fin del vuelo: ${puntos} puntos. Récord: ${record}.`;
  }

  // ── Física a paso fijo (120 por segundo): igual en cualquier pantalla ──
  function paso(dt) {
    reloj += dt;
    const meta = estado === 'jugando' ? Math.min(7 + puntos * .1, 11.5) : estado === 'listo' ? 3.2 : 0;
    vel += (meta - vel) * Math.min(1, dt * (estado === 'jugando' ? 1.5 : 2.5));
    const dx = vel * dt; recorrido += dx;
    for (const d of datosEd) { d.x -= dx * .22; if (d.x < -95) d.x += 172; }
    for (let i = 0; i < NE; i++) { estrellas.pos[i * 3] -= dx * velE[i]; if (estrellas.pos[i * 3] < -100) estrellas.pos[i * 3] += 210; }
    for (const t of torres) {
      if (!t.activa) continue;
      t.x -= dx;
      if (t.estallada) for (let i = 0; i < t.n; i++) { const c = t.c[i]; c.vy -= 22 * dt; c.px += c.vx * dt - dx; c.py += c.vy * dt; c.pz += c.vz * dt; c.ax += c.wx * dt; c.ay += c.wy * dt; }
      if (t.x < bordeIzq - 3) t.activa = false;
    }
    for (const g of gemas) if (g.activa) { g.x -= dx; if (g.x < bordeIzq - 2) g.activa = false; }
    if (restosVida > 0) { restosVida -= dt; for (const r of datosR) { r.vy -= 24 * dt; r.x += r.vx * dt - dx; r.y += r.vy * dt; r.z += r.vz * dt; r.ax += r.wx * dt; r.ay += r.wy * dt; } }
    if (invulnerable > 0) invulnerable -= dt;

    if (estado === 'jugando') {
      if (piloto) { // solo para pruebas: aletea para quedar a la altura del próximo hueco
        let meta = gyAnt, mx = 1e9; for (const t of torres) if (t.activa && t.x > -1.6 && t.x < mx) { mx = t.x; meta = t.gy; }
        if (py < meta - 1 && vy < 0) aletear();
      }
      vy = Math.max(vy - G * dt, -CAIDA); py += vy * dt;
      siguienteX -= dx; while (siguienteX < bordeDer + 8) { generar(siguienteX); siguienteX += ESPACIO; }
      revisar();
    } else if (estado === 'listo') {
      const base = celular() ? 5 : 0; // en celular, por encima de la tarjeta de inicio
      py = base + Math.sin(reloj * 2.2) * .7; vy = Math.cos(reloj * 2.2) * 1.54;
    } else if (estado === 'muerto' || estado === 'fin') {
      vy -= G * .9 * dt; py += vy * dt;
      if (py < PISO + MEDIO) { py = PISO + MEDIO; vy = Math.abs(vy) > 3 ? -vy * .35 : 0; }
      if (vy !== 0) giroMuerte -= dt * 7;
      if (estado === 'muerto' && reloj - tMuerte > 1.15) mostrarFin();
    }
  }

  // ── Dibujo (cada cuadro): posiciones extrapoladas con el tiempo que sobra del paso fijo, para que se vea fluido ──
  function dibujarTorres(adelanto) {
    for (const t of torres) {
      const b = t.s * CPT;
      if (!t.activa) { if (!t.limpia) { for (let i = 0; i < CPT; i++) cubos.setMatrixAt(b + i, CERO); for (const k of [t.s * 2, t.s * 2 + 1]) { tapas.setMatrixAt(k, CERO); halosTapa.setMatrixAt(k, CERO); } t.limpia = true; } continue; }
      t.limpia = false;
      const x = t.x - adelanto, u = (reloj - t.nacio) / .85;
      if (t.estallada) {
        const k = M.clamp(1.3 - (reloj - t.estallo), 0, 1);
        for (let i = 0; i < t.n; i++) { const c = t.c[i]; v.set(c.px - adelanto, c.py, c.pz); q.setFromEuler(e3.set(c.ax, c.ay, 0)); esc.setScalar(k); cubos.setMatrixAt(b + i, mtx.compose(v, q, esc)); }
        for (const k of [t.s * 2, t.s * 2 + 1]) { tapas.setMatrixAt(k, CERO); halosTapa.setMatrixAt(k, CERO); } continue;
      }
      for (let i = 0; i < t.n; i++) {
        const c = t.c[i], a = reducirMov ? 1 : M.clamp((u - c.retraso) / .6, 0, 1);
        if (a <= 0) { cubos.setMatrixAt(b + i, CERO); continue; }
        const inv = (1 - a) ** 3;
        v.set(x + c.ox + c.dx * inv, c.oy + c.dy * inv, c.oz + c.dz * inv); q.setFromEuler(e3.set(c.rx * inv, c.ry * inv, c.rz * inv)); esc.setScalar(1 - inv * .7);
        cubos.setMatrixAt(b + i, mtx.compose(v, q, esc));
      }
      const at = reducirMov ? 1 : M.clamp((u - .55) / .4, 0, 1);
      q.identity(); esc.set(at, 1, at);
      tapas.setMatrixAt(t.s * 2, at ? mtx.compose(v.set(x, t.gy + t.gap / 2 + .02, 0), q, esc) : CERO);
      tapas.setMatrixAt(t.s * 2 + 1, at ? mtx.compose(v.set(x, t.gy - t.gap / 2 - .02, 0), q, esc) : CERO);
      // halo de la tapa: delante de la torre, para que el neón se vea encima de los cubos
      esc.set(at, at, 1);
      halosTapa.setMatrixAt(t.s * 2, at ? mtx.compose(v.set(x, t.gy + t.gap / 2 + .05, 1.25), q, esc) : CERO);
      halosTapa.setMatrixAt(t.s * 2 + 1, at ? mtx.compose(v.set(x, t.gy - t.gap / 2 - .05, 1.25), q, esc) : CERO);
    }
    cubos.instanceMatrix.needsUpdate = true; tapas.instanceMatrix.needsUpdate = true; halosTapa.instanceMatrix.needsUpdate = true;
  }

  function animar(dt, adelanto) {
    const pyV = py + vy * acum;
    personaje.position.set(0, pyV, 0);
    // cabeceo según la velocidad; al morir, gira mientras cae
    if (estado === 'muerto' || estado === 'fin') giro.rotation.z = giroMuerte;
    else {
      const meta = estado === 'listo' ? Math.sin(reloj * 2.2 + .6) * .1 : M.clamp(vy * .034, -.75, .5);
      giro.rotation.z += (meta - giro.rotation.z) * Math.min(1, dt * 12);
    }
    // estirar y aplastar con un resorte al aletear
    vEstirar += (-170 * estirar - 13 * vEstirar) * dt; estirar = M.clamp(estirar + vEstirar * dt, -.3, .35);
    cuerpo.scale.set(1 - estirar * .45, 1 + estirar, 1 - estirar * .45);
    // ojos: miran hacia adelante al jugar y siguen al mouse mientras espera
    if (performance.now() - tMirada > 2500) { const s = Math.sin(reloj * .8); miradaMouse = s > .2 ? 1 : s < -.65 ? -1 : 0; }
    cuerpo.rotation.y = .4 + Math.sin(reloj * 1.3) * .1 + (estado === 'listo' ? miradaMouse * .2 : 0);
    cuerpo.visible = !(invulnerable > 0 && Math.floor(reloj * 14) % 2 === 0);
    let c = 'normal';
    if (estado === 'muerto' || estado === 'fin') c = 'muerto';
    else if (reloj < caraHasta) c = caraTemp;
    else if (reloj > proximoParpadeo) { if (reloj < proximoParpadeo + .14) c = 'parpadeo'; else proximoParpadeo = reloj + azar(1.6, 4.2); }
    pintarOjos(c, c === 'muerto' ? 0 : estado === 'listo' ? miradaMouse : 1);
    haloOjos.visible = estado !== 'muerto' && estado !== 'fin';
    // escudo
    alfaEscudo += ((escudo ? 1 : 0) - alfaEscudo) * Math.min(1, dt * 6);
    escudoMalla.visible = alfaEscudo > .01; escudoMat.uniforms.uT.value = reloj; escudoMat.uniforms.uAlfa.value = alfaEscudo * (.85 + .15 * Math.sin(reloj * 7));
    escudoMalla.rotation.y = reloj * .6;
    // estela de píxeles
    if (estado === 'jugando' || estado === 'listo') {
      estelaAcum += dt * (estado === 'jugando' ? 75 : 35);
      while (estelaAcum >= 1) { estelaAcum--; emitir(azar(-1.7, -1.1), pyV + azar(-.5, .5), azar(-.6, .3), -vel * .7 - azar(.5, 2.5), azar(-.4, .4), azar(-.3, .3), azar(.45, .8), azar(.12, .26), escudo ? cCian : cPluma); }
    }
    moverChispas(dt);
    dibujarTorres(adelanto);
    // cristales
    gemas.forEach((g, i) => {
      if (!g.activa) { mallaGemas.setMatrixAt(i, CERO); halosGema.setMatrixAt(i, CERO); return; }
      const s = Math.min(1, (reloj - g.nacio) * 3);
      v.set(g.x - adelanto, g.y + Math.sin(reloj * 3 + i) * .18, 0); q.setFromEuler(e3.set(.3, reloj * 2.4 + i, 0)); esc.set(s, s * 1.35, s);
      mallaGemas.setMatrixAt(i, mtx.compose(v, q, esc));
      q.identity(); esc.setScalar(s * (.9 + Math.sin(reloj * 5 + i) * .1)); v.z = .6; halosGema.setMatrixAt(i, mtx.compose(v, q, esc));
      if (Math.random() < dt * 6) emitir(v.x + azar(-.4, .4), v.y + azar(-.5, .5), azar(-.3, .3), -vel, azar(.5, 1.5), 0, .5, .14, cCian);
    });
    mallaGemas.instanceMatrix.needsUpdate = true; halosGema.instanceMatrix.needsUpdate = true;
    // pedazos del choque
    const kr = M.clamp(restosVida / .5, 0, 1);
    datosR.forEach((r, i) => {
      if (kr <= 0) { restos.setMatrixAt(i, CERO); return; }
      v.set(r.x - adelanto, r.y, r.z); q.setFromEuler(e3.set(r.ax, r.ay, 0)); esc.setScalar(kr); restos.setMatrixAt(i, mtx.compose(v, q, esc));
    });
    restos.instanceMatrix.needsUpdate = true;
    // ciudad y estrellas (parallax)
    q.identity();
    datosEd.forEach((d, i) => { v.set(d.x - adelanto * .22, PISO + d.h / 2, d.z); esc.set(d.w, d.h, d.d); edificios.setMatrixAt(i, mtx.compose(v, q, esc)); });
    edificios.instanceMatrix.needsUpdate = true; estrellas.subir();
    despRejilla.value = recorrido + adelanto;
    luna.rotation.z = Math.sin(reloj * .2) * .03;
    // cámara: sigue un poco al personaje y tiembla con los choques
    temblor = Math.max(0, temblor - dt * 1.3); const t2 = temblor * temblor * 2;
    camara.position.set(tx - 1.1 + (Math.random() - .5) * t2, 1.3 + pyV * .14 + (Math.random() - .5) * t2, D);
    camara.lookAt(tx, pyV * .1, 0);
  }

  // el lienzo aparece (con un fundido) cuando ya pintó unos cuadros: nunca se ve un primer cuadro a medio cargar
  let pintados = 0;
  function dibujar() { renderer.render(escena, camara); if (++pintados === 3) lienzo.classList.add('listo'); }

  // ── Bucle: solo corre con la sección en pantalla ──
  // calidad adaptable, medida después de un calentamiento (los primeros cuadros son lentos por la carga y no cuentan):
  // si va a menos de ~45 cps, baja la resolución un escalón (1,5× → 1× → 0,75×). El aspecto no cambia, solo la nitidez.
  let visible = false, raf = 0, ultimo = performance.now(), muestras = 0, sumaDt = 0, calentando = 60;
  function medirRendimiento(dt) {
    if (dt >= .1 || document.hidden) return;
    if (calentando > 0) { calentando--; return; }
    sumaDt += dt; if (++muestras < 90) return;
    const media = sumaDt / muestras; muestras = 0; sumaDt = 0;
    if (media > .022 && pr > .75) { pr = pr > 1 ? 1 : .75; ajustar(); calentando = 45; }
  }
  const activo = () => c.juegoActivo() === 'arkadash';
  function arrancar() { if (visible && activo() && !raf) { ultimo = performance.now(); calentando = Math.max(calentando, 30); raf = requestAnimationFrame(cuadro); } }
  function cuadro(ahora) {
    if (!visible || !activo()) { raf = 0; return; }
    raf = requestAnimationFrame(cuadro);
    let dt = (ahora - ultimo) / 1000; ultimo = ahora; if (!(dt > 0)) dt = 1 / 60;
    medirRendimiento(dt);
    dt = Math.min(dt, .05);
    const dtJ = estado === 'pausa' ? 0 : dt;
    acum += dtJ; let k = 0; while (acum >= PASO && k++ < 10) { paso(PASO); acum -= PASO; } if (acum >= PASO) acum = 0;
    animar(dtJ, vel * acum); pintarHud(); dibujar();
  }
  c.vigilar(new IntersectionObserver(([e]) => {
    visible = e.isIntersecting; arrancar();
    if (e.intersectionRatio < .3) pausar();
  }, { threshold: [0, .3, .55, .8] })).observe(cabina);
  on(document, 'visibilitychange', () => { if (document.hidden) pausar(); });
  // al cambiar de minijuego: se pausa y deja de dibujar; al volver, retoma el bucle (la partida queda en pausa)
  c.controles.arkadash = { activar: arrancar, desactivar: pausar };

  // ── Controles: clic o toque en el panel, Espacio / ↑ / W con la sección en pantalla, P o Esc para pausar ──
  on($j('panelArkadash'), 'pointerdown', (e) => { if (e.button !== 0 || (e.target as Element).closest('button')) return; accion(); });
  on($j('jJugar'), 'click', accion); on($j('jOtra'), 'click', accion);
  on(botonPausa, 'click', () => { if (estado !== 'jugando') return; pausar(); dashSounds.pausa(true); $j('jReanudar').focus({ preventScroll: true }); });
  on($j('jReanudar'), 'click', () => { accion(); cabina.focus({ preventScroll: true }); }); // reanuda (y aletea, como al tocar la pantalla)
  on(window, 'keydown', (e) => {
    if (!activo() || !c.enVista() || estado === 'cargando' || c.visorAbierto()) return;
    const a = document.activeElement, ajeno = a && a !== document.body && !cabina.contains(a);
    if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && estado === 'jugando') { pausar(); dashSounds.pausa(true); return; }
    if (!(e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W')) return;
    if (ajeno && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(a.tagName)) return;
    e.preventDefault(); if (!e.repeat) accion();
  });
  on(window, 'pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = cabina.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width - .3;
    miradaMouse = fx > .06 ? 1 : fx < -.06 ? -1 : 0; tMirada = performance.now();
  }, { passive: true });

  // ── Listo: se compilan los shaders antes de mostrar (sin tirones al aparecer el escudo) ──
  ajustar();
  escudoMalla.visible = true; renderer.compile(escena, camara); escudoMalla.visible = false;
  pintarOjos('normal', 1); pintarHud();
  estado = 'listo'; $j('jCargando').classList.add('oculta'); mostrar(pInicio, true);
  // para pruebas desde la consola
  if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).arkadash = { get estado() { return estado; }, get puntos() { return puntos; }, get escudo() { return escudo; }, get calidad() { return { pr, llamadas: renderer.info.render.calls, triangulos: renderer.info.render.triangles }; }, set piloto(s) { piloto = s; }, accion, avanzar(seg) { for (let i = 0; i < seg / PASO; i++) paso(PASO); animar(1 / 60, 0); pintarHud(); dibujar(); } };
  c.alDestruir(() => { cancelAnimationFrame(raf); raf = 0; disposeScene(escena, renderer); });
}
