/**
 * RefSheet Studio - Main Application Controller
 */

class App {
  constructor() {
    this.mediaPool = null;
    this.wellManager = null;
    this.exporter = null;

    this.currentTemplateId = 'minimal';

    // Gutter Configuration
    this.gutterSize = 8;
    this.gutterColor = '#dedede';

    // UI Elements
    this.templateSelectorEl = document.getElementById('templateSelector');
    this.btnClearCollageEl = document.getElementById('btnClearCollage');
    this.btnExportEl = document.getElementById('btnExport');
    this.exportBtnTextEl = document.getElementById('exportBtnText');
    this.exportFormatEl = document.getElementById('exportFormat');
    this.workspaceViewportEl = document.getElementById('workspaceViewport');
    this.collageBoardEl = document.getElementById('collageBoard');
    this.statusPresetNameEl = document.getElementById('statusPresetName');
    this.statusExportResEl = document.getElementById('statusExportRes');
    this.statusGutterDisplayEl = document.getElementById('statusGutterDisplay');
    this.toastEl = document.getElementById('toast');

    // Gutter Controls UI
    this.btnGutterSettingsEl = document.getElementById('btnGutterSettings');
    this.gutterDropdownEl = document.getElementById('gutterDropdown');
    this.gutterWidthSliderEl = document.getElementById('gutterWidthSlider');
    this.gutterWidthValEl = document.getElementById('gutterWidthVal');
    this.gutterStatusTextEl = document.getElementById('gutterStatusText');
    this.gutterColorPreviewEl = document.getElementById('gutterColorPreview');
    this.gutterColorPickerEl = document.getElementById('gutterColorPicker');
    this.gutterHexInputEl = document.getElementById('gutterHexInput');
    this.btnResetGutterEl = document.getElementById('btnResetGutter');

    this.init();
  }

  init() {
    // 1. Initialize Subsystems
    this.mediaPool = new MediaPool({
      onMediaChange: () => {
        // Re-render wells if images were removed or updated
        this.wellManager.renderAll();
      }
    });

    this.wellManager = new WellManager({
      mediaPool: this.mediaPool,
      onStateChange: () => {}
    });

    this.exporter = new RefSheetExporter(this.wellManager, this.mediaPool);

    // 2. Apply initial gutter CSS variables
    this.applyGutterSettings();

    // 3. Bind Navigation & Actions
    this.bindEvents();

    // 4. Set Initial Template
    this.setTemplate('minimal');

    // 5. Initial layout calculation & setup resize observer
    this.updateBoardDimensions();
    window.addEventListener('resize', () => {
      this.updateBoardDimensions();
      this.wellManager.renderAll();
    });

    const resizeObserver = new ResizeObserver(() => {
      this.updateBoardDimensions();
      this.wellManager.renderAll();
    });
    resizeObserver.observe(this.workspaceViewportEl);

    // Provide global reference for inline handlers
    window.app = this;
  }

