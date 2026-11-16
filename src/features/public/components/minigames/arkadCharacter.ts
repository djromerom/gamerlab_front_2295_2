/**
 * Lo compartido por Arkadash y Arkad Jam (ARK-233): el logo 3D de Arkad, los halos de neón y el personaje con ojos de píxeles.
 */
import type * as T from "three";
import type { MeshBasicMaterial } from "three";

type Three = typeof T;

// los dos picos del logo (mismas coordenadas que la escena de la portada)
export const LOGO_FRONT = [[1.05,30.55],[19.3,0.96],[37.55,30.55],[22.96,25.48],[26.53,23.41],[19.3,11.49],[12.07,23.41],[15.64,25.48]];
export const LOGO_BACK = [[47.96,30.55],[33.38,25.48],[36.94,23.41],[29.71,11.49],[22.48,23.41],[26.05,25.48],[11.46,30.55],[29.71,0.96]];
export const logoShape = (THREE: Three, pts: number[][]) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x - 24.5, 15.75 - y) : s.moveTo(x - 24.5, 15.75 - y)); s.closePath(); return s; };
export function neonHelpers(THREE: Three) {
  // los shaders propios terminan con el mismo tono y espacio de color que los materiales de Three.js
  const FIN = '\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n';
  // halo de neón: un degradado radial de 64 px que se pega en planos con mezcla aditiva (reemplaza al bloom)
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.3, 'rgba(255,255,255,.4)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const texHalo = new THREE.CanvasTexture(c); texHalo.colorSpace = THREE.SRGBColorSpace;
  const matHalo = (color: number, opacidad: number) => new THREE.MeshBasicMaterial({ map: texHalo, color, transparent: true, opacity: opacidad, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false });
  return { FIN, matHalo };
}
// el personaje: el logo 3D (dos picos extruidos con bisel) con un visor y ojos de píxeles; «ancho» en unidades del mundo
export function createArkadCharacter(THREE: Three, matHalo: (color: number, opacidad: number) => MeshBasicMaterial, ancho: number) {
  const cuerpo = new THREE.Group(), logo = new THREE.Group(); cuerpo.add(logo); logo.scale.setScalar(ancho / 49);
  const mat = (color, rugoso) => new THREE.MeshStandardMaterial({ color, roughness: rugoso, metalness: .15 });
  const EXT = { depth: 5, bevelEnabled: true, bevelThickness: 1, bevelSize: .55, bevelSegments: 3, curveSegments: 1 };
  const pieza = (pts, z, cara, lado) => { const g = new THREE.ExtrudeGeometry(logoShape(THREE, pts), EXT); g.translate(0, 0, z - 2.5); logo.add(new THREE.Mesh(g, [cara, lado])); };
  pieza(LOGO_BACK, -4, mat(0x8fabf5, .28), mat(0x3d63f0, .35));
  pieza(LOGO_FRONT, 4, mat(0xc9d6ff, .22), mat(0x7d9cff, .3));
  const redonda = (w, h, r) => { const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
  const P = 1.6, VX = -5.2, VY = -4.05, ZV = 7.3;
  const visor = new THREE.Mesh(new THREE.ExtrudeGeometry(redonda(19, 9.4, 3), { depth: 1, bevelEnabled: true, bevelThickness: .6, bevelSize: .6, bevelSegments: 4, curveSegments: 8 }),
    new THREE.MeshStandardMaterial({ color: 0x050a24, roughness: .1, metalness: .5 }));
  visor.position.set(VX, VY, ZV - .4); logo.add(visor);
  const ojos = new THREE.InstancedMesh(new THREE.BoxGeometry(P * .86, P * .86, .9), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 2.3, 4.2), fog: false }), 50);
  ojos.position.set(VX, VY, ZV + 1.9); ojos.frustumCulled = false; logo.add(ojos);
  const haloOjos = new THREE.Mesh(new THREE.PlaneGeometry(30, 17), matHalo(0x6f9bff, .4)); haloOjos.position.set(VX, VY, ZV + 2.6); logo.add(haloOjos);
  // expresiones: cada ojo es una cuadrícula de 3×5 píxeles que se puede correr un píxel para mirar a los lados
  const CARAS = {
    normal:    ['.#.', '###', '###', '###', '.#.'],
    parpadeo:  ['...', '...', '###', '...', '...'],
    feliz:     ['...', '.#.', '#.#', '...', '...'],
    sorpresa:  ['###', '#.#', '#.#', '#.#', '###'],
    muerto:    ['...', '#.#', '.#.', '#.#', '...'],
  };
  const CERO = new THREE.Matrix4().makeScale(0, 0, 0), m = new THREE.Matrix4();
  let clave = '';
  function pintarOjos(c, dx) {
    if (c + dx === clave) return; clave = c + dx;
    const pat = CARAS[c]; let i = 0;
    for (const lado of [-1, 1]) for (let r = 0; r < 5; r++) for (let col = 0; col < 5; col++, i++) {
      if (pat[r][col - 1 - dx] !== '#') { ojos.setMatrixAt(i, CERO); continue; }
      m.makeTranslation(lado * 3 * P + (col - 2) * P, (2 - r) * P, 0); ojos.setMatrixAt(i, m);
    }
    ojos.instanceMatrix.needsUpdate = true;
  }
  return { cuerpo, pintarOjos, haloOjos };
}

/** Libera la GPU al desmontar: geometrías, materiales, texturas y el contexto WebGL (los navegadores limitan cuántos hay abiertos). */
export function disposeScene(escena: T.Scene, renderer: T.WebGLRenderer) {
  const texturas = new Set<T.Texture>();
  escena.traverse((o) => {
    const m = o as T.Mesh;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const mat of mats) {
      for (const v of Object.values(mat)) if (v && (v as T.Texture).isTexture) texturas.add(v as T.Texture);
      const u = (mat as T.ShaderMaterial).uniforms;
      if (u) for (const { value } of Object.values(u)) if (value && (value as T.Texture).isTexture) texturas.add(value as T.Texture);
      mat.dispose();
    }
  });
  if (escena.environment) texturas.add(escena.environment);
  texturas.forEach((t) => t.dispose());
  renderer.dispose();
  renderer.forceContextLoss();
}
