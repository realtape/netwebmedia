/*
 * hero-3d-world.js — Orbital data system behind the home-page hero.
 * Navy core + 4 AI-citation glass labels (Claude, ChatGPT, Perplexity, Gemini)
 * orbiting around it, with a drifting starfield. Brand palette only.
 *
 * Graceful no-op: prefers-reduced-motion, low-power devices, WebGL failure,
 * sustained low FPS — all short-circuit to a hidden canvas with no errors.
 */
(() => {
  'use strict';

  const canvas = document.getElementById('hero-3d-canvas');
  if (!canvas) return;

  const hide = () => { canvas.style.display = 'none'; };

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    hide(); return;
  }

  const isMobile = window.innerWidth < 900;
  const cores = navigator.hardwareConcurrency || 4;
  if (isMobile || cores < 4) { hide(); return; }

  // Test WebGL once before loading Three.js
  try {
    const test = document.createElement('canvas').getContext('webgl')
              || document.createElement('canvas').getContext('experimental-webgl');
    if (!test) { hide(); return; }
  } catch (e) { hide(); return; }

  const THREE_URL = 'https://unpkg.com/three@0.160.0/build/three.min.js';
  const s = document.createElement('script');
  s.src = THREE_URL;
  s.crossOrigin = 'anonymous';
  s.onload = () => { try { init(); } catch (e) { hide(); } };
  s.onerror = hide;
  document.head.appendChild(s);

  function init() {
    const THREE = window.THREE;
    if (!THREE) { hide(); return; }

    const NAVY = 0x010F3B;
    const ORANGE = 0xFF671F;
    const ORANGE_SOFT = 0xFFB58A;

    // Size from the canvas's own rendered CSS box, NOT the parent .hero section
    // (the hero is much taller than the canvas due to pricing cards below the fold).
    let w = canvas.clientWidth || window.innerWidth;
    let h = canvas.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'low-power'
    });
    renderer.setPixelRatio(1);
    renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0.6, 9);
    camera.lookAt(0, 0, 0);

    // ── Lights ─────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x6688ff, 0.5));
    const keyLight = new THREE.PointLight(ORANGE, 1.6, 30);
    keyLight.position.set(4, 3, 5);
    scene.add(keyLight);
    const rim = new THREE.PointLight(0x4A90D9, 0.9, 25);
    rim.position.set(-5, -2, 3);
    scene.add(rim);

    // World shift — anchors orbital system over the right column on desktop
    // so it doesn't overlap the hero copy on the left.
    // Computed in animation loop based on aspect ratio.
    const orbital = new THREE.Group();
    scene.add(orbital);

    // ── Core sphere (navy with orange emissive pulse) ──────────────────────
    const coreGeo = new THREE.IcosahedronGeometry(1.05, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: NAVY,
      emissive: ORANGE,
      emissiveIntensity: 0.18,
      roughness: 0.35,
      metalness: 0.6,
      flatShading: true
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    orbital.add(core);

    // Wireframe halo around core
    const haloGeo = new THREE.IcosahedronGeometry(1.35, 1);
    const haloMat = new THREE.MeshBasicMaterial({
      color: ORANGE,
      wireframe: true,
      transparent: true,
      opacity: 0.18
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    orbital.add(halo);

    // ── Orbiting label sprites ─────────────────────────────────────────────
    const labels = ['Claude', 'ChatGPT', 'Perplexity', 'Gemini'];
    const orbitGroup = new THREE.Group();
    orbital.add(orbitGroup);

    const labelSprites = [];
    const orbitRadius = 3.4;

    function makeLabelTexture(text) {
      const cnv = document.createElement('canvas');
      cnv.width = 512; cnv.height = 192;
      const ctx = cnv.getContext('2d');

      // Glass card background
      const grad = ctx.createLinearGradient(0, 0, 0, cnv.height);
      grad.addColorStop(0, 'rgba(255, 103, 31, 0.18)');
      grad.addColorStop(1, 'rgba(1, 15, 59, 0.85)');
      ctx.fillStyle = grad;
      roundRect(ctx, 8, 8, cnv.width - 16, cnv.height - 16, 28);
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(255, 181, 138, 0.65)';
      ctx.lineWidth = 3;
      roundRect(ctx, 8, 8, cnv.width - 16, cnv.height - 16, 28);
      ctx.stroke();

      // Text
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 78px Inter, "Helvetica Neue", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(255, 103, 31, 0.55)';
      ctx.shadowBlur = 18;
      ctx.fillText(text, cnv.width / 2, cnv.height / 2 + 4);

      // Top-left dot accent
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#FF671F';
      ctx.beginPath();
      ctx.arc(38, 36, 7, 0, Math.PI * 2);
      ctx.fill();

      const tex = new THREE.CanvasTexture(cnv);
      tex.anisotropy = 4;
      tex.needsUpdate = true;
      return tex;
    }

    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y,     x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x,     y + h, r);
      ctx.arcTo(x,     y + h, x,     y,     r);
      ctx.arcTo(x,     y,     x + w, y,     r);
      ctx.closePath();
    }

    labels.forEach((txt, i) => {
      const angle = (i / labels.length) * Math.PI * 2;
      const tex = makeLabelTexture(txt);
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(1.7, 0.64, 1);
      sprite.position.set(
        Math.cos(angle) * orbitRadius,
        Math.sin(angle * 0.5) * 0.3,
        Math.sin(angle) * orbitRadius
      );
      sprite.userData = { baseAngle: angle, baseY: sprite.position.y };
      orbitGroup.add(sprite);
      labelSprites.push(sprite);

      // Connection line core → label
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0), sprite.position.clone()
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: ORANGE_SOFT, transparent: true, opacity: 0.22
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.userData = { spriteIndex: i };
      orbitGroup.add(line);
    });

    // ── Starfield ──────────────────────────────────────────────────────────
    const starCount = 220;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3]     = (Math.random() - 0.5) * 30;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 24 - 6;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffd0a8,
      size: 0.045,
      transparent: true,
      opacity: 0.65,
      sizeAttenuation: true
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ── Position orbital system over the right column ──────────────────────
    // Visible world-width at z=0 plane = 2 * cameraZ * tan(fov/2)
    // We want the orbital center at ~70% of canvas width (right column).
    // Shift = (0.70 - 0.50) * visibleWidth = 0.20 * visibleWidth
    function applyOrbitalOffset() {
      const fovRad = camera.fov * Math.PI / 180;
      const visibleW = 2 * camera.position.z * Math.tan(fovRad / 2) * camera.aspect;
      // On narrow viewports, center it instead of pushing right
      const shiftRatio = (w >= 1024) ? 0.20 : 0;
      orbital.position.x = shiftRatio * visibleW;
    }
    applyOrbitalOffset();

    // ── Animation loop ─────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let frames = 0, fpsSum = 0, lowFpsStreak = 0, stopped = false;
    let lastFpsCheck = performance.now();
    let lastRender = 0;
    const TARGET_INTERVAL = 1000 / 30; // 30fps cap

    function loop() {
      if (stopped) return;
      requestAnimationFrame(loop);
      const now = performance.now();
      if (now - lastRender < TARGET_INTERVAL) return;
      lastRender = now;

      const t = clock.getElapsedTime();

      core.rotation.y = t * 0.18;
      core.rotation.x = Math.sin(t * 0.25) * 0.12;
      halo.rotation.y = -t * 0.10;
      halo.rotation.z = t * 0.06;

      orbitGroup.rotation.y = t * 0.12;

      // Per-sprite bob + always face camera (sprites do this automatically)
      labelSprites.forEach((sp, i) => {
        sp.position.y = sp.userData.baseY + Math.sin(t * 0.8 + i) * 0.15;
      });

      // Rebuild line endpoints to track sprites
      orbitGroup.children.forEach((child) => {
        if (child.isLine && child.userData && typeof child.userData.spriteIndex === 'number') {
          const sp = labelSprites[child.userData.spriteIndex];
          const pos = child.geometry.attributes.position;
          pos.setXYZ(1, sp.position.x, sp.position.y, sp.position.z);
          pos.needsUpdate = true;
        }
      });

      // Emissive pulse on core
      coreMat.emissiveIntensity = 0.18 + Math.sin(t * 1.4) * 0.08;

      // Slow star drift
      stars.rotation.y = t * 0.015;

      renderer.render(scene, camera);

      // FPS watchdog: if avg drops below 18 for 3 consecutive seconds, stop
      // (threshold lowered since we're capping at 30fps target)
      frames++;
      if (now - lastFpsCheck >= 1000) {
        const fps = (frames * 1000) / (now - lastFpsCheck);
        fpsSum = fps;
        frames = 0;
        lastFpsCheck = now;
        if (fps < 18) {
          lowFpsStreak++;
          if (lowFpsStreak >= 3) {
            stopped = true;
            hide();
          }
        } else {
          lowFpsStreak = 0;
        }
      }
    }

    loop();

    // ── Resize handler ─────────────────────────────────────────────────────
    let resizeRaf = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        w = canvas.clientWidth || window.innerWidth;
        h = canvas.clientHeight || window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        applyOrbitalOffset();
      });
    });

    // ── Pause when off-screen (intersection observer) ──────────────────────
    if ('IntersectionObserver' in window) {
      const heroSection = canvas.closest('section') || canvas.parentElement || canvas;
      let visible = true;
      const io = new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
      }, { threshold: 0.05 });
      io.observe(heroSection);

      // Wrap loop with visibility gate
      const originalRender = renderer.render.bind(renderer);
      renderer.render = (sc, cam) => {
        if (visible) originalRender(sc, cam);
      };
    }
  }
})();
