/* ============================================================
   Ark Tech — Hero: floating 3D logo
   ------------------------------------------------------------
   Renders the brand logo as a slow-rotating, gently floating
   3D plane with a soft glow halo. Mouse drag rotates it,
   mouse-move adds parallax. Falls back to a static image
   if WebGL/Three.js is unavailable or the user prefers
   reduced motion.
   ============================================================ */

const logoMount = document.getElementById('logo-3d');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function showFallback(reason) {
  if (!logoMount) return;
  logoMount.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'logo-3d-fallback';
  const img = document.createElement('img');
  img.src = 'assets/logo_512.png';
  img.alt = 'Ark Tech logo';
  wrap.appendChild(img);
  logoMount.appendChild(wrap);
  if (reason) console.info('[hero] logo fallback:', reason);
}

function canUse3D() {
  return !reduceMotion && typeof window.THREE === 'object' && logoMount;
}

function buildLogoScene() {
  if (!logoMount) return;
  const THREE = window.THREE;

  // hint line
  const hint = document.createElement('div');
  hint.className = 'logo-3d-hint';
  hint.textContent = 'Drag to rotate';
  logoMount.appendChild(hint);

  // scene + camera
  const scene = new THREE.Scene();
  scene.background = null; // transparent so CSS gradient shows through

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 5.2);

  const renderer = new THREE.WebGLRenderer({
    antialias: true, alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  logoMount.appendChild(renderer.domElement);

  /* ---- lights: key + cool fill to read the logo's blue/violet tones ---- */
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xfff2d6, 0.9);
  key.position.set(2, 3, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x6fb2ff, 0.5);
  fill.position.set(-3, 1, 2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x8a5cf6, 0.4);
  rim.position.set(0, -2, -3);
  scene.add(rim);

  /* ---- glow halo (additive sprite behind the logo) ---- */
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = haloCanvas.height = 256;
  const hctx = haloCanvas.getContext('2d');
  const grd = hctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  grd.addColorStop(0.0, 'rgba(140, 120, 255, 0.85)');
  grd.addColorStop(0.35, 'rgba(43, 158, 255, 0.45)');
  grd.addColorStop(0.75, 'rgba(43, 158, 255, 0.0)');
  hctx.fillStyle = grd;
  hctx.fillRect(0, 0, 256, 256);
  const haloTex = new THREE.CanvasTexture(haloCanvas);
  const haloMat = new THREE.SpriteMaterial({
    map: haloTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.set(4.4, 4.4, 1);
  halo.position.set(0, 0, -0.6);
  scene.add(halo);

  /* ---- logo as a textured plane ---- */
  const loader = new THREE.TextureLoader();
  const logoTex = loader.load(
    'assets/logo_512.png',
    (tex) => {
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      tex.colorSpace = THREE.SRGBColorSpace;
    },
    undefined,
    (err) => {
      console.warn('[hero] logo texture failed:', err);
      showFallback('texture load failed');
    }
  );
  logoTex.minFilter = THREE.LinearFilter;

  // Plane size roughly matches the aspect of a square logo.
  const planeGeom = new THREE.PlaneGeometry(2.4, 2.4);
  const planeMat = new THREE.MeshStandardMaterial({
    map: logoTex,
    transparent: true,
    alphaTest: 0.02,
    roughness: 0.4,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(planeGeom, planeMat);
  scene.add(plane);

  // Slight tilt so it doesn't read dead-on
  plane.rotation.x = -0.05;

  /* ---- subtle background dust (small points floating around) ---- */
  const dustCount = 60;
  const dustGeom = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3 + 0] = (Math.random() - 0.5) * 8;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 5;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
  }
  dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0x8a5cf6, size: 0.025, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const dust = new THREE.Points(dustGeom, dustMat);
  scene.add(dust);

  /* ---- interaction ---- */
  const state = {
    rotY: 0,
    targetRotY: 0,
    rotX: -0.05,
    targetRotX: -0.05,
    floatY: 0,
    pointerNX: 0, // normalised mouse x (-1..1)
    pointerNY: 0, // normalised mouse y
    dragging: false,
    dragStartX: 0, dragStartY: 0, dragStartRY: 0, dragStartRX: 0,
  };
  const onDown = (e) => {
    state.dragging = true;
    const p = e.touches ? e.touches[0] : e;
    state.dragStartX = p.clientX; state.dragStartY = p.clientY;
    state.dragStartRY = state.targetRotY; state.dragStartRX = state.targetRotX;
  };
  const onMove = (e) => {
    if (e.touches) return; // touchmove handled separately
    const r = logoMount.getBoundingClientRect();
    state.pointerNX = ((e.clientX - r.left) / r.width) * 2 - 1;
    state.pointerNY = -(((e.clientY - r.top) / r.height) * 2 - 1);
    if (state.dragging) {
      const dx = e.clientX - state.dragStartX;
      const dy = e.clientY - state.dragStartY;
      state.targetRotY = state.dragStartRY + dx * 0.008;
      state.targetRotX = Math.max(-0.7, Math.min(0.7, state.dragStartRX + dy * 0.006));
    }
  };
  const onUp = () => { state.dragging = false; };
  const onLeave = () => { state.dragging = false; state.pointerNX = 0; state.pointerNY = 0; };
  const onTouchMove = (e) => {
    if (!state.dragging || !e.touches[0]) return;
    const dx = e.touches[0].clientX - state.dragStartX;
    const dy = e.touches[0].clientY - state.dragStartY;
    state.targetRotY = state.dragStartRY + dx * 0.008;
    state.targetRotX = Math.max(-0.7, Math.min(0.7, state.dragStartRX + dy * 0.006));
  };

  logoMount.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  logoMount.addEventListener('mouseleave', onLeave);
  logoMount.addEventListener('touchstart', onDown, { passive: true });
  logoMount.addEventListener('touchmove', onTouchMove, { passive: true });
  logoMount.addEventListener('touchend', onLeave);

  /* ---- resize ---- */
  const resize = () => {
    const r = logoMount.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(resize).catch(() => {});
  }

  /* ---- render loop ---- */
  const clock = new THREE.Clock();
  let rafId = 0;
  const tick = () => {
    const t = clock.getElapsedTime();
    // idle drift when not dragging
    if (!state.dragging) {
      state.targetRotY = Math.sin(t * 0.18) * 0.18;
      state.targetRotX = -0.05 + Math.cos(t * 0.22) * 0.04;
    }
    // smooth toward targets
    state.rotY += (state.targetRotY - state.rotY) * 0.08;
    state.rotX += (state.targetRotX - state.rotX) * 0.08;
    plane.rotation.y = state.rotY;
    plane.rotation.x = state.rotX;
    // float
    state.floatY = Math.sin(t * 0.9) * 0.08;
    plane.position.y = state.floatY;
    halo.position.y = state.floatY * 0.6;
    // dust drift
    dust.rotation.y = t * 0.02;
    // mouse parallax (camera offset)
    camera.position.x = state.pointerNX * 0.25;
    camera.position.y = -state.pointerNY * 0.15;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  };
  tick();

  // cleanup
  logoMount._cleanup3d = () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    logoTex.dispose();
    haloTex.dispose();
    planeGeom.dispose();
    planeMat.dispose();
    haloMat.dispose();
    dustGeom.dispose();
    dustMat.dispose();
    renderer.dispose();
  };
}

/* ---- entry ---- */
if (canUse3D()) {
  try {
    buildLogoScene();
  } catch (err) {
    console.warn('[hero] 3D logo failed, showing static image:', err);
    showFallback('init error');
  }
} else {
  showFallback(reduceMotion ? 'reduced motion' : 'no WebGL/Three.js');
}
