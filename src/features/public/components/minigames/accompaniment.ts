/**
 * Arkad Jam (ARK-233): acompañamiento automático. De cada acorde de la canción salen las notas del piano o la guitarra de fondo
 * según su estilo (vals, rock, arpegio, bloque, rasgueo o banda). Funciones puras: devuelven eventos que el audio programa.
 */
import type { Song, SongStyle, AccompanimentEvent, Instrument } from "./songs";

// ── Acompañamiento: de cada acorde salen las notas del piano o la guitarra según el estilo de la canción ──
const RAICES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }, CALIDADES = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], dim: [0, 3, 6], aug: [0, 4, 8] };
export function parseChord(nombre: string): { r: number; iv: number[] } {
  const [, letra, alter, calidad] = /^([A-G])([#b]?)(.*)$/.exec(nombre);
  return { r: (RAICES[letra] + (alter === '#' ? 1 : alter === 'b' ? -1 : 0) + 12) % 12, iv: CALIDADES[calidad] || CALIDADES[''] };
}
function voces(tipo: "piano" | "guitarra", estilo: SongStyle, { r, iv }: { r: number; iv: number[] }, b: number, L: number, ev: AccompanimentEvent[]) { // agrega a «ev» los eventos { tipo, alto, beat, dur, vol, retraso } de un acorde que dura L tiempos
  const bajo = tipo === 'guitarra' ? (r - 24 >= -20 ? r - 24 : r - 12) : r - 24;   // piano: Do2–Si2; guitarra: desde el Mi grave
  const tonos = iv.map(i => r + i - 12), arriba = r + (r < 4 ? 12 : 0);           // acorde en la región media
  const nota = (alto, x, dur, vol, retraso = 0) => { if (x < L - .001) ev.push({ tipo, alto, beat: b + x, dur: Math.min(dur, L - x + .5), vol, retraso }); };
  const rasguido = (x, dur, vol, sube) => { const t = [bajo, bajo + 7, ...tonos, arriba]; (sube ? t.slice(-3).reverse() : t).forEach((a, k) => nota(a, x, dur, vol, k * .014)); };
  if (tipo === 'guitarra') {
    if (estilo === 'arpegio' || estilo === 'vals') { // punteo: bajo, quinta, octava, tercera, quinta y la nota de color, en corcheas
      const seq = [bajo, bajo + 7, bajo + 12, bajo + 12 + iv[1], bajo + 19, bajo + 12 + (iv[3] ?? iv[1] + 12)];
      for (let k = 0; k * .5 < L - .001; k++) nota(seq[k % 6], k * .5, 2, k % 6 ? .7 : 1);
    } else if (estilo === 'rock') { // quintas (power chords) en corcheas
      for (let x = 0; x < L - .001; x += .5) [bajo, bajo + 7, bajo + 12].forEach((a, k) => nota(a, x, .35, x % 1 ? .6 : .9, k * .01));
    } else { // rasgueo: abajo en cada tiempo, arriba suave en cada contratiempo
      for (let x = 0; x < L - .001; x += .5) rasguido(x, x % 1 ? .45 : .9, x % 1 ? .35 : .75, x % 1);
    }
  } else {
    if (estilo === 'vals') { // bajo en el 1, acorde en el 2 y el 3
      for (let x = 0; x < L - .001; x++) { if (x % 3 === 0) nota(bajo, x, 1, 1); else tonos.forEach(a => nota(a, x, .8, .5)); }
    } else if (estilo === 'rock') { // bajo y acorde en cada tiempo
      for (let x = 0; x < L - .001; x++) { nota(bajo, x, .9, .9); tonos.forEach(a => nota(a, x, .8, .45)); }
    } else if (estilo === 'banda') { // con batería y melodía: bajo corto en 1 y 3 (su octava en el contratiempo) y el acorde seco en 2 y 4; deja aire a la melodía
      const seca = (alto, x, dur, vol) => { if (x < L - .001) ev.push({ tipo: 'pianoSeco', alto, beat: b + x, dur, vol, retraso: 0 }); };
      for (let x = 0; x < L - .001; x++) {
        const tiempo = Math.round(b + x) % 2; // en qué tiempo del compás cae (par: 1 y 3; impar: 2 y 4), aunque el acorde empiece a mitad
        if (tiempo === 0) { seca(bajo, x, .45, 1); seca(bajo + 12, x + .5, .3, .45); } else tonos.forEach(a => seca(a, x, .28, .4)); // acorde en la zona media-grave: no pisa la melodía
      }
    } else if (estilo === 'arpegio') {
      const seq = [bajo, bajo + 7, bajo + 12, ...tonos.map(a => a + 12)];
      for (let k = 0; k * .5 < L - .001; k++) nota(seq[k % seq.length], k * .5, 2, k ? .65 : 1);
    } else { // bloque: bajo y acorde cada 2 tiempos
      for (let x = 0; x < L - .001; x += 2) { nota(bajo, x, 2, 1); tonos.forEach(a => nota(a, x, 1.8, .55)); }
    }
  }
}
export function accompaniment(def: Song, instrumento: Instrument, total: number): AccompanimentEvent[] { // guitarra → piano de fondo; piano → guitarra; batería → ambos
  if (def.fondo) return def.fondo(); // acompañamiento escrito a mano para esa canción
  if (!def.acordes) return [];
  // con melodía (canciones de batería con tema): solo piano de fondo, para que la melodía se oiga clara
  const tipos: ("piano" | "guitarra")[] = instrumento === 'guitarra' ? ['piano'] : instrumento === 'piano' ? ['guitarra'] : def.tema ? ['piano'] : ['piano', 'guitarra'], ev: AccompanimentEvent[] = [];
  for (let b = 0; b < total - .001;) {
    for (const [nombre, largo] of def.acordes) {
      if (b >= total - .001) break;
      const acorde = parseChord(nombre), L = Math.min(largo, total - b);
      for (const tipo of tipos) voces(tipo, def.estilo, acorde, b, L, ev);
      b += largo;
    }
  }
  if (def.tema) { let b = 0; for (const [alto, d] of def.tema) { if (alto !== null && b < total - .001) ev.push({ tipo: 'melodia', alto, beat: b, dur: d * .9, vol: 1.3, retraso: 0 }); b += d; } }
  return ev;
}
