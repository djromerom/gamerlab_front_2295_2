/**
 * Sonido de los minijuegos (ARK-233), sintetizado con Web Audio, sin archivos: efectos de Arkadash, guitarra (Karplus-Strong),
 * piano, batería y el acompañamiento de Arkad Jam. El contexto se crea con el primer toque o tecla (lo exigen los navegadores)
 * y se cierra al salir de la landing.
 */
import { frequency } from "./songs";

export interface Audio {
  ctx: AudioContext;
  master: GainNode;
  rev: ConvolverNode;
  ruido: AudioBuffer;
  volumenGeneral: GainNode;
  cuerdas: Record<number, AudioBuffer>;
  voces: Record<number, GainNode | null>;
}
/** Voz de guitarra que sigue sonando (nota sostenida): se apaga con apagarCuerda */
export interface StringVoice {
  src: AudioBufferSourceNode;
  g: GainNode;
  t: number;
}

// volumen que se aplica al crear el contexto (lo fija el control de volumen)
let volumenEfectivo = 0.8;
export function setMasterVolume(v: number) {
  volumenEfectivo = v;
  if (audio) audio.volumenGeneral.gain.setTargetAtTime(v, audio.ctx.currentTime, 0.02);
}
export function closeAudio() {
  const a = audio;
  audio = null;
  a?.ctx.close().catch(() => {});
}

