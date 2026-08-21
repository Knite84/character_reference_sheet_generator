/**
 * RefSheet Studio - Content Well Renderer & Interaction Manager
 * 
 * Manages pan, zoom, drag-and-drop, swapping, and rendering of individual wells.
 */

class WellManager {
  constructor(options = {}) {
    this.containerEl = document.getElementById('collageBoard');
    this.mediaPool = options.mediaPool;
    this.onStateChange = options.onStateChange || (() => {});

    this.currentTemplate = null;
    // Map of slotId -> { mediaId, panX, panY, zoom, element, canvas, ctx }
    this.wellStates = new Map();

    // Drag-panning tracking
    this.activePan = null; // { slotId, startX, startY, origPanX, origPanY }
    this.initGlobalEvents();
  }

  initGlobalEvents() {
    // Global pointer move & up for smooth panning even if mouse leaves the well
    window.addEventListener('pointermove', (e) => {
      if (!this.activePan) return;
      const { slotId, startX, startY, origPanX, origPanY } = this.activePan;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const state = this.wellStates.get(slotId);
      if (state) {
        state.panX = origPanX + dx;
        state.panY = origPanY + dy;
        this.renderWell(slotId);
      }
    });

    window.addEventListener('pointerup', () => {
      if (this.activePan) {
        const state = this.wellStates.get(this.activePan.slotId);
        if (state && state.element) {
          const contentEl = state.element.querySelector('.well-content');
          if (contentEl) contentEl.classList.remove('is-panning');
        }
        this.activePan = null;
        this.onStateChange();
      }
    });
  }

  setTemplate(template) {
    this.currentTemplate = template;
    this.containerEl.setAttribute('data-template', template.id);

    // Save previous assigned media if we can transfer to matching slots
    const prevMediaMap = new Map();
    this.wellStates.forEach((state, slotId) => {
      if (state.mediaId) prevMediaMap.set(slotId, state);
    });

    // Clear board and state
    this.containerEl.innerHTML = '';
    this.wellStates.clear();

    // Create well elements for each slot in template
    template.slots.forEach((slot, index) => {
      // Check if we can preserve media from previous template slot with same ID or same index
      let existingState = prevMediaMap.get(slot.id);
      if (!existingState) {
        // Try fallback by index if switching templates
        const prevEntries = Array.from(prevMediaMap.values());
        if (prevEntries[index]) {
          existingState = prevEntries[index];
        }
      }

      const wellState = {
        slotId: slot.id,
        label: slot.label,
        aspect: slot.aspect,
        mediaId: existingState ? existingState.mediaId : null,
        panX: existingState ? existingState.panX : 0,
        panY: existingState ? existingState.panY : 0,
        zoom: existingState ? existingState.zoom : 1.0,
        element: null,
        canvas: null,
        ctx: null,
        unitBounds: slot.unitBounds
      };

      this.wellStates.set(slot.id, wellState);
      const wellEl = this.createWellElement(slot, wellState);
      wellState.element = wellEl;
      this.containerEl.appendChild(wellEl);
    });

    // Initial render of all wells
    this.wellStates.forEach((_, slotId) => {
      this.renderWell(slotId);
    });

    this.onStateChange();
  }

