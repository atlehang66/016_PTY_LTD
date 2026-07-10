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

function initSectionSnap() {
  const mobileQuery = window.matchMedia('(max-width: 900px), (pointer: coarse)');
  if (mobileQuery.matches) return;

  const sections = Array.from(document.querySelectorAll('section'));
  if (sections.length < 2) return;

  let isSnapping = false;
  let lastWheelTime = 0;

  const getTargetTop = (index) => {
    const section = sections[index];
    if (!section) return window.scrollY;
    const navOffset = 76;
    const rectTop = section.getBoundingClientRect().top + window.scrollY;
    return Math.max(0, rectTop - navOffset);
  };

  const snapToSection = (direction) => {
    if (isSnapping) return;

    const currentIndex = sections.reduce((closestIndex, section, index) => {
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const currentDistance = Math.abs(sectionTop - window.scrollY - 80);
      const closestDistance = Math.abs(sections[closestIndex].getBoundingClientRect().top + window.scrollY - window.scrollY - 80);
      return currentDistance < closestDistance ? index : closestIndex;
    }, 0);

    const nextIndex = Math.max(0, Math.min(sections.length - 1, currentIndex + direction));
    if (nextIndex === currentIndex) return;

    isSnapping = true;
    window.scrollTo({ top: getTargetTop(nextIndex), behavior: 'smooth' });
    window.setTimeout(() => { isSnapping = false; }, 650);
  };

  window.addEventListener('wheel', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || isSnapping) return;
    const now = window.performance.now();
    if (now - lastWheelTime < 120) return;
    lastWheelTime = now;

    const delta = event.deltaY;
    if (Math.abs(delta) < 30) return;

    event.preventDefault();
    snapToSection(delta > 0 ? 1 : -1);
  }, { passive: false });

  window.addEventListener('keydown', (event) => {
    const target = event.target;
    const isTyping = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    if (isTyping) return;

    if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
      event.preventDefault();
      snapToSection(1);
    } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      snapToSection(-1);
    }
  });
}

initSectionSnap();

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
  // Load the logo onto a canvas first so we can fix low-contrast
  // (near-black) text before it becomes a texture.
  const planeGeom = new THREE.PlaneGeometry(3.4, 3.4);
  const planeMat = new THREE.MeshStandardMaterial({
    transparent: true,
    alphaTest: 0.02,
    roughness: 0.4,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(planeGeom, planeMat);
  scene.add(plane);

  const rawImg = new Image();
  rawImg.crossOrigin = 'anonymous';
  rawImg.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = rawImg.width;
    canvas.height = rawImg.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(rawImg, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3];
      if (a === 0) continue;
      const brightness = (d[i] + d[i + 1] + d[i + 2]) / 3;
      // Near-black pixels are the wordmark text — lift them to paper color.
      if (brightness < 70) {
        d[i] = 244; d[i + 1] = 241; d[i + 2] = 232; // var(--paper)
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const logoTex = new THREE.CanvasTexture(canvas);
    logoTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    logoTex.colorSpace = THREE.SRGBColorSpace;
    logoTex.minFilter = THREE.LinearFilter;
    logoTex.needsUpdate = true;
    planeMat.map = logoTex;
    planeMat.needsUpdate = true;
  };
  rawImg.onerror = (err) => {
    console.warn('[hero] logo texture failed:', err);
    showFallback('texture load failed');
  };
  rawImg.src = 'assets/logo_512.png';

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
