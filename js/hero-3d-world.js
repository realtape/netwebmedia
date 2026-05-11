/*
 * hero-3d-world.js — Photoreal Earth backdrop for the home-page hero.
 *
 * Real NASA Blue Marble textures (diffuse + bump + specular + clouds),
 * Fresnel atmosphere glow, drifting starfield. Fetches the visitor's
 * IP geolocation from ipapi.co and drops a pulsing orange pin on their
 * city, then rotates the globe so that location faces the camera.
 *
 * Graceful no-op chain: prefers-reduced-motion, mobile/low-power,
 * WebGL failure, sustained low FPS — all short-circuit to hidden canvas.
 *
 * CSP requirements (already satisfied in .htaccess):
 *   script-src: unpkg.com  (Three.js loader)
 *   img-src:    https:     (Three.js example textures + clouds)
 *   connect-src: ipapi.co  (IP geolocation lookup)
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

  // Quick WebGL probe (on a throwaway canvas — never on the real one)
  try {
    const probe = document.createElement('canvas');
    const ctx = probe.getContext('webgl') || probe.getContext('experimental-webgl');
    if (!ctx) { hide(); return; }
  } catch (e) { hide(); return; }

  // Lazy-load Three.js
  const s = document.createElement('script');
  s.src = 'https://unpkg.com/three@0.160.0/build/three.min.js';
  s.crossOrigin = 'anonymous';
  s.onload = () => { try { init(); } catch (e) { console.warn('[hero-3d-world] init failed', e); hide(); } };
  s.onerror = hide;
  document.head.appendChild(s);

  function init() {
    const THREE = window.THREE;
    if (!THREE) { hide(); return; }

    const ORANGE = 0xFF671F;
    const ATMOSPHERE_BLUE = new THREE.Color(0.30, 0.55, 1.0);

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
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(0, 0.4, 6.5);
    camera.lookAt(0, 0, 0);

    // ── Lights ─────────────────────────────────────────────────────────────
    // Brighter ambient — Earth always readable, no pitch-black hemisphere
    scene.add(new THREE.AmbientLight(0x6e7da0, 1.1));
    // Strong sun-like directional light from camera's side (front-lit Earth)
    const sun = new THREE.DirectionalLight(0xfff2dc, 1.8);
    sun.position.set(2, 1.5, 7);
    scene.add(sun);
    // Warm orange rim from opposite side — adds brand temperature on the limb
    const rim = new THREE.PointLight(ORANGE, 0.9, 18);
    rim.position.set(-5, 1, 2);
    scene.add(rim);

    // ── Orbital group (so the whole earth+pin+atmosphere shifts right) ────
    const orbital = new THREE.Group();
    scene.add(orbital);

    // ── Earth ──────────────────────────────────────────────────────────────
    const EARTH_RADIUS = 1.55;
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);

    // Material with fallback color so it looks reasonable even if textures fail
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0x1a2840,        // fallback navy if texture fails to load
      specular: new THREE.Color(0x222233),
      shininess: 14,
      bumpScale: 0.04
    });

    const earth = new THREE.Mesh(earthGeo, earthMat);
    orbital.add(earth);

    // Cloud layer (slightly larger than earth, semi-transparent)
    const cloudsGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.012, 64, 64);
    const cloudsMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,        // fade-in only after texture loads
      depthWrite: false
    });
    const clouds = new THREE.Mesh(cloudsGeo, cloudsMat);
    earth.add(clouds);   // child of earth so it rotates with it (slightly faster via own rotation tick)

    // ── Atmosphere glow (Fresnel back-side shader) ─────────────────────────
    const atmoGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.18, 64, 64);
    const atmoMat = new THREE.ShaderMaterial({
      uniforms: { glowColor: { value: ATMOSPHERE_BLUE } },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.4);
          gl_FragColor = vec4(glowColor, 1.0) * intensity;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    const atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    orbital.add(atmosphere);

    // ── Texture loading (best-effort, non-blocking) ─────────────────────────
    const texLoader = new THREE.TextureLoader();
    texLoader.crossOrigin = 'anonymous';
    const TEX = 'https://threejs.org/examples/textures/planets/';

    texLoader.load(TEX + 'earth_atmos_2048.jpg',
      (t) => { earthMat.map = t; earthMat.color.setHex(0xffffff); earthMat.needsUpdate = true; },
      undefined,
      () => { /* keep navy fallback */ }
    );
    texLoader.load(TEX + 'earth_normal_2048.jpg',
      (t) => { earthMat.normalMap = t; earthMat.needsUpdate = true; }
    );
    texLoader.load(TEX + 'earth_specular_2048.jpg',
      (t) => { earthMat.specularMap = t; earthMat.needsUpdate = true; }
    );
    texLoader.load(TEX + 'earth_clouds_1024.png',
      (t) => { cloudsMat.map = t; cloudsMat.opacity = 0.38; cloudsMat.needsUpdate = true; }
    );

    // ── Starfield ──────────────────────────────────────────────────────────
    const starCount = 260;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      // Stars on a large sphere shell (visually distant)
      const r = 22 + Math.random() * 8;
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi) - 5;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffe0c0,
      size: 0.05,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ── Pin marker (orange pulsing sphere + outward ring) ──────────────────
    const pinGroup = new THREE.Group();
    pinGroup.visible = false;     // hidden until geolocation resolves
    earth.add(pinGroup);

    const pinCoreGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const pinCoreMat = new THREE.MeshBasicMaterial({ color: ORANGE });
    const pinCore = new THREE.Mesh(pinCoreGeo, pinCoreMat);
    pinGroup.add(pinCore);

    // Glow halo around the pin (additive)
    const pinHaloGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const pinHaloMat = new THREE.MeshBasicMaterial({
      color: ORANGE,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const pinHalo = new THREE.Mesh(pinHaloGeo, pinHaloMat);
    pinGroup.add(pinHalo);

    // Expanding ring on the surface — re-spawned each pulse cycle
    const ringGeo = new THREE.RingGeometry(0.06, 0.08, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: ORANGE,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;   // initial orientation; final via lookAt
    pinGroup.add(ring);

    // City label sprite (filled in after geolocation)
    const labelMat = new THREE.SpriteMaterial({ transparent: true, depthWrite: false, opacity: 0 });
    const cityLabel = new THREE.Sprite(labelMat);
    cityLabel.scale.set(0.9, 0.32, 1);
    cityLabel.position.set(0, 0.18, 0);
    pinGroup.add(cityLabel);

    function latLonToVec3(lat, lon, radius) {
      // Three.js coordinate convention: y = up
      // Standard equirectangular Earth map (Three.js default): texture seam at lon=180,
      // so the prime meridian (0°) is at theta = π. Verify with known cities.
      const phi   = (90 - lat) * Math.PI / 180;
      const theta = (lon + 180) * Math.PI / 180;
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
         radius * Math.cos(phi),
         radius * Math.sin(phi) * Math.sin(theta)
      );
    }

    function makeCityLabelTexture(city, country) {
      const cnv = document.createElement('canvas');
      cnv.width = 512; cnv.height = 180;
      const ctx = cnv.getContext('2d');

      // Background pill
      const g = ctx.createLinearGradient(0, 0, 0, cnv.height);
      g.addColorStop(0, 'rgba(255, 103, 31, 0.92)');
      g.addColorStop(1, 'rgba(204,  60,  0, 0.92)');
      ctx.fillStyle = g;
      const r = 56;
      ctx.beginPath();
      ctx.moveTo(r, 10);
      ctx.arcTo(cnv.width - 10, 10, cnv.width - 10, cnv.height - 10, r);
      ctx.arcTo(cnv.width - 10, cnv.height - 10, 10, cnv.height - 10, r);
      ctx.arcTo(10, cnv.height - 10, 10, 10, r);
      ctx.arcTo(10, 10, cnv.width - 10, 10, r);
      ctx.closePath();
      ctx.fill();

      // Pin glyph
      ctx.fillStyle = '#fff';
      ctx.font = '700 70px Inter, "Helvetica Neue", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;

      const display = country
        ? `${city}, ${country}`
        : city;
      ctx.fillText('📍 ' + display, 38, cnv.height / 2);

      const tex = new THREE.CanvasTexture(cnv);
      tex.anisotropy = 4;
      tex.needsUpdate = true;
      return tex;
    }

    // Initial Earth orientation: center the Atlantic so it looks balanced
    // even before the geolocation lookup resolves.
    earth.rotation.y = Math.PI;
    clouds.rotation.y = Math.PI;

    let targetEarthRotY = earth.rotation.y;   // animated toward user's city
    let geolocResolved = false;
    let pinSpawnTime = 0;

    function placePin(lat, lon, city, country) {
      const surfacePos = latLonToVec3(lat, lon, EARTH_RADIUS * 1.001);
      pinGroup.position.copy(surfacePos);

      // Orient the ring (and group) flat against the surface
      pinGroup.lookAt(0, 0, 0);          // -Z faces center; we want +Z so flip
      pinGroup.rotateY(Math.PI);

      if (city) {
        labelMat.map = makeCityLabelTexture(city, country || '');
        labelMat.opacity = 0;             // fade in via animation
        labelMat.needsUpdate = true;
      }
      pinGroup.visible = true;
      pinSpawnTime = clock.getElapsedTime();

      // Compute target Earth rotation so the pin faces the camera (z+)
      // Theta of marker = (lon + 180) * π/180. We want this position to point
      // toward +Z after earth.rotation.y. Equivalently: after rotation, the
      // marker's azimuth should equal π (the +Z direction in our convention).
      // Add a small slant so user sees the marker on the upper-front of globe.
      targetEarthRotY = -(lon + 180) * Math.PI / 180 + Math.PI;
    }

    // ── IP geolocation (best-effort) ───────────────────────────────────────
    // CSP connect-src allows ipapi.co. If this fails (rate-limited, blocked,
    // offline), the Earth still rotates without a pin — no error to user.
    if (typeof fetch === 'function') {
      const ctl = (typeof AbortController === 'function') ? new AbortController() : null;
      const timeoutId = setTimeout(() => { if (ctl) ctl.abort(); }, 4000);
      fetch('https://ipapi.co/json/', { signal: ctl ? ctl.signal : undefined })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          clearTimeout(timeoutId);
          if (!data || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return;
          geolocResolved = true;
          placePin(data.latitude, data.longitude, data.city || '', data.country_code || data.country || '');
        })
        .catch(() => { clearTimeout(timeoutId); /* silent — Earth keeps spinning */ });
    }

    // ── Position orbital system over the right column ──────────────────────
    function applyOrbitalOffset() {
      const fovRad = camera.fov * Math.PI / 180;
      const visibleW = 2 * camera.position.z * Math.tan(fovRad / 2) * camera.aspect;
      const shiftRatio = (w >= 1024) ? 0.20 : 0;
      orbital.position.x = shiftRatio * visibleW;
    }
    applyOrbitalOffset();

    // ── Animation loop ─────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let frames = 0, lowFpsStreak = 0, stopped = false;
    let lastFpsCheck = performance.now();
    let lastRender = 0;
    const TARGET_INTERVAL = 1000 / 30;     // 30fps cap

    function loop() {
      if (stopped) return;
      requestAnimationFrame(loop);
      const now = performance.now();
      if (now - lastRender < TARGET_INTERVAL) return;
      lastRender = now;

      const t = clock.getElapsedTime();

      // Earth rotation: lerp toward target if geolocation resolved,
      // otherwise slow continuous spin.
      if (geolocResolved) {
        const delta = targetEarthRotY - earth.rotation.y;
        earth.rotation.y += delta * 0.04;   // smooth easing
        clouds.rotation.y += delta * 0.04;
        // Once close enough, add a gentle drift so it's not totally static
        if (Math.abs(delta) < 0.01) {
          earth.rotation.y += 0.0008;
          clouds.rotation.y += 0.001;
        }
      } else {
        earth.rotation.y += 0.0025;
        clouds.rotation.y += 0.0033;
      }

      // Atmosphere subtle scale breathing
      const breathe = 1.0 + Math.sin(t * 0.6) * 0.005;
      atmosphere.scale.setScalar(breathe);

      // Pin pulse: halo scale + ring expand
      if (pinGroup.visible) {
        const age = t - pinSpawnTime;
        // Halo pulse
        const halo = 1.0 + Math.sin(t * 2.2) * 0.25;
        pinHalo.scale.setScalar(halo);
        pinHaloMat.opacity = 0.25 + Math.sin(t * 2.2) * 0.12;

        // Ring: re-emits every 2 seconds, scales out and fades
        const period = 2.0;
        const phase = (age % period) / period;     // 0 → 1
        const ringScale = 0.5 + phase * 6.0;
        ring.scale.setScalar(ringScale);
        ringMat.opacity = (1.0 - phase) * 0.55;

        // City label fade-in (first 1.2s)
        if (labelMat.map) {
          labelMat.opacity = Math.min(1, age / 1.2);
        }
      }

      // Star drift
      stars.rotation.y = t * 0.012;

      renderer.render(scene, camera);

      // FPS watchdog (we're capped at 30; bail if avg < 18 for 3s)
      frames++;
      if (now - lastFpsCheck >= 1000) {
        const fps = (frames * 1000) / (now - lastFpsCheck);
        frames = 0;
        lastFpsCheck = now;
        if (fps < 18) {
          lowFpsStreak++;
          if (lowFpsStreak >= 3) { stopped = true; hide(); }
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

    // ── Pause when scrolled off-screen ─────────────────────────────────────
    if ('IntersectionObserver' in window) {
      const heroSection = canvas.closest('section') || canvas.parentElement || canvas;
      let visible = true;
      const io = new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
      }, { threshold: 0.05 });
      io.observe(heroSection);
      const _origRender = renderer.render.bind(renderer);
      renderer.render = (sc, cam) => { if (visible) _origRender(sc, cam); };
    }
  }
})();
