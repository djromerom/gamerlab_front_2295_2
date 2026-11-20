/**
 * Arkad Jam (ARK-233): los tres instrumentos en 3D. Cada uno sabe su encuadre, dónde va el personaje, cómo se anima al tocar
 * y de dónde salen las notas: guitarra de 6 cuerdas (cuerda y traste por nota), piano de 13 teclas con semitonos y batería
 * con baquetas que van a la pieza que suena.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { LOGO_BACK, LOGO_FRONT, logoShape } from "./arkadCharacter";
import { WHITE_KEYS, type Instrument } from "./songs";

export interface JamInstrument {
  grupo: THREE.Group;
  escala: number;
  /** dónde va la cara del personaje */
  cara: THREE.Vector3;
  /** encuadre de la cámara en modo libre */
  caja: { x: number; y: number; w: number; h: number };
  /** punto (en el mundo) de donde salen las notas de la pieza i */
  origen(i: number, out: THREE.Vector3): THREE.Vector3;
  tocar(i: number): void;
  soltar?(i: number): void;
  actualizar(dt: number): void;
}

interface Dependencias {
  matHalo: (color: number, opacidad: number) => THREE.MeshBasicMaterial;
  /** color de cada nota (COLORES_NOTA) */
  colores: THREE.Color[];
  /** color de la última nota tocada (lo usa la pantalla del piano) */
  colorActivo: THREE.Color;
  /** reloj de la animación, en segundos */
  reloj: () => number;
}

