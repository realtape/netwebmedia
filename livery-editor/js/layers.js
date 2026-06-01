class Layer {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.visible = true;
    this.locked = false;
    this.opacity = 100;
    this.blendMode = 'normal';
    // Fabric objects on this layer (tracked by custom .layerId property)
  }
}

class LayerManager {
  constructor(app) {
    this.app = app;
    this.layers = [];
    this.activeId = null;
    this._nextId = 1;
    this._el = document.getElementById('layers-list');
    this._opacitySlider = document.getElementById('layer-opacity');
    this._opacityVal = document.getElementById('layer-opacity-val');
    this._blendSelect = document.getElementById('layer-blend');
    this._sbLayer = document.getElementById('sb-layer');

    document.getElementById('btn-layer-add').addEventListener('click', () => this.add());
    document.getElementById('btn-layer-dup').addEventListener('click', () => this.duplicate());
    document.getElementById('btn-layer-del').addEventListener('click', () => this.remove());
    document.getElementById('btn-layer-up').addEventListener('click', () => this.moveUp());
    document.getElementById('btn-layer-down').addEventListener('click', () => this.moveDown());

    this._opacitySlider.addEventListener('input', () => {
      const layer = this.active();
      if (!layer) return;
      layer.opacity = parseInt(this._opacitySlider.value);
      this._opacityVal.textContent = layer.opacity + '%';
      this._applyLayerOpacity(layer);
    });

    this._blendSelect.addEventListener('change', () => {
      const layer = this.active();
      if (!layer) return;
      layer.blendMode = this._blendSelect.value;
      this._applyLayerBlend(layer);
    });
  }

  add(name) {
    const id = 'layer_' + (this._nextId++);
    name = name || ('Layer ' + this._nextId);
    const layer = new Layer(id, name);
    this.layers.unshift(layer); // new layers go on top
    this.setActive(id);
    this.render();
    return layer;
  }

  duplicate() {
    const layer = this.active();
    if (!layer) return;
    const newLayer = this.add(layer.name + ' copy');
    // Copy all Fabric objects from this layer
    const canvas = this.app.canvas;
    const objs = canvas.getObjects().filter(o => o.layerId === layer.id);
    objs.forEach(obj => {
      obj.clone(cloned => {
        cloned.layerId = newLayer.id;
        cloned.set({ left: obj.left + 10, top: obj.top + 10 });
        canvas.add(cloned);
      });
    });
    canvas.renderAll();
  }

  remove() {
    if (this.layers.length <= 1) return; // keep at least one layer
    const layer = this.active();
    if (!layer) return;
    // Remove all objects on this layer from canvas
    const canvas = this.app.canvas;
    const toRemove = canvas.getObjects().filter(o => o.layerId === layer.id);
    toRemove.forEach(o => canvas.remove(o));
    const idx = this.layers.findIndex(l => l.id === layer.id);
    this.layers.splice(idx, 1);
    // Activate adjacent layer
    const newActive = this.layers[Math.max(0, idx - 1)];
    this.setActive(newActive.id);
    this.render();
    canvas.renderAll();
  }

  moveUp() {
    const idx = this._activeIndex();
    if (idx <= 0) return;
    [this.layers[idx], this.layers[idx - 1]] = [this.layers[idx - 1], this.layers[idx]];
    this._syncZOrder();
    this.render();
  }

  moveDown() {
    const idx = this._activeIndex();
    if (idx >= this.layers.length - 1) return;
    [this.layers[idx], this.layers[idx + 1]] = [this.layers[idx + 1], this.layers[idx]];
    this._syncZOrder();
    this.render();
  }

  setActive(id) {
    this.activeId = id;
    const layer = this.active();
    if (layer) {
      this._opacitySlider.value = layer.opacity;
      this._opacityVal.textContent = layer.opacity + '%';
      this._blendSelect.value = layer.blendMode;
      this._sbLayer.textContent = layer.name;
    }
    this.render();
  }

  active() {
    return this.layers.find(l => l.id === this.activeId) || null;
  }

  _activeIndex() {
    return this.layers.findIndex(l => l.id === this.activeId);
  }

  // Move canvas objects to match layer z-order (layers[0] = topmost)
  _syncZOrder() {
    const canvas = this.app.canvas;
    // Build ordered list of all objects by layer order
    [...this.layers].reverse().forEach((layer, zIdx) => {
      const objs = canvas.getObjects().filter(o => o.layerId === layer.id);
      objs.forEach(obj => {
        canvas.bringToFront(obj); // rough ordering
      });
    });
    canvas.renderAll();
  }

