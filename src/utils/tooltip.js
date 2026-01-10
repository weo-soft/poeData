/**
 * Tooltip utility functions for displaying item information on hover
 */

let tooltipElement = null;

/**
 * Create tooltip element if it doesn't exist
 */
function ensureTooltip() {
  if (!tooltipElement) {
    tooltipElement = document.createElement('div');
    tooltipElement.className = 'stash-tooltip';
    tooltipElement.style.cssText = `
      position: fixed;
      background-color: rgba(0, 0, 0, 0.9);
      color: #d4d4d4;
      padding: 0.75rem;
      border-radius: 4px;
      border: 1px solid #af6025;
      pointer-events: none;
      z-index: 10000;
      font-size: 0.9rem;
      max-width: 300px;
      display: none;
    `;
    document.body.appendChild(tooltipElement);
  }
  return tooltipElement;
}

/**
 * Show tooltip for an item
 * @param {Object} item - Item object
 * @param {number} x - Mouse X position
 * @param {number} y - Mouse Y position
 */
export function showTooltip(item, x, y) {
  const tooltip = ensureTooltip();
  
  // Build tooltip content
  let content = `<div style="font-weight: bold; color: #af6025; margin-bottom: 0.5rem;">${item.name || item.id}</div>`;
  
  if (item.dropLevel) {
    content += `<div style="margin-bottom: 0.25rem;">Level: ${item.dropLevel}</div>`;
  }
  
  if (item.dropWeight !== undefined && item.dropWeight !== null) {
    content += `<div style="margin-bottom: 0.25rem;">Drop Weight: ${item.dropWeight}</div>`;
  }
  
  if (item.description) {
    content += `<div style="margin-top: 0.5rem; color: #888888; font-size: 0.85rem;">${item.description}</div>`;
  }
  
  tooltip.innerHTML = content;
  tooltip.style.display = 'block';
  updateTooltipPosition(x, y);
}

/**
 * Update tooltip position
 * @param {number} x - Mouse X position
 * @param {number} y - Mouse Y position
 */
export function updateTooltipPosition(x, y) {
  const tooltip = ensureTooltip();
  if (!tooltip.style.display || tooltip.style.display === 'none') {
    return;
  }
  
  // Offset tooltip from cursor
  const offsetX = 15;
  const offsetY = 15;
  
  // Get tooltip dimensions
  const rect = tooltip.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Adjust position to keep tooltip in viewport
  let left = x + offsetX;
  let top = y + offsetY;
  
  if (left + rect.width > viewportWidth) {
    left = x - rect.width - offsetX;
  }
  
  if (top + rect.height > viewportHeight) {
    top = y - rect.height - offsetY;
  }
  
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

/**
 * Hide tooltip
 */
export function hideTooltip() {
  if (tooltipElement) {
    tooltipElement.style.display = 'none';
  }
}

/**
 * Cleanup tooltip element
 */
export function cleanupTooltip() {
  if (tooltipElement && tooltipElement.parentNode) {
    tooltipElement.parentNode.removeChild(tooltipElement);
    tooltipElement = null;
  }
}

