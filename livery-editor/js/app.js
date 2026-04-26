const CANVAS_W = 2048;
const CANVAS_H = 1024;
const MAX_UNDO  = 40;

class LiveryApp {
  constructor() {
    this._undoStack = [];
    this._redoStack = [];
    this._zoom      = 0.5;
    this._currentTemplate = 'gt3';

    this._initCanvas();
    this._initLayers();
    this._initTools();
    this._initTemplate();
    this._initZoom();
    this._initExport();
    this._initImageUpload();
    this._initTopbarControls();
    this._initMouseTracking();
    this._initBgColor();
    this._applyZoom();
    this._applyNWMStarterLivery();
    this.saveState();
    this.canvas.renderAll();
  }

  // ─── CANVAS SETUP ───────────────────────────────────────────────────────────

  _initCanvas() {
    this.canvas = new fabric.Canvas('editor-canvas', {
      width:  CANVAS_W,
      height: CANVAS_H,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection:        true,
      stopContextMenu:  true,
      fireRightClick:   false,
    });

    // Template overlay: keep buffer at full logical res for sharp rendering
    const overlay    = document.getElementById('template-overlay');
    overlay.width    = CANVAS_W;
    overlay.height   = CANVAS_H;

    document.getElementById('sb-size').textContent = `${CANVAS_W} × ${CANVAS_H}`;
  }

  _initLayers() {
    this.layers = new LayerManager(this);
    this.layers.add('Layer 1');
  }

  _initTools() {
    this.tools = new ToolManager(this);
  }

  // ─── ZOOM ────────────────────────────────────────────────────────────────────

  _initZoom() {
    const sel   = document.getElementById('zoom-select');
    sel.value   = '0.5';

    sel.addEventListener('change', () => {
      this._zoom = parseFloat(sel.value);
      this._applyZoom();
    });

    // Ctrl + wheel zooms
    document.getElementById('canvas-scroll').addEventListener('wheel', (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const levels  = [0.25, 0.5, 0.75, 1, 1.5, 2];
      const idx     = levels.indexOf(this._zoom);
      if (e.deltaY < 0 && idx < levels.length - 1) this._zoom = levels[idx + 1];
      else if (e.deltaY > 0 && idx > 0)             this._zoom = levels[idx - 1];
      sel.value = this._zoom;
      this._applyZoom();
    }, { passive: false });
  }

  _applyZoom() {
    const scaledW = Math.round(CANVAS_W * this._zoom);
    const scaledH = Math.round(CANVAS_H * this._zoom);

    // ── Fabric native zoom ───────────────────────────────────────────────────
    // Logical coordinates always stay in 0..CANVAS_W / 0..CANVAS_H space.
    // canvas.getPointer() automatically un-applies the viewport transform.
    this.canvas.setViewportTransform([this._zoom, 0, 0, this._zoom, 0, 0]);
    this.canvas.setWidth(scaledW);
    this.canvas.setHeight(scaledH);

    // ── Size the outer clip container ────────────────────────────────────────
    // canvas-outer clips the layout overflow so the scroll area is correctly
    // sized to the visual (zoomed) canvas dimensions.
    const outer        = document.getElementById('canvas-outer');
    outer.style.width  = scaledW + 'px';
    outer.style.height = scaledH + 'px';

    // canvas-wrapper matches outer so position:absolute children align
    const wrapper        = document.getElementById('canvas-wrapper');
    wrapper.style.width  = scaledW + 'px';
    wrapper.style.height = scaledH + 'px';

    // ── Scale the template overlay (buffer stays at full res for crispness) ──
    const overlay         = document.getElementById('template-overlay');
    overlay.style.width   = scaledW + 'px';
    overlay.style.height  = scaledH + 'px';

    this._renderTemplate();
  }

  // ─── BACKGROUND COLOR ────────────────────────────────────────────────────────

  _initBgColor() {
    const picker = document.getElementById('canvas-bg-color');
    if (!picker) return;
    picker.addEventListener('input', () => {
      this.canvas.setBackgroundColor(picker.value, () => this.canvas.renderAll());
    });
  }

  // ─── NWM STARTER LIVERY ──────────────────────────────────────────────────────
  // Paints a NetWebMedia-branded GT3 livery on the blank canvas at startup.
  // All objects land on Layer 1 so the user can immediately edit or delete them.