  bindEvents() {
    // Gutter Settings Dropdown toggle
    this.btnGutterSettingsEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.gutterDropdownEl.classList.toggle('show');
    });

    // Close gutter dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.gutterDropdownEl.contains(e.target) && !this.btnGutterSettingsEl.contains(e.target)) {
        this.gutterDropdownEl.classList.remove('show');
      }
    });

    // Gutter Width Slider
    this.gutterWidthSliderEl.addEventListener('input', (e) => {
      this.gutterSize = parseInt(e.target.value, 10);
      this.applyGutterSettings();
      this.wellManager.renderAll();
    });

    // Gutter Color Picker Input (Native Color Wheel / Dialog)
    this.gutterColorPickerEl.addEventListener('input', (e) => {
      this.gutterColor = e.target.value.toLowerCase();
      this.gutterHexInputEl.value = this.gutterColor;
      this.applyGutterSettings();
    });

    // Gutter Hex Text Input
    this.gutterHexInputEl.addEventListener('input', (e) => {
      let hex = e.target.value.trim();
      if (!hex.startsWith('#')) hex = '#' + hex;
      if (/^#[0-9A-F]{6}$/i.test(hex)) {
        this.gutterColor = hex.toLowerCase();
        this.gutterColorPickerEl.value = this.gutterColor;
        this.applyGutterSettings();
      }
    });

    // Color Swatch buttons
    const swatchBtns = this.gutterDropdownEl.querySelectorAll('.color-swatch-btn');
    swatchBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        if (color) {
          this.gutterColor = color.toLowerCase();
          this.gutterColorPickerEl.value = this.gutterColor;
          this.gutterHexInputEl.value = this.gutterColor;
          this.applyGutterSettings();
        }
      });
    });

    // Reset Gutter to default button (8px, #dedede)
    if (this.btnResetGutterEl) {
      this.btnResetGutterEl.addEventListener('click', () => {
        this.gutterSize = 8;
        this.gutterColor = '#dedede';
        this.gutterWidthSliderEl.value = '8';
        this.gutterColorPickerEl.value = '#dedede';
        this.gutterHexInputEl.value = '#dedede';
        this.applyGutterSettings();
        this.wellManager.renderAll();
        this.showToast('Gutter reset to default (8px #dedede)');
      });
    }

    // Template switcher buttons
    const tabButtons = this.templateSelectorEl.querySelectorAll('.template-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const templateId = btn.dataset.template;
        if (templateId && templateId !== this.currentTemplateId) {
          tabButtons.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
          this.setTemplate(templateId);
        }
      });
    });

    // Reset collage wells
    this.btnClearCollageEl.addEventListener('click', () => {
      const hasMediaInWells = Array.from(this.wellManager.wellStates.values()).some(st => !!st.mediaId);
      if (!hasMediaInWells) {
        this.showToast('Wells are already empty.');
        return;
      }
      if (confirm('Clear all images from the reference sheet wells? (Uploaded photos in library will remain intact)')) {
        this.wellManager.clearAllWells();
        this.showToast('Cleared reference sheet wells.');
      }
    });

    // Export Sheet Button
    this.btnExportEl.addEventListener('click', async () => {
      const format = this.exportFormatEl.value;
      const originalText = this.exportBtnTextEl.textContent;

      try {
        let fileHandle = null;

        if (this.exporter.supportsSaveDialog()) {
          // Open the native "Save As" dialog immediately (while click activation is fresh)
          this.btnExportEl.disabled = true;
          this.exportBtnTextEl.textContent = 'Choose save location...';

          try {
            const suggestedName = this.exporter.buildSuggestedFilename(format);
            fileHandle = await this.exporter.requestSaveHandle(suggestedName, format);
          } catch (err) {
            if (err && err.name === 'AbortError') {
              return; // User cancelled the dialog
            }
            console.warn('Save dialog unavailable, falling back to download:', err);
          }
        }

        this.btnExportEl.disabled = true;
        this.exportBtnTextEl.textContent = 'Rendering High-Res...';

        // Allow UI to repaint
        await new Promise(r => setTimeout(r, 50));

        const result = await this.exporter.exportSheet(format, undefined, { fileHandle });
        this.showToast(`Saved ${result.filename} (${result.width}x${result.height}px)!`);
      } catch (err) {
        console.error('Export failed:', err);
        this.showToast('Export failed: ' + err.message);
      } finally {
        this.btnExportEl.disabled = false;
        this.exportBtnTextEl.textContent = originalText;
      }
    });

    // External file drag & drop (e.g. from Windows Explorer) onto the workspace.
    // All images are added to the Media Library; empty wells are auto-filled at random.
    this.externalDragDepth = 0;
    const hasFiles = (e) => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');

    ['dragenter', 'dragover'].forEach(eventName => {
      this.workspaceViewportEl.addEventListener(eventName, (e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (eventName === 'dragenter') this.externalDragDepth++;
        this.workspaceViewportEl.classList.add('file-drop-hover');
      });
    });

    this.workspaceViewportEl.addEventListener('dragleave', () => {
      this.externalDragDepth = Math.max(0, this.externalDragDepth - 1);
      if (this.externalDragDepth === 0) {
        this.workspaceViewportEl.classList.remove('file-drop-hover');
      }
    });

    this.workspaceViewportEl.addEventListener('drop', async (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      this.externalDragDepth = 0;
      this.workspaceViewportEl.classList.remove('file-drop-hover');

      try {
        const addedIds = await this.mediaPool.handleFiles(Array.from(e.dataTransfer.files), { showToastMsg: false });
        if (addedIds.length === 0) return;

        const placedCount = this.wellManager.autoFillFromMediaIds(addedIds);
        const libraryOnlyCount = addedIds.length - placedCount;

        let msg = `Added ${addedIds.length} photo${addedIds.length > 1 ? 's' : ''}`;
        if (placedCount > 0) {
          msg += ` • ${placedCount} auto-placed into empty wells`;
          if (libraryOnlyCount > 0) msg += ` (${libraryOnlyCount} library only)`;
        } else {
          msg += ' • all wells already full';
        }
        this.showToast(msg);
      } catch (err) {
        console.error('External drop handling failed:', err);
        this.showToast('Failed to import dropped images.');
      }
    });

    // Prevent the browser from navigating/opening files dropped outside the workspace
    document.addEventListener('dragover', (e) => {
      if (hasFiles(e)) e.preventDefault();
    });
    document.addEventListener('drop', (e) => {
      if (hasFiles(e)) e.preventDefault();
    });
  }

  applyGutterSettings() {
    // Set CSS variables on collageBoard
    this.collageBoardEl.style.setProperty('--gutter-size', `${this.gutterSize}px`);
    this.collageBoardEl.style.setProperty('--gutter-color', this.gutterColor);

    // Update UI controls & labels
    this.gutterWidthValEl.textContent = `${this.gutterSize}px`;
    this.gutterStatusTextEl.textContent = `${this.gutterSize}px`;
    this.gutterColorPreviewEl.style.backgroundColor = this.gutterColor;

    // Update statusbar
    if (this.statusGutterDisplayEl) {
      this.statusGutterDisplayEl.textContent = `${this.gutterSize}px ${this.gutterColor}`;
    }
  }

  setTemplate(templateId) {
    const template = TEMPLATES[templateId];
    if (!template) return;

    this.currentTemplateId = templateId;
    this.statusPresetNameEl.textContent = template.name;
    this.statusExportResEl.textContent = `${template.exportWidth.toLocaleString()} × ${template.exportHeight.toLocaleString()} px`;

    this.wellManager.setTemplate(template);
    this.updateBoardDimensions();

    // Re-render wells after layout
    setTimeout(() => {
      this.wellManager.renderAll();
    }, 50);
  }

  updateBoardDimensions() {
    const template = TEMPLATES[this.currentTemplateId];
    if (!template) return;

    const viewportW = this.workspaceViewportEl.clientWidth - 48; // padding
    const viewportH = this.workspaceViewportEl.clientHeight - 48;

    if (viewportW <= 0 || viewportH <= 0) return;

    const targetRatio = template.aspectW / template.aspectH;
    let boardW, boardH;

    if (viewportW / viewportH > targetRatio) {
      // Viewport is wider than target ratio: constrained by height
      boardH = viewportH;
      boardW = Math.round(boardH * targetRatio);
    } else {
      // Viewport is taller than target ratio: constrained by width
      boardW = viewportW;
      boardH = Math.round(boardW / targetRatio);
    }

    this.collageBoardEl.style.width = `${boardW}px`;
    this.collageBoardEl.style.height = `${boardH}px`;
  }

  showToast(message, duration = 3200) {
    this.toastEl.textContent = message;
    this.toastEl.classList.add('show');
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, duration);
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
