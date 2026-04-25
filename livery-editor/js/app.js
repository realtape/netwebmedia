const CANVAS_W = 2048;
const CANVAS_H = 1024;
const MAX_UNDO = 40;

class LiveryApp {
  constructor() {
    this._undoStack = [];
    this._redoStack = [];
    this._zoom = 0.5;
    this._currentTemplate = 'stock';

    this._initCanvas();
    this._initLayers();
    this._initTools();
    this._initTemplate();
    this._initZoom();
    this._initExport();
    this._initImageUpload();
    this._initTopbarControls();
    this._initMouseTracking();
    this._applyZoom();
    this.saveState();

    // Initial render
    this.canvas.renderAll();
  }

  _initCanvas() {
    this.canvas = new fabric.Canvas('editor-canvas', {
      width: CANVAS_W,
      height: CANVAS_H,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
      stopContextMenu: true,
      fireRightClick: false,
    });

    // Size the wrapper
    const wrapper = document.getElementById('canvas-wrapper');
    wrapper.style.width = CANVAS_W + 'px';
    wrapper.style.height = CANVAS_H + 'px';

    // Size template overlay canvas
    const overlay = document.getElementById('template-overlay');
    overlay.width = CANVAS_W;
    overlay.height = CANVAS_H;

    document.getElementById('sb-size').textContent = `${CANVAS_W} × ${CANVAS_H}`;
  }

  _initLayers() {
    this.layers = new LayerManager(this);
    this.layers.add('Layer 1');
  }

  _initTools() {
    this.tools = new ToolManager(this);
  }

  _initZoom() {
    const sel = document.getElementById('zoom-select');
    sel.value = '0.5';
    sel.addEventListener('change', () => {
      this._zoom = parseFloat(sel.value);
      this._applyZoom();
    });

    // Mouse wheel zoom on canvas area
    document.getElementById('canvas-scroll').addEventListener('wheel', (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const zoomLevels = [0.25, 0.5, 0.75, 1, 1.5, 2];
      const idx = zoomLevels.indexOf(this._zoom);
      if (e.deltaY < 0 && idx < zoomLevels.length - 1) {
        this._zoom = zoomLevels[idx + 1];
      } else if (e.deltaY > 0 && idx > 0) {
        this._zoom = zoomLevels[idx - 1];
      }
      sel.value = this._zoom;
      this._applyZoom();
    }, { passive: false });
  }

  _applyZoom() {
    const wrapper = document.getElementById('canvas-wrapper');
    wrapper.style.transform = `scale(${this._zoom})`;
    wrapper.style.width = CANVAS_W + 'px';
    wrapper.style.height = CANVAS_H + 'px';
    const scroll = document.getElementById('canvas-scroll');
    scroll.style.minWidth = (CANVAS_W * this._zoom + 80) + 'px';
    scroll.style.minHeight = (CANVAS_H * this._zoom + 80) + 'px';
  }

  _initMouseTracking() {
    const sbPos = document.getElementById('sb-pos');
    this.canvas.on('mouse:move', (e) => {
      const ptr = this.canvas.getPointer(e.e);
      sbPos.textContent = `${Math.round(ptr.x)}, ${Math.round(ptr.y)}`;
    });
  }

  // ─── TEMPLATE ────────────────────────────────────────────────────────────────

