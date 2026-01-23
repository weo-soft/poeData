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
 * @param {string} categoryId - Optional category identifier for category-specific tooltips
 */
export function showTooltip(item, x, y, categoryId = null) {
  const tooltip = ensureTooltip();
  
  // Check if this is a tattoo or runegraft item (has replaces, dropRequired, or stackSize properties)
  const isTattoo = categoryId === 'tattoos' || categoryId === 'runegrafts' || item.replaces || item.dropRequired || (item.stackSize && !item.dropLevel);
  
  if (isTattoo) {
    showTattooTooltip(item, x, y);
  } else {
    showGenericTooltip(item, x, y);
  }
}

/**
 * Show tooltip for a tattoo item
 * @param {Object} tattoo - Tattoo item object
 * @param {number} x - Mouse X position
 * @param {number} y - Mouse Y position
 */
function showTattooTooltip(tattoo, x, y) {
  const tooltip = ensureTooltip();
  
  // Build tooltip content for tattoos
  let content = `<div style="font-weight: bold; color: #af6025; margin-bottom: 0.5rem; font-size: 1rem;">${tattoo.name || tattoo.id}</div>`;
  
  // Description (main effect)
  if (tattoo.description) {
    // Replace newlines with <br> for multi-line descriptions
    const description = tattoo.description.replace(/\n/g, '<br>');
    content += `<div style="margin-top: 0.5rem; margin-bottom: 0.5rem; color: #d4d4d4; font-size: 0.9rem; line-height: 1.4;">${description}</div>`;
  }
  
  // Separator line
  content += `<div style="border-top: 1px solid #444; margin: 0.5rem 0;"></div>`;
  
  // Replaces (what passive it replaces)
  if (tattoo.replaces) {
    content += `<div style="margin-bottom: 0.25rem; color: #888888; font-size: 0.85rem;"><span style="color: #d4d4d4;">Replaces:</span> ${tattoo.replaces}</div>`;
  }
  
  // Stack size
  if (tattoo.stackSize !== undefined && tattoo.stackSize !== null) {
    content += `<div style="margin-bottom: 0.25rem; color: #888888; font-size: 0.85rem;"><span style="color: #d4d4d4;">Stack Size:</span> ${tattoo.stackSize}</div>`;
  }
  
  // Drop required (how to obtain)
  if (tattoo.dropRequired) {
    content += `<div style="margin-top: 0.5rem; color: #888888; font-size: 0.8rem; font-style: italic;">${tattoo.dropRequired}</div>`;
  }
  
  tooltip.innerHTML = content;
  tooltip.style.display = 'block';
  // Increase max-width for tattoos as they may have longer text
  tooltip.style.maxWidth = '350px';
  updateTooltipPosition(x, y);
}

/**
 * Show tooltip for a generic item
 * @param {Object} item - Item object
 * @param {number} x - Mouse X position
 * @param {number} y - Mouse Y position
 */
function showGenericTooltip(item, x, y) {
  const tooltip = ensureTooltip();
  
  // Build tooltip content
  let content = `<div style="font-weight: bold; color: #af6025; margin-bottom: 0.5rem;">${item.name || item.id}</div>`;
  
  if (item.dropLevel) {
    content += `<div style="margin-bottom: 0.25rem;">Level: ${item.dropLevel}</div>`;
  }
  
  // Show weights - Bayesian as primary, MLE as secondary if available (as percentages)
  if (item.dropWeight !== undefined && item.dropWeight !== null) {
    const percentage = (item.dropWeight * 100).toFixed(4);
    content += `<div style="margin-bottom: 0.25rem;">Weight (Bayesian): ${percentage}%</div>`;
  }
  
  if (item.dropWeightMle !== undefined && item.dropWeightMle !== null) {
    const percentage = (item.dropWeightMle * 100).toFixed(4);
    content += `<div style="margin-bottom: 0.25rem;">Weight (MLE): ${percentage}%</div>`;
  }
  
  if (item.description) {
    content += `<div style="margin-top: 0.5rem; color: #888888; font-size: 0.85rem;">${item.description}</div>`;
  }
  
  // Show helpText if available (e.g., for DeliriumOrbs)
  if (item.helpText) {
    content += `<div style="margin-top: 0.5rem; color: #888888; font-size: 0.85rem; font-style: italic;">${item.helpText}</div>`;
  }
  
  tooltip.innerHTML = content;
  tooltip.style.display = 'block';
  tooltip.style.maxWidth = '300px';
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

