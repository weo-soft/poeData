/**
 * Divination Card Renderer
 * Renders Path of Exile divination cards with frame, art, and styled text
 * Supports dynamic scaling with responsive sizing and zoom controls
 */

import { createElement } from '../utils/dom.js';

// Default base width (300px is the standard card size)
const BASE_WIDTH = 300;
const MIN_WIDTH = 150;
const MAX_WIDTH = 1200;
const DEFAULT_WIDTH = 300;
const ZOOM_STEP = 25;

// Store card state for dynamic updates
const cardState = {
  container: null,
  card: null,
  currentWidth: DEFAULT_WIDTH,
  cardContainer: null,
  elements: {},
  isManualAdjustment: false,
  manualAdjustmentTimeout: null
};

/**
 * Mark that user is manually adjusting size (prevents responsive override)
 */
function markManualSizeAdjustment() {
  cardState.isManualAdjustment = true;
  if (cardState.manualAdjustmentTimeout) {
    clearTimeout(cardState.manualAdjustmentTimeout);
  }
  // Reset manual adjustment flag after 2 seconds of inactivity
  cardState.manualAdjustmentTimeout = setTimeout(() => {
    cardState.isManualAdjustment = false;
  }, 2000);
}

/**
 * Render a divination card with dynamic scaling support
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} card - Card data object
 * @param {Object} [options] - Rendering options
 * @param {number} [options.width] - Initial card width in pixels (default: 300)
 * @param {boolean} [options.showControls=true] - Show zoom controls
 * @param {boolean} [options.responsive=true] - Enable responsive sizing
 */
export async function renderDivinationCard(container, card, options = {}) {
  const {
    width = DEFAULT_WIDTH,
    responsive = true
  } = options;
  
  // Clear container
  container.innerHTML = '';
  
  // Store state
  cardState.container = container;
  cardState.card = card;
  cardState.currentWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width));
  
  // Create card container
  const cardContainer = createElement('div', {
    className: 'div-card-preview'
  });
  cardState.cardContainer = cardContainer;
  
  // Render card content
  await renderCardContent(cardContainer, card, cardState.currentWidth);
  
  container.appendChild(cardContainer);
  
  // Enable responsive sizing if requested (internal functionality, no UI)
  if (responsive) {
    enableResponsiveSizing();
  }
}

/**
 * Render card content with specified width
 * @param {HTMLElement} cardContainer - Card container element
 * @param {Object} card - Card data object
 * @param {number} width - Card width in pixels
 */
