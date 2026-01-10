/**
 * Canvas utility functions for image loading and drawing operations
 */

/**
 * Load an image from a URL
 * @param {string} src - Image source URL
 * @returns {Promise<HTMLImageElement>} Loaded image
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Clear canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
export function clearCanvas(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
}

/**
 * Draw cell highlight overlay
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Cell width
 * @param {number} height - Cell height
 * @param {string} color - Highlight color
 * @param {number} opacity - Opacity (0-1)
 */
export function drawCellHighlight(ctx, x, y, width, height, color, opacity) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = opacity;
  ctx.fillRect(x, y, width, height);
  ctx.restore();
}

/**
 * Draw cell border
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Cell width
 * @param {number} height - Cell height
 * @param {string} color - Border color
 * @param {number} lineWidth - Border line width
 */
export function drawCellBorder(ctx, x, y, width, height, color, lineWidth) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
}