  _initTemplate() {
    const sel = document.getElementById('car-select');
    sel.addEventListener('change', () => {
      this._currentTemplate = sel.value;
      this._renderTemplate();
    });

    document.getElementById('show-template').addEventListener('change', (e) => {
      document.getElementById('template-overlay').style.opacity = e.target.checked ? '' : '0';
    });

    document.getElementById('show-labels').addEventListener('change', () => this._renderTemplate());

    document.getElementById('template-opacity').addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      document.getElementById('template-opacity-val').textContent = val + '%';
      document.getElementById('template-overlay').style.opacity = val / 100;
    });

    this._renderTemplate();
  }

  _renderTemplate() {
    const tpl = TEMPLATES[this._currentTemplate];
    if (!tpl) return;

    const canvas = document.getElementById('template-overlay');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const showLabels = document.getElementById('show-labels').checked;

    // Scale the template to fit CANVAS_W × CANVAS_H with padding
    const padX = 80, padY = 80;
    const availW = CANVAS_W - padX * 2;
    const availH = CANVAS_H - padY * 2;
    const scaleX = availW / tpl.w;
    const scaleY = availH / tpl.h;
    const scale = Math.min(scaleX, scaleY);
    const offX = padX + (availW - tpl.w * scale) / 2;
    const offY = padY + (availH - tpl.h * scale) / 2;

    ctx.save();
    ctx.translate(offX, offY);
    ctx.scale(scale, scale);

    const parsePath = (d) => {
      const path = new Path2D(d);
      return path;
    };

    // Draw section fills first
    tpl.sections.forEach(section => {
      ctx.beginPath();
      const p = new Path2D(section.path);
      ctx.fillStyle = section.fill;
      ctx.fill(p);
    });

    // Draw body
    ctx.beginPath();
    const bodyPath = new Path2D(tpl.body);
    ctx.fillStyle = 'rgba(220,220,228,0.6)';
    ctx.fill(bodyPath);
    ctx.strokeStyle = 'rgba(40,40,60,0.85)';
    ctx.lineWidth = 2.5 / scale;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke(bodyPath);

    // Draw glass
    if (tpl.glass) {
      const glassPath = new Path2D(tpl.glass);
      ctx.fillStyle = 'rgba(160,200,240,0.45)';
      ctx.fill(glassPath);
      ctx.strokeStyle = 'rgba(80,120,160,0.7)';
      ctx.lineWidth = 1.5 / scale;
      ctx.stroke(glassPath);
    }

    // Draw wheels
    tpl.wheels.forEach(w => {
      // Outer tire
      ctx.beginPath();
      ctx.arc(w.cx, w.cy, w.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(40,40,40,0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(80,80,80,0.9)';
      ctx.lineWidth = 1.5 / scale;
      ctx.stroke();
      // Rim
      ctx.beginPath();
      ctx.arc(w.cx, w.cy, w.r * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(160,160,175,0.9)';
      ctx.fill();
      // Hub
      ctx.beginPath();
      ctx.arc(w.cx, w.cy, w.r * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(80,80,90,0.95)';
      ctx.fill();
      // Spokes
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(w.cx + Math.cos(angle) * w.r * 0.18, w.cy + Math.sin(angle) * w.r * 0.18);
        ctx.lineTo(w.cx + Math.cos(angle) * w.r * 0.52, w.cy + Math.sin(angle) * w.r * 0.52);
        ctx.strokeStyle = 'rgba(60,60,70,0.8)';
        ctx.lineWidth = 3 / scale;
        ctx.stroke();
      }
    });

    // Draw detail lines
    if (tpl.details) {
      ctx.strokeStyle = 'rgba(60,60,80,0.5)';
      ctx.lineWidth = 1.5 / scale;
      ctx.setLineDash([4 / scale, 3 / scale]);
      const detailPath = new Path2D(tpl.details);
      ctx.stroke(detailPath);
      ctx.setLineDash([]);
    }

    // Section labels
    if (showLabels) {
      ctx.font = `bold ${14 / scale}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      tpl.sections.forEach(section => {
        // Label background
        const tw = ctx.measureText(section.label).width;
        const th = 14 / scale;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.roundRect(section.x - tw / 2 - 4 / scale, section.y - th / 2 - 3 / scale, tw + 8 / scale, th + 6 / scale, 3 / scale);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fillText(section.label, section.x, section.y);
      });
    }

    ctx.restore();

    // Store transform for hit testing
    this._tplTransform = { offX, offY, scale };
  }

  // ─── UNDO / REDO ─────────────────────────────────────────────────────────────

  saveState() {
    const state = {
      canvas: JSON.stringify(this.canvas.toJSON(['layerId', '_baseOpacity', '_templateMarker', '_isFillResult', '_layerBlend'])),
      layers: this.layers.serialize()
    };
    this._undoStack.push(state);
    if (this._undoStack.length > MAX_UNDO) this._undoStack.shift();
    this._redoStack = [];
  }

  undo() {
    if (this._undoStack.length <= 1) return;
    const current = this._undoStack.pop();
    this._redoStack.push(current);
    const prev = this._undoStack[this._undoStack.length - 1];
    this._restoreState(prev);
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
    });
  }

  // ─── EXPORT ──────────────────────────────────────────────────────────────────

  _initExport() {
    document.getElementById('btn-export').addEventListener('click', () => this._exportPNG());
  }

  _exportPNG() {
    const sizeEl = document.getElementById('export-size');
    const exportH = parseInt(sizeEl.value); // 512, 1024, or 2048
    const exportW = exportH * 2;
    const multiplier = exportW / CANVAS_W;

    const dataURL = this.canvas.toDataURL({
      format: 'png',
      multiplier: multiplier,
      quality: 1,
    });

    const a = document.createElement('a');
    a.href = dataURL;
    const templateName = TEMPLATES[this._currentTemplate]?.name.replace(/\s+/g, '_') || 'livery';
    a.download = `livery_${templateName}_${exportW}x${exportH}.png`;
    a.click();
  }

  // ─── IMAGE UPLOAD ─────────────────────────────────────────────────────────────

  _initImageUpload() {
    const input = document.getElementById('image-upload');
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      fabric.Image.fromURL(url, (img) => {
        // Scale large images down to fit
        const maxDim = 600;
        if (img.width > maxDim || img.height > maxDim) {
          const ratio = Math.min(maxDim / img.width, maxDim / img.height);
          img.scale(ratio);
        }
        img.set({
          left: CANVAS_W / 2 - (img.width * (img.scaleX || 1)) / 2,
          top: CANVAS_H / 2 - (img.height * (img.scaleY || 1)) / 2,
          selectable: true
        });
        this.layers.assignToActive(img);
        this.canvas.add(img);
        this.canvas.setActiveObject(img);
        this.canvas.renderAll();
        this.saveState();
        URL.revokeObjectURL(url);
      });
      input.value = '';
      // Switch to select after adding image
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
      this._undoStack = [];
      this._redoStack = [];
      this.layers.layers = [];
      this.layers.add('Layer 1');
      this.canvas.renderAll();
      this.saveState();
    });
  }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
  window.app = new LiveryApp();
});