async function renderCardContent(cardContainer, card, width) {
  // Clear existing content and element references
  cardContainer.innerHTML = '';
  cardState.elements = {};
  
  // Calculate dimensions (aspect ratio 300:455)
  const height = Math.round(width * (455 / 300));
  const scaleFactor = width / BASE_WIDTH;
  
  // Set container size
  cardContainer.style.width = `${width}px`;
  cardContainer.style.height = `${height}px`;
  
  // Load and add frame image
  const frameImg = createElement('img', {
    className: 'div-card-frame',
    src: '/assets/images/Divination_card_frame.png',
    alt: 'Divination frame'
  });
  cardContainer.appendChild(frameImg);
  cardState.elements.frameImg = frameImg;
  
  // Add title
  const titleFontSize = 16 * scaleFactor;
  const letterSpacing = 0.5 * scaleFactor;
  const title = createElement('div', {
    className: 'div-card-title div-card-text-base',
    textContent: card.name,
    style: `font-size: ${titleFontSize}px; letter-spacing: ${letterSpacing}px;`
  });
  cardContainer.appendChild(title);
  cardState.elements.title = title;
  
  // Add card art if available (use card id as filename)
  if (card.id) {
    const artImg = createElement('img', {
      className: 'div-card-art',
      src: `/assets/images/divinationcards/${card.id}.png`,
      alt: card.name
    });
    artImg.onerror = () => {
      // Hide image if loading fails
      artImg.style.display = 'none';
    };
    cardContainer.appendChild(artImg);
    cardState.elements.artImg = artImg;
  }
  
  // Add stack size if available
  if (card.stackSize) {
    const stackFontSize = 12 * scaleFactor;
    const stack = createElement('div', {
      className: 'div-card-stack',
      textContent: card.stackSize,
      style: `font-size: ${stackFontSize}px;`
    });
    cardContainer.appendChild(stack);
    cardState.elements.stack = stack;
  }
  
  // Calculate number of lines in explicitModifiers for dynamic positioning
  const rewardLineCount = getRewardLineCount(card.explicitModifiers);
  
  // Add reward text
  if (card.explicitModifiers && card.explicitModifiers.length > 0) {
    const rewardText = formatRewardText(card.explicitModifiers);
    const rewardClass = getRewardClass(card.explicitModifiers);
    const rewardStyle = getRewardStyle(rewardClass, scaleFactor, width);
    
    // Calculate dynamic top position based on line count and card size
    // Base position: 56%, adjust down by ~2.5% per additional line beyond 1
    const rewardTop = calculateRewardTop(rewardLineCount, scaleFactor);
    
    const reward = createElement('div', {
      className: `div-card-reward div-card-text-base ${rewardClass}`,
      innerHTML: rewardText
    });
    
    // Apply styles directly to element to ensure they take effect
    Object.assign(reward.style, rewardStyle, {
      top: `${rewardTop}%`
    });
    cardContainer.appendChild(reward);
    cardState.elements.reward = reward;
  }
  
  // Add separator
  // Position dynamically based on reward line count and card size
  const separatorTop = calculateSeparatorTop(rewardLineCount, scaleFactor);
  const separator = createElement('img', {
    className: 'div-card-separator',
    src: '/assets/images/Divination_card_separator.png',
    alt: 'separator',
    style: `top: ${separatorTop}%;`
  });
  cardContainer.appendChild(separator);
  cardState.elements.separator = separator;
  
  // Add flavour text
  // Position dynamically based on reward line count and card size
  if (card.flavourText) {
    const flavourFontSize = Math.max(8, 12 * scaleFactor); // Minimum 8px for readability
    const flavourTop = calculateFlavourTop(rewardLineCount, scaleFactor);
    const flavour = createElement('div', {
      className: 'div-card-flavour div-card-text-base',
      textContent: formatFlavourText(card.flavourText),
      style: `font-size: ${flavourFontSize}px; top: ${flavourTop}%;`
    });
    cardContainer.appendChild(flavour);
    cardState.elements.flavour = flavour;
  }
}

/**
 * Update card size dynamically
 * @param {number} newWidth - New card width in pixels
 */
function updateCardSize(newWidth) {
  // Clamp width to valid range
  const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
  
  if (clampedWidth === cardState.currentWidth) {
    return; // No change needed
  }
  
  cardState.currentWidth = clampedWidth;
  
  // Update card content
  if (cardState.cardContainer && cardState.card) {
    renderCardContent(cardState.cardContainer, cardState.card, clampedWidth);
  }
  
  // Internal resize functionality - no UI updates needed
}

/**
 * Enable responsive sizing based on container/viewport
 */
function enableResponsiveSizing() {
  if (!cardState.container) return;
  
  // Remove existing resize listener if any
  if (cardState.resizeListener) {
    window.removeEventListener('resize', cardState.resizeListener);
  }
  
  // Create resize handler
  cardState.resizeListener = () => {
    // Don't override manual adjustments
    if (cardState.isManualAdjustment) {
      return;
    }
    
    // Calculate responsive width based on container
    const containerWidth = cardState.container.clientWidth || window.innerWidth;
    const padding = 40; // Account for padding/margins
    const maxWidth = Math.min(MAX_WIDTH, containerWidth - padding);
    const responsiveWidth = Math.max(MIN_WIDTH, Math.min(maxWidth, DEFAULT_WIDTH * 1.5));
    
    // Only update if significantly different to avoid constant re-renders
    if (Math.abs(responsiveWidth - cardState.currentWidth) > 10) {
      updateCardSize(responsiveWidth);
    }
  };
  
  // Initial calculation
  cardState.resizeListener();
  
  // Add resize listener
  window.addEventListener('resize', cardState.resizeListener);
}

