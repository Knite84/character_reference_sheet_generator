/**
 * RefSheet Studio - Media Pool Manager
 * 
 * Handles client-side file ingestion, local blob URLs, thumbnail rendering,
 * and drag-and-drop integration.
 */

class MediaPool {
  constructor(options = {}) {
    this.mediaItems = new Map(); // id -> mediaObject
    this.onMediaChange = options.onMediaChange || (() => {});

    // Elements
    this.dropzoneEl = document.getElementById('uploadDropzone');
    this.fileInputEl = document.getElementById('fileInput');
    this.mediaListEl = document.getElementById('mediaList');
    this.mediaCountEl = document.getElementById('mediaCount');
    this.btnClearMediaEl = document.getElementById('btnClearMedia');
    this.emptyMediaMsgEl = document.getElementById('emptyMediaMsg');

    this.initEventListeners();
  }

  initEventListeners() {
    // File input change
    this.fileInputEl.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.handleFiles(Array.from(e.target.files));
        this.fileInputEl.value = ''; // reset so same files can be re-added if needed
      }
    });

    // Dropzone Drag & Drop
    ['dragenter', 'dragover'].forEach(eventName => {
      this.dropzoneEl.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzoneEl.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      this.dropzoneEl.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzoneEl.classList.remove('drag-over');
      }, false);
    });

    this.dropzoneEl.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt.files && dt.files.length > 0) {
        this.handleFiles(Array.from(dt.files));
      }
    });

    // Clear all media button
    this.btnClearMediaEl.addEventListener('click', () => {
      if (this.mediaItems.size > 0 && confirm('Remove all photos from the media library?')) {
        this.clearAll();
      }
    });
  }

  async handleFiles(files, { showToastMsg = true } = {}) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      window.app?.showToast('Please upload valid image files.');
      return [];
    }

    const addedIds = [];
    for (const file of imageFiles) {
      const mediaId = 'media_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      const blobUrl = URL.createObjectURL(file);

      // Load Image to get dimensions
      const img = new Image();
      img.src = blobUrl;

      await new Promise((resolve) => {
        img.onload = () => {
          const mediaObj = {
            id: mediaId,
            name: file.name,
            size: file.size,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            aspect: img.naturalWidth / img.naturalHeight,
            blobUrl: blobUrl,
            imgElement: img
          };
          this.mediaItems.set(mediaId, mediaObj);
          addedIds.push(mediaId);
          resolve();
        };
        img.onerror = () => {
          console.warn('Failed to load image:', file.name);
          resolve();
        };
      });
    }

    this.render();
    this.onMediaChange();

    if (showToastMsg && addedIds.length > 0) {
      window.app?.showToast(`Added ${addedIds.length} photo${addedIds.length > 1 ? 's' : ''}`);
    }

    // Return IDs of successfully ingested images so callers can auto-place them
    return addedIds;
  }

  getMedia(id) {
    return this.mediaItems.get(id);
  }

  removeMedia(id) {
    const item = this.mediaItems.get(id);
    if (item) {
      URL.revokeObjectURL(item.blobUrl);
      this.mediaItems.delete(id);
      this.render();
      this.onMediaChange();
    }
  }

  clearAll() {
    this.mediaItems.forEach(item => URL.revokeObjectURL(item.blobUrl));
    this.mediaItems.clear();
    this.render();
    this.onMediaChange();
  }

  render() {
    const count = this.mediaItems.size;
    this.mediaCountEl.textContent = `${count} photo${count === 1 ? '' : 's'}`;
    this.btnClearMediaEl.style.display = count > 0 ? 'inline-flex' : 'none';

    // Clear existing cards
    this.mediaListEl.innerHTML = '';

    if (count === 0) {
      this.mediaListEl.appendChild(this.emptyMediaMsgEl);
      return;
    }

    this.mediaItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'media-card';
      card.setAttribute('draggable', 'true');
      card.dataset.mediaId = item.id;
      card.title = `${item.name} (${item.naturalWidth} x ${item.naturalHeight}px)\nDrag into any sheet well`;

      // Thumbnail Image
      const img = document.createElement('img');
      img.src = item.blobUrl;
      img.alt = item.name;

      // Card Meta info
      const info = document.createElement('div');
      info.className = 'media-card-info';
      info.textContent = `${item.naturalWidth}x${item.naturalHeight}`;

      // Delete Button
      const removeBtn = document.createElement('button');
      removeBtn.className = 'media-card-remove';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = 'Remove photo from library';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeMedia(item.id);
      });

      // Drag start / end handlers
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'copyMove';
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.setData('application/x-refsheet-media', item.id);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });

      card.appendChild(img);
      card.appendChild(info);
      card.appendChild(removeBtn);
      this.mediaListEl.appendChild(card);
    });
  }
}