  _applyLayerOpacity(layer) {
    const canvas = this.app.canvas;
    const opacity = layer.opacity / 100;
    canvas.getObjects().filter(o => o.layerId === layer.id).forEach(o => {
      o.set('opacity', opacity * (o._baseOpacity ?? 1));
    });
    canvas.renderAll();
    this.render();
  }

  _applyLayerBlend(layer) {
    // Fabric.js doesn't support per-group blend modes easily,
    // but we apply it to each object for supported modes
    const canvas = this.app.canvas;
    canvas.getObjects().filter(o => o.layerId === layer.id).forEach(o => {
      // Store blend mode for reference
      o._layerBlend = layer.blendMode;
    });
  }

  toggleVisibility(id) {
    const layer = this.layers.find(l => l.id === id);
    if (!layer) return;
    layer.visible = !layer.visible;
    const canvas = this.app.canvas;
    canvas.getObjects().filter(o => o.layerId === id).forEach(o => {
      o.set('visible', layer.visible);
    });
    canvas.renderAll();
    this.render();
  }

  toggleLock(id) {
    const layer = this.layers.find(l => l.id === id);
    if (!layer) return;
    layer.locked = !layer.locked;
    const canvas = this.app.canvas;
    canvas.getObjects().filter(o => o.layerId === id).forEach(o => {
      o.set({
        selectable: !layer.locked,
        evented: !layer.locked
      });
    });
    this.render();
  }

  // Assign a Fabric object to the active layer
  assignToActive(obj) {
    const layer = this.active();
    if (layer) {
      obj.layerId = layer.id;
      obj._baseOpacity = 1;
    }
  }

  render() {
    this._el.innerHTML = '';
    this.layers.forEach(layer => {
      const item = document.createElement('div');
      item.className = 'layer-item' + (layer.id === this.activeId ? ' active' : '');
      item.dataset.id = layer.id;

      const vis = document.createElement('div');
      vis.className = 'layer-vis';
      vis.textContent = layer.visible ? '👁' : '🚫';
      vis.title = layer.visible ? 'Hide layer' : 'Show layer';
      vis.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleVisibility(layer.id);
      });

      const thumb = document.createElement('div');
      thumb.className = 'layer-thumb';
      thumb.style.background = layer.visible ? '#333' : '#1a1a1a';

      const nameEl = document.createElement('div');
      nameEl.className = 'layer-name';
      nameEl.textContent = layer.name;
      nameEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        const input = document.createElement('input');
        input.value = layer.name;
        nameEl.textContent = '';
        nameEl.appendChild(input);
        input.focus();
        input.select();
        const done = () => {
          layer.name = input.value.trim() || layer.name;
          this.render();
          if (layer.id === this.activeId) this._sbLayer.textContent = layer.name;
        };
        input.addEventListener('blur', done);
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') done();
          if (e.key === 'Escape') this.render();
        });
      });

      const opEl = document.createElement('div');
      opEl.className = 'val';
      opEl.style.fontSize = '10px';
      opEl.textContent = layer.opacity + '%';

      const lock = document.createElement('div');
      lock.className = 'layer-lock';
      lock.textContent = layer.locked ? '🔒' : '🔓';
      lock.title = layer.locked ? 'Unlock' : 'Lock';
      lock.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleLock(layer.id);
      });

      // Restore thumbnail if available
      if (this._thumbDataURL) {
        thumb.style.backgroundImage = `url(${this._thumbDataURL})`;
        thumb.style.backgroundSize = 'cover';
        thumb.style.backgroundPosition = 'center';
      }

      item.appendChild(vis);
      item.appendChild(thumb);
      item.appendChild(nameEl);
      item.appendChild(opEl);
      item.appendChild(lock);

      item.addEventListener('click', () => this.setActive(layer.id));
      this._el.appendChild(item);
    });
  }

  // Update all layer thumbnails with a fresh composite snapshot
  updateThumbnails(dataURL) {
    this._thumbDataURL = dataURL;
    document.querySelectorAll('.layer-thumb').forEach(el => {
      el.style.backgroundImage = `url(${dataURL})`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    });
  }

  // Serialize all layers for undo/redo
  serialize() {
    return this.layers.map(l => ({
      id: l.id, name: l.name, visible: l.visible,
      locked: l.locked, opacity: l.opacity, blendMode: l.blendMode
    }));
  }

  // Restore layers from serialized state
  restore(data) {
    this.layers = data.map(d => {
      const l = new Layer(d.id, d.name);
      l.visible = d.visible;
      l.locked = d.locked;
      l.opacity = d.opacity;
      l.blendMode = d.blendMode;
      return l;
    });
    const activeExists = this.layers.find(l => l.id === this.activeId);
    if (!activeExists && this.layers.length) this.setActive(this.layers[0].id);
    this.render();
  }
}