  _applyNWMStarterLivery() {
    const c  = this.canvas;
    const CW = CANVAS_W;   // 2048
    const CH = CANVAS_H;   // 1024

    const NWM_NAVY   = '#010F3B';
    const NWM_ORANGE = '#FF671F';
    const NWM_WHITE  = '#FFFFFF';

    // ── 1. Navy base ──────────────────────────────────────────────────────────
    const base = new fabric.Rect({
      left: 0, top: 0, width: CW, height: CH,
      fill: NWM_NAVY, selectable: true, evented: true,
    });
    this.layers.assignToActive(base);
    c.add(base);
    c.sendToBack(base);

    // ── 2. Orange diagonal band ───────────────────────────────────────────────
    // A wide swept stripe running across the lower-middle of the car
    const stripe = new fabric.Rect({
      left: -300, top: 480,
      width: CW + 600, height: 280,
      fill: NWM_ORANGE,
      angle: -11,
      selectable: true, evented: true,
    });
    this.layers.assignToActive(stripe);
    c.add(stripe);

    // ── 3. Thin white pinstripe just below the orange band ────────────────────
    const pin = new fabric.Rect({
      left: -300, top: 735,
      width: CW + 600, height: 28,
      fill: NWM_WHITE,
      angle: -11,
      selectable: true, evented: true,
    });
    this.layers.assignToActive(pin);
    c.add(pin);

    // ── 4. "NWM" wordmark on the door panel ──────────────────────────────────
    const wordmark = new fabric.IText('NWM', {
      left: 520, top: 260,
      fontSize: 260,
      fontFamily: 'Inter, Arial Black, sans-serif',
      fontWeight: '900',
      fill: NWM_ORANGE,
      charSpacing: 80,
      selectable: true, evented: true,
    });
    this.layers.assignToActive(wordmark);
    c.add(wordmark);

    // ── 5. "netwebmedia.com" sub-text ─────────────────────────────────────────
    const sub = new fabric.IText('netwebmedia.com', {
      left: 528, top: 560,
      fontSize: 72,
      fontFamily: 'Inter, Arial, sans-serif',
      fontWeight: '600',
      fill: NWM_WHITE,
      charSpacing: 30,
      selectable: true, evented: true,
    });
    this.layers.assignToActive(sub);
    c.add(sub);

    // ── 6. Car number board (right rear quarter) ──────────────────────────────
    const numBg = new fabric.Rect({
      left: 1540, top: 200, width: 300, height: 300,
      fill: NWM_WHITE, rx: 12, ry: 12,
      selectable: true, evented: true,
    });
    this.layers.assignToActive(numBg);
    c.add(numBg);

    const numText = new fabric.IText('1', {
      left: 1630, top: 215,
      fontSize: 240,
      fontFamily: 'Inter, Arial Black, sans-serif',
      fontWeight: '900',
      fill: NWM_NAVY,
      selectable: true, evented: true,
    });
    this.layers.assignToActive(numText);
    c.add(numText);

    // ── 7. Orange accent flash on the front bumper area ───────────────────────
    const frontFlash = new fabric.Triangle({
      left: 0, top: 180,
      width: 340, height: 520,
      fill: NWM_ORANGE,
      angle: 12,
      selectable: true, evented: true,
    });
    this.layers.assignToActive(frontFlash);
    c.add(frontFlash);

    // Background stays at back; bring wordmark / text above stripes
    c.bringToFront(wordmark);
    c.bringToFront(sub);
    c.bringToFront(numBg);
    c.bringToFront(numText);

    // Also update the bg-color picker to match
    const bgPicker = document.getElementById('canvas-bg-color');
    if (bgPicker) bgPicker.value = NWM_NAVY;
    c.setBackgroundColor(NWM_NAVY, () => {});
  }

  // ─── CAR TEMPLATE OVERLAY ────────────────────────────────────────────────────

  _initTemplate() {
    const carSel      = document.getElementById('car-select');
    const tplCheck    = document.getElementById('show-template');
    const labelsCheck = document.getElementById('show-labels');
    const opSlider    = document.getElementById('template-opacity');
    const opVal       = document.getElementById('template-opacity-val');
    const overlay     = document.getElementById('template-overlay');

    carSel.addEventListener('change', () => {
      this._currentTemplate = carSel.value;
      this._renderTemplate();
    });

    // FIX: toggle reads the slider's current value instead of fighting it
    tplCheck.addEventListener('change', () => {
      overlay.style.opacity = tplCheck.checked ? (parseInt(opSlider.value) / 100) : 0;
    });

    labelsCheck.addEventListener('change', () => this._renderTemplate());

    opSlider.addEventListener('input', () => {
      const val = parseInt(opSlider.value);
      opVal.textContent = val + '%';
      // Only apply if the visibility toggle is on
      if (tplCheck.checked) overlay.style.opacity = val / 100;
    });

    // Set initial state from slider default
    overlay.style.opacity = parseInt(opSlider.value) / 100;

    this._renderTemplate();
  }

