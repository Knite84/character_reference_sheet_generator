/**
 * RefSheet Studio - High-Resolution Export Engine
 * 
 * Composites the full reference sheet into an offscreen canvas at exact target
 * resolutions (3000x2000, 4000x2000, 3500x3500) and triggers local file download.
 */

class RefSheetExporter {
  constructor(wellManager, mediaPool) {
    this.wellManager = wellManager;
    this.mediaPool = mediaPool;
  }

  async exportSheet(format = 'png', quality = 0.95) {
    const template = this.wellManager.currentTemplate;
    if (!template) {
      throw new Error('No active template found.');
    }

    const boardEl = document.getElementById('collageBoard');
    const boardRect = boardEl.getBoundingClientRect();

    if (boardRect.width === 0 || boardRect.height === 0) {
      throw new Error('Workspace is not visible.');
    }

    const targetWidth = template.exportWidth;
    const targetHeight = template.exportHeight;

    // Create offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    // Enable max quality interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Fill entire background with the configured gutter color
    const computedGutterColor = window.app?.gutterColor || getComputedStyle(boardEl).getPropertyValue('--gutter-color').trim() || '#dedede';
    ctx.fillStyle = computedGutterColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Scale factors from screen board to export canvas
    const scaleFactorX = targetWidth / boardRect.width;
    const scaleFactorY = targetHeight / boardRect.height;

    // 2. Composite each well
    for (const [slotId, state] of this.wellManager.wellStates.entries()) {
      if (!state.element) continue;

      const wellRect = state.element.getBoundingClientRect();
      // Well bounds on the export canvas
      const exportX = (wellRect.left - boardRect.left) * scaleFactorX;
      const exportY = (wellRect.top - boardRect.top) * scaleFactorY;
      const exportW = wellRect.width * scaleFactorX;
      const exportH = wellRect.height * scaleFactorY;

      // Draw well placeholder background if empty
      ctx.save();
      ctx.beginPath();
      ctx.rect(exportX, exportY, exportW, exportH);
      ctx.clip();

      if (state.mediaId) {
        const media = this.mediaPool.getMedia(state.mediaId);
        if (media && media.imgElement) {
          const img = media.imgElement;

          // Calculate "cover" scale for export dimensions
          const sX = exportW / img.naturalWidth;
          const sY = exportH / img.naturalHeight;
          const baseScale = Math.max(sX, sY);
          const finalScale = baseScale * state.zoom;

          const drawW = img.naturalWidth * finalScale;
          const drawH = img.naturalHeight * finalScale;

          // Scale pan offsets from screen to export dimensions
          const panX = state.panX * (exportW / wellRect.width);
          const panY = state.panY * (exportH / wellRect.height);

          const drawX = exportX + (exportW - drawW) / 2 + panX;
          const drawY = exportY + (exportH - drawH) / 2 + panY;

          ctx.drawImage(img, drawX, drawY, drawW, drawH);
        }
      } else {
        // Empty well background on export
        ctx.fillStyle = '#1e1e24';
        ctx.fillRect(exportX, exportY, exportW, exportH);
      }

      ctx.restore();
    }

    // 3. Export to Blob and trigger local download
    let mimeType = 'image/png';
    let extension = 'png';
    if (format === 'jpeg' || format === 'jpg') {
      mimeType = 'image/jpeg';
      extension = 'jpg';
    } else if (format === 'webp') {
      mimeType = 'image/webp';
      extension = 'webp';
    }

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `refsheet-${template.id}-${targetWidth}x${targetHeight}-${timestamp}.${extension}`;

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to generate image blob.'));
          return;
        }

        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Revoke after a moment
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
        resolve({ filename, width: targetWidth, height: targetHeight });
      }, mimeType, quality);
    });
  }
}
