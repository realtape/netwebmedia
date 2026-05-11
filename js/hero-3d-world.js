/*
 * hero-3d-world.js — Photoreal Earth + AI citation network for the home hero.
 *
 * The visitor's IP is geolocated via ipapi.co; the globe rotates so their
 * city faces the camera and pulses an orange pin. Four AI brand labels
 * (Claude, ChatGPT, Perplexity, Gemini) orbit outside the atmosphere,
 * each beaming a laser line down to the pin — visualizing "your business,
 * cited by every AI tool, right where you are."
 *
 * Graceful no-op chain: prefers-reduced-motion, mobile/low-power,
 * WebGL failure, sustained low FPS — all short-circuit to a hidden canvas.
 *
 * CSP requirements (already satisfied in /.htaccess):
 *   script-src:  unpkg.com         (Three.js)
 *   img-src:     https:            (Three.js example textures)
 *   connect-src: ipapi.co          (IP geolocation)
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

  // WebGL probe on a throwaway canvas
  try {
    const probe = document.createElement('canvas');
    const ctx = probe.getContext('webgl') || probe.getContext('experimental-webgl');
    if (!ctx) { hide(); return; }
  } catch (e) { hide(); return; }

  // Lazy-load Three.js
  const s = document.createElement('script');
  s.src = 'https://unpkg.com/three@0.160.0/build/three.min.js';
  s.crossOrigin = 'anonymous';
  s.onload = () => { try { init(); } catch (e) { console.warn('[hero-3d-world]', e); hide(); } };
  s.onerror = hide;
  document.head.appendChild(s);

  function init() {
    const THREE = window.THREE;
    if (!THREE) { hide(); return; }

    const ORANGE = 0xFF671F;
    const ORANGE_SOFT = 0xFFB58A;
    const ATMOSPHERE_BLUE = new THREE.Color(0.32, 0.58, 1.0);

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
    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    camera.position.set(0, 0.5, 10);
    camera.lookAt(0, 0, 0);

    // ── Lights ─────────────────────────────────────────────────────────────
    // Bright ambient — Earth is always clearly readable
    scene.add(new THREE.AmbientLight(0xa6b4d1, 1.5));
    // Sun-like key light from camera direction so the front hemisphere lights up
    const sun = new THREE.DirectionalLight(0xfff4dc, 2.0);
    sun.position.set(2, 1.5, 7);
    scene.add(sun);
    // Soft fill from below to avoid pitch-black shadows
    const fill = new THREE.DirectionalLight(0xb0c4ff, 0.55);
    fill.position.set(-1, -2, 5);
    scene.add(fill);
    // Warm rim from the left for brand temperature on the limb
    const rim = new THREE.PointLight(ORANGE, 1.1, 18);
    rim.position.set(-5, 1, 2);
    scene.add(rim);

    // ── Master group (so the whole assembly shifts to the right column) ────
    const orbital = new THREE.Group();
    orbital.rotation.x = 0.18;     // gentle axial tilt — makes Earth look 3D, not flat
    orbital.scale.setScalar(0.68); // scale the whole assembly down to fit the right half
    scene.add(orbital);

    // ── Earth ──────────────────────────────────────────────────────────────
    const EARTH_RADIUS = 1.55;
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0x223352,          // navy fallback if texture fails
      specular: new THREE.Color(0x222233),
      shininess: 14,
      bumpScale: 0.04
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    orbital.add(earth);

    // Cloud layer (slightly larger, fades in after texture loads)
    const cloudsGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.012, 64, 64);
    const cloudsMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const clouds = new THREE.Mesh(cloudsGeo, cloudsMat);
    earth.add(clouds);

    // ── Atmosphere glow (Fresnel back-side shader) ─────────────────────────
    const atmoGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.20, 64, 64);
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
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
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

    // ── Equatorial orbit ring (futuristic satellite path) ──────────────────
    const eqRingGeo = new THREE.TorusGeometry(EARTH_RADIUS * 1.85, 0.012, 8, 96);
    const eqRingMat = new THREE.MeshBasicMaterial({
      color: ORANGE,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const equatorRing = new THREE.Mesh(eqRingGeo, eqRingMat);
    equatorRing.rotation.x = Math.PI / 2;
    orbital.add(equatorRing);

    // Second tilted ring (gives a "two-orbit" satellite look)
    const tiltRingGeo = new THREE.TorusGeometry(EARTH_RADIUS * 1.85, 0.008, 8, 96);
    const tiltRingMat = new THREE.MeshBasicMaterial({
      color: ORANGE_SOFT,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const tiltRing = new THREE.Mesh(tiltRingGeo, tiltRingMat);
    tiltRing.rotation.x = Math.PI / 2 + 0.4;
    tiltRing.rotation.y = 0.3;
    orbital.add(tiltRing);

    // ── Earth textures (best-effort, non-blocking) ─────────────────────────
    const texLoader = new THREE.TextureLoader();
    texLoader.crossOrigin = 'anonymous';
    const TEX = 'https://threejs.org/examples/textures/planets/';

    texLoader.load(TEX + 'earth_atmos_2048.jpg',
      (t) => { earthMat.map = t; earthMat.color.setHex(0xffffff); earthMat.needsUpdate = true; }
    );
    texLoader.load(TEX + 'earth_normal_2048.jpg',
      (t) => { earthMat.normalMap = t; earthMat.needsUpdate = true; }
    );
    texLoader.load(TEX + 'earth_specular_2048.jpg',
      (t) => { earthMat.specularMap = t; earthMat.needsUpdate = true; }
    );
    texLoader.load(TEX + 'earth_clouds_1024.png',
      (t) => { cloudsMat.map = t; cloudsMat.opacity = 0.36; cloudsMat.needsUpdate = true; }
    );

    // ── Starfield ──────────────────────────────────────────────────────────
    const starCount = 300;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 22 + Math.random() * 10;
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

    // ── Lat/Lon helper ─────────────────────────────────────────────────────
    function latLonToVec3(lat, lon, radius) {
      const phi   = (90 - lat) * Math.PI / 180;
      const theta = (lon + 180) * Math.PI / 180;
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
         radius * Math.cos(phi),
         radius * Math.sin(phi) * Math.sin(theta)
      );
    }

    // ── Pin marker (child of earth — rotates with the globe) ───────────────
    const pinGroup = new THREE.Group();
    pinGroup.visible = false;
    earth.add(pinGroup);

    const pinCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 16, 16),
      new THREE.MeshBasicMaterial({ color: ORANGE })
    );
    pinGroup.add(pinCore);

    const pinHalo = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 16),
      new THREE.MeshBasicMaterial({
        color: ORANGE, transparent: true, opacity: 0.5,
        blending: THREE.AdditiveBlending, depthWrite: false
      })
    );
    pinGroup.add(pinHalo);

    // Expanding pulse ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.06, 0.08, 32),
      new THREE.MeshBasicMaterial({
        color: ORANGE, side: THREE.DoubleSide,
        transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false
      })
    );
    ring.rotation.x = Math.PI / 2;
    pinGroup.add(ring);

    // City label
    const labelMat = new THREE.SpriteMaterial({ transparent: true, depthWrite: false, opacity: 0 });
    const cityLabel = new THREE.Sprite(labelMat);
    cityLabel.scale.set(0.70, 0.25, 1);   // smaller — matches the icon badges
    cityLabel.position.set(0, 0.18, 0);
    pinGroup.add(cityLabel);

    function makeCityLabelTexture(city, country) {
      const cnv = document.createElement('canvas');
      cnv.width = 512; cnv.height = 180;
      const ctx = cnv.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 0, cnv.height);
      g.addColorStop(0, 'rgba(255, 103, 31, 0.95)');
      g.addColorStop(1, 'rgba(204,  60,  0, 0.95)');
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
      ctx.fillStyle = '#fff';
      ctx.font = '700 70px Inter, "Helvetica Neue", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
      ctx.fillText('📍 ' + (country ? city + ', ' + country : city), 38, cnv.height / 2);
      const tex = new THREE.CanvasTexture(cnv);
      tex.anisotropy = 4;
      tex.needsUpdate = true;
      return tex;
    }

    // ── Circular icon-badge texture maker (for LLM logos) ─────────────────
    // Draws a glass-orb badge with a simplified, abstract glyph that evokes
    // each AI brand without using copyrighted marks directly.
    function makeIconBadge(kind) {
      const cnv = document.createElement('canvas');
      cnv.width = 256; cnv.height = 256;
      const ctx = cnv.getContext('2d');
      const cx = 128, cy = 128;

      // Glass-orb background — radial gradient orange to navy
      const bg = ctx.createRadialGradient(cx - 30, cy - 40, 10, cx, cy, 122);
      bg.addColorStop(0, 'rgba(255, 150, 90, 0.95)');
      bg.addColorStop(0.55, 'rgba(255, 103, 31, 0.92)');
      bg.addColorStop(1, 'rgba(1, 15, 59, 0.95)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(cx, cy, 120, 0, Math.PI * 2);
      ctx.fill();

      // Outer rim
      ctx.strokeStyle = 'rgba(255, 200, 160, 0.85)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 120, 0, Math.PI * 2);
      ctx.stroke();

      // Inner ring (decorative)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 108, 0, Math.PI * 2);
      ctx.stroke();

      // Glyph (white, glowing)
      ctx.shadowColor = 'rgba(255, 235, 205, 0.95)';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const r = 52;
      switch (kind) {
        case 'claude': {
          // Anthropic-style 8-rayed asterisk burst
          for (let i = 0; i < 8; i++) {
            const a = i * Math.PI / 4;
            const len = (i % 2 === 0) ? r : r * 0.6;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
            ctx.stroke();
          }
          // Center dot
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'chatgpt': {
          // OpenAI-style hex knot — 3 overlapping ellipses at 60° offsets
          ctx.lineWidth = 6;
          for (let i = 0; i < 3; i++) {
            const a = i * Math.PI / 3;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(a);
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 0.95, r * 0.42, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
          break;
        }
        case 'perplexity': {
          // Concentric arc + center dot (evokes "search/answer" emblem)
          ctx.lineWidth = 7;
          // Outer arc, top half
          ctx.beginPath();
          ctx.arc(cx, cy, r, Math.PI * 1.1, Math.PI * 1.9);
          ctx.stroke();
          // Middle arc, bottom half
          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.68, Math.PI * 0.1, Math.PI * 0.9);
          ctx.stroke();
          // Center dot
          ctx.beginPath();
          ctx.arc(cx, cy, 8, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'gemini': {
          // 4-pointed sparkle star (Google Gemini-style)
          const drawSparkle = (sx, sy, sr) => {
            ctx.beginPath();
            ctx.moveTo(sx, sy - sr);
            ctx.quadraticCurveTo(sx + sr * 0.18, sy - sr * 0.18, sx + sr, sy);
            ctx.quadraticCurveTo(sx + sr * 0.18, sy + sr * 0.18, sx, sy + sr);
            ctx.quadraticCurveTo(sx - sr * 0.18, sy + sr * 0.18, sx - sr, sy);
            ctx.quadraticCurveTo(sx - sr * 0.18, sy - sr * 0.18, sx, sy - sr);
            ctx.closePath();
            ctx.fill();
          };
          drawSparkle(cx, cy, r);
          // Small accent sparkle
          ctx.globalAlpha = 0.7;
          drawSparkle(cx + r * 0.78, cy - r * 0.78, r * 0.32);
          ctx.globalAlpha = 1;
          break;
        }
      }

      const tex = new THREE.CanvasTexture(cnv);
      tex.anisotropy = 4;
      tex.needsUpdate = true;
      return tex;
    }

    // ── LLM icon badges orbiting around Earth ─────────────────────────────
    const LLM_KINDS = ['claude', 'chatgpt', 'perplexity', 'gemini'];
    const LLM_ORBIT_R = 2.45;
    const llmGroup = new THREE.Group();
    orbital.add(llmGroup);

    const llmSprites = [];
    const llmLaserLines = [];

    LLM_KINDS.forEach((kind, i) => {
      const angle = (i / LLM_KINDS.length) * Math.PI * 2;
      const tex = makeIconBadge(kind);
      const mat = new THREE.SpriteMaterial({
        map: tex, transparent: true, depthWrite: false, opacity: 0.95
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.55, 0.55, 1);   // small square badges
      sprite.userData = { baseAngle: angle };
      llmGroup.add(sprite);
      llmSprites.push(sprite);

      // Laser line from this badge to the pin (updated per-frame)
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(), new THREE.Vector3()
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: ORANGE_SOFT,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.userData = { llmIndex: i };
      orbital.add(line);
      llmLaserLines.push(line);
    });

    // ── Initial Earth orientation & geolocation hook ───────────────────────
    earth.rotation.y = 0;
    clouds.rotation.y = 0;

    let geolocResolved = false;
    let targetEarthRotY = 0;
    let pinSpawnTime = 0;
    let pinWorldPos = new THREE.Vector3();    // updated each frame for laser endpoint

    function placePin(lat, lon, city, country) {
      const surfacePos = latLonToVec3(lat, lon, EARTH_RADIUS * 1.002);
      pinGroup.position.copy(surfacePos);

      // Orient the ring flat against the surface
      pinGroup.lookAt(0, 0, 0);
      pinGroup.rotateY(Math.PI);

      if (city) {
        labelMat.map = makeCityLabelTexture(city, country || '');
        labelMat.opacity = 0;
        labelMat.needsUpdate = true;
      }
      pinGroup.visible = true;
      pinSpawnTime = clock.getElapsedTime();

      // Rotate Earth so this pin's local (x,z) gets rotated to (0, +z) — face camera.
      // The rotation that brings horizontal vector (px,pz) → (0, |v|) is -atan2(px, pz).
      targetEarthRotY = -Math.atan2(surfacePos.x, surfacePos.z);

      // Snap to the target immediately on first placement so visitor sees their
      // city facing forward right away. Subsequent drift is handled by the loop.
      earth.rotation.y = targetEarthRotY;
      clouds.rotation.y = targetEarthRotY;

      geolocResolved = true;
    }

    // Expose internals for browser-console debugging (no functional impact)
    window.__NWM_HERO_3D__ = { earth, clouds, orbital, llmGroup, pinGroup,
      get earthRotY() { return earth.rotation.y; },
      get targetRotY() { return targetEarthRotY; },
      get textureLoaded() { return !!earthMat.map; }
    };

    // ── IP geolocation ─────────────────────────────────────────────────────
    if (typeof fetch === 'function') {
      const ctl = (typeof AbortController === 'function') ? new AbortController() : null;
      const timeoutId = setTimeout(() => { if (ctl) ctl.abort(); }, 4000);
      fetch('https://ipapi.co/json/', { signal: ctl ? ctl.signal : undefined })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          clearTimeout(timeoutId);
          if (!data || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return;
          placePin(data.latitude, data.longitude, data.city || '', data.country_code || data.country || '');
        })
        .catch(() => { clearTimeout(timeoutId); });
    }

    // ── Right-column horizontal offset ─────────────────────────────────────
    function applyOrbitalOffset() {
      const fovRad = camera.fov * Math.PI / 180;
      const visibleW = 2 * camera.position.z * Math.tan(fovRad / 2) * camera.aspect;
      // Push the (now smaller) scene to ~25% past center → sits in the right column
      const shiftRatio = (w >= 1024) ? 0.25 : 0;
      orbital.position.x = shiftRatio * visibleW;
    }
    applyOrbitalOffset();

    // ── Animation loop ─────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let frames = 0, lowFpsStreak = 0, stopped = false;
    let lastFpsCheck = performance.now();
    let lastRender = 0;
    const TARGET_INTERVAL = 1000 / 30;

    // Reusable temp vectors to avoid GC churn
    const _tmpPinWorld = new THREE.Vector3();
    const _tmpLLMWorld = new THREE.Vector3();

    function loop() {
      if (stopped) return;
      requestAnimationFrame(loop);
      const now = performance.now();
      if (now - lastRender < TARGET_INTERVAL) return;
      lastRender = now;

      const t = clock.getElapsedTime();

      // Earth rotation
      if (geolocResolved) {
        const delta = targetEarthRotY - earth.rotation.y;
        earth.rotation.y += delta * 0.05;
        clouds.rotation.y += delta * 0.05;
        if (Math.abs(delta) < 0.01) {
          earth.rotation.y += 0.0006;
          clouds.rotation.y += 0.0009;
        }
      } else {
        earth.rotation.y += 0.0028;
        clouds.rotation.y += 0.0036;
      }

      // Atmosphere subtle breathing
      const breathe = 1.0 + Math.sin(t * 0.6) * 0.005;
      atmosphere.scale.setScalar(breathe);

      // Orbit rings slow spin
      equatorRing.rotation.z = t * 0.06;
      tiltRing.rotation.z = -t * 0.08;

      // LLM labels orbit + bob
      llmGroup.rotation.y = t * 0.15;
      llmSprites.forEach((sp, i) => {
        const ang = sp.userData.baseAngle;
        sp.position.x = Math.cos(ang) * LLM_ORBIT_R;
        sp.position.z = Math.sin(ang) * LLM_ORBIT_R;
        sp.position.y = Math.sin(t * 0.7 + i * 1.4) * 0.25;
      });

      // Update laser lines (LLM → pin) in orbital-local space
      if (pinGroup.visible) {
        // Pin world position relative to orbital group
        pinGroup.getWorldPosition(_tmpPinWorld);
        orbital.worldToLocal(_tmpPinWorld);
        pinWorldPos.copy(_tmpPinWorld);

        llmSprites.forEach((sp, i) => {
          sp.getWorldPosition(_tmpLLMWorld);
          orbital.worldToLocal(_tmpLLMWorld);
          const line = llmLaserLines[i];
          const pos = line.geometry.attributes.position;
          pos.setXYZ(0, _tmpLLMWorld.x, _tmpLLMWorld.y, _tmpLLMWorld.z);
          pos.setXYZ(1, _tmpPinWorld.x, _tmpPinWorld.y, _tmpPinWorld.z);
          pos.needsUpdate = true;

          // Lines glow brighter when their LLM is on the front hemisphere
          // (z > 0 in orbital-local frame after rotation, but orbital is tilted —
          // use the world-Z relative to camera for a simpler heuristic)
          const frontness = (_tmpLLMWorld.z + LLM_ORBIT_R) / (2 * LLM_ORBIT_R);
          line.material.opacity = 0.10 + frontness * 0.22;
        });
      }

      // Pin pulse
      if (pinGroup.visible) {
        const age = t - pinSpawnTime;
        const halo = 1.0 + Math.sin(t * 2.2) * 0.25;
        pinHalo.scale.setScalar(halo);
        pinHalo.material.opacity = 0.35 + Math.sin(t * 2.2) * 0.15;

        const period = 2.0;
        const phase = (age % period) / period;
        ring.scale.setScalar(0.5 + phase * 6.0);
        ring.material.opacity = (1.0 - phase) * 0.55;

        if (labelMat.map) {
          labelMat.opacity = Math.min(1, age / 1.2);
        }
      }

      // Star drift
      stars.rotation.y = t * 0.012;

      renderer.render(scene, camera);

      // FPS watchdog — only trips on sustained terrible performance.
      // Threshold lowered (10 FPS) and only counts when the tab is actually
      // active (document.visibilityState === 'visible'), so background-
      // throttled tabs don't get permanently hidden.
      frames++;
      if (now - lastFpsCheck >= 1000) {
        const fps = (frames * 1000) / (now - lastFpsCheck);
        frames = 0;
        lastFpsCheck = now;
        const tabVisible = (typeof document !== 'undefined' && document.visibilityState === 'visible');
        if (tabVisible && fps < 10) {
          lowFpsStreak++;
          if (lowFpsStreak >= 5) { stopped = true; hide(); }
        } else {
          lowFpsStreak = 0;
        }
      }
    }
    loop();

    // ── Resize ─────────────────────────────────────────────────────────────
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

    // ── Pause when scrolled out of view ────────────────────────────────────
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