  _renderTemplate() {
    const tpl = TEMPLATES[this._currentTemplate];
    if (!tpl) return;

    const canvas = document.getElementById('template-overlay');
    const ctx    = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const showLabels = document.getElementById('show-labels').checked;

    // Scale template paths to fit the canvas with padding
    const padX   = 80, padY = 80;
    const availW = CANVAS_W - padX * 2;
    const availH = CANVAS_H - padY * 2;
    const scale  = Math.min(availW / tpl.w, availH / tpl.h);
    const offX   = padX + (availW - tpl.w * scale) / 2;
    const offY   = padY + (availH - tpl.h * scale) / 2;

    ctx.save();
    ctx.translate(offX, offY);
    ctx.scale(scale, scale);

    // Section fills (orientation colors)
    tpl.sections.forEach(section => {
      ctx.fillStyle = section.fill;
      ctx.fill(new Path2D(section.path));
    });

    // Body fill + outline
    const bodyPath = new Path2D(tpl.body);
    ctx.fillStyle   = 'rgba(220,220,228,0.6)';
    ctx.fill(bodyPath);
    ctx.strokeStyle = 'rgba(40,40,60,0.88)';
    ctx.lineWidth   = 2.5 / scale;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    ctx.stroke(bodyPath);

    // Glass / cockpit opening
    if (tpl.glass) {
      const glassPath = new Path2D(tpl.glass);
      ctx.fillStyle   = 'rgba(160,200,240,0.45)';
      ctx.fill(glassPath);
      ctx.strokeStyle = 'rgba(80,120,160,0.7)';
      ctx.lineWidth   = 1.5 / scale;
      ctx.stroke(glassPath);
    }

    // Wheels — tyre + rim + hub + spokes
    tpl.wheels.forEach(w => {
      ctx.beginPath();
      ctx.arc(w.cx, w.cy, w.r, 0, Math.PI * 2);
      ctx.fillStyle   = 'rgba(35,35,35,0.88)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(70,70,70,0.9)';
      ctx.lineWidth   = 1.5 / scale;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(w.cx, w.cy, w.r * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(155,155,168,0.92)';
      ctx.fill();

      for (let i = 0; i < 5; i++) {
        const ang = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(w.cx + Math.cos(ang) * w.r * 0.18, w.cy + Math.sin(ang) * w.r * 0.18);
        ctx.lineTo(w.cx + Math.cos(ang) * w.r * 0.52, w.cy + Math.sin(ang) * w.r * 0.52);
        ctx.strokeStyle = 'rgba(55,55,65,0.8)';
        ctx.lineWidth   = 3 / scale;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(w.cx, w.cy, w.r * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(70,70,80,0.95)';
      ctx.fill();
    });

    // Detail / panel lines (dashed)
    if (tpl.details) {
      ctx.strokeStyle = 'rgba(60,60,80,0.5)';
      ctx.lineWidth   = 1.5 / scale;
      ctx.setLineDash([4 / scale, 3 / scale]);
      ctx.stroke(new Path2D(tpl.details));
      ctx.setLineDash([]);
    }

    // Section labels
    if (showLabels) {
      const fs = 14 / scale;
      ctx.font         = `bold ${fs}px Inter, sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';

      tpl.sections.forEach(s => {
        const tw = ctx.measureText(s.label).width;
        const th = fs;
        const pad = 4 / scale;
        ctx.fillStyle = 'rgba(0,0,0,0.58)';
        ctx.roundRect(s.x - tw / 2 - pad, s.y - th / 2 - pad * 0.75, tw + pad * 2, th + pad * 1.5, 3 / scale);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.96)';
        ctx.fillText(s.label, s.x, s.y);
      });
    }

    ctx.restore();
    this._tplTransform = { offX, offY, scale };
  }

  // ─── UNDO / REDO ─────────────────────────────────────────────────────────────

  saveState() {
    const state = {
      canvas: JSON.stringify(this.canvas.toJSON(
        ['layerId', '_baseOpacity', '_templateMarker', '_isFillResult', '_layerBlend']
      )),
      layers: this.layers.serialize()
    };
    this._undoStack.push(state);
    if (this._undoStack.length > MAX_UNDO) this._undoStack.shift();
    this._redoStack = [];

    // Refresh layer thumbnails after a short delay (canvas may still be rendering)
    clearTimeout(this._thumbTimer);
    this._thumbTimer = setTimeout(() => this._updateThumbnails(), 80);
  }

  _updateThumbnails() {
    // Render at ~40×20 px — cheap and gives enough visual context
    try {
      const dataURL = this.canvas.toDataURL({
        format: 'jpeg',
        quality: 0.6,
        multiplier: 40 / CANVAS_W,
      });
      this.layers.updateThumbnails(dataURL);
    } catch (_) { /* tainted canvas (cross-origin image) — skip silently */ }
  }

  undo() {
    if (this._undoStack.length <= 1) return;
    const current = this._undoStack.pop();
    this._redoStack.push(current);
    this._restoreState(this._undoStack[this._undoStack.length - 1]);
  }

  redo() {
    if (!this._redoStack.length) return;
    const next = this._redoStack.pop();
    this._undoStack.push(next);
    this._restoreState(next);
  }

  _restoreState(state) {
    this.canvas.loadFromJSON(state.canvas, () => {
      this.layers.restore(state.layers);
      this.canvas.renderAll();
      this._updateThumbnails();
    });
  }

  // ─── EXPORT ──────────────────────────────────────────────────────────────────

  _initExport() {
    document.getElementById('btn-export').addEventListener('click', () => this._exportPNG());
  }

  _exportPNG() {
    const exportH   = parseInt(document.getElementById('export-size').value);
    const exportW   = exportH * 2;
    const multiplier = exportW / CANVAS_W;

    const dataURL = this.canvas.toDataURL({ format: 'png', multiplier, quality: 1 });

    const a     = document.createElement('a');
    a.href      = dataURL;
    const name  = (TEMPLATES[this._currentTemplate]?.name || 'livery')
                    .replace(/\s+/g, '_').toLowerCase();
    a.download  = `livery_${name}_${exportW}x${exportH}.png`;
    a.click();
  }

  // ─── IMAGE UPLOAD ────────────────────────────────────────────────────────────

  _initImageUpload() {
    const input = document.getElementById('image-upload');
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);

      fabric.Image.fromURL(url, (img) => {
        const maxDim = 800;
        if (img.width > maxDim || img.height > maxDim) {
          img.scale(Math.min(maxDim / img.width, maxDim / img.height));
        }
        img.set({
          left: CANVAS_W / 2 - (img.width  * (img.scaleX || 1)) / 2,
          top:  CANVAS_H / 2 - (img.height * (img.scaleY || 1)) / 2,
          selectable: true,
        });
        this.layers.assignToActive(img);
        this.canvas.add(img);
        this.canvas.setActiveObject(img);
        this.canvas.renderAll();
        this.saveState();
        URL.revokeObjectURL(url);
      });

      input.value = '';
      this.tools.setTool('select');
    });
  }

  // ─── TOPBAR CONTROLS ─────────────────────────────────────────────────────────

  _initTopbarControls() {
    document.getElementById('btn-undo').addEventListener('click', () => this.undo());
    document.getElementById('btn-redo').addEventListener('click', () => this.redo());

    document.getElementById('btn-new').addEventListener('click', () => {
      if (!confirm('Start a new livery? All unsaved work will be lost.')) return;
      this.canvas.clear();
      this.canvas.backgroundColor = '#ffffff';
      document.getElementById('canvas-bg-color').value = '#ffffff';
      this._undoStack = [];
      this._redoStack = [];
      this.layers.layers = [];
      this.layers._thumbDataURL = null;
      this.layers.add('Layer 1');
      this._applyNWMStarterLivery();
      this.canvas.renderAll();
      this.saveState();
    });
  }

  // ─── MOUSE TRACKING ──────────────────────────────────────────────────────────

  _initMouseTracking() {
    this.canvas.on('mouse:move', (e) => {
      const ptr = this.canvas.getPointer(e.e);
      document.getElementById('sb-pos').textContent =
        `${Math.round(ptr.x)}, ${Math.round(ptr.y)}`;
    });
  }
}

// ─── BOOT ────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  window.app = new LiveryApp();
});