export function createJamInstruments({ matHalo, colores: COL, colorActivo: colActual, reloj }: Dependencias): Record<Instrument, JamInstrument> {
  const M = THREE.MathUtils, v = new THREE.Vector3();
  const estandar = (color: number, rugoso = .35, metal = .2) => new THREE.MeshStandardMaterial({ color, roughness: rugoso, metalness: metal });
  const instrumentos = {} as Record<Instrument, JamInstrument>;
  { // GUITARRA de 6 cuerdas (Mi La Re Sol Si Mi): cada nota es una cuerda y un traste, con el dedo marcado en el mástil
    const g = new THREE.Group(), amp = new Float32Array(6), colorCuerda = Array.from({ length: 6 }, () => new THREE.Color(0xdfe6ff)), cuerdas = [];
    const CUERDA = [1, 2, 2, 2, 3, 3, 4, 4], TRASTE = [3, 0, 2, 3, 0, 2, 0, 1]; // Do3 Re Mi Fa Sol La Si Do4 en una guitarra afinada normal
    const XB = (c) => (c - 2.5) * .17, XN = (c) => (c - 2.5) * .07, YB = -.7, YN = 7, xEn = (c, y) => M.lerp(XB(c), XN(c), (y - YB) / (YN - YB));
    const lado = []; for (let k = 0; k <= 48; k++) { const y = -1.55 + k / 48 * 4.6; lado.push([Math.max(y <= 1.55 ? Math.sqrt(Math.max(0, 1.55 ** 2 - y * y)) : 0, y >= .75 ? Math.sqrt(Math.max(0, 1.15 ** 2 - (y - 1.9) ** 2)) : 0), y]); }
    const sil = new THREE.Shape(); sil.moveTo(lado[0][0], lado[0][1]);
    for (let k = 1; k < lado.length; k++) sil.lineTo(lado[k][0], lado[k][1]);
    for (let k = lado.length - 2; k > 0; k--) sil.lineTo(-lado[k][0], lado[k][1]);
    const caja = new THREE.Mesh(new THREE.ExtrudeGeometry(sil, { depth: .45, bevelEnabled: true, bevelThickness: .1, bevelSize: .08, bevelSegments: 3, curveSegments: 1 }),
      [estandar(0x2f55e6, .22, .3), estandar(0xe9eeff, .35, .1)]);
    caja.position.z = -.225; g.add(caja);
    const boca = new THREE.Mesh(new THREE.CircleGeometry(.42, 32), new THREE.MeshBasicMaterial({ color: 0x03061a })); boca.position.set(0, .95, .335); g.add(boca);
    const roseta = new THREE.Mesh(new THREE.RingGeometry(.44, .56, 40), estandar(0xc9d6ff, .3, .6)); roseta.position.set(0, .95, .336); g.add(roseta);
    const puente = new THREE.Mesh(new THREE.BoxGeometry(1.15, .16, .1), estandar(0x0b1030)); puente.position.set(0, YB, .38); g.add(puente);
    const mastil = new THREE.Mesh(new THREE.BoxGeometry(.5, 4.1, .2), estandar(0x141a3d, .5)); mastil.position.set(0, 4.95, .2); g.add(mastil);
    const matTraste = estandar(0xc9d6ff, .25, .8);
    for (let k = 1; k <= 9; k++) { const t = new THREE.Mesh(new THREE.BoxGeometry(.5, .035, .03), matTraste); t.position.set(0, YN - k * .42, .315); g.add(t); }
    for (const k of [3, 5, 7]) { const p = new THREE.Mesh(new THREE.CircleGeometry(.05, 12), matTraste); p.position.set(0, YN - (k - .5) * .42, .312); g.add(p); }
    const clavijero = new THREE.Mesh(new RoundedBoxGeometry(.78, 1.05, .2, 2, .08), estandar(0x2f55e6, .22, .3)); clavijero.position.set(0, 7.55, .2); g.add(clavijero);
    for (let k = 0; k < 6; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .22, 8), matTraste); c.rotation.z = Math.PI / 2; c.position.set(k < 3 ? -.5 : .5, 7.25 + (k % 3) * .26, .2); g.add(c); }
    for (let c = 0; c < 6; c++) {
      const dx = XN(c) - XB(c), dy = YN - YB, largo = Math.hypot(dx, dy);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(.024 - c * .0025, .024 - c * .0025, 1, 6), new THREE.MeshBasicMaterial({ color: 0xdfe6ff }));
      m.scale.y = largo; m.position.set((XB(c) + XN(c)) / 2, (YB + YN) / 2, .43); m.rotation.z = -Math.atan2(dx, dy); g.add(m); cuerdas.push(m);
    }
    const dedo = new THREE.Mesh(new THREE.CircleGeometry(.11, 20), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })); dedo.position.z = .46; g.add(dedo);
    const haloDedo = new THREE.Mesh(new THREE.PlaneGeometry(.9, .9), matHalo(0xffffff, .8)); haloDedo.position.z = .47; dedo.add(haloDedo);
    let dedoVida = 0;
    const pua = new THREE.Mesh(new THREE.CircleGeometry(.17, 3), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .3, side: THREE.DoubleSide }));
    pua.rotation.z = -Math.PI / 2; g.add(pua);
    const PUA = new THREE.Vector3(.85, .3, .55); let tPua = -9, xPua = 0;
    g.scale.setScalar(.78); g.rotation.set(0, .25, -1); g.position.set(-1.2, -1.75, 1.6);
    const cBase = new THREE.Color(0xdfe6ff);
    instrumentos.guitarra = { grupo: g, escala: .78, cara: new THREE.Vector3(-1.9, .75, 0), caja: { x: .3, y: -.25, w: 8.2, h: 5.6 },
      origen(i, out) { return g.localToWorld(out.set(xEn(CUERDA[i], .3), .3, .5)); },
      tocar(i) {
        const c = CUERDA[i]; amp[c] = 1; colorCuerda[c].copy(COL[i]); tPua = reloj(); xPua = xEn(c, .3);
        if (TRASTE[i] > 0) { const y = YN - (TRASTE[i] - .5) * .42; dedo.position.set(xEn(c, y), y, .46); dedo.material.color.copy(COL[i]); haloDedo.material.color.copy(COL[i]); dedoVida = 1; }
      },
      actualizar(dt) {
        cuerdas.forEach((m, c) => { amp[c] *= Math.exp(-dt * 2.4); const s = 1 + amp[c] * 3.5 * Math.abs(Math.sin(reloj() * 70 + c)); m.scale.x = m.scale.z = s;
          m.material.color.copy(cBase).lerp(colorCuerda[c], Math.min(1, amp[c] * 1.6)); });
        dedoVida = Math.max(0, dedoVida - dt * 2.2); dedo.visible = dedoVida > 0; dedo.material.opacity = Math.min(1, dedoVida * 2); dedo.scale.setScalar(.7 + dedoVida * .5);
        const k = (reloj() - tPua) / .16; // la púa rasguea la cuerda y vuelve a su lugar
        if (k < 1) pua.position.set(xPua + (k - .5) * .5, .3 - (k - .5) * .12, .55); else pua.position.lerp(PUA, Math.min(1, dt * 8));
      } };
  }
  { // PIANO de 13 teclas (Do a Do) con sus 5 semitonos: las negras también suenan y se hunden
    const g = new THREE.Group(), amp = new Float32Array(13), presion = new Float32Array(13), sostenida = new Uint8Array(13), teclas = [];
    const base = new THREE.Mesh(new RoundedBoxGeometry(9.3, .75, 3.1, 3, .22), estandar(0x0d1a5c, .35, .4)); g.add(base);
    const franja = new THREE.Mesh(new THREE.BoxGeometry(9.1, .06, .06), new THREE.MeshBasicMaterial({ color: new THREE.Color(.6, 1, 3), fog: false })); franja.position.set(0, .05, 1.58); g.add(franja);
    const panelTrasero = new THREE.Mesh(new RoundedBoxGeometry(9.3, .5, .95, 2, .15), estandar(0x0a1240, .4, .4)); panelTrasero.position.set(0, .55, -1.1); g.add(panelTrasero);
    for (let k = 0; k < 5; k++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .14, 20), estandar(0xc9d6ff, .3, .7)); p.position.set(-4 + k * .48, .85, -1.1); g.add(p); }
    const matPantalla = new THREE.MeshBasicMaterial({ color: new THREE.Color(.4, .6, 2) }), pantalla = new THREE.Mesh(new THREE.PlaneGeometry(2.8, .34), matPantalla);
    pantalla.rotation.x = -Math.PI / 2; pantalla.position.set(2.7, .81, -1.1); g.add(pantalla);
    const xTecla = (s) => { const b = WHITE_KEYS.indexOf(s); return ((b >= 0 ? b : WHITE_KEYS.indexOf(s - 1) + .5) - 3.5) * 1.02; };
    for (let s = 0; s <= 12; s++) {
      const negra = WHITE_KEYS.indexOf(s) < 0;
      const geo = negra ? new RoundedBoxGeometry(.56, .3, 1.25, 2, .05) : new RoundedBoxGeometry(.94, .3, 2.05, 2, .05);
      geo.translate(0, 0, negra ? .625 : 1.025); // el eje de giro queda al fondo de la tecla
      const t = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: negra ? 0x10153a : 0xf2f5ff, roughness: negra ? .35 : .4, metalness: negra ? .3 : .05 }));
      t.position.set(xTecla(s), negra ? .68 : .52, -.55); g.add(t); teclas.push(t);
    }
    g.position.set(0, -2.45, 1.6); g.rotation.x = .32;
    const colorTecla = (s) => (WHITE_KEYS.indexOf(s) >= 0 ? COL[WHITE_KEYS.indexOf(s)] : COL[5]);
    instrumentos.piano = { grupo: g, escala: 1, cara: new THREE.Vector3(0, .95, -.8), caja: { x: 0, y: -.7, w: 9.8, h: 5.2 },
      origen(s, out) { return g.localToWorld(out.set(xTecla(s), .75, WHITE_KEYS.indexOf(s) >= 0 ? .9 : .2)); },
      tocar(s) { amp[s] = 1; sostenida[s] = 1; }, soltar(s) { sostenida[s] = 0; },
      actualizar(dt) {
        let total = 0;
        teclas.forEach((t, s) => { amp[s] *= Math.exp(-dt * 3); presion[s] += ((sostenida[s] ? 1 : 0) - presion[s]) * Math.min(1, dt * 30);
          const p = Math.max(presion[s], amp[s] > .75 ? 1 : 0); t.rotation.x = .09 * p; t.material.emissive.copy(colorTecla(s)).multiplyScalar(amp[s] * .9); total += amp[s]; });
        matPantalla.color.setRGB(.4, .6, 2).lerp(colActual, Math.min(1, total));
      } };
  }
  { // BATERÍA: bombo con el logo, caja, hi-hat, tres toms y platillo; dos baquetas que van a la pieza que suena
    const g = new THREE.Group(), amp = new Float32Array(8), piezas = [];
    const mCasco = estandar(0x2f55e6, .25, .35), mAro = estandar(0xdfe6ff, .25, .8), mPlat = estandar(0xcfd8ff, .22, .9), mPie = estandar(0x9aa6c8, .3, .8);
    const pie = (x, y, z) => { const largo = y + 3.6; if (largo <= 0) return; const p = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, largo, 8), mPie); p.position.set(x, y - largo / 2, z); g.add(p); };
    const tambor = (r, h, x, y, z, rx, rz) => {
      const grp = new THREE.Group(), parche = new THREE.MeshStandardMaterial({ color: 0xe8eeff, roughness: .55 });
      grp.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 40), [mCasco, parche, parche]));
      for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.TorusGeometry(r, .045, 8, 40), mAro); a.rotation.x = Math.PI / 2; a.position.y = s * h / 2; grp.add(a); }
      grp.position.set(x, y, z); grp.rotation.set(rx, 0, rz); g.add(grp); return { grp, parche, arriba: new THREE.Vector3(0, h / 2 + .1, 0), rx };
    };
    const platillo = (r, x, y, z, rx, rz) => {
      const grp = new THREE.Group(), mat = mPlat.clone();
      grp.add(new THREE.Mesh(new THREE.CylinderGeometry(r * .08, r, .05, 48), mat));
      grp.position.set(x, y, z); grp.rotation.set(rx, 0, rz); g.add(grp); pie(x, y - .05, z); return { grp, parche: mat, arriba: new THREE.Vector3(0, .12, 0), rx };
    };
    const bombo = tambor(1.3, 1.1, 0, -2.3, -.2, Math.PI / 2, 0);
    const logoB = new THREE.Group(), matLogo = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (const pts of [LOGO_BACK, LOGO_FRONT]) logoB.add(new THREE.Mesh(new THREE.ShapeGeometry(logoShape(THREE, pts)), matLogo));
    logoB.scale.setScalar(1.7 / 49); logoB.position.set(0, -2.3, -.2 + .55 + .06); g.add(logoB);
    const hhAbajo = platillo(.78, -3, -.4, .35, .12, 0), hhArriba = new THREE.Mesh(new THREE.CylinderGeometry(.06, .78, .05, 48), mPlat);
    hhAbajo.grp.add(hhArriba); hhArriba.position.y = .07;
    piezas.push(bombo, tambor(.62, .36, -1.75, -1.15, 1, .38, .12), hhAbajo, hhAbajo, tambor(.5, .42, -.72, .2, -.1, .55, .1), tambor(.56, .46, .72, .2, -.1, .55, -.1),
      tambor(.72, .8, 2, -1.55, 1, .25, -.08), platillo(1.05, 2.9, 1.2, -.5, .5, -.3));
    pie(-1.75, -1.4, 1); pie(2, -1.95, 1);
    // baquetas: cada una tiene un lugar de descanso y, al golpear, salta a la pieza y vuelve
    const baquetas = [-1, 1].map((s) => {
      const geo = new THREE.CylinderGeometry(.035, .05, 1.5, 8); geo.translate(0, .75, 0);
      const m = new THREE.Mesh(geo, estandar(0xf4ead2, .5, 0)); const punta = new THREE.Mesh(new THREE.SphereGeometry(.065, 10, 8), m.material); punta.position.y = 1.5; m.add(punta);
      g.add(m); return { m, s, t0: -9, mango: new THREE.Vector3(s * 1.35, 1.25, .5), puntaReposo: new THREE.Vector3(s * .9, .45, 1.3), golpe: new THREE.Vector3() };
    });
    const Y = new THREE.Vector3(0, 1, 0), mango = new THREE.Vector3(), punta = new THREE.Vector3(), dir = new THREE.Vector3();
    instrumentos.bateria = { grupo: g, escala: 1, cara: new THREE.Vector3(0, 1.75, -1.8), caja: { x: 0, y: -.45, w: 8.4, h: 6.2 },
      origen(i, out) { return piezas[i].grp.localToWorld(out.copy(piezas[i].arriba)); },
      tocar(i) {
        amp[i] = 1; if (i === 0) return; // el bombo se toca con el pedal
        const b = baquetas[piezas[i].grp.position.x < 0 ? 0 : 1]; b.t0 = reloj(); piezas[i].grp.localToWorld(b.golpe.copy(piezas[i].arriba)); g.worldToLocal(b.golpe);
      },
      actualizar(dt) {
        piezas.forEach((p, i) => {
          if (i === 3) return; amp[i] *= Math.exp(-dt * 5); const a = i === 2 ? Math.max(amp[2], amp[3]) : amp[i];
          p.grp.scale.setScalar(1 + a * .07); p.parche.emissive.copy(COL[i === 2 && amp[3] > amp[2] ? 3 : i]).multiplyScalar(a * .8);
          if (i === 2 || i === 7) p.grp.rotation.x = p.rx + Math.sin(reloj() * 28) * a * .12;
        });
        amp[3] *= Math.exp(-dt * 3); hhArriba.position.y = .07 + amp[3] * .3; // hi-hat abierto: el platillo de arriba se levanta
        for (const b of baquetas) {
          const k = M.clamp(1 - (reloj() - b.t0) / .28, 0, 1), e = k * k * (3 - 2 * k);
          mango.copy(b.mango); punta.copy(b.puntaReposo);
          if (e > 0) { mango.lerp(v.copy(b.golpe).add(dir.set(0, 1.25, -.55)), e); punta.lerp(b.golpe, e); }
          punta.y += Math.sin(reloj() * 3 + b.s) * .04;
          b.m.position.copy(mango); dir.subVectors(punta, mango); b.m.scale.y = dir.length() / 1.5; b.m.quaternion.setFromUnitVectors(Y, dir.normalize());
        }
      } };
  }
  return instrumentos;
}