/**
 * Disable responsive sizing
 */
function disableResponsiveSizing() {
  if (cardState.resizeListener) {
    window.removeEventListener('resize', cardState.resizeListener);
    cardState.resizeListener = null;
  }
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Parse styling metadata and convert to HTML with CSS classes
 * Format: <STYLING-METADATA>{TEXT}
 * Example: <uniqueitem>{The Poet's Pen} -> <span class="poe-style-uniqueitem">The Poet's Pen</span>
 * Handles nested tags and preserves newlines by converting them to <br> tags
 * @param {string} text - Text with styling metadata
 * @returns {string} HTML string with styled spans
 */
function parseStyledText(text) {
  // First, convert newlines to a temporary marker to preserve them
  const newlineMarker = '___NEWLINE___';
  let result = text.replace(/\n/g, newlineMarker);
  
  // Process tags from innermost to outermost
  let changed = true;
  let iterations = 0;
  const maxIterations = 100; // Safety limit to prevent infinite loops
  
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    
    // Pattern to match: <tag>{content}
    const tagPattern = /<([^>]+)>\{/g;
    const tagMatches = [];
    
    let match;
    while ((match = tagPattern.exec(result)) !== null) {
      const tagStart = match.index;
      const tag = match[1];
      const contentStart = match.index + match[0].length;
      
      // Find the matching closing brace by counting brace depth
      let depth = 1;
      let pos = contentStart;
      let contentEnd = -1;
      
      while (pos < result.length && depth > 0) {
        if (result[pos] === '{') {
          depth++;
        } else if (result[pos] === '}') {
          depth--;
          if (depth === 0) {
            contentEnd = pos;
            break;
          }
        }
        pos++;
      }
      
      if (contentEnd !== -1) {
        const content = result.substring(contentStart, contentEnd);
        // Check if content contains unprocessed tags
        const hasUnprocessedTags = /<[^/>]+>\{/.test(content);
        if (!hasUnprocessedTags) {
          tagMatches.push({
            start: tagStart,
            tag,
            contentStart,
            contentEnd
          });
        }
      }
    }
    
    // Process matches from right to left (innermost first)
    tagMatches.reverse().forEach(tagMatch => {
      const content = result.substring(tagMatch.contentStart, tagMatch.contentEnd);
      const cssClass = `poe-style-${tagMatch.tag.replace(/:/g, '-')}`;
      const replacement = `<span class="${cssClass}">${content}</span>`;
      
      // Replace the entire tag including braces
      const before = result.substring(0, tagMatch.start);
      const after = result.substring(tagMatch.contentEnd + 1);
      result = before + replacement + after;
      changed = true;
    });
  }
  
  // Convert newline markers to <br> tags BEFORE escaping
  result = result.replace(new RegExp(newlineMarker, 'g'), '<br>');
  
  // Now we need to escape text content but preserve HTML tags (<span> and <br>)
  const htmlTagRegex = /(<(?:span|br)[^>]*>|<\/span>)/gi;
  const parts = result.split(htmlTagRegex);
  
  let output = '';
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    // Check if this part is an HTML tag
    if (part && (part.startsWith('<span') || part.startsWith('<br') || part === '</span>')) {
      output += part;
    } else if (part) {
      // Escape text content
      output += escapeHtml(part);
    }
  }
  
  return output.trim();
}

/**
 * Format reward text from explicit modifiers
 * @param {Array} explicitModifiers - Array of modifier objects
 * @returns {string} Formatted HTML string
 */
function formatRewardText(explicitModifiers) {
  const raw = explicitModifiers
    .map(m => m.text)
    .join('\n');
  return parseStyledText(raw);
}

/**
 * Get reward class based on text length
 * @param {Array} explicitModifiers - Array of modifier objects
 * @returns {string} CSS class name
 */
function getRewardClass(explicitModifiers) {
  const raw = explicitModifiers
    .map(m => m.text)
    .join('\n');
  const plainText = raw
    .replace(/<[^>]+>\{([^}]*)\}/g, '$1')
    .replace(/\n/g, ' ')
    .trim();
  
  const length = plainText.length;
  const words = plainText.trim().split(/\s+/).filter(Boolean).length;
  
  if (length > 70 || words >= 9) return 'xxsmall';
  if (length > 50 || words >= 7) return 'xsmall';
  if (length > 30 || words >= 5) return 'small';
  return 'normal';
}

/**
 * Get reward style object
 * @param {string} rewardClass - Reward class name
 * @param {number} scaleFactor - Scale factor for sizing
 * @param {number} width - Card width in pixels
 * @returns {Object} Style object
 */
function getRewardStyle(rewardClass, scaleFactor, width) {
  // Apply additional scaling for miniature cards to make explicitModifiers text smaller
  const isMiniature = width < 200;
  // Moderate scaling for miniatures - reduces font size by ~25% (0.75 scale)
  const miniatureScale = isMiniature ? 1.2 : 1.0;
  const effectiveScaleFactor = scaleFactor * miniatureScale;
  
  // For miniature cards, use transform scale to bypass browser minimum font size limits
  // For regular cards, maintain minimums for readability
  let baseFontSize;
  let transformScale = 1;
  
  if (isMiniature) {
    // Use a readable base font size, then scale it down with transform
    baseFontSize = 14 * scaleFactor; // Use original scaleFactor for base
    transformScale = miniatureScale; // Apply additional scaling via transform
  } else {
    const MIN_FONT_SIZE = 7;
    baseFontSize = Math.max(MIN_FONT_SIZE, 14 * scaleFactor);
  }
  
  const baseStyle = {
    fontSize: `${baseFontSize}px`,
    transform: transformScale !== 1 ? `scale(${transformScale})` : 'none',
    transformOrigin: 'center center'
  };
  
  if (rewardClass === 'small') {
    const fontSize = isMiniature ? 11 * scaleFactor : Math.max(6, 11 * scaleFactor);
    return {
      fontSize: `${fontSize}px`,
      letterSpacing: `${0.3 * effectiveScaleFactor}px`,
      lineHeight: width < 200 ? '1.15' : '1.18',
      transform: transformScale !== 1 ? `scale(${transformScale})` : 'none',
      transformOrigin: 'center center'
    };
  } else if (rewardClass === 'xsmall') {
    const fontSize = isMiniature ? 9.5 * scaleFactor : Math.max(5.5, 9.5 * scaleFactor);
    return {
      fontSize: `${fontSize}px`,
      letterSpacing: `${0.2 * effectiveScaleFactor}px`,
      lineHeight: width < 200 ? '1.1' : '1.12',
      transform: transformScale !== 1 ? `scale(${transformScale})` : 'none',
      transformOrigin: 'center center'
    };
  } else if (rewardClass === 'xxsmall') {
    const fontSize = isMiniature ? 8.5 * scaleFactor : Math.max(5, 8.5 * scaleFactor);
    return {
      fontSize: `${fontSize}px`,
      letterSpacing: `${0.15 * effectiveScaleFactor}px`,
      lineHeight: width < 200 ? '1.05' : '1.08',
      transform: transformScale !== 1 ? `scale(${transformScale})` : 'none',
      transformOrigin: 'center center'
    };
  }
  
  return baseStyle;
}

/**
 * Count the number of lines in explicitModifiers
 * @param {Array} explicitModifiers - Array of modifier objects
 * @returns {number} Number of lines
 */
function getRewardLineCount(explicitModifiers) {
  if (!explicitModifiers || explicitModifiers.length === 0) {
    return 0;
  }
  
  // Count newlines in the combined text
  const raw = explicitModifiers
    .map(m => m.text)
    .join('\n');
  
  // Count newlines (each \n is a line break)
  const lineCount = (raw.match(/\n/g) || []).length + 1;
  return lineCount;
}

/**
 * Calculate reward text top position based on line count and scale
 * @param {number} lineCount - Number of lines in reward text
 * @param {number} scaleFactor - Scale factor for card size
 * @returns {number} Top position as percentage
 */
function calculateRewardTop(lineCount, scaleFactor) {
  // Base position for 1 line: 60% (increased from 56% to add more padding from card art)
  // For each additional line, move down by ~2.2% to account for line height
  // Adjust adjustment per line based on scale factor (smaller cards need more adjustment)
  const baseTop = 60;
  const baseAdjustmentPerLine = 2.3;
  // For smaller cards, increase adjustment to account for tighter spacing
  const adjustmentPerLine = scaleFactor < 0.7 ? baseAdjustmentPerLine * 1.2 : baseAdjustmentPerLine;
  const additionalLines = Math.max(0, lineCount - 1);
  return Math.max(45, baseTop - (additionalLines * adjustmentPerLine));
}

/**
 * Calculate separator top position based on reward line count and scale
 * @param {number} lineCount - Number of lines in reward text
 * @param {number} scaleFactor - Scale factor for card size
 * @returns {number} Top position as percentage
 */
function calculateSeparatorTop(lineCount, scaleFactor) {
  // Base position for 1 line: 70% (increased from 66% to match reward text movement)
  // Separator should be positioned after the reward text with some spacing
  // For smaller cards, increase adjustment to account for text taking more relative space
  const baseTop = 70;
  const baseAdjustmentPerLine = 0.5;
  // For smaller cards, increase adjustment significantly to account for tighter spacing
  const adjustmentPerLine = scaleFactor < 0.7 ? baseAdjustmentPerLine * 2.5 : baseAdjustmentPerLine;
  const additionalLines = Math.max(0, lineCount - 1);
  return Math.max(55, baseTop + (additionalLines * adjustmentPerLine));
}

/**
 * Calculate flavour text top position based on reward line count and scale
 * @param {number} lineCount - Number of lines in reward text
 * @param {number} scaleFactor - Scale factor for card size
 * @returns {number} Top position as percentage
 */
function calculateFlavourTop(lineCount, scaleFactor) {
  // Base position for 1 line: 77% (increased from 73% to match reward text movement)
  // Flavour text should be positioned after the separator with some spacing
  // For smaller cards, increase adjustment to account for tighter spacing
  const baseTop = 77;
  const baseAdjustmentPerLine = 2.2;
  // For smaller cards, increase adjustment to account for text taking more relative space
  const adjustmentPerLine = scaleFactor < 0.7 ? baseAdjustmentPerLine * 1.2 : baseAdjustmentPerLine;
  const additionalLines = Math.max(0, lineCount - 1);
  return Math.max(62, baseTop + (additionalLines * adjustmentPerLine));
}

/**
 * Format flavour text by removing wiki markup
 * @param {string} text - Raw flavour text
 * @returns {string} Cleaned flavour text
 */
function formatFlavourText(text) {
  // Remove wiki/markup tags like <size:27>, <smaller>, <magicitem>, etc.
  text = text.replace(/<[^>]*>/g, '');
  // Remove surrounding braces often used on wiki examples
  text = text.replace(/^\s*[\{\[\(\"'""]+/, '').replace(/[\}\]\)\"'""]+\s*$/, '');
  // Collapse multiple spaces and normalize whitespace/newlines
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

