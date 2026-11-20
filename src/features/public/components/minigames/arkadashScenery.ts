/**
 * Arkadash (ARK-233): el fondo del vuelo. Cielo con degradado, el logo gigante como «luna», una ciudad de bloques que pasa en
 * parallax, piso con rejilla de neón, las dos líneas que limitan el área de juego y estrellas de píxel. También da las nubes
 * de puntos (mezcla aditiva) que el juego usa para las chispas.
 */
import * as THREE from "three";
import { LOGO_BACK, LOGO_FRONT, logoShape } from "./arkadCharacter";

interface OpcionesFondo {
  /** final común de los shaders propios (tono y espacio de color de Three.js) */
  FIN: string;
  VERT_UV: string;
  niebla: THREE.Color;
  /** alto del piso y del techo del área de juego */
  piso: number;
  techo: number;
}

export function createArkadashScenery(escena: THREE.Scene, { FIN, VERT_UV, niebla: NIEBLA, piso: PISO, techo: TECHO }: OpcionesFondo) {
  const azar = (a: number, b: number) => a + Math.random() * (b - a), hdr = (hex: number, k: number) => new THREE.Color(hex).multiplyScalar(k);
  const AZUL = new THREE.Color(0x4c74ff);
  // ── Fondo: cielo con degradado, logo gigante como "luna", ciudad de bloques, piso con rejilla de neón y estrellas de píxel ──
  const uFondo = { uArriba: { value: new THREE.Color(0x050a24) }, uMedio: { value: new THREE.Color(0x1f33a8) }, uAbajo: { value: NIEBLA.clone() } };
  const fondo = new THREE.Mesh(new THREE.PlaneGeometry(460, 220), new THREE.ShaderMaterial({ uniforms: uFondo, depthWrite: false, fog: false, vertexShader: VERT_UV,
    fragmentShader: `uniform vec3 uArriba, uMedio, uAbajo; varying vec2 vUv;
      void main(){ float y = vUv.y; vec3 c = mix(uAbajo, uMedio, smoothstep(.41, .45, y)); c = mix(c, uArriba, smoothstep(.45, .6, y));
        vec2 p = (vUv - vec2(.5, .45)) * vec2(2.4, 1.); c += vec3(.12, .18, .8) * .35 * exp(-dot(p, p) * 40.); gl_FragColor = vec4(c, 1.);${FIN}}` }));
  fondo.position.set(0, 14, -110); escena.add(fondo);

  const matLuna = new THREE.MeshBasicMaterial({ color: hdr(0x4c74ff, 1.5), transparent: true, opacity: .14, fog: false, depthWrite: false });
  const luna = new THREE.Group();
  luna.add(new THREE.Mesh(new THREE.ShapeGeometry(logoShape(THREE, LOGO_BACK)), matLuna), new THREE.Mesh(new THREE.ShapeGeometry(logoShape(THREE, LOGO_FRONT)), matLuna),
    new THREE.Mesh(new THREE.RingGeometry(31, 31.5, 128), matLuna));
  luna.position.set(30, 17, -100); escena.add(luna);

  const NED = 44, datosEd = Array.from({ length: NED }, (_, i) => ({ x: -80 + i * 3.9 + azar(0, 2), w: azar(2, 5), h: azar(4, 17), z: azar(-75, -52), d: azar(2, 5) }));
  // fondo con material Lambert (iluminación barata): está lejos y en niebla, no necesita reflejos
  const edificios = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x02061c }), NED);
  datosEd.forEach((d, i) => edificios.setColorAt(i, new THREE.Color(0x0a1442).lerp(new THREE.Color(0x1a2a80), Math.random() * .6)));
  edificios.frustumCulled = false; escena.add(edificios);

  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(420, 130), new THREE.MeshLambertMaterial({ color: 0x040822 }));
  suelo.rotation.x = -Math.PI / 2; suelo.position.set(0, PISO - .05, -45); escena.add(suelo);
  const colorRejilla = { value: AZUL.clone() }, despRejilla = { value: 0 };
  const rejilla = new THREE.Mesh(new THREE.PlaneGeometry(420, 130), new THREE.ShaderMaterial({ uniforms: { uDesp: despRejilla, uColor: colorRejilla },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, extensions: { derivatives: true },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uDesp; uniform vec3 uColor; varying vec3 vW;
      void main(){ vec2 g = vec2(vW.x + uDesp, vW.z) / 2.; vec2 f = abs(fract(g - .5) - .5) / fwidth(g); float l = 1. - min(min(f.x, f.y), 1.);
        float lejos = smoothstep(-100., -6., vW.z) * (1. - smoothstep(8., 18., vW.z)); gl_FragColor = vec4(uColor * (.7 + l * .9), l * lejos * .5);${FIN}}` }));
  rejilla.rotation.x = -Math.PI / 2; rejilla.position.set(0, PISO, -45); escena.add(rejilla);
  // límites del área de juego: dos líneas de neón (piso y techo)
  const matLimite = new THREE.MeshBasicMaterial({ color: hdr(0x6f95ff, 2.6), fog: false });
  for (const y of [PISO, TECHO]) { const l = new THREE.Mesh(new THREE.BoxGeometry(400, .09, .09), matLimite); l.position.set(0, y, 0); escena.add(l); }

  // nubes de píxeles (puntos cuadrados con mezcla aditiva): estrellas y efectos
  const escalaPuntos = { value: 1 };
  function nube(n: number) {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 4), tam = new Float32Array(n), geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 4).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aTam', new THREE.BufferAttribute(tam, 1).setUsage(THREE.DynamicDrawUsage));
    const malla = new THREE.Points(geo, new THREE.ShaderMaterial({ uniforms: { uEscala: escalaPuntos }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute vec4 aColor; attribute float aTam; uniform float uEscala; varying vec4 vC;
        void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = aTam * uEscala / max(.5, -mv.z); gl_Position = projectionMatrix * mv; vC = aColor; }`,
      fragmentShader: `varying vec4 vC; void main(){ gl_FragColor = vC;${FIN}}` }));
    malla.frustumCulled = false; escena.add(malla);
    const subir = () => { geo.attributes.position.needsUpdate = true; geo.attributes.aColor.needsUpdate = true; geo.attributes.aTam.needsUpdate = true; };
    return { pos, col, tam, subir };
  }
  const NE = 150, estrellas = nube(NE), velE = new Float32Array(NE);
  for (let i = 0; i < NE; i++) {
    estrellas.pos.set([azar(-100, 110), azar(2, 45), azar(-95, -30)], i * 3); estrellas.tam[i] = azar(.25, .7);
    const b = azar(.4, 1.1); estrellas.col.set([.7 * b, .8 * b, 1.5 * b, azar(.35, .9)], i * 4); velE[i] = azar(.03, .12);
  }
  estrellas.subir();
  return { luna, datosEd, edificios, despRejilla, escalaPuntos, nube, estrellas, velE, NE };
}
