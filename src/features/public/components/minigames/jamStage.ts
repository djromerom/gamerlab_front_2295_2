/**
 * Arkad Jam (ARK-233): el escenario. Fondo del mismo azul de la página con un brillo al centro, tarima con aro de neón (la «banda»,
 * donde van el personaje y el instrumento), pared de ecualizador, tres haces de luz y las nubes de partículas (notas ♪ de píxel
 * y chispas) que salen de cada golpe.
 */
import * as THREE from "three";

interface OpcionesEscenario {
  matHalo: (color: number, opacidad: number) => THREE.MeshBasicMaterial;
  /** final común de los shaders propios (tono y espacio de color de Three.js) */
  FIN: string;
  VERT_UV: string;
  /** color de fondo (el de la página) */
  fondo: number;
}

export function createJamStage(escena: THREE.Scene, { matHalo, FIN, VERT_UV, fondo: FONDO }: OpcionesEscenario) {
  const mtx = new THREE.Matrix4();
  const estandar = (color: number, rugoso = .35, metal = .2) => new THREE.MeshStandardMaterial({ color, roughness: rugoso, metalness: metal });
  // ── Escenario: fondo azul de la página con un brillo suave al centro, tarima con aro de neón, pared de ecualizador y tres haces de luz ──
  const fondo = new THREE.Mesh(new THREE.PlaneGeometry(170, 95), new THREE.ShaderMaterial({ depthWrite: false, fog: false, vertexShader: VERT_UV,
    uniforms: { uFondo: { value: new THREE.Color(FONDO) }, uLuz: { value: new THREE.Color(0x1f33a8) } },
    fragmentShader: `uniform vec3 uFondo, uLuz; varying vec2 vUv;
      void main(){ vec2 p = (vUv - vec2(.5, .42)) * vec2(1.8, 1.); gl_FragColor = vec4(mix(uFondo, uLuz, .55 * exp(-dot(p, p) * 7.)), 1.);${FIN}}` }));
  fondo.position.set(0, 4, -28); escena.add(fondo);
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(220, 120), new THREE.MeshLambertMaterial({ color: FONDO })); piso.rotation.x = -Math.PI / 2; piso.position.set(0, -4.2, -30); escena.add(piso);
  // la «banda» (tarima, personaje e instrumento): al centro en modo libre; en modo canciones se achica a un costado y deja lugar a la pista
  const banda = new THREE.Group(); escena.add(banda);
  const tarima = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.9, .6, 64), estandar(0x0a1244, .45, .45)); tarima.position.y = -3.9; banda.add(tarima);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(5.62, .05, 8, 128), new THREE.MeshBasicMaterial({ color: new THREE.Color(.6, 1, 3), fog: false }));
  aro.rotation.x = Math.PI / 2; aro.position.y = -3.6; banda.add(aro);
  const luzTarima = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), matHalo(0x4c74ff, .22)); luzTarima.rotation.x = -Math.PI / 2; luzTarima.position.y = -3.58; banda.add(luzTarima);

  // pared de ecualizador apoyada en el piso, detrás de la tarima: cada columna con el color de su nota
  const COLS = 8, FILAS = 13, niveles = new Float32Array(COLS), cApagado = new THREE.Color(0x0d1748);
  const eq = new THREE.InstancedMesh(new THREE.BoxGeometry(1.25, .48, .3), new THREE.MeshBasicMaterial(), COLS * FILAS);
  for (let c = 0; c < COLS; c++) for (let r = 0; r < FILAS; r++) { const i = c * FILAS + r; eq.setMatrixAt(i, mtx.makeTranslation((c - 3.5) * 1.5, -3.9 + r * .62, -8)); eq.setColorAt(i, cApagado); }
  escena.add(eq);
  // haces de luz azules (pulsan con cada nota, sin cambiar de color)
  const haces = [-1, 0, 1].map((lado) => {
    const mat = new THREE.ShaderMaterial({ uniforms: { uColor: { value: new THREE.Color(0x6f8fff) }, uAlfa: { value: .6 } }, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, vertexShader: VERT_UV,
      fragmentShader: `uniform vec3 uColor; uniform float uAlfa; varying vec2 vUv; void main(){ gl_FragColor = vec4(uColor, pow(vUv.y, 1.7) * .15 * uAlfa);${FIN}}` });
    const haz = new THREE.Mesh(new THREE.ConeGeometry(3, 13, 32, 1, true), mat);
    haz.position.set(lado * 5.5, 3, -2.5); haz.userData = { lado, base: lado * .32 }; escena.add(haz); return haz;
  });

  // ── Notas musicales de píxel (♪) y chispas que salen de cada golpe ──
  const escalaPuntos = { value: 1 };
  const texNota = (() => { const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); g.fillStyle = '#fff';
    ['....##..', '....#.#.', '....#..#', '....#...', '....#...', '.####...', '#####...', '.###....'].forEach((fila, y) => [...fila].forEach((ch, x) => { if (ch === '#') g.fillRect(x * 2, y * 2, 2, 2); }));
    const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t; })();
  function nube(n, mapa) {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 4), tam = new Float32Array(n), geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 4).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aTam', new THREE.BufferAttribute(tam, 1).setUsage(THREE.DynamicDrawUsage));
    const malla = new THREE.Points(geo, new THREE.ShaderMaterial({ uniforms: { uEscala: escalaPuntos, uMapa: { value: mapa } }, transparent: true, depthWrite: false,
      blending: mapa ? THREE.NormalBlending : THREE.AdditiveBlending,
      vertexShader: `attribute vec4 aColor; attribute float aTam; uniform float uEscala; varying vec4 vC;
        void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = aTam * uEscala / max(.5, -mv.z); gl_Position = projectionMatrix * mv; vC = aColor; }`,
      fragmentShader: mapa
        ? `uniform sampler2D uMapa; varying vec4 vC; void main(){ if (texture2D(uMapa, vec2(gl_PointCoord.x, 1. - gl_PointCoord.y)).a < .5) discard; gl_FragColor = vC;${FIN}}`
        : `varying vec4 vC; void main(){ gl_FragColor = vC;${FIN}}` }));
    malla.frustumCulled = false; escena.add(malla);
    const vel = new Float32Array(n * 3), vida = new Float32Array(n), max = new Float32Array(n), base = new Float32Array(n), rgb = new Float32Array(n * 3), fase = new Float32Array(n);
    let sig = 0;
    return {
      emitir(x, y, z, vx, vy, vz, dura, t, c) { const i = sig; sig = (sig + 1) % n; pos.set([x, y, z], i * 3); vel.set([vx, vy, vz], i * 3); vida[i] = max[i] = dura; base[i] = t; rgb.set([c.r, c.g, c.b], i * 3); fase[i] = Math.random() * 6.3; },
      mover(dt, reloj, ondula) {
        const roce = Math.exp(-dt * (ondula ? .4 : 3));
        for (let i = 0; i < n; i++) {
          if (vida[i] <= 0) { if (tam[i]) { tam[i] = 0; col[i * 4 + 3] = 0; } continue; }
          vida[i] -= dt; const k = Math.max(0, vida[i] / max[i]), j = i * 3;
          vel[j] *= roce; vel[j + 1] *= roce; vel[j + 2] *= roce;
          pos[j] += (vel[j] + (ondula ? Math.sin(reloj * 4 + fase[i]) * .7 : 0)) * dt; pos[j + 1] += vel[j + 1] * dt; pos[j + 2] += vel[j + 2] * dt;
          tam[i] = base[i] * (ondula ? Math.min(1, (1 - k) * 8) : .4 + .6 * k);
          const o = i * 4; col[o] = rgb[j]; col[o + 1] = rgb[j + 1]; col[o + 2] = rgb[j + 2]; col[o + 3] = ondula ? Math.min(1, k * 2.5) : k;
        }
        geo.attributes.position.needsUpdate = geo.attributes.aColor.needsUpdate = geo.attributes.aTam.needsUpdate = true;
      },
    };
  }
  const notasPx = nube(120, texNota), chispas = nube(260, null);
  return { banda, eq, niveles, COLS, FILAS, cApagado, haces, escalaPuntos, notasPx, chispas };
}
