class ToolManager {
  constructor(app) {
    this.app = app;
    this.current = 'select';
    this._drawing = false;
    this._shapeStart = null;
    this._shapePreview = null;
    this._gradientModal = null;
    this._initButtons();
    this._initKeyboard();
    this._initColorPickers();
    this._initSwatches();
    this._initGradientModal();
    this._initObjectProps();
  }

  _initButtons() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setTool(btn.dataset.tool);
      });
    });
  }

  _initKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      const map = { v: 'select', b: 'brush', f: 'fill', r: 'rect', c: 'circle', t: 'text', i: 'eyedropper', l: 'line' };
      if (map[e.key]) this.setTool(map[e.key]);
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); this.app.undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); this.app.redo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement === document.body) {
          this._deleteSelected();
        }
      }
    });
  }

  _deleteSelected() {
    const canvas = this.app.canvas;
    const active = canvas.getActiveObjects();
    if (active.length) {
      this.app.saveState();
      active.forEach(o => canvas.remove(o));
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }

  _initColorPickers() {
    const fgPicker = document.getElementById('color-picker-fg');
    const bgPicker = document.getElementById('color-picker-bg');
    const fgSwatch = document.getElementById('color-fg-swatch');
    const bgSwatch = document.getElementById('color-bg-swatch');

    const update = () => {
      fgSwatch.style.background = fgPicker.value;
      bgSwatch.style.background = bgPicker.value;
    };
    fgPicker.addEventListener('input', () => { update(); this._onColorChange(); });
    bgPicker.addEventListener('input', () => { update(); });

    fgSwatch.addEventListener('click', () => fgPicker.click());
    bgSwatch.addEventListener('click', () => bgPicker.click());

    document.getElementById('btn-swap-colors').addEventListener('click', () => {
      const tmp = fgPicker.value;
      fgPicker.value = bgPicker.value;
      bgPicker.value = tmp;
      update();
      this._onColorChange();
    });
    document.getElementById('btn-reset-colors').addEventListener('click', () => {
      fgPicker.value = '#FF671F';
      bgPicker.value = '#010F3B';
      update();
      this._onColorChange();
    });
    update();

    // Brush property sliders
    ['brush-size', 'brush-opacity', 'brush-softness'].forEach(id => {
      const el = document.getElementById(id);
      const valEl = document.getElementById(id + '-val');
      el.addEventListener('input', () => {
        valEl.textContent = el.value;
        this._onBrushChange();
      });
    });
  }

  _initSwatches() {
    const grid = document.getElementById('swatches-grid');
    SWATCHES.forEach(color => {
      const s = document.createElement('div');
      s.className = 'swatch';
      s.style.background = color;
      s.title = color;
      s.addEventListener('click', (e) => {
        if (e.shiftKey) {
          document.getElementById('color-picker-bg').value = color;
          document.getElementById('color-bg-swatch').style.background = color;
        } else {
          document.getElementById('color-picker-fg').value = color;
          document.getElementById('color-fg-swatch').style.background = color;
          this._onColorChange();
        }
      });
      grid.appendChild(s);
    });
  }

  _initGradientModal() {
    const modal = document.createElement('div');
    modal.id = 'gradient-modal';
    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-title">Add Gradient</div>
        <div class="modal-row">
          <label>Type</label>
          <select id="grad-type">
            <option value="linear">Linear</option>
            <option value="radial">Radial</option>
          </select>
        </div>
        <div class="modal-row">
          <label>Color 1</label>
          <input type="color" id="grad-c1" value="#FF671F">
        </div>
        <div class="modal-row">
          <label>Color 2</label>
          <input type="color" id="grad-c2" value="#010F3B">
        </div>
        <div class="modal-row">
          <label>Angle</label>
          <input type="range" id="grad-angle" min="0" max="360" value="0" style="flex:1">
          <span id="grad-angle-val" style="width:35px;text-align:right;font-size:11px">0°</span>
        </div>
        <div class="modal-row">
          <label>Apply to</label>
          <select id="grad-target">
            <option value="canvas">Full Canvas</option>
            <option value="rect">Rectangle</option>
            <option value="selected">Selected Object</option>
          </select>
        </div>
        <div class="modal-preview" id="grad-preview"></div>
        <div class="modal-btns">
          <button id="grad-cancel">Cancel</button>
          <button class="modal-ok" id="grad-apply">Apply</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this._gradientModal = modal;

    const updatePreview = () => {
      const c1 = document.getElementById('grad-c1').value;
      const c2 = document.getElementById('grad-c2').value;
      const angle = document.getElementById('grad-angle').value;
      document.getElementById('grad-angle-val').textContent = angle + '°';
      const type = document.getElementById('grad-type').value;
      const prev = document.getElementById('grad-preview');
      if (type === 'linear') {
        prev.style.background = `linear-gradient(${angle}deg, ${c1}, ${c2})`;
      } else {
        prev.style.background = `radial-gradient(circle, ${c1}, ${c2})`;
      }
    };

    ['grad-c1','grad-c2','grad-angle','grad-type'].forEach(id => {
      document.getElementById(id).addEventListener('input', updatePreview);
    });
    updatePreview();

    document.getElementById('grad-cancel').addEventListener('click', () => {
      modal.classList.remove('open');
    });
    document.getElementById('grad-apply').addEventListener('click', () => {
      this._applyGradient();
      modal.classList.remove('open');
    });
  }

  _applyGradient() {
    const c1 = document.getElementById('grad-c1').value;
    const c2 = document.getElementById('grad-c2').value;
    const angle = parseInt(document.getElementById('grad-angle').value);
    const type = document.getElementById('grad-type').value;
    const target = document.getElementById('grad-target').value;
    const canvas = this.app.canvas;
    this.app.saveState();

    const rad = (angle - 90) * Math.PI / 180;

    if (target === 'canvas') {
      // Apply gradient as a full-canvas rect
      const cw = canvas.width, ch = canvas.height;
      let gradient;
      if (type === 'linear') {
        gradient = new fabric.Gradient({
          type: 'linear',
          coords: {
            x1: cw / 2 + Math.cos(rad) * cw / 2,
            y1: ch / 2 + Math.sin(rad) * ch / 2,
            x2: cw / 2 - Math.cos(rad) * cw / 2,
            y2: ch / 2 - Math.sin(rad) * ch / 2,
          },
          colorStops: [{ offset: 0, color: c1 }, { offset: 1, color: c2 }]
        });
      } else {
        gradient = new fabric.Gradient({
          type: 'radial',
          coords: { x1: cw / 2, y1: ch / 2, r1: 0, x2: cw / 2, y2: ch / 2, r2: Math.max(cw, ch) / 2 },
          colorStops: [{ offset: 0, color: c1 }, { offset: 1, color: c2 }]
        });
      }
      const rect = new fabric.Rect({ left: 0, top: 0, width: cw, height: ch, fill: gradient, selectable: true });
      this.app.layers.assignToActive(rect);
      canvas.add(rect);
      canvas.sendToBack(rect);
    } else if (target === 'selected') {
      const obj = canvas.getActiveObject();
      if (!obj) return;
      let gradient;
      if (type === 'linear') {
        gradient = new fabric.Gradient({
          type: 'linear',
          gradientUnits: 'percentage',
          coords: { x1: 0, y1: 0, x2: 1, y2: 1 },
          colorStops: [{ offset: 0, color: c1 }, { offset: 1, color: c2 }]
        });
      } else {
        gradient = new fabric.Gradient({
          type: 'radial',
          gradientUnits: 'percentage',
          coords: { x1: 0.5, y1: 0.5, r1: 0, x2: 0.5, y2: 0.5, r2: 0.5 },
          colorStops: [{ offset: 0, color: c1 }, { offset: 1, color: c2 }]
        });
      }
      obj.set('fill', gradient);
      canvas.renderAll();
    } else {
      // Draw a rectangle to drag (just add a rect with gradient)
      const cw = canvas.width, ch = canvas.height;
      const w = cw * 0.5, h = ch * 0.5;
      let gradient;
      if (type === 'linear') {
        gradient = new fabric.Gradient({
          type: 'linear',
          coords: { x1: 0, y1: 0, x2: w, y2: h },
          colorStops: [{ offset: 0, color: c1 }, { offset: 1, color: c2 }]
        });
      } else {
        gradient = new fabric.Gradient({
          type: 'radial',
          coords: { x1: w/2, y1: h/2, r1: 0, x2: w/2, y2: h/2, r2: Math.max(w,h)/2 },
          colorStops: [{ offset: 0, color: c1 }, { offset: 1, color: c2 }]
        });
      }
      const rect = new fabric.Rect({ left: cw/4, top: ch/4, width: w, height: h, fill: gradient, selectable: true });
      this.app.layers.assignToActive(rect);
      canvas.add(rect);
      canvas.setActiveObject(rect);
    }
    canvas.renderAll();
  }

  _initObjectProps() {
    this.app.canvas.on('selection:created', () => this._renderObjProps());
    this.app.canvas.on('selection:updated', () => this._renderObjProps());
    this.app.canvas.on('selection:cleared', () => {
      document.getElementById('obj-props').innerHTML = '<div class="no-sel">No object selected</div>';
    });
  }

  _renderObjProps() {
    const canvas = this.app.canvas;
    const obj = canvas.getActiveObject();
    const el = document.getElementById('obj-props');
    if (!obj) { el.innerHTML = '<div class="no-sel">No object selected</div>'; return; }

    const makeRow = (label, input) => {
      const row = document.createElement('div');
      row.className = 'obj-row';
      const lbl = document.createElement('label');
      lbl.textContent = label;
      row.appendChild(lbl);
      row.appendChild(input);
      return row;
    };

    el.innerHTML = '';

    // X, Y
    const xInput = Object.assign(document.createElement('input'), { type: 'number', value: Math.round(obj.left) });
    const yInput = Object.assign(document.createElement('input'), { type: 'number', value: Math.round(obj.top) });
    xInput.addEventListener('change', () => { obj.set('left', parseFloat(xInput.value)); canvas.renderAll(); });
    yInput.addEventListener('change', () => { obj.set('top', parseFloat(yInput.value)); canvas.renderAll(); });
    el.appendChild(makeRow('X', xInput));
    el.appendChild(makeRow('Y', yInput));

    // W, H
    if (obj.width !== undefined) {
      const wInput = Object.assign(document.createElement('input'), { type: 'number', value: Math.round(obj.getScaledWidth()) });
      const hInput = Object.assign(document.createElement('input'), { type: 'number', value: Math.round(obj.getScaledHeight()) });
      wInput.addEventListener('change', () => { obj.scaleToWidth(parseFloat(wInput.value)); canvas.renderAll(); });
      hInput.addEventListener('change', () => { obj.scaleToHeight(parseFloat(hInput.value)); canvas.renderAll(); });
      el.appendChild(makeRow('W', wInput));
      el.appendChild(makeRow('H', hInput));
    }

    // Rotation
    const rotInput = Object.assign(document.createElement('input'), { type: 'number', value: Math.round(obj.angle) });
    rotInput.addEventListener('change', () => { obj.set('angle', parseFloat(rotInput.value)); canvas.renderAll(); });
    el.appendChild(makeRow('Rotate', rotInput));

    // Fill color (if not gradient)
    if (obj.fill && typeof obj.fill === 'string') {
      const fillInput = document.createElement('input');
      fillInput.type = 'color';
      fillInput.value = this._toHex(obj.fill);
      fillInput.addEventListener('input', () => { obj.set('fill', fillInput.value); canvas.renderAll(); });
      el.appendChild(makeRow('Fill', fillInput));
    }

    // Stroke
    if (obj.stroke !== undefined) {
      const strokeInput = document.createElement('input');
      strokeInput.type = 'color';
      strokeInput.value = this._toHex(obj.stroke || '#000000');
      strokeInput.addEventListener('input', () => { obj.set('stroke', strokeInput.value); canvas.renderAll(); });
      el.appendChild(makeRow('Stroke', strokeInput));
    }

    // Buttons row
    const btnRow = document.createElement('div');
    btnRow.className = 'obj-btn-row';

    const dupBtn = document.createElement('button');
    dupBtn.className = 'obj-btn';
    dupBtn.textContent = 'Duplicate';
    dupBtn.addEventListener('click', () => {
      obj.clone(cloned => {
        cloned.set({ left: obj.left + 15, top: obj.top + 15 });
        this.app.layers.assignToActive(cloned);
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
      });
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'obj-btn';
    delBtn.textContent = 'Delete';
    delBtn.style.color = '#e05252';
    delBtn.addEventListener('click', () => this._deleteSelected());

    const flipBtn = document.createElement('button');
    flipBtn.className = 'obj-btn';
    flipBtn.textContent = 'Flip H';
    flipBtn.addEventListener('click', () => { obj.set('flipX', !obj.flipX); canvas.renderAll(); });

    btnRow.appendChild(dupBtn);
    btnRow.appendChild(flipBtn);
    btnRow.appendChild(delBtn);
    el.appendChild(btnRow);
  }

  _toHex(color) {
    if (!color || color === 'transparent') return '#000000';
    if (color.startsWith('#')) return color.slice(0, 7);
    const c = document.createElement('canvas').getContext('2d');
    c.fillStyle = color;
    return c.fillStyle;
  }

  get fgColor() { return document.getElementById('color-picker-fg').value; }
  get bgColor() { return document.getElementById('color-picker-bg').value; }
  get brushSize() { return parseInt(document.getElementById('brush-size').value); }
  get brushOpacity() { return parseInt(document.getElementById('brush-opacity').value) / 100; }

  _onColorChange() {
    const canvas = this.app.canvas;
    if (canvas.isDrawingMode) {
      canvas.freeDrawingBrush.color = this._hexToRgba(this.fgColor, this.brushOpacity);
    }
    // Update active text/shape color
    const obj = canvas.getActiveObject();
    if (obj && this.current !== 'eyedropper') {
      if (obj.type === 'i-text' || obj.type === 'text') {
        obj.set('fill', this.fgColor);
        canvas.renderAll();
      }
    }
  }

  _onBrushChange() {
    const canvas = this.app.canvas;
    if (canvas.isDrawingMode) {
      canvas.freeDrawingBrush.width = this.brushSize;
      canvas.freeDrawingBrush.color = this._hexToRgba(this.fgColor, this.brushOpacity);
    }
  }

  _hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  setTool(name) {
    this.current = name;
    const canvas = this.app.canvas;

    // Clean up any in-progress drawing
    this._drawing = false;
    if (this._shapePreview) {
      canvas.remove(this._shapePreview);
      this._shapePreview = null;
    }
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');

    // Update button states
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === name);
    });

    // Update body class for cursor
    document.body.className = 'tool-' + name;

    // Reset canvas mode
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.getObjects().forEach(o => { if (!o._templateMarker) o.selectable = true; });

    // Update status bar
    const names = {
      select: 'Select Tool', brush: 'Brush Tool', fill: 'Fill Tool',
      gradient: 'Gradient Tool', rect: 'Rectangle Tool', circle: 'Circle Tool',
      triangle: 'Triangle Tool', line: 'Line Tool', text: 'Text Tool',
      image: 'Image Tool', eyedropper: 'Eyedropper'
    };
    document.getElementById('sb-tool').textContent = names[name] || name;

    switch (name) {
      case 'select':
        this._activateSelect(canvas); break;
      case 'brush':
        this._activateBrush(canvas); break;
      case 'fill':
        this._activateFill(canvas); break;
      case 'gradient':
        this._gradientModal.classList.add('open'); break;
      case 'rect':
        this._activateShape(canvas, 'rect'); break;
      case 'circle':
        this._activateShape(canvas, 'circle'); break;
      case 'triangle':
        this._activateShape(canvas, 'triangle'); break;
      case 'line':
        this._activateShape(canvas, 'line'); break;
      case 'text':
        this._activateText(canvas); break;
      case 'image':
        document.getElementById('image-upload').click(); break;
      case 'eyedropper':
        this._activateEyedropper(canvas); break;
    }
  }

  _activateSelect(canvas) {
    canvas.isDrawingMode = false;
    canvas.selection = true;
  }

  _activateBrush(canvas) {
    canvas.isDrawingMode = true;
    canvas.selection = false;
    const softness = parseInt(document.getElementById('brush-softness').value);

    if (softness > 0) {
      canvas.freeDrawingBrush = new fabric.CircleBrush(canvas);
    } else {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    }

    canvas.freeDrawingBrush.width = this.brushSize;
    canvas.freeDrawingBrush.color = this._hexToRgba(this.fgColor, this.brushOpacity);

    canvas.on('path:created', (e) => {
      this.app.saveState();
      this.app.layers.assignToActive(e.path);
      e.path.selectable = true;
    });
  }

  _activateFill(canvas) {
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.getObjects().forEach(o => { if (!o._templateMarker) o.selectable = false; });

    canvas.on('mouse:down', (e) => {
      const ptr = canvas.getPointer(e.e);
      this._floodFill(Math.round(ptr.x), Math.round(ptr.y));
    });
  }

  _floodFill(x, y) {
    const canvas = this.app.canvas;
    const cw = canvas.width, ch = canvas.height;
    this.app.saveState();

    // Render canvas to offscreen
    const offscreen = document.createElement('canvas');
    offscreen.width = cw;
    offscreen.height = ch;
    const ctx = offscreen.getContext('2d');
    const dataURL = canvas.toDataURL({ format: 'png', multiplier: 1 });

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, cw, ch);
      const data = imageData.data;

      const idx = (py, px) => (py * cw + px) * 4;
      const tIdx = idx(y, x);
      const targetR = data[tIdx], targetG = data[tIdx + 1], targetB = data[tIdx + 2], targetA = data[tIdx + 3];

      const fillHex = this.fgColor;
      const fillR = parseInt(fillHex.slice(1, 3), 16);
      const fillG = parseInt(fillHex.slice(3, 5), 16);
      const fillB = parseInt(fillHex.slice(5, 7), 16);

      if (targetR === fillR && targetG === fillG && targetB === fillB && targetA === 255) return;

      const tolerance = 30;
      const matchesTarget = (i) => {
        return Math.abs(data[i] - targetR) <= tolerance &&
               Math.abs(data[i+1] - targetG) <= tolerance &&
               Math.abs(data[i+2] - targetB) <= tolerance &&
               Math.abs(data[i+3] - targetA) <= tolerance;
      };

      // BFS flood fill
      const visited = new Uint8Array(cw * ch);
      const queue = [[x, y]];
      visited[y * cw + x] = 1;
      const filled = [];

      while (queue.length > 0) {
        const [px, py] = queue.shift();
        const i = idx(py, px);
        data[i] = fillR; data[i+1] = fillG; data[i+2] = fillB; data[i+3] = 255;
        filled.push([px, py]);

        const neighbors = [[px-1,py],[px+1,py],[px,py-1],[px,py+1]];
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || nx >= cw || ny < 0 || ny >= ch) continue;
          if (visited[ny * cw + nx]) continue;
          visited[ny * cw + nx] = 1;
          const ni = idx(ny, nx);
          if (matchesTarget(ni)) queue.push([nx, ny]);
        }
      }

      // Put filled imagedata back to offscreen, then add as image
      ctx.putImageData(imageData, 0, 0);
      const resultDataURL = offscreen.toDataURL();

      fabric.Image.fromURL(resultDataURL, (fabricImg) => {
        fabricImg.set({ left: 0, top: 0, selectable: true, evented: true });
        this.app.layers.assignToActive(fabricImg);
        // Remove old background if it's a fill image
        canvas.add(fabricImg);
        canvas.sendToBack(fabricImg);
        // Remove previous fill layer if exists
        const existing = canvas.getObjects().filter(o => o._isFillResult && o !== fabricImg);
        existing.forEach(o => canvas.remove(o));
        fabricImg._isFillResult = true;
        canvas.renderAll();
      });
    };
    img.src = dataURL;
  }

  _activateShape(canvas, type) {
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.getObjects().forEach(o => { if (!o._templateMarker) o.selectable = false; });

    let isDown = false, origX, origY;

    canvas.on('mouse:down', (e) => {
      if (e.e.altKey) return;
      isDown = true;
      const ptr = canvas.getPointer(e.e);
      origX = ptr.x; origY = ptr.y;

      const color = this.fgColor;
      const strokeColor = this.bgColor;

      let obj;
      if (type === 'rect') {
        obj = new fabric.Rect({ left: origX, top: origY, width: 0, height: 0, fill: color, stroke: strokeColor, strokeWidth: 2, selectable: false });
      } else if (type === 'circle') {
        obj = new fabric.Ellipse({ left: origX, top: origY, rx: 0, ry: 0, fill: color, stroke: strokeColor, strokeWidth: 2, selectable: false });
      } else if (type === 'triangle') {
        obj = new fabric.Triangle({ left: origX, top: origY, width: 0, height: 0, fill: color, stroke: strokeColor, strokeWidth: 2, selectable: false });
      } else if (type === 'line') {
        obj = new fabric.Line([origX, origY, origX, origY], { stroke: color, strokeWidth: this.brushSize, selectable: false, strokeLineCap: 'round' });
      }
      this._shapePreview = obj;
      canvas.add(obj);
    });

    canvas.on('mouse:move', (e) => {
      if (!isDown || !this._shapePreview) return;
      const ptr = canvas.getPointer(e.e);
      const w = ptr.x - origX, h = ptr.y - origY;
      const obj = this._shapePreview;
      const constrain = e.e.shiftKey;

      if (type === 'rect' || type === 'triangle') {
        const absW = Math.abs(w), absH = Math.abs(h);
        const size = constrain ? Math.max(absW, absH) : null;
        obj.set({
          left: w > 0 ? origX : origX + (size ? -size : w),
          top: h > 0 ? origY : origY + (size ? -size : h),
          width: size || absW,
          height: size || absH
        });
      } else if (type === 'circle') {
        const rx = Math.abs(w) / 2, ry = Math.abs(h) / 2;
        const r = constrain ? Math.max(rx, ry) : null;
        obj.set({
          left: w > 0 ? origX : origX + (r ? -r * 2 : w),
          top: h > 0 ? origY : origY + (r ? -r * 2 : h),
          rx: r || rx, ry: r || ry
        });
      } else if (type === 'line') {
        obj.set({ x2: ptr.x, y2: ptr.y });
      }
      obj.setCoords();
      canvas.renderAll();
    });

    canvas.on('mouse:up', () => {
      if (!this._shapePreview) return;
      isDown = false;
      const obj = this._shapePreview;
      obj.set('selectable', true);
      this.app.layers.assignToActive(obj);
      this._shapePreview = null;
      canvas.setActiveObject(obj);
      canvas.renderAll();
      this.app.saveState();
    });
  }

  _activateText(canvas) {
    canvas.isDrawingMode = false;
    canvas.selection = true;

    canvas.on('mouse:down', (e) => {
      if (canvas.getActiveObject()) return; // clicking existing object
      const ptr = canvas.getPointer(e.e);
      const text = new fabric.IText('Type here', {
        left: ptr.x,
        top: ptr.y,
        fontSize: 60,
        fill: this.fgColor,
        fontFamily: 'Inter, Arial, sans-serif',
        fontWeight: 'bold',
        selectable: true,
        editable: true
      });
      this.app.layers.assignToActive(text);
      canvas.add(text);
      canvas.setActiveObject(text);
      text.enterEditing();
      text.selectAll();
      canvas.renderAll();
      this.app.saveState();
    });
  }

  _activateEyedropper(canvas) {
    canvas.isDrawingMode = false;
    canvas.selection = false;

    canvas.on('mouse:down', (e) => {
      const ptr = canvas.getPointer(e.e);
      const x = Math.round(ptr.x), y = Math.round(ptr.y);
      const cw = canvas.width, ch = canvas.height;
      if (x < 0 || x >= cw || y < 0 || y >= ch) return;

      const dataURL = canvas.toDataURL({ format: 'png', multiplier: 1 });
      const img = new Image();
      img.onload = () => {
        const tmp = document.createElement('canvas');
        tmp.width = cw; tmp.height = ch;
        const ctx = tmp.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('');

        if (e.e.shiftKey) {
          document.getElementById('color-picker-bg').value = hex;
          document.getElementById('color-bg-swatch').style.background = hex;
        } else {
          document.getElementById('color-picker-fg').value = hex;
          document.getElementById('color-fg-swatch').style.background = hex;
        }
        // Switch back to previous tool after picking
        this.setTool('select');
      };
      img.src = dataURL;
    });
  }
}
