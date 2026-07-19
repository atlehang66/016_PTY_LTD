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

  /* ---- lights: key + warm fill to read the logo's coral/amber tones ---- */
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xfff2d6, 0.9);
  key.position.set(2, 3, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffb46f, 0.5);
  fill.position.set(-3, 1, 2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xff6b4a, 0.4);
  rim.position.set(0, -2, -3);
  scene.add(rim);

  /* ---- glow halo (additive sprite behind the logo) ---- */
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = haloCanvas.height = 256;
  const hctx = haloCanvas.getContext('2d');
  const grd = hctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  grd.addColorStop(0.0, 'rgba(255, 107, 74, 0.85)');
  grd.addColorStop(0.35, 'rgba(255, 193, 104, 0.45)');
  grd.addColorStop(0.75, 'rgba(255, 193, 104, 0.0)');
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
      // Near-black pixels are the wordmark text — lift them to the theme's text color.
      if (brightness < 70) {
        d[i] = 248; d[i + 1] = 243; d[i + 2] = 236; // var(--text)
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
    color: 0xffb46f, size: 0.025, transparent: true, opacity: 0.55,
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



/* ============================================================
   Work section — thumbnail previews: scale live iframes to fill
   their browser-chrome frame at any card width, no letterboxing.
   These stay non-interactive (pointer-events:none in CSS); the
   click surface is .work-frame-link, which opens the modal below.
   ============================================================ */
(function initWorkThumbnails() {
  const BASE_W = 1440;
  const viewports = document.querySelectorAll('.work-frame-viewport');
  if (!viewports.length) return;
 
  function scaleFrame(viewport) {
    const iframe = viewport.querySelector('iframe');
    if (!iframe) return;
    const scale = viewport.clientWidth / BASE_W;
    iframe.style.transform = `scale(${scale})`;
  }
 
  function scaleAll() {
    viewports.forEach(scaleFrame);
  }
 
  scaleAll();
  window.addEventListener('resize', scaleAll);
 
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(scaleAll);
    viewports.forEach((vp) => ro.observe(vp));
  }
})();
 
/* ============================================================
   Work section — interactive preview modal.
   Opens a real, live, fully-clickable copy of the site scaled
   down ("zoomed out") to fit the modal, so more of the page is
   visible at once. Closes via Esc, backdrop click, or the ✕.
   ============================================================ */
(function initWorkModal() {
  const modal = document.getElementById('workModal');
  if (!modal) return;
 
  const body = modal.querySelector('.work-modal-body');
  const viewport = document.getElementById('workModalViewport');
  const iframe = document.getElementById('workModalIframe');
  const urlLabel = document.getElementById('workModalUrl');
  const openLink = document.getElementById('workModalOpenLink');
  const BASE_W = 1440;
  const BASE_H = 900;
  const BODY_PADDING = 48; // matches .work-modal-body padding (24px each side)
 
  let lastFocused = null;
  let isOpen = false;
 
  function sizeViewport() {
    if (!isOpen) return;
    const availW = body.clientWidth - BODY_PADDING;
    const availH = body.clientHeight - BODY_PADDING;
    // Zoom out only — never scale a small site up past 100%.
    const scale = Math.min(availW / BASE_W, availH / BASE_H, 1);
    viewport.style.width = `${BASE_W * scale}px`;
    viewport.style.height = `${BASE_H * scale}px`;
    iframe.style.transform = `scale(${scale})`;
  }
 
  function openModal(url, label) {
    lastFocused = document.activeElement;
    urlLabel.textContent = label || url;
    openLink.href = url;
    iframe.src = url;
    isOpen = true;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(sizeViewport);
    modal.querySelector('.work-modal-close').focus();
  }
 
  function closeModal() {
    isOpen = false;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    iframe.src = 'about:blank'; // stop whatever's running behind it
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }
 
  document.querySelectorAll('.work-frame-link[data-work-url]').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(trigger.dataset.workUrl, trigger.dataset.workLabel);
    });
  });
 
  modal.querySelectorAll('[data-work-close]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });
 
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeModal();
  });
 
  window.addEventListener('resize', sizeViewport);
  if ('ResizeObserver' in window) {
    new ResizeObserver(sizeViewport).observe(body);
  }
})();