  createWellElement(slot, wellState) {
    const slotEl = document.createElement('div');
    slotEl.className = 'well-slot' + (wellState.mediaId ? '' : ' is-empty');
    slotEl.dataset.slotId = slot.id;

    // 1. Empty state placeholder
    const emptyEl = document.createElement('div');
    emptyEl.className = 'well-empty';
    emptyEl.innerHTML = `
      <div class="well-empty-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
      <span class="well-label-badge">${slot.label}</span>
      <span class="well-hint">Drag photo here</span>
    `;

    // 2. Populated Canvas container
    const contentEl = document.createElement('div');
    contentEl.className = 'well-content';

    const canvas = document.createElement('canvas');
    canvas.className = 'well-canvas';
    wellState.canvas = canvas;
    wellState.ctx = canvas.getContext('2d');
    contentEl.appendChild(canvas);

    // 3. Well Overlay Controls (Tag, Re-center, Move/Swap drag handle, Clear, Zoom slider)
    const overlayEl = document.createElement('div');
    overlayEl.className = 'well-overlay';

    // Top Bar in Overlay
    const topOverlay = document.createElement('div');
    topOverlay.className = 'well-overlay-top';

    const tagEl = document.createElement('span');
    tagEl.className = 'well-tag';
    tagEl.textContent = slot.label;

    const actionsGroup = document.createElement('div');
    actionsGroup.className = 'well-top-actions';

    // Recenter button
    const btnRecenter = document.createElement('button');
    btnRecenter.className = 'btn-well-action';
    btnRecenter.title = 'Re-center & reset zoom';
    btnRecenter.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="2" x2="12" y2="6"></line>
        <line x1="12" y1="18" x2="12" y2="22"></line>
        <line x1="2" y1="12" x2="6" y2="12"></line>
        <line x1="18" y1="12" x2="22" y2="12"></line>
      </svg>
    `;
    btnRecenter.addEventListener('click', (e) => {
      e.stopPropagation();
      this.recenterWell(slot.id);
    });

    // Move/Swap Drag Handle
    const btnSwapHandle = document.createElement('div');
    btnSwapHandle.className = 'btn-well-action action-drag-handle';
    btnSwapHandle.title = 'Drag to move or swap with another well';
    btnSwapHandle.setAttribute('draggable', 'true');
    btnSwapHandle.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="5 9 2 12 5 15"></polyline>
        <polyline points="9 5 12 2 15 5"></polyline>
        <polyline points="15 19 12 22 9 19"></polyline>
        <polyline points="19 9 22 12 19 15"></polyline>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <line x1="12" y1="2" x2="12" y2="22"></line>
      </svg>
    `;
    btnSwapHandle.addEventListener('dragstart', (e) => {
      e.stopPropagation();
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', slot.id);
      e.dataTransfer.setData('application/x-refsheet-slot', slot.id);
    });

    // Clear Well Button
    const btnClear = document.createElement('button');
    btnClear.className = 'btn-well-action action-remove';
    btnClear.title = 'Remove photo from this well';
    btnClear.innerHTML = '&times;';
    btnClear.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearWell(slot.id);
    });

    actionsGroup.appendChild(btnRecenter);
    actionsGroup.appendChild(btnSwapHandle);
    actionsGroup.appendChild(btnClear);

    topOverlay.appendChild(tagEl);
    topOverlay.appendChild(actionsGroup);

    // Bottom Bar in Overlay (Floating Zoom Bar)
    const bottomOverlay = document.createElement('div');
    bottomOverlay.className = 'well-overlay-bottom';

    const zoomBar = document.createElement('div');
    zoomBar.className = 'well-zoom-bar';

    const btnZoomOut = document.createElement('button');
    btnZoomOut.className = 'btn-zoom-step';
    btnZoomOut.innerHTML = '&minus;';
    btnZoomOut.title = 'Zoom out';

    const zoomSlider = document.createElement('input');
    zoomSlider.type = 'range';
    zoomSlider.min = '1.0';
    zoomSlider.max = '4.0';
    zoomSlider.step = '0.05';
    zoomSlider.value = wellState.zoom.toString();
    zoomSlider.className = 'zoom-slider';
    zoomSlider.title = 'Adjust zoom';

    const zoomLabel = document.createElement('span');
    zoomLabel.textContent = `${Math.round(wellState.zoom * 100)}%`;

    const btnZoomIn = document.createElement('button');
    btnZoomIn.className = 'btn-zoom-step';
    btnZoomIn.innerHTML = '&#43;';
    btnZoomIn.title = 'Zoom in';

    btnZoomOut.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustZoom(slot.id, -0.15, zoomSlider, zoomLabel);
    });

    btnZoomIn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustZoom(slot.id, 0.15, zoomSlider, zoomLabel);
    });

    zoomSlider.addEventListener('input', (e) => {
      e.stopPropagation();
      const val = parseFloat(e.target.value);
      wellState.zoom = val;
      zoomLabel.textContent = `${Math.round(val * 100)}%`;
      this.renderWell(slot.id);
      this.onStateChange();
    });

    zoomBar.appendChild(btnZoomOut);
    zoomBar.appendChild(zoomSlider);
    zoomBar.appendChild(btnZoomIn);
    zoomBar.appendChild(zoomLabel);
    bottomOverlay.appendChild(zoomBar);

    overlayEl.appendChild(topOverlay);
    overlayEl.appendChild(bottomOverlay);

    // ==========================================
    // Interaction Handlers (Pan, Wheel Zoom, Drop)
    // ==========================================

    // Pointer-down for Panning
    contentEl.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || !wellState.mediaId) return;
      e.preventDefault();
      contentEl.classList.add('is-panning');
      this.activePan = {
        slotId: slot.id,
        startX: e.clientX,
        startY: e.clientY,
        origPanX: wellState.panX,
        origPanY: wellState.panY
      };
    });

    // Wheel for zooming
    slotEl.addEventListener('wheel', (e) => {
      if (!wellState.mediaId) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      this.adjustZoom(slot.id, delta, zoomSlider, zoomLabel);
    }, { passive: false });

    // Drag-and-drop targets for Media Pool & Slot swapping
    slotEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      slotEl.classList.add('drag-target-hover');
    });

    slotEl.addEventListener('dragleave', () => {
      slotEl.classList.remove('drag-target-hover');
    });

    slotEl.addEventListener('drop', (e) => {
      e.preventDefault();
      slotEl.classList.remove('drag-target-hover');

      // Check if dropped from Media Pool
      const mediaId = e.dataTransfer.getData('application/x-refsheet-media') || e.dataTransfer.getData('text/plain');
      const sourceSlotId = e.dataTransfer.getData('application/x-refsheet-slot');

      if (sourceSlotId && sourceSlotId !== slot.id) {
        // Swap or move from another well!
        this.swapWells(sourceSlotId, slot.id);
      } else if (mediaId && this.mediaPool.getMedia(mediaId)) {
        // Placed from Media Pool
        this.setWellMedia(slot.id, mediaId);
      }
    });

    slotEl.appendChild(emptyEl);
    slotEl.appendChild(contentEl);
    slotEl.appendChild(overlayEl);

    return slotEl;
  }

  adjustZoom(slotId, delta, sliderEl, labelEl) {
    const state = this.wellStates.get(slotId);
    if (!state) return;

    let newZoom = Math.min(4.0, Math.max(1.0, state.zoom + delta));
    state.zoom = Math.round(newZoom * 100) / 100;
    if (sliderEl) sliderEl.value = state.zoom.toString();
    if (labelEl) labelEl.textContent = `${Math.round(state.zoom * 100)}%`;

    this.renderWell(slotId);
    this.onStateChange();
  }

  recenterWell(slotId) {
    const state = this.wellStates.get(slotId);
    if (!state) return;
    state.panX = 0;
    state.panY = 0;
    state.zoom = 1.0;

    const slider = state.element.querySelector('.zoom-slider');
    const label = state.element.querySelector('.well-zoom-bar span');
    if (slider) slider.value = '1.0';
    if (label) label.textContent = '100%';

    this.renderWell(slotId);
    this.onStateChange();
  }

  clearWell(slotId) {
    const state = this.wellStates.get(slotId);
    if (!state) return;
    state.mediaId = null;
    state.panX = 0;
    state.panY = 0;
    state.zoom = 1.0;

    if (state.element) {
      state.element.classList.add('is-empty');
    }
    this.renderWell(slotId);
    this.onStateChange();
  }

  clearAllWells() {
    this.wellStates.forEach((_, slotId) => {
      this.clearWell(slotId);
    });
  }

  setWellMedia(slotId, mediaId) {
    const state = this.wellStates.get(slotId);
    if (!state) return;

    state.mediaId = mediaId;
    state.panX = 0;
    state.panY = 0;
    state.zoom = 1.0;

    if (state.element) {
      state.element.classList.remove('is-empty');
      const slider = state.element.querySelector('.zoom-slider');
      const label = state.element.querySelector('.well-zoom-bar span');
      if (slider) slider.value = '1.0';
      if (label) label.textContent = '100%';
    }

    this.renderWell(slotId);
    this.onStateChange();
  }

  getEmptySlotIds() {
    const emptySlotIds = [];
    this.wellStates.forEach((state, slotId) => {
      if (!state.mediaId) emptySlotIds.push(slotId);
    });
    return emptySlotIds;
  }

  autoFillFromMediaIds(mediaIds) {
    if (!Array.isArray(mediaIds) || mediaIds.length === 0) return [];

    const emptySlotIds = this.getEmptySlotIds();
    const shuffledMedia = [...mediaIds];

    // Fisher-Yates shuffle so images land in random empty wells
    for (let i = shuffledMedia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledMedia[i], shuffledMedia[j]] = [shuffledMedia[j], shuffledMedia[i]];
    }
    for (let i = emptySlotIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [emptySlotIds[i], emptySlotIds[j]] = [emptySlotIds[j], emptySlotIds[i]];
    }

    const fillCount = Math.min(shuffledMedia.length, emptySlotIds.length);
    for (let i = 0; i < fillCount; i++) {
      this.setWellMedia(emptySlotIds[i], shuffledMedia[i]);
    }

    return fillCount;
  }

  swapWells(slotAId, slotBId) {
    const stateA = this.wellStates.get(slotAId);
    const stateB = this.wellStates.get(slotBId);
    if (!stateA || !stateB) return;

    // Swap media and transforms
    const tempMedia = stateA.mediaId;
    const tempPanX = stateA.panX;
    const tempPanY = stateA.panY;
    const tempZoom = stateA.zoom;

    stateA.mediaId = stateB.mediaId;
    stateA.panX = stateB.panX;
    stateA.panY = stateB.panY;
    stateA.zoom = stateB.zoom;

    stateB.mediaId = tempMedia;
    stateB.panX = tempPanX;
    stateB.panY = tempPanY;
    stateB.zoom = tempZoom;

    // Update classes
    stateA.element.classList.toggle('is-empty', !stateA.mediaId);
    stateB.element.classList.toggle('is-empty', !stateB.mediaId);

    // Update zoom slider UI
    [stateA, stateB].forEach(st => {
      const slider = st.element.querySelector('.zoom-slider');
      const label = st.element.querySelector('.well-zoom-bar span');
      if (slider) slider.value = st.zoom.toString();
      if (label) label.textContent = `${Math.round(st.zoom * 100)}%`;
    });

    this.renderWell(slotAId);
    this.renderWell(slotBId);
    this.onStateChange();
  }

  renderWell(slotId) {
    const state = this.wellStates.get(slotId);
    if (!state || !state.canvas) return;

    const { canvas, ctx } = state;
    const rect = state.element.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Update canvas pixel dimensions to match display size exactly
    if (rect.width > 0 && rect.height > 0) {
      const targetW = Math.round(rect.width * dpr);
      const targetH = Math.round(rect.height * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
    }

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    if (!state.mediaId) return;

    const media = this.mediaPool.getMedia(state.mediaId);
    if (!media || !media.imgElement) return;

    const img = media.imgElement;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Calculate base "cover" scale
    const scaleX = width / img.naturalWidth;
    const scaleY = height / img.naturalHeight;
    const baseScale = Math.max(scaleX, scaleY);
    const finalScale = baseScale * state.zoom;

    const drawW = img.naturalWidth * finalScale;
    const drawH = img.naturalHeight * finalScale;

    // Centered coordinates + user pan offset (scaled by dpr)
    const panOffsetX = state.panX * dpr;
    const panOffsetY = state.panY * dpr;

    const drawX = (width - drawW) / 2 + panOffsetX;
    const drawY = (height - drawH) / 2 + panOffsetY;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  renderAll() {
    this.wellStates.forEach((_, slotId) => {
      this.renderWell(slotId);
    });
  }
}
