/**
 * RefSheet Studio - Main Application Controller
 */

class App {
  constructor() {
    this.mediaPool = null;
    this.wellManager = null;
    this.exporter = null;

    this.currentTemplateId = 'minimal';

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
    this.toastEl = document.getElementById('toast');

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

    // 2. Bind Navigation & Actions
    this.bindEvents();

    // 3. Set Initial Template
    this.setTemplate('minimal');

    // 4. Initial layout calculation & setup resize observer
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
        this.btnExportEl.disabled = true;
        this.exportBtnTextEl.textContent = 'Rendering High-Res...';

        // Allow UI to repaint
        await new Promise(r => setTimeout(r, 50));

        const result = await this.exporter.exportSheet(format);
        this.showToast(`Saved ${result.filename} (${result.width}x${result.height}px)!`);
      } catch (err) {
        console.error('Export failed:', err);
        this.showToast('Export failed: ' + err.message);
      } finally {
        this.btnExportEl.disabled = false;
        this.exportBtnTextEl.textContent = originalText;
      }
    });
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
