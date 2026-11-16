/**
 * Minijuego «Arkad Jam» (ARK-233): el personaje de Arkad toca guitarra (6 cuerdas), piano (con semitonos) o batería sobre una
 * tarima con luces y una pared de ecualizador. Teclas 1–8 para las notas; en el piano, Q W R T Y son los semitonos.
 * Dos modos: libre (improvisar) y canciones, estilo Guitar Hero: las notas bajan por su carril y se tocan al llegar a la línea.
 * Solo dibuja con el juego abierto y en pantalla.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createArkadCharacter, disposeScene, neonHelpers } from "./arkadCharacter";
import { createJamInstruments } from "./jamInstruments";
import { createJamStage } from "./jamStage";
import { drawTrack } from "./jamTrack";
import {
  audio, muteString, metronomeClick, backingGuitar, startAudio, backingStrings, backingPiano, backingLead, backingPianoShort, connectOutput,
  releasePiano, playDrum, playGuitar, playPiano,
} from "./audio";
import { WHITE_KEYS, SONGS, FREE_LANES, NOTE_COLORS, LEVELS, lanesFor } from "./songs";
import { accompaniment } from "./accompaniment";
import type { GameContext } from "./gameContext";
import type { Instrument } from "./songs";


export function mountArkadJam(c: GameContext) {
  const { $j, cabina, on } = c;
  const { FIN, matHalo } = neonHelpers(THREE);
  const M = THREE.MathUtils, azar = (a, b) => a + Math.random() * (b - a);
  const panel = $j('panelJam'), lienzoJ = $j<HTMLCanvasElement>('lienzoJam'), teclasUI = $j('jamTeclas');
  const fallo = (t) => { $j('jamCargaTxt').textContent = t; $j('jamCargando').querySelector<HTMLElement>('.giro').style.display = 'none'; };

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: lienzoJ, antialias: true, powerPreference: 'high-performance', stencil: false }); }
  catch { fallo('Tu navegador no puede mostrar gráficos 3D (WebGL): el juego no está disponible.'); return; }
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // resolución inicial: hasta 1,5× en computador y 1,25× en pantallas táctiles (celulares con densidad 3× pagarían 2 a 6 veces más píxeles)
  let pr = Math.min(devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.25 : 1.5);
  // fondo del mismo azul de la página (#050A24): las luces no se tiñen con las notas
  const FONDO = 0x050a24;
  const escena = new THREE.Scene(); escena.fog = new THREE.FogExp2(FONDO, .02);
  const FOV = 34, camara = new THREE.PerspectiveCamera(FOV, 1, .1, 200);
  const pmrem = new THREE.PMREMGenerator(renderer);
  escena.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture; pmrem.dispose();
  escena.add(new THREE.HemisphereLight(0xa9c4ff, 0x0b1a6b, .7));
  const sol = new THREE.DirectionalLight(0xffffff, 2.1); sol.position.set(-6, 10, 12); escena.add(sol);
  const contra = new THREE.DirectionalLight(0x4c74ff, 3); contra.position.set(6, 5, -10); escena.add(contra);
  const COL = NOTE_COLORS.map(c => new THREE.Color(c));
  const v = new THREE.Vector3(), colTmp = new THREE.Color();
  const VERT_UV = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;

  const { banda, eq, niveles, COLS, FILAS, cApagado, haces, escalaPuntos, notasPx, chispas } = createJamStage(escena, { matHalo, FIN, VERT_UV, fondo: FONDO });
  let pulsoLuz = 0;

  // ── Personaje ──
  const personaje = new THREE.Group(), giro = new THREE.Group(), { cuerpo, pintarOjos } = createArkadCharacter(THREE, matHalo, 4.2);
  personaje.add(giro); giro.add(cuerpo); banda.add(personaje);


  // ── Instrumentos: cada uno sabe su encuadre, dónde va el personaje, cómo se anima y de dónde salen las notas ──
  let reloj = 0;
    const colActual = new THREE.Color(0x4c74ff);
  const instrumentos = createJamInstruments({ matHalo, colores: COL, colorActivo: colActual, reloj: () => reloj });
  Object.values(instrumentos).forEach(ins => { ins.grupo.visible = false; banda.add(ins.grupo); });

  // ── Interfaz: instrumento, modo (libre o canciones) y una tecla por carril ──
  const botonesIns = [...panel.querySelectorAll<HTMLElement>('.instrumento')], botonesModo = [...panel.querySelectorAll<HTMLElement>('.modo')];
  let actual: Instrument = 'guitarra', botones = [], entrada = 1;
  // carriles del momento: en modo libre, las notas del instrumento (el piano con semitonos);
  // en modo canciones, los de la canción elegida (3, 4, 5 o 6 según la dificultad)
  let carrilesCancion = [];
  const carriles = () => (modo === 'libre' ? FREE_LANES[actual] : carrilesCancion);
  function construirTeclas() {
    const lista = carriles();
    teclasUI.innerHTML = ''; teclasUI.classList.toggle('piano', lista === FREE_LANES.piano);
    teclasUI.style.gridTemplateColumns = `repeat(${lista.filter(c => !c.negra).length}, 1fr)`;
    botones = carriles().map((c, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'nota' + (c.negra ? ' negra' : ''); b.style.setProperty('--c', c.color); b.dataset.i = String(i);
      // en modo canciones solo va el número (los carriles no son notas fijas); en modo libre, número y nota
      b.innerHTML = modo === 'libre' ? `<b>${c.tecla}</b><small>${c.nombre}</small>` : `<b>${c.tecla}</b>`;
      b.setAttribute('aria-label', modo === 'libre' ? `${c.nombre}, tecla ${c.tecla}` : `Carril ${c.tecla}`); teclasUI.appendChild(b); return b;
    });
    colocarNegras(); medirPista();
  }
  function colocarNegras() { // las negras van encima, entre sus dos blancas
    if (carriles() !== FREE_LANES.piano) return;
    const blancas = botones.filter(b => !b.classList.contains('negra'));
    FREE_LANES.piano.forEach((c, i) => {
      if (!c.negra) return; const a = blancas[c.entre], b = blancas[c.entre + 1], ancho = a.offsetWidth * .62, centro = (a.offsetLeft + a.offsetWidth + b.offsetLeft) / 2;
      Object.assign(botones[i].style, { left: `${centro - ancho / 2}px`, width: `${ancho}px`, top: `${a.offsetTop}px`, height: `${a.offsetHeight * .58}px` });
    });
  }
  function elegirInstrumento(nombre) {
    if (!instrumentos[nombre] || nombre === actual && botones.length) return;
    const enCanciones = modo !== 'libre';
    soltarTodo(); if (cancion) detenerCancion(false);
    instrumentos[actual].grupo.visible = false; actual = nombre as Instrument; instrumentos[actual].grupo.visible = true; entrada = 0;
    botonesIns.forEach(b => { const si = b.dataset.instrumento === nombre; b.setAttribute('aria-checked', String(si)); b.tabIndex = si ? 0 : -1; });
    construirTeclas(); vEstirar += 3; ajustar();
    if (enCanciones) mostrarLista();
  }
  botonesIns.forEach((b) => {
    on(b, 'click', () => elegirInstrumento(b.dataset.instrumento));
    on(b, 'keydown', (e) => { if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; e.preventDefault();
      const i = (botonesIns.indexOf(b) + (e.key === 'ArrowRight' ? 1 : -1) + 3) % 3; botonesIns[i].focus(); elegirInstrumento(botonesIns[i].dataset.instrumento); });
  });
  botonesModo.forEach((b) => on(b, 'click', () => (b.dataset.modo === 'libre' ? modoLibre() : mostrarLista())));
  function marcarModo(m) { botonesModo.forEach(b => { const si = b.dataset.modo === m; b.setAttribute('aria-checked', String(si)); b.tabIndex = si ? 0 : -1; }); }

  // ── Tocar una nota: sonido, animación del instrumento, del personaje y de la escena ──
  let estirar = 0, vEstirar = 0, ladeo = 0, caraHasta = 0, caraTemp = 'feliz', proximoParpadeo = 2, mirada = 0, golpes = 0;
  const lugar = instrumentos.guitarra.cara.clone(), pulsadas = new Set(), destellos = new Float32Array(13);
  function tocar(i) {
    if (cancion?.pausa) return; // en pausa (o en la cuenta para reanudar) las teclas no suenan
    startAudio();
    const lista = carriles(), c = lista[i]; if (!c) return;
    // en una canción, si la nota llega a tiempo suena la altura de la melodía; si no, la del carril
    const nota = cancion ? juzgar(i) : null, alto = nota && actual !== 'bateria' ? nota.alto : c.s;
    // la nota de adorno de la partitura (si la tiene) suena sola, muy rápido, y la nota tocada entra 60 ms después
    const adorno = nota && actual !== 'bateria' ? nota.adorno : undefined, tras = adorno === undefined ? 0 : .06;
    if (adorno !== undefined) { if (actual === 'piano') playPiano(adorno, 0, true); else playGuitar(adorno); }
    if (actual === 'guitarra') { const voz = playGuitar(alto, tras); if (nota?.sost) nota.voz = voz; }
    else if (actual === 'piano') { playPiano(alto, tras, false, nota?.sost ? Math.max(2.6, nota.sost + 1.5) : 2.6); altoSonando[i] = alto; } else playDrum(alto);
    // el instrumento se anima con la nota que suena: cuerda y traste en la guitarra, tecla en el piano, pieza en la batería
    const ins = instrumentos[actual], id = actual === 'guitarra' ? diatonica(alto) : actual === 'piano' ? plegar(alto) : alto; ins.tocar(id);
    const col = Math.round(i * 7 / Math.max(1, lista.length - 1)); colActual.set(c.color);
    niveles[col] = Math.max(niveles[col], 8 + Math.random() * 3);
    if (col > 0) niveles[col - 1] = Math.max(niveles[col - 1], niveles[col] - 3); if (col < 7) niveles[col + 1] = Math.max(niveles[col + 1], niveles[col] - 3);
    ins.origen(id, v);
    for (let k = 0; k < 2; k++) notasPx.emitir(v.x + azar(-.3, .3), v.y + .2, v.z + .3, azar(-.6, .6), azar(2, 3.2), azar(-.2, .2), 1.8, azar(.55, .8), colTmp.copy(colActual).multiplyScalar(1.15));
    for (let k = 0; k < 10; k++) { const a = azar(0, Math.PI * 2), r = azar(2, 5); chispas.emitir(v.x, v.y, v.z + .2, Math.cos(a) * r, Math.sin(a) * r, azar(-1, 1), azar(.35, .6), azar(.12, .2), colTmp.copy(colActual).multiplyScalar(1.6)); }
    const lado = i / (lista.length - 1); vEstirar += actual === 'bateria' ? 2.6 : 1.8; ladeo = (lado - .5) * .35; mirada = lado < .35 ? -1 : lado > .65 ? 1 : 0;
    caraTemp = 'feliz'; caraHasta = reloj + .35; pulsoLuz = 1; golpes++; destellos[i] = 1;
    const b = botones[i]; b.classList.add('sonando'); clearTimeout(b.apagar);
    if (!pulsadas.has(i)) b.apagar = setTimeout(() => b.classList.remove('sonando'), 150);
  }
  const altoSonando = {}; // en el piano, la altura que sonó en cada carril (para apagarla al soltar)
  const plegar = (a) => (a >= 0 && a <= 12 ? a : ((a % 12) + 12) % 12);
  function diatonica(a) { if (WHITE_KEYS.includes(a)) return WHITE_KEYS.indexOf(a); let m = ((a % 12) + 12) % 12; while (!WHITE_KEYS.includes(m)) m--; return WHITE_KEYS.indexOf(m); }
  function soltar(i) {
    pulsadas.delete(i); botones[i]?.classList.remove('sonando');
    const a = altoSonando[i]; if (actual === 'piano' && a !== undefined) { instrumentos.piano.soltar(plegar(a)); releasePiano(a); delete altoSonando[i]; }
    const n = cancion?.sost[i]; // soltar una nota sostenida: completa si ya casi terminaba, cortada si no
    if (n && !cancion.pausa) { if (tiempo() >= n.t + n.sost - BIEN) completarSostenida(i); else romperSostenida(i); }
  }
  function soltarTodo() { for (let i = 0; i < botones.length; i++) soltar(i); }

  // ── Modo canciones (estilo Guitar Hero): las notas bajan por su carril y se tocan al llegar a la línea ──
  const ANTICIPO = 2.2, PERFECTO = .075, BIEN = .15; // 2,2 s a la vista antes de llegar a la línea
  let modo = 'libre', cancion = null, cuentaMostrada = '';
  const nivelLista = { guitarra: 1, piano: 1, bateria: 1 }; // pestaña de dificultad abierta en cada instrumento
  const pLista = $j('jamCanciones'), pResultado = $j('jamResultado'), marcador = $j('jamMarcador'), modos = panel.querySelector<HTMLElement>('.modos'), cuenta = $j('jamCuenta');
  const claveMejor = (i) => `arkadjam-${actual}-${i}`;
  const leerMejor = (i) => { try { return +localStorage.getItem(claveMejor(i)) || 0; } catch { return 0; } };
  function mostrar(el, si) { el.classList.toggle('oculta', !si); }
  function mostrarLista() {
    if (cancion) detenerCancion(false);
    soltarTodo(); modo = 'lista'; marcarModo('canciones'); mostrar(pResultado, false);
    $j('jamListaTitulo').textContent = { guitarra: 'Guitarra', piano: 'Piano', bateria: 'Batería' }[actual];
    pintarNiveles(); pintarCanciones(); mostrar(pLista, true);
    $j('jamLista').querySelector('button')?.focus({ preventScroll: true });
  }
  function elegirNivel(k) { nivelLista[actual] = k; pintarNiveles(); pintarCanciones(); $j('jamNiveles').querySelector<HTMLElement>(`[data-nivel="${k}"]`).focus({ preventScroll: true }); }
  function pintarNiveles() { // pestañas Fácil · Medio · Difícil · Extremo (con flechas se pasa de una a otra)
    const caja = $j('jamNiveles'); caja.innerHTML = '';
    for (const k of [1, 2, 3, 4]) {
      const n = LEVELS[k], si = k === nivelLista[actual], b = document.createElement('button');
      b.type = 'button'; b.className = 'nivel-btn'; b.dataset.nivel = String(k); b.style.setProperty('--c', n.color); b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(si)); b.tabIndex = si ? 0 : -1; b.innerHTML = `${n.nombre}<small>${n.carriles} notas</small>`;
      on(b, 'click', () => elegirNivel(k));
      on(b, 'keydown', (e) => { if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; e.preventDefault(); elegirNivel(((k - 1 + (e.key === 'ArrowRight' ? 1 : 3)) % 4) + 1); });
      caja.appendChild(b);
    }
  }
  function pintarCanciones() { // las canciones de la dificultad elegida; las teclas de abajo muestran sus carriles
    const lista = $j('jamLista'), nivel = LEVELS[nivelLista[actual]]; lista.innerHTML = '';
    const delNivel = SONGS[actual].map((c, i) => ({ c, i })).filter(x => x.c.nivel === nivelLista[actual]);
    carrilesCancion = lanesFor(delNivel[0].c, actual).carriles; construirTeclas();
    delNivel.forEach(({ c, i }, k) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'cancion-btn'; b.style.setProperty('--c', nivel.color);
      const mejor = leerMejor(i);
      b.innerHTML = `<span class="num">${k + 1}</span><span class="txt"><b>${c.nombre}</b><small>${c.autor}</small></span>`
        + `<span class="lado"><span class="mejor${mejor ? '' : ' nueva'}">${mejor ? `★ ${mejor}` : 'Nueva'}</span></span>`;
      b.setAttribute('aria-label', `${c.nombre}, ${c.autor}, ${nivel.nombre}${mejor ? `, mejor puntaje ${mejor}` : ''}`);
      on(b, 'click', () => empezarCancion(i)); lista.appendChild(b);
    });
  }
  function modoLibre() {
    if (cancion) detenerCancion(false);
    soltarTodo(); modo = 'libre'; construirTeclas(); limpiarPista(); marcarModo('libre'); mostrar(pLista, false); mostrar(pResultado, false); cabina.focus({ preventScroll: true });
  }
  function empezarCancion(indice) {
    startAudio(); if (cancion) detenerCancion(false); // corta el acompañamiento de una canción anterior
    const def = SONGS[actual][indice], spb = 60 / def.bpm, notas = [], reparto = lanesFor(def, actual); let t = 0;
    nivelLista[actual] = def.nivel; // al volver al menú, queda abierta la pestaña de esta canción
    def.notas.forEach(([valor, dur, adorno], k) => {
      if (valor !== null) {
        // sostenida: en guitarra y piano, las notas largas (1½ tiempos o más) y las negras que llegan tras notas rápidas; en la batería,
        // las de 2 tiempos o más (redobles). La cola dura lo que la nota en el ritmo, menos ¼ de tiempo para soltar y volver a tocar.
        const largo = dur * spb, previo = def.notas[k - 1]?.[1] ?? 9;
        const sostenida = actual === 'bateria' ? dur >= 2 : (dur >= 1.5 && largo >= .7) || (dur >= 1 && largo >= .6 && previo <= .25);
        notas.push({ t, alto: valor, adorno, carril: reparto.carrilDe(valor), estado: 0, golpe: 0, sost: sostenida ? (dur - .25) * spb : 0, sostEstado: 0 });
      }
      t += dur * spb;
    });
    soltarTodo(); carrilesCancion = reparto.carriles; modo = 'cancion'; construirTeclas();
    const espera = spb * 4; // cuenta regresiva de 4 tiempos con metrónomo
    cancion = { def, indice, notas, fin: t, spb, inicio: performance.now() + espera * 1000, puntos: 0, combo: 0, maxCombo: 0, perfectos: 0, bienes: 0, fallos: 0, sig: 0,
      sost: {}, sostOk: 0, sostTotal: notas.filter(n => n.sost).length }; // sost: la nota sostenida de cada carril mientras se mantiene
    for (let k = 0; k < 4; k++) metronomeClick(audio.ctx.currentTime + .05 + k * spb, k === 0);
    // acompañamiento automático, programado de una vez en el reloj del audio (queda a tiempo aunque baje la fluidez de la imagen)
    const eventos = accompaniment(def, actual, t / spb);
    if (eventos.length) {
      const bus = audio.ctx.createGain(), cero = audio.ctx.currentTime + espera; bus.gain.value = .6; connectOutput(bus);
      for (const e of eventos) ({ piano: backingPiano, guitarra: backingGuitar, cuerdas: backingStrings, melodia: backingLead, pianoSeco: backingPianoShort })[e.tipo](bus, e.alto, cero + e.beat * spb + e.retraso, e.dur * spb, e.vol);
      cancion.fondo = bus;
    }
    modo = 'cancion'; mostrar(pLista, false); mostrar(pResultado, false); modos.hidden = true; marcador.hidden = false; cuentaMostrada = '';
    pintarMarcador(); medirPista(); cabina.focus({ preventScroll: true });
  }
  const tiempo = () => ((cancion.pausa || performance.now()) - cancion.inicio) / 1000; // en pausa, el tiempo queda quieto
  const pPausaJam = $j('jamPausa');
  function mostrarCuenta(texto) { cuentaMostrada = texto; cuenta.textContent = texto; cuenta.classList.remove('pop'); void cuenta.offsetWidth; if (texto) cuenta.classList.add('pop'); }
  function pausarCancion() {
    if (!cancion || cancion.pausa || modo !== 'cancion') return;
    cancion.pausa = performance.now(); audio?.ctx.suspend(); // el reloj del audio se detiene: el acompañamiento programado espera
    clearTimeout(cancion.reanudando); cancion.reanudando = 0; mostrarCuenta('');
    // las teclas no se sueltan: si la mantienes durante la pausa, la nota sostenida sigue al reanudar; si la sueltas, queda cortada
    $j('jamPausaCancion').textContent = cancion.def.nombre.toUpperCase(); mostrar(pPausaJam, true); $j('jamReanudar').focus({ preventScroll: true });
  }
  function reanudarCancion() { // cuenta 3, 2, 1 y la canción sigue exactamente donde quedó
    if (!cancion?.pausa || cancion.reanudando) return;
    mostrar(pPausaJam, false); cabina.focus({ preventScroll: true });
    let n = 3;
    const paso = () => {
      if (!cancion?.pausa) return;
      if (n > 0) { mostrarCuenta(String(n--)); cancion.reanudando = setTimeout(paso, 500); return; }
      cancion.reanudando = 0; mostrarCuenta('');
      cancion.inicio += performance.now() - cancion.pausa; cancion.pausa = 0; audio?.ctx.resume();
      for (const k of Object.keys(cancion.sost)) if (!pulsadas.has(+k)) romperSostenida(+k); // sostenida que ya no se mantiene: queda cortada
    };
    paso();
  }
  function detenerCancion(volverALista = true) {
    if (cancion?.pausa) { // detener en pausa: se corta el acompañamiento antes de que el audio vuelva a correr
      clearTimeout(cancion.reanudando); cancion.fondo?.disconnect(); cancion.fondo = null; audio?.ctx.resume();
    }
    mostrar(pPausaJam, false);
    if (cancion?.fondo) { const g = cancion.fondo.gain, t = audio.ctx.currentTime; g.cancelScheduledValues(t); g.setTargetAtTime(0, t, .08); const bus = cancion.fondo; setTimeout(() => bus.disconnect(), 600); }
    cancion = null; cuenta.textContent = ''; modos.hidden = false; marcador.hidden = true; limpiarPista();
    if (volverALista) mostrarLista();
  }
  function juzgar(carril) {
    const t = tiempo(); let mejor = null, dm = 1e9;
    for (let k = cancion.sig; k < cancion.notas.length; k++) {
      const n = cancion.notas[k]; if (n.t - t > BIEN) break;
      if (n.estado || n.carril !== carril) continue; const d = Math.abs(n.t - t); if (d <= BIEN && d < dm) { dm = d; mejor = n; }
    }
    if (!mejor) return null; // una nota fuera de tiempo suena igual, pero no suma ni resta
    mejor.estado = 1; mejor.golpe = t;
    if (mejor.sost) { // empieza a sostenerse: suma puntos hasta que termine o se suelte
      Object.assign(mejor, { sostEstado: 1, visto: t, acum: 0, proxGolpe: mejor.t + pasoRedoble(mejor.alto) });
      while (mejor.proxGolpe <= t) mejor.proxGolpe += pasoRedoble(mejor.alto);
      cancion.sost[carril] = mejor;
    }
    const perfecto = dm <= PERFECTO; cancion.combo++; cancion.maxCombo = Math.max(cancion.maxCombo, cancion.combo);
    cancion.puntos += (perfecto ? 100 : 50) * multiplicador(); if (perfecto) cancion.perfectos++; else cancion.bienes++;
    avisoJam(perfecto ? '¡Perfecto!' : 'Bien', carril, perfecto ? 'perfecto' : 'bien'); pintarMarcador();
    return mejor;
  }
  const multiplicador = () => Math.min(4, 1 + Math.floor(cancion.combo / 8));
  const pasoRedoble = (pieza) => cancion.spb * (pieza === 7 ? .5 : .25); // redoble a semicorcheas; el platillo, a corcheas
  function sumarSostenida(n, hasta) { // 30 puntos por cada tiempo sostenido, con el multiplicador
    const fin = Math.min(hasta, n.t + n.sost); if (fin <= n.visto) return;
    n.acum += (fin - n.visto) / cancion.spb * 30 * multiplicador(); n.visto = fin;
    const enteros = Math.floor(n.acum); cancion.puntos += enteros; n.acum -= enteros;
  }
  function completarSostenida(i) {
    const n = cancion.sost[i]; delete cancion.sost[i]; sumarSostenida(n, n.t + n.sost);
    n.sostEstado = 2; cancion.sostOk++; cancion.puntos += 50 * multiplicador(); avisoJam('¡Sostenida!', i, 'perfecto'); destellos[i] = 1;
    muteString(n.voz, .3); if (actual === 'piano' && altoSonando[i] !== undefined) releasePiano(altoSonando[i]); // la nota termina con su ritmo
    pintarMarcador();
  }
  function romperSostenida(i) {
    const n = cancion.sost[i], t = tiempo(); delete cancion.sost[i]; sumarSostenida(n, t);
    n.sostEstado = 3; n.corte = t; muteString(n.voz); pintarMarcador();
  }
  function actualizarCancion() {
    const t = tiempo();
    for (const k of Object.keys(cancion.sost)) { // notas sostenidas en curso
      const n = cancion.sost[k], i = +k, fin = n.t + n.sost;
      if (actual === 'bateria') while (n.proxGolpe < fin - .01 && n.proxGolpe <= t + .05) { // redoble programado en el reloj del audio
        playDrum(n.alto, .5, Math.max(0, n.proxGolpe - t)); instrumentos.bateria.tocar(n.alto); destellos[i] = Math.max(destellos[i], .8); n.proxGolpe += pasoRedoble(n.alto);
      }
      if (t >= fin) completarSostenida(i); else sumarSostenida(n, t);
    }
    while (cancion.sig < cancion.notas.length) {
      const n = cancion.notas[cancion.sig];
      if (n.estado) { cancion.sig++; continue; }
      if (t - n.t > BIEN) { n.estado = 2; cancion.fallos++; cancion.combo = 0; avisoJam('Fallo', n.carril, 'fallo'); caraTemp = 'sorpresa'; caraHasta = reloj + .4; pintarMarcador(); cancion.sig++; continue; }
      break;
    }
    const texto = t < 0 ? String(Math.min(4, Math.ceil(-t / cancion.spb))) : t < .5 ? '¡Ya!' : '';
    if (texto !== cuentaMostrada) { cuentaMostrada = texto; cuenta.textContent = texto; cuenta.classList.remove('pop'); void cuenta.offsetWidth; if (texto) cuenta.classList.add('pop'); }
    if (t > cancion.fin + 1.2) terminarCancion();
  }
  function terminarCancion() {
    const c = cancion, total = c.notas.length, precision = total ? (c.perfectos + c.bienes * .6) / total : 0, estrellas = precision >= .9 ? 3 : precision >= .7 ? 2 : precision >= .4 ? 1 : 0;
    const antes = leerMejor(c.indice), nuevo = c.puntos > antes;
    if (nuevo) { try { localStorage.setItem(claveMejor(c.indice), String(c.puntos)); } catch { /* sin almacenamiento */ } }
    detenerCancion(false); modo = 'resultado'; ultimaCancion = c.indice;
    $j('jamResCancion').textContent = c.def.nombre.toUpperCase();
    $j('jamResTitulo').textContent = nuevo && c.puntos ? '¡Nuevo récord!' : estrellas === 3 ? '¡Impecable!' : estrellas ? '¡Canción completa!' : 'Sigue practicando';
    const e = $j('jamEstrellas'); e.innerHTML = '★★★'.split('').map((s, k) => `<span class="${k < estrellas ? '' : 'apagada'}">★</span>`).join(''); e.setAttribute('aria-label', `${estrellas} de 3 estrellas`);
    $j('jamResPuntos').textContent = c.puntos; $j('jamResPrecision').textContent = Math.round(precision * 100) + '%';
    $j('jamResDetalle').textContent = `${c.perfectos} perfectas · ${c.bienes} bien · ${c.fallos} fallos · ${c.sostOk}/${c.sostTotal} sostenidas · combo máximo ${c.maxCombo}`;
    mostrar(pResultado, true); $j('jamOtra').focus({ preventScroll: true });
    $j('jAnuncio').textContent = `${c.def.nombre}: ${c.puntos} puntos, precisión ${Math.round(precision * 100)} por ciento.`;
  }
  let ultimaCancion = 0;
  on($j('jamOtra'), 'click', () => empezarCancion(ultimaCancion));
  on($j('jamOtraCancion'), 'click', mostrarLista);
  on($j('jamDetener'), 'click', pausarCancion);
  on($j('jamReanudar'), 'click', reanudarCancion);
  on($j('jamReiniciar'), 'click', () => { const i = cancion.indice; detenerCancion(false); empezarCancion(i); });
  on($j('jamSalir'), 'click', () => detenerCancion(true));
  on(document, 'visibilitychange', () => { if (document.hidden) pausarCancion(); }); // al cambiar de pestaña o bloquear el celular
  function pintarMarcador() { $j('jamPuntos').textContent = cancion.puntos; $j('jamCombo').textContent = `${cancion.combo} · ×${multiplicador()}`; }
  const capaJam = $j('jamAvisos');
  function avisoJam(texto, carril, clase) {
    const el = document.createElement('span'); el.className = 'aviso ' + clase; el.textContent = texto;
    el.style.left = `${carrilX[carril] || 0}px`; el.style.top = `${pistaArriba + pistaAlto - 46}px`;
    capaJam.appendChild(el); setTimeout(() => el.remove(), 950);
  }

  // pista: un lienzo 2D entre la barra de arriba y las teclas; cada carril queda justo encima de su tecla
  const pista = $j<HTMLCanvasElement>('jamPista'), ctx2 = pista.getContext('2d');
  let carrilX = [], carrilAncho = [], pistaArriba = 0, pistaAlto = 0, dP = 1;
  function medirPista() {
    const rp = panel.getBoundingClientRect(); if (!rp.width) return;
    const arriba = panel.querySelector('.jam-arriba').getBoundingClientRect(), primera = botones.find(b => !b.classList.contains('negra'))?.getBoundingClientRect();
    if (!primera) return;
    pistaArriba = arriba.bottom - rp.top; pistaAlto = Math.max(60, primera.top - rp.top - pistaArriba - (actual === 'piano' ? 0 : 2));
    dP = Math.min(devicePixelRatio || 1, 1.5);
    pista.style.top = `${pistaArriba}px`; pista.style.height = `${pistaAlto}px`; pista.width = Math.round(rp.width * dP); pista.height = Math.round(pistaAlto * dP);
    carrilX = botones.map(b => { const r = b.getBoundingClientRect(); return r.left - rp.left + r.width / 2; });
    carrilAncho = botones.map(b => b.getBoundingClientRect().width);
  }
  function limpiarPista() { ctx2.clearRect(0, 0, pista.width, pista.height); }
  function dibujarPista(dt: number) {
    drawTrack(ctx2, { d: dP, carriles: carriles(), carrilX, carrilAncho, cancion, t: cancion ? tiempo() : performance.now() / 1000, destellos, anticipo: ANTICIPO }, dt);
  }

  // ── Teclado: 1–8 y, en el piano, Q W R T Y para los semitonos; G, P y B cambian el instrumento; Esc detiene la canción ──
  function carrilDeTecla(e) {
    const m = /^(?:Digit|Numpad)([1-8])$/.exec(e.code); let t = m ? m[1] : (/^[1-8]$/.test(e.key) ? e.key : null);
    if (!t && /^Key[QWRTY]$/.test(e.code)) t = e.code.slice(3);
    return t ? carriles().findIndex(c => c.tecla === t) : -1;
  }
  on(window, 'keydown', (e) => {
    if (c.juegoActivo() !== 'jam' || !c.enVista() || c.escribiendo() || e.ctrlKey || e.metaKey || e.altKey || c.visorAbierto()) return;
    const i = carrilDeTecla(e);
    if (i >= 0) { e.preventDefault(); if (!e.repeat) { pulsadas.add(i); tocar(i); } return; }
    if (e.key === 'Escape' && cancion) { e.preventDefault(); if (cancion.pausa) reanudarCancion(); else pausarCancion(); return; } // Esc pausa y reanuda
    const ins = { g: 'guitarra', p: 'piano', b: 'bateria' }[e.key.toLowerCase()];
    if (ins) { e.preventDefault(); elegirInstrumento(ins); }
  });
  on(window, 'keyup', (e) => { const i = carrilDeTecla(e); if (i >= 0 && pulsadas.has(i)) soltar(i); });
  // toque o clic: se puede deslizar el dedo por las notas (glissando)
  let arrastrando = false;
  on(teclasUI, 'pointerdown', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('.nota'); if (!b) return;
    e.preventDefault(); b.releasePointerCapture?.(e.pointerId); arrastrando = true; const i = +b.dataset.i; pulsadas.add(i); tocar(i);
  });
  on(teclasUI, 'pointerover', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('.nota'); if (!b || !arrastrando) return; const i = +b.dataset.i; if (pulsadas.has(i)) return;
    for (const p of [...pulsadas]) soltar(p); pulsadas.add(i); tocar(i);
  });
  const terminar = () => { arrastrando = false; for (const p of [...pulsadas]) soltar(p); };
  on(window, 'pointerup', terminar); on(window, 'pointercancel', terminar);
  on(teclasUI, 'keydown', (e) => { // Enter o Espacio sobre un botón también toca la nota
    const b = (e.target as Element).closest<HTMLElement>('.nota'); if (!b || (e.key !== 'Enter' && e.key !== ' ') || e.repeat) return; e.preventDefault(); const i = +b.dataset.i; pulsadas.add(i); tocar(i);
  });
  on(teclasUI, 'keyup', (e) => { const b = (e.target as Element).closest<HTMLElement>('.nota'); if (b && (e.key === 'Enter' || e.key === ' ')) soltar(+b.dataset.i); });
  let px = 0, py = 0;
  on(window, 'pointermove', (e) => { if (e.pointerType !== 'mouse') return; const r = cabina.getBoundingClientRect(); px = M.clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1); py = M.clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1); }, { passive: true });

  // ── Encuadre: lo de cada instrumento cabe entre la barra de arriba y las teclas de abajo ──
  // modo canciones: cámara más abierta (fondo con ecualizador y luces, como en la portada) y la banda chica arriba a la izquierda
  const CAJA_CANCION = { x: 0, y: .6, w: 15, h: 8 }, bandaCancion = new THREE.Vector3(), cajaVista = { x: 0, y: 0 };
  let D = 20, Dlibre = 20, Dcancion = 24, escBanda = .45, mezcla = 0, camX = 0, camY = 0;
  function ajustar() {
    const w = lienzoJ.clientWidth, h = lienzoJ.clientHeight; if (!w || !h) return;
    renderer.setPixelRatio(pr); renderer.setSize(w, h, false); camara.aspect = w / h;
    const arriba = panel.querySelector<HTMLElement>('.jam-arriba').offsetHeight, abajo = teclasUI.offsetHeight, util = Math.max(.35, (h - arriba - abajo) / h);
    panel.style.setProperty('--alto-arriba', `${arriba}px`);
    const tan = Math.tan(M.degToRad(FOV / 2)), C = instrumentos[actual].caja, CC = CAJA_CANCION;
    Dlibre = Math.max(C.h / (2 * tan * util), C.w / (2 * tan * camara.aspect * .94));
    Dcancion = Math.max(CC.h / (2 * tan * util), CC.w / (2 * tan * camara.aspect * .94));
    const medio = Dcancion * tan * camara.aspect; // media anchura visible en modo canciones
    if (medio > 9) { escBanda = .45; bandaCancion.set(-medio + 3.4, 1.4, -2); } else { escBanda = .36; bandaCancion.set(0, 2.6, -4); } // en pantallas angostas va arriba, detrás de la pista
    D = M.lerp(Dlibre, Dcancion, mezcla);
    camara.setViewOffset(w, h, 0, (abajo - arriba) / 2, w, h); camara.updateProjectionMatrix();
    escalaPuntos.value = h * pr / (2 * tan);
    colocarNegras(); medirPista();
  }
  c.vigilar(new ResizeObserver(ajustar)).observe(lienzoJ);

  // ── Animación ──
  function animar(dt) {
    reloj += dt;
    const ins = instrumentos[actual];
    // transición entre modo libre (banda al centro) y modo canciones (banda chica a un costado, pista al centro)
    mezcla += ((modo !== 'libre' ? 1 : 0) - mezcla) * Math.min(1, dt * 4); const m = mezcla * mezcla * (3 - 2 * mezcla);
    banda.position.copy(bandaCancion).multiplyScalar(m); banda.scale.setScalar(1 + (escBanda - 1) * m);
    D = M.lerp(Dlibre, Dcancion, m); cajaVista.x = M.lerp(ins.caja.x, CAJA_CANCION.x, m); cajaVista.y = M.lerp(ins.caja.y, CAJA_CANCION.y, m); const C = cajaVista;
    entrada = Math.min(1, entrada + dt * 3.5); const ent = 1 - (1 - entrada) ** 3;
    ins.grupo.scale.setScalar(ins.escala * (.6 + .4 * ent)); ins.actualizar(dt);
    // personaje: se acerca a su lugar, rebota con cada nota y se balancea con la música
    lugar.lerp(ins.cara, Math.min(1, dt * 6));
    personaje.position.copy(lugar); personaje.position.y += Math.sin(reloj * 2.4) * .08;
    vEstirar += (-150 * estirar - 12 * vEstirar) * dt; estirar = M.clamp(estirar + vEstirar * dt, -.25, .3);
    cuerpo.scale.set(1 - estirar * .4, 1 + estirar, 1 - estirar * .4);
    ladeo *= Math.exp(-dt * 3); giro.rotation.z = ladeo + Math.sin(reloj * 1.6) * .04; giro.rotation.x = actual === 'bateria' ? -Math.max(0, estirar) * .5 : 0;
    cuerpo.rotation.y = px * .25 + Math.sin(reloj * .9) * .08;
    let cara = 'normal';
    if (reloj < caraHasta) cara = caraTemp;
    else if (reloj > proximoParpadeo) { if (reloj < proximoParpadeo + .14) cara = 'parpadeo'; else proximoParpadeo = reloj + azar(1.8, 4.5); }
    if (reloj > caraHasta + 1.2) mirada = Math.round(px * 1.4) || 0;
    pintarOjos(cara, M.clamp(mirada, -1, 1));
    // ecualizador: respira solo y salta con cada nota
    for (let c = 0; c < COLS; c++) {
      const base = 1.2 + 1.6 * (Math.sin(reloj * 1.7 + c * .8) * .5 + .5);
      niveles[c] = Math.max(niveles[c] - dt * 9, base);
      for (let r = 0; r < FILAS; r++) eq.setColorAt(c * FILAS + r, r < niveles[c] ? colTmp.copy(COL[c]).multiplyScalar(.45 + .75 * r / FILAS) : cApagado);
    }
    eq.instanceColor.needsUpdate = true;
    // haces de luz: se mueven y pulsan con cada nota
    pulsoLuz = Math.max(0, pulsoLuz - dt * 2.5);
    for (const h of haces) { h.rotation.z = h.userData.base + Math.sin(reloj * .7 + h.userData.lado) * .14; h.material.uniforms.uAlfa.value = .6 + pulsoLuz * .8; }
    notasPx.mover(dt, reloj, true); chispas.mover(dt, reloj, false);
    // cámara: se mueve suave hacia el encuadre del instrumento, con un poco de parallax del mouse
    camX += (C.x + px * .7 - camX) * Math.min(1, dt * 4); camY += (C.y - py * .4 - camY) * Math.min(1, dt * 4);
    camara.position.set(camX, camY + 1.2, D); camara.lookAt(C.x, C.y + .2, 0);
    if (cancion && !cancion.pausa) actualizarCancion();
    if (modo !== 'libre') dibujarPista(dt); // la pista se ve en todo el modo canciones (también en la lista y el resultado)
  }

  // ── Bucle: solo dibuja con el juego abierto y el marco en pantalla ──
  let visible = false, raf = 0, ultimo = 0, pintados = 0, muestras = 0, sumaDt = 0, calentando = 60;
  const activo = () => c.juegoActivo() === 'jam';
  // calidad adaptable (como en Arkadash): si va a menos de ~45 cps tras el calentamiento, baja la resolución un escalón (1,5× → 1× → 0,75×)
  function medirRendimiento(dt) {
    if (dt >= .1 || document.hidden) return;
    if (calentando > 0) { calentando--; return; }
    sumaDt += dt; if (++muestras < 90) return;
    const media = sumaDt / muestras; muestras = 0; sumaDt = 0;
    if (media > .022 && pr > .75) { pr = pr > 1 ? 1 : .75; ajustar(); calentando = 45; }
  }
  function arrancar() { if (visible && activo() && !raf) { ultimo = performance.now(); calentando = Math.max(calentando, 30); raf = requestAnimationFrame(cuadro); } }
  function cuadro(ahora) {
    if (!visible || !activo()) { raf = 0; return; }
    raf = requestAnimationFrame(cuadro);
    const bruto = Math.max(0, (ahora - ultimo) / 1000) || 1 / 60; ultimo = ahora; medirRendimiento(bruto);
    const dt = Math.min(.05, bruto);
    animar(dt); renderer.render(escena, camara); if (++pintados === 3) lienzoJ.classList.add('listo');
  }
  c.vigilar(new IntersectionObserver(([e]) => { visible = e.isIntersecting; arrancar(); if (!visible) pausarCancion(); }, { threshold: 0 })).observe(cabina); // fuera de pantalla: pausa
  c.controles.jam = { activar() { ajustar(); arrancar(); }, desactivar() { terminar(); modoLibre(); } };

  actual = 'guitarra'; instrumentos.guitarra.grupo.visible = true; construirTeclas();
  for (const n of Object.keys(instrumentos)) instrumentos[n].grupo.visible = true;
  renderer.compile(escena, camara);
  for (const n of Object.keys(instrumentos)) instrumentos[n].grupo.visible = n === actual;
  $j('jamCargando').classList.add('oculta');
  if (activo()) c.controles.jam.activar();
  // para pruebas desde la consola
  if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).arkadJam = { tocar, soltar, pausarCancion, reanudarCancion, elegirInstrumento, mostrarLista, empezarCancion, modoLibre, get instrumento() { return actual; }, get golpes() { return golpes; },
    fondo(ins, k) { const d = SONGS[ins][k], total = d.notas.reduce((a, n) => a + n[1], 0), ev = accompaniment(d, ins, total);
      return { nombre: d.nombre, tiempos: total, acordes: d.acordes ? d.acordes.reduce((a, c) => a + c[1], 0) : 'propio', piano: ev.filter(e => e.tipo === 'piano').length,
        guitarra: ev.filter(e => e.tipo === 'guitarra').length, cuerdas: ev.filter(e => e.tipo === 'cuerdas').length, fin: Math.max(...ev.map(e => e.beat + e.dur)) }; },
    get cancion() { return cancion && { t: tiempo(), puntos: cancion.puntos, combo: cancion.combo, perfectos: cancion.perfectos, bienes: cancion.bienes, fallos: cancion.fallos, sostOk: cancion.sostOk, sostTotal: cancion.sostTotal, pausa: !!cancion.pausa, notas: cancion.notas } },
    get modo() { return modo; }, get audio() { return audio && audio.ctx.state; },
    avanzar(seg) { for (let t = 0; t < seg; t += 1 / 60) animar(1 / 60); renderer.render(escena, camara); },
    get calidad() { return { pr, llamadas: renderer.info.render.calls, triangulos: renderer.info.render.triangles }; } };
  c.alDestruir(() => { if (cancion) detenerCancion(false); cancelAnimationFrame(raf); raf = 0; disposeScene(escena, renderer); });
}
