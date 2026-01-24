/**
 * Tooltip utility functions for displaying item information on hover
 * Supports both mouse hover (desktop) and touch/long-press (mobile)
 */

let tooltipElement = null;
let touchTooltipTimeout = null;
let isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

/**
 * Create tooltip element if it doesn't exist
 */
function ensureTooltip() {
  if (!tooltipElement) {
    tooltipElement = document.createElement('div');
    tooltipElement.className = 'stash-tooltip';
    const isMobile = window.innerWidth < 768;
    tooltipElement.style.cssText = `
      position: fixed;
      background-color: rgba(0, 0, 0, 0.95);
      color: #d4d4d4;
      padding: ${isMobile ? '1rem' : '0.75rem'};
      border-radius: 4px;
      border: 1px solid #af6025;
      pointer-events: none;
      z-index: 10000;
      font-size: ${isMobile ? '0.95rem' : '0.9rem'};
      max-width: ${isMobile ? '90vw' : '300px'};
      display: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
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
  
  // Check if this is a divination card
  const isDivinationCard = categoryId === 'divination-cards' || (item.explicitModifiers && item.flavourText && item.stackSize);
  
  // Check if this is a tattoo or runegraft item (has replaces, dropRequired, or stackSize properties)
  const isTattoo = categoryId === 'tattoos' || categoryId === 'runegrafts' || item.replaces || item.dropRequired || (item.stackSize && !item.dropLevel && !isDivinationCard);
  
  if (isDivinationCard) {
    showDivinationCardTooltip(item, x, y);
  } else if (isTattoo) {
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
  
  // Show weights - Bayesian as primary, MLE as secondary if available (as percentages)
  if (tattoo.dropWeight !== undefined && tattoo.dropWeight !== null) {
    const percentage = (tattoo.dropWeight * 100).toFixed(4);
    content += `<div style="margin-bottom: 0.25rem; color: #888888; font-size: 0.85rem;"><span style="color: #d4d4d4;">Weight (Bayesian):</span> ${percentage}%</div>`;
  }
  
  if (tattoo.dropWeightMle !== undefined && tattoo.dropWeightMle !== null) {
    const percentage = (tattoo.dropWeightMle * 100).toFixed(4);
    content += `<div style="margin-bottom: 0.25rem; color: #888888; font-size: 0.85rem;"><span style="color: #d4d4d4;">Weight (MLE):</span> ${percentage}%</div>`;
  }
  
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
 * Show tooltip for a divination card
 * @param {Object} card - Divination card item object
 * @param {number} x - Mouse X position
 * @param {number} y - Mouse Y position
 */
function showDivinationCardTooltip(card, x, y) {
  const tooltip = ensureTooltip();
  
  // Build tooltip content for divination cards
  let content = `<div style="font-weight: bold; color: #af6025; margin-bottom: 0.5rem; font-size: 1rem;">${card.name || card.id}</div>`;
  
  // Stack size
  if (card.stackSize !== undefined && card.stackSize !== null) {
    content += `<div style="margin-bottom: 0.25rem; color: #888888; font-size: 0.85rem;"><span style="color: #d4d4d4;">Stack Size:</span> ${card.stackSize}</div>`;
  }
  
  // Drop level
  if (card.dropLevel) {
    content += `<div style="margin-bottom: 0.25rem; color: #888888; font-size: 0.85rem;"><span style="color: #d4d4d4;">Drop Level:</span> ${card.dropLevel}</div>`;
  }
  
  // Separator line
  content += `<div style="border-top: 1px solid #444; margin: 0.5rem 0;"></div>`;
  
  // Explicit modifiers (reward)
  if (card.explicitModifiers && Array.isArray(card.explicitModifiers) && card.explicitModifiers.length > 0) {
    content += `<div style="margin-bottom: 0.5rem;"><div style="color: #d4d4d4; font-size: 0.85rem; margin-bottom: 0.25rem;">Reward:</div>`;
    card.explicitModifiers.forEach(modifier => {
      if (modifier.text) {
        // Strip HTML tags for tooltip display (keep it simple)
        const cleanText = modifier.text.replace(/<[^>]*>/g, '').replace(/\n/g, ' ');
        content += `<div style="color: #888888; font-size: 0.85rem; margin-left: 0.5rem; margin-bottom: 0.15rem;">${cleanText}</div>`;
      }
    });
    content += `</div>`;
  }
  
  // Drop areas
  if (card.dropAreas && Array.isArray(card.dropAreas) && card.dropAreas.length > 0) {
    content += `<div style="margin-bottom: 0.5rem;"><div style="color: #d4d4d4; font-size: 0.85rem; margin-bottom: 0.25rem;">Drop Areas:</div>`;
    content += `<div style="color: #888888; font-size: 0.85rem; margin-left: 0.5rem;">${card.dropAreas.join(', ')}</div></div>`;
  }
  
  // Drop monsters
  if (card.dropMonsters && Array.isArray(card.dropMonsters) && card.dropMonsters.length > 0) {
    content += `<div style="margin-bottom: 0.5rem;"><div style="color: #d4d4d4; font-size: 0.85rem; margin-bottom: 0.25rem;">Drop Monsters:</div>`;
    content += `<div style="color: #888888; font-size: 0.85rem; margin-left: 0.5rem;">${card.dropMonsters.join(', ')}</div></div>`;
  }
  
  // Flavour text
  if (card.flavourText) {
    // Strip HTML tags and clean up flavour text
    const cleanFlavourText = card.flavourText.replace(/<[^>]*>/g, '').trim();
    if (cleanFlavourText) {
      content += `<div style="border-top: 1px solid #444; margin: 0.5rem 0; padding-top: 0.5rem; color: #888888; font-size: 0.8rem; font-style: italic;">${cleanFlavourText}</div>`;
    }
  }
  
  // Show weights - Bayesian as primary, MLE as secondary if available (as percentages)
  if (card.dropWeight !== undefined && card.dropWeight !== null) {
    const percentage = (card.dropWeight * 100).toFixed(4);
    content += `<div style="margin-top: 0.5rem; margin-bottom: 0.25rem; color: #888888; font-size: 0.85rem;"><span style="color: #d4d4d4;">Weight (Bayesian):</span> ${percentage}%</div>`;
  }
  
  if (card.dropWeightMle !== undefined && card.dropWeightMle !== null) {
    const percentage = (card.dropWeightMle * 100).toFixed(4);
    content += `<div style="margin-bottom: 0.25rem; color: #888888; font-size: 0.85rem;"><span style="color: #d4d4d4;">Weight (MLE):</span> ${percentage}%</div>`;
  }
  
  tooltip.innerHTML = content;
  tooltip.style.display = 'block';
  // Increase max-width for divination cards as they may have longer text
  tooltip.style.maxWidth = '400px';
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