// ── Sonido: se crea con el primer toque o tecla (los navegadores lo exigen) ──
export let audio: Audio | null = null;
export function startAudio() {
  if (audio) { if (audio.ctx.state === 'suspended') audio.ctx.resume(); return; }
  const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  // volumen general al final de la cadena (también controla la reverberación): el control de volumen actúa aquí
  const volumenGeneral = ctx.createGain(); volumenGeneral.gain.value = volumenEfectivo; volumenGeneral.connect(ctx.destination);
  const limitador = ctx.createDynamicsCompressor(); limitador.threshold.value = -12; limitador.ratio.value = 6; limitador.connect(volumenGeneral);
  const master = ctx.createGain(); master.gain.value = .8; master.connect(limitador);
  // reverberación de sala: respuesta al impulso hecha con ruido que se apaga
  const largo = Math.round(ctx.sampleRate * 1.6), ir = ctx.createBuffer(2, largo, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < largo; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / largo) ** 3; }
  const rev = ctx.createConvolver(); rev.buffer = ir; const humedo = ctx.createGain(); humedo.gain.value = .2; rev.connect(humedo); humedo.connect(limitador);
  const ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); { const d = ruido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  audio = { ctx, master, rev, ruido, volumenGeneral, cuerdas: {}, voces: {} };

}
export const connectOutput = (nodo: AudioNode) => { nodo.connect(audio.master); nodo.connect(audio.rev); };
// ── Efectos de Arkadash: tonos y soplos de ruido con envolventes cortas (nada de archivos) ──
// seco = sin reverberación (el aleteo se repite mucho y con eco se embarraría)
type OpcionesTono = { tipo?: OscillatorType; vol?: number; ataque?: number; hacia?: number; seco?: boolean };
function tono(f: number, cuando: number, dur: number, { tipo = 'sine', vol = .2, ataque = .004, hacia = 0, seco = false }: OpcionesTono = {}) {
  const { ctx } = audio, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = tipo; o.frequency.setValueAtTime(f, cuando); if (hacia) o.frequency.exponentialRampToValueAtTime(hacia, cuando + dur * .8);
  g.gain.setValueAtTime(0, cuando); g.gain.linearRampToValueAtTime(vol, cuando + ataque); g.gain.exponentialRampToValueAtTime(.0008, cuando + dur);
  o.connect(g); if (seco) g.connect(audio.master); else connectOutput(g); o.start(cuando); o.stop(cuando + dur + .02);
}
type OpcionesSoplo = { tipo?: BiquadFilterType; f?: number; hacia?: number; q?: number; vol?: number; seco?: boolean };
function soplo(cuando: number, dur: number, { tipo = 'bandpass', f = 1500, hacia = 0, q = 1, vol = .2, seco = false }: OpcionesSoplo = {}) {
  const { ctx } = audio, src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = audio.ruido; fl.type = tipo; fl.Q.value = q; fl.frequency.setValueAtTime(f, cuando); if (hacia) fl.frequency.exponentialRampToValueAtTime(hacia, cuando + dur);
  g.gain.setValueAtTime(vol, cuando); g.gain.exponentialRampToValueAtTime(.0008, cuando + dur);
  src.connect(fl).connect(g); if (seco) g.connect(audio.master); else connectOutput(g); src.start(cuando, Math.random() * .4); src.stop(cuando + dur + .02);
}
const semi = (n: number) => 523.25 * 2 ** (n / 12); // semitonos desde el Do5
const PENTA = [0, 2, 4, 7, 9];              // pentatónica: los puntos seguidos van armando una melodía que sube
export const dashSounds = {
  aleteo() { // «fup» con cuerpo: un pulso que sube, su octava y un soplo de aire; cambia un poco cada vez para no cansar
    if (!audio) return; const t = audio.ctx.currentTime, v = 1 + (Math.random() - .5) * .1;
    tono(230 * v, t, .17, { tipo: 'triangle', vol: .34, hacia: 620 * v, seco: true });
    tono(460 * v, t, .1, { vol: .07, hacia: 1240 * v, seco: true });
    soplo(t, .13, { f: 800, hacia: 2600, q: .8, vol: .13, seco: true });
  },
  punto(n) { // «ding-ding» de moneda: dos notas (la segunda una quinta arriba) que suben por la escala con cada punto
    if (!audio) return; const t = audio.ctx.currentTime, k = (n - 1) % 10, b = PENTA[k % 5] + 12 * Math.floor(k / 5) - 5;
    tono(semi(b), t, .12, { tipo: 'triangle', vol: .17 });
    tono(semi(b + 7), t + .065, .42, { tipo: 'triangle', vol: .2 }); tono(semi(b + 19), t + .065, .3, { vol: .045 });
  },
  alRas() { // arpegio brillante muy rápido y un destello de aire: la recompensa por arriesgar
    if (!audio) return; const t = audio.ctx.currentTime;
    [0, 4, 7, 12, 16].forEach((n, i) => { tono(semi(n + 7), t + i * .038, .3, { tipo: 'triangle', vol: .14 }); tono(semi(n + 19), t + i * .038, .2, { vol: .04 }); });
    soplo(t + .05, .45, { tipo: 'highpass', f: 6000, q: .5, vol: .07 });
  },
  cristal(nivel) { // campanita de cristal (parciales inarmónicos, como una copa); más aguda con cada cristal
    if (!audio) return; const t = audio.ctx.currentTime, f = semi([16, 20, 23, 28][Math.min(nivel, 4) - 1]);
    tono(f, t, .7, { vol: .16, ataque: .002 }); tono(f * 2.76, t, .35, { vol: .05, ataque: .002 }); tono(f * 5.4, t, .16, { vol: .025, ataque: .002 });
    tono(f * 1.5, t + .05, .4, { tipo: 'triangle', vol: .05 });
  },
  escudo() { // carga del escudo: barrido que sube y un acorde mayor que se abre
    if (!audio) return; const t = audio.ctx.currentTime;
    tono(220, t, .5, { tipo: 'sawtooth', vol: .05, hacia: 1320, ataque: .05 });
    soplo(t, .55, { f: 500, hacia: 5000, q: 2, vol: .09 });
    [0, 4, 7, 12, 16].forEach((n, i) => tono(semi(n), t + .12 + i * .055, .9 - i * .08, { tipo: 'triangle', vol: .13, ataque: .01 }));
    tono(semi(24), t + .4, .9, { vol: .05, ataque: .03 });
  },
  escudoRoto() { // vidrio que se quiebra: golpe grave, ruido agudo y astillas sueltas
    if (!audio) return; const t = audio.ctx.currentTime;
    tono(190, t, .28, { vol: .35, hacia: 60 });
    soplo(t, .4, { tipo: 'highpass', f: 2600, q: .7, vol: .26 });
    for (let i = 0; i < 7; i++) tono(2400 + Math.random() * 4200, t + Math.random() * .16, .1 + Math.random() * .2, { vol: .045, ataque: .001 });
  },
  choque() { // choque: golpe seco que cae, crujido y un zumbido que se apaga
    if (!audio) return; const t = audio.ctx.currentTime;
    tono(150, t, .55, { vol: .75, hacia: 36, ataque: .002 });
    soplo(t, .4, { tipo: 'lowpass', f: 2400, hacia: 180, q: .6, vol: .5 });
    tono(330, t + .02, .6, { tipo: 'square', vol: .07, hacia: 70 });
  },
  fin(record) { // al mostrar el resultado: fanfarria si hay récord; si no, tres notas que bajan, amables
    if (!audio) return; const t = audio.ctx.currentTime;
    if (record) {
      [0, 4, 7].forEach((n, i) => tono(semi(n), t + i * .1, .2, { tipo: 'square', vol: .045 }));
      [0, 4, 7, 12].forEach(n => { tono(semi(n), t + .32, 1.1, { tipo: 'triangle', vol: .12, ataque: .01 }); });
      tono(semi(24), t + .32, .9, { vol: .05 }); soplo(t + .32, .8, { tipo: 'highpass', f: 7000, q: .5, vol: .06 });
    } else [7, 4, 0].forEach((n, i) => tono(semi(n - 12), t + i * .14, i === 2 ? .6 : .2, { tipo: 'triangle', vol: .14 }));
  },
  pausa(entra) { // dos notas: bajan al pausar, suben al volver
    if (!audio) return; const t = audio.ctx.currentTime, n = entra ? [7, 0] : [0, 7];
    n.forEach((x, i) => tono(semi(x), t + i * .07, .16, { tipo: 'triangle', vol: .1 }));
  },
};
// cuerda pulsada (Karplus-Strong): se calcula la primera vez que suena cada altura y queda guardada
function bufferCuerda(f: number): AudioBuffer {
  const clave = Math.round(f * 10); if (audio.cuerdas[clave]) return audio.cuerdas[clave];
  const { ctx } = audio, sr = ctx.sampleRate, N = Math.round(sr / f), largo = Math.round(sr * 2.6), b = ctx.createBuffer(1, largo, sr), d = b.getChannelData(0);
  const anillo = new Float32Array(N); let previo = 0;
  for (let k = 0; k < N; k++) { previo = previo * .45 + (Math.random() * 2 - 1) * .55; anillo[k] = previo; }
  let k = 0, pico = 0;
  for (let n = 0; n < largo; n++) { const v = anillo[k]; d[n] = v; pico = Math.max(pico, Math.abs(v)); anillo[k] = (v + anillo[(k + 1) % N]) * .5 * .9965; k = (k + 1) % N; }
  for (let n = 0; n < largo; n++) d[n] /= pico || 1;
  return (audio.cuerdas[clave] = b);
}
export function playGuitar(s: number, retraso = 0): StringVoice {
  const { ctx } = audio, t = ctx.currentTime + retraso;
  const src = ctx.createBufferSource(); src.buffer = bufferCuerda(frequency(s) / 2); // la guitarra suena una octava abajo de lo escrito
  const cuerpo = ctx.createBiquadFilter(); cuerpo.type = 'peaking'; cuerpo.frequency.value = 220; cuerpo.gain.value = 5;
  const tono = ctx.createBiquadFilter(); tono.type = 'lowpass'; tono.frequency.value = 4200;
  const g = ctx.createGain(); g.gain.value = .5;
  src.connect(cuerpo).connect(tono).connect(g); connectOutput(g); src.start(t);
  return { src, g, t };
}
export function muteString(v: StringVoice | undefined, suave = .12) { // nota sostenida: la cuerda suena natural mientras se sostiene y al final se apaga suave (sin cortes secos)
  if (!v) return; const ahora = audio.ctx.currentTime; v.g.gain.cancelScheduledValues(ahora); v.g.gain.setValueAtTime(v.g.gain.value, ahora); v.g.gain.setTargetAtTime(0, ahora, suave);
}
export function playPiano(s: number, retraso = 0, corta = false, dura = 2.6) { // dura: cuánto tarda en apagarse sola (más en una nota sostenida)
  const { ctx } = audio, t = ctx.currentTime + retraso, f = frequency(s);
  const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.3, t + .006);
  g.gain.exponentialRampToValueAtTime(.12, t + .3); g.gain.exponentialRampToValueAtTime(.0005, t + dura);
  const filtro = ctx.createBiquadFilter(); filtro.type = 'lowpass'; filtro.frequency.setValueAtTime(f * 9, t); filtro.frequency.exponentialRampToValueAtTime(f * 3, t + 1.2);
  for (const [h, a, tipo] of [[1, 1, 'triangle'], [2, .35, 'sine'], [3, .14, 'sine'], [4, .06, 'sine']] as [number, number, OscillatorType][]) {
    const o = ctx.createOscillator(); o.type = tipo; o.frequency.value = f * h * (1 + (Math.random() - .5) * .002);
    const ga = ctx.createGain(); ga.gain.value = a; o.connect(ga).connect(filtro); o.start(t); o.stop(t + dura + .1);
  }
  filtro.connect(g); connectOutput(g);
  if (corta) { g.gain.cancelScheduledValues(t + .07); g.gain.setTargetAtTime(0, t + .07, .03); return; } // nota de adorno: se apaga enseguida
  audio.voces[s] = g; // al soltar la tecla, la nota se apaga (como al levantar el dedo de la ocarina)
}
export function releasePiano(s: number) {
  const g = audio?.voces[s]; if (!g) return;
  const t = audio.ctx.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(Math.max(g.gain.value, .0005), t); g.gain.setTargetAtTime(0, t, .09);
  audio.voces[s] = null;
}
export function playDrum(i: number, fuerza = 1, retraso = 0) { // fuerza < 1: golpes suaves del redoble
  const { ctx, ruido } = audio, t = ctx.currentTime + retraso;
  const env = (nodo, pico, dur) => { const g = ctx.createGain(); g.gain.setValueAtTime(pico * fuerza, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); nodo.connect(g); connectOutput(g); };
  const osc = (tipo, f0, f1, dur, pico) => { const o = ctx.createOscillator(); o.type = tipo; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * .6); env(o, pico, dur); o.start(t); o.stop(t + dur + .05); };
  const sopla = (tipo, f, q, dur, pico) => { const s = ctx.createBufferSource(); s.buffer = ruido; const fl = ctx.createBiquadFilter(); fl.type = tipo; fl.frequency.value = f; fl.Q.value = q; s.connect(fl); env(fl, pico, dur); s.start(t); s.stop(t + dur + .05); };
  switch (i) {
    case 0: osc('sine', 160, 42, .55, 1.1); sopla('lowpass', 900, .7, .03, .3); break;   // bombo
    case 1: osc('triangle', 220, 160, .14, .45); sopla('highpass', 1400, .7, .22, .55); break; // caja
    case 2: sopla('highpass', 7500, .8, .06, .35); break;                                // hi-hat cerrado
    case 3: sopla('highpass', 7000, .8, .45, .3); break;                                 // hi-hat abierto
    case 4: osc('sine', 300, 190, .35, .75); break;                                      // tom 1
    case 5: osc('sine', 220, 140, .42, .8); break;                                       // tom 2
    case 6: osc('sine', 150, 92, .55, .85); break;                                       // tom de piso
    default: sopla('highpass', 4200, .5, 1.6, .32); sopla('bandpass', 6500, 1.2, 1.2, .16); // platillo
  }
}
export function backingPiano(destino: AudioNode, s: number, cuando: number, dur: number, vol: number) { // acompañamiento: piano suave con armónicos
  const { ctx } = audio, f = frequency(s), g = ctx.createGain(), fin = cuando + Math.min(dur + 1.2, 4);
  g.gain.setValueAtTime(0, cuando); g.gain.linearRampToValueAtTime(.16 * vol, cuando + .01); g.gain.exponentialRampToValueAtTime(.05 * vol, cuando + .4); g.gain.exponentialRampToValueAtTime(.0005, fin);
  for (const [h, a, tipo] of [[1, 1, 'triangle'], [2, .3, 'sine']] as [number, number, OscillatorType][]) { // dos osciladores: el acompañamiento programa cientos de notas
    const o = ctx.createOscillator(); o.type = tipo; o.frequency.value = f * h; const ga = ctx.createGain(); ga.gain.value = a; o.connect(ga).connect(g); o.start(cuando); o.stop(fin + .05);
  }
  g.connect(destino);
}
export function backingPianoShort(destino: AudioNode, s: number, cuando: number, dur: number, vol: number) { // piano de fondo corto (estilo banda): se apaga enseguida, sin cola que se amontone
  const { ctx } = audio, f = frequency(s), g = ctx.createGain(), fin = cuando + dur + .2;
  g.gain.setValueAtTime(0, cuando); g.gain.linearRampToValueAtTime(.17 * vol, cuando + .006); g.gain.setTargetAtTime(.06 * vol, cuando + .006, .07); g.gain.setTargetAtTime(0, cuando + dur, .05);
  for (const [h, a, tipo] of [[1, 1, 'triangle'], [2, .25, 'sine']] as [number, number, OscillatorType][]) { const o = ctx.createOscillator(); o.type = tipo; o.frequency.value = f * h; const ga = ctx.createGain(); ga.gain.value = a; o.connect(ga).connect(g); o.start(cuando); o.stop(fin); }
  g.connect(destino);
}
export function backingGuitar(destino: AudioNode, s: number, cuando: number, dur: number, vol: number) { // acompañamiento: una cuerda de guitarra (s = altura como suena)
  const { ctx } = audio, src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = bufferCuerda(frequency(s));
  g.gain.setValueAtTime(.3 * vol, cuando); g.gain.setTargetAtTime(0, cuando + dur, .07);
  src.connect(g); g.connect(destino); src.start(cuando); src.stop(cuando + dur + .5);
}
export function backingLead(destino: AudioNode, s: number, cuando: number, dur: number, vol: number) { // la melodía sobre la batería: un sintetizador suave (triángulo y cuadrada filtrada) que sostiene la nota
  const { ctx } = audio, f = frequency(s), g = ctx.createGain(), filtro = ctx.createBiquadFilter(), fin = cuando + Math.max(dur, .08);
  filtro.type = 'lowpass'; filtro.frequency.value = Math.min(5000, f * 7);
  g.gain.setValueAtTime(0, cuando); g.gain.linearRampToValueAtTime(.2 * vol, cuando + .012); g.gain.setTargetAtTime(.13 * vol, cuando + .012, .12); g.gain.setTargetAtTime(0, fin, .05);
  for (const [tipo, a] of [['triangle', 1], ['square', .16]] as [OscillatorType, number][]) { const o = ctx.createOscillator(); o.type = tipo; o.frequency.value = f; const ga = ctx.createGain(); ga.gain.value = a; o.connect(ga).connect(filtro); o.start(cuando); o.stop(fin + .35); }
  filtro.connect(g); g.connect(destino);
}
export function backingStrings(destino: AudioNode, s: number, cuando: number, dur: number, vol: number) { // colchón de cuerdas: dos sierras desafinadas, filtradas, con entrada y salida suaves
  const { ctx } = audio, f = frequency(s), g = ctx.createGain(), filtro = ctx.createBiquadFilter(), fin = cuando + dur + .6;
  filtro.type = 'lowpass'; filtro.frequency.value = 1600;
  g.gain.setValueAtTime(0, cuando); g.gain.linearRampToValueAtTime(.045 * vol, cuando + .35); g.gain.setValueAtTime(.045 * vol, cuando + dur); g.gain.linearRampToValueAtTime(0, fin);
  for (const desafino of [-6, 6]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = desafino; o.connect(filtro); o.start(cuando); o.stop(fin + .05); }
  filtro.connect(g); g.connect(destino);
}
export function metronomeClick(cuando: number, acento: boolean) { // metrónomo de la cuenta regresiva
  const { ctx } = audio, o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.value = acento ? 1560 : 1040; g.gain.setValueAtTime(.0001, cuando); g.gain.exponentialRampToValueAtTime(.35, cuando + .004); g.gain.exponentialRampToValueAtTime(.0001, cuando + .08);
  o.connect(g); g.connect(audio.master); o.start(cuando); o.stop(cuando + .1);
}
