/**
 * HTML5 Canvas stash tab visualization renderer
 * Renders items in a grid layout similar to Path of Exile stash tabs
 * For scarabs, uses base image with cell overlay system
 */

import { loadImage, clearCanvas, drawCellHighlight, drawCellBorder } from '../utils/canvasUtils.js';
import { createCellsFromGroups, getCellAtPosition, IMAGE_DIMENSIONS, CELL_SIZE, SCARAB_ORDER_CONFIG } from '../config/gridConfig.js';
import { showTooltip, hideTooltip, updateTooltipPosition } from '../utils/tooltip.js';

let baseImage = null;
let itemImageCache = new Map();
let cellDefinitions = [];
let cellToItemMap = new Map();
let itemToCellMap = new Map();
let currentCanvas = null;
let highlightedItemId = null;

/**
 * Render stash tab with items
 * @param {HTMLCanvasElement} canvas - Canvas element to render into
 * @param {Array} items - Array of item objects
 * @param {string} categoryId - Category identifier
 */
export async function renderStashTab(canvas, items, categoryId) {
  currentCanvas = canvas;
  
  // For scarabs, use the grid-based approach with base image
  if (categoryId === 'scarabs') {
    await renderScarabGrid(canvas, items);
  } else {
    // For other categories, use simple grid layout
    await renderSimpleGrid(canvas, items, categoryId);
  }
}

/**
 * Render scarab grid with base image and cell overlay
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array} items - Array of scarab items
 */
async function renderScarabGrid(canvas, items) {
  try {
    // Load base image - try public first, then src
    let baseImagePath = '/assets/images/Scarab-tab.png';
    try {
      baseImage = await loadImage(baseImagePath);
    } catch (e) {
      // Fallback to src path
      baseImagePath = '/src/assets/images/Scarab-tab.png';
      baseImage = await loadImage(baseImagePath);
    }
    
    // Setup canvas to match image dimensions
    setupCanvas(canvas, baseImage.width, baseImage.height);
    
    // Create cell definitions
    cellDefinitions = createCellsFromGroups();
    
    // Map items to cells
    mapItemsToCells(items);
    
    // Preload item images
    await preloadItemImages(items);
    
    // Render grid
    renderGrid(canvas, items);
    
    // Setup event handlers
    setupEventHandlers(canvas, items);
    
  } catch (error) {
    console.error('Error rendering scarab grid:', error);
    // Fallback to simple grid if base image fails
    await renderSimpleGrid(canvas, items, 'scarabs');
  }
}

/**
 * Setup canvas dimensions
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
function setupCanvas(canvas, width, height) {
  const ctx = canvas.getContext('2d');
  
  // Set display size
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  
  // Set actual canvas size (for high DPI displays)
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
}

/**
 * Map items to cells based on type
 * @param {Array} items - Array of items
 */
function mapItemsToCells(items) {
  cellToItemMap.clear();
  itemToCellMap.clear();
  
  // Group cells by type
  const cellsByType = new Map();
  cellDefinitions.forEach(cell => {
    if (cell.groupType) {
      if (!cellsByType.has(cell.groupType)) {
        cellsByType.set(cell.groupType, []);
      }
      cellsByType.get(cell.groupType).push(cell);
    }
  });
  
  // Sort cells within each group by position (left to right, top to bottom)
  cellsByType.forEach((cells, type) => {
    cells.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.x - b.x;
    });
  });
  
  // Group items by type
  const itemsByType = new Map();
  items.forEach(item => {
    const itemType = getItemType(item);
    if (itemType) {
      if (!itemsByType.has(itemType)) {
        itemsByType.set(itemType, []);
      }
      itemsByType.get(itemType).push(item);
    }
  });
  
  // Sort items within each type
  // Use explicit order if configured, otherwise sort by drop weight (low to high)
  itemsByType.forEach((typeItems, type) => {
    const explicitOrder = SCARAB_ORDER_CONFIG[type];
    
    if (explicitOrder && Array.isArray(explicitOrder)) {
      // Use explicit ordering
      typeItems.sort((a, b) => {
        const indexA = explicitOrder.indexOf(a.id);
        const indexB = explicitOrder.indexOf(b.id);
        
        // If both are in the order list, sort by their position
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        // If only one is in the list, prioritize it
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        // If neither is in the list, sort by drop weight as fallback
        const weightA = a.dropWeight || 0;
        const weightB = b.dropWeight || 0;
        return weightA - weightB;
      });
    } else {
      // Default: sort by drop weight (low to high)
      typeItems.sort((a, b) => {
        const weightA = a.dropWeight || 0;
        const weightB = b.dropWeight || 0;
        return weightA - weightB;
      });
    }
  });
  
  // Map items to cells
  cellsByType.forEach((cells, type) => {
    const typeItems = itemsByType.get(type) || [];
    const maxAssignments = Math.min(cells.length, typeItems.length);
    
    for (let i = 0; i < maxAssignments; i++) {
      const cell = cells[i];
      const item = typeItems[i];
      
      if (cell && item) {
        cellToItemMap.set(cell.id, item);
        itemToCellMap.set(item.id, cell.id);
      }
    }
  });
}

/**
 * Get item type from item ID or name
 * @param {Object} item - Item object
 * @returns {string|null} Item type or null
 */
function getItemType(item) {
  if (!item || !item.id) return null;
  
  const idLower = item.id.toLowerCase();
  
  // Special handling for misc and misc2 groups (IDs start with "scarab-of-")
  // Check misc2 first (more specific)
  const misc2Order = SCARAB_ORDER_CONFIG['misc2'] || [];
  if (misc2Order.includes(item.id)) {
    return 'misc2';
  }
  
  // Check misc group
  const miscOrder = SCARAB_ORDER_CONFIG['misc'] || [];
  if (miscOrder.includes(item.id)) {
    return 'misc';
  }
  
  // Special handling for horned scarabs - distinguish between horned and horned2
  const horned2Order = SCARAB_ORDER_CONFIG['horned2'] || [];
  if (horned2Order.includes(item.id)) {
    return 'horned2';
  }
  
  const hornedOrder = SCARAB_ORDER_CONFIG['horned'] || [];
  if (hornedOrder.includes(item.id)) {
    return 'horned';
  }
  
  // Extract type from ID pattern: "{type}-scarab" or "{type}-scarab-of-..."
  // Example: "abyss-scarab" -> "abyss", "titanic-scarab-of-x" -> "titanic"
  const match = idLower.match(/^([^-]+)-scarab/);
  if (match) {
    const extractedType = match[1];
    
    // Get all group types
    const groupTypes = cellDefinitions
      .map(c => c.groupType)
      .filter(t => t);
    
    // Try exact match first
    if (groupTypes.includes(extractedType)) {
      return extractedType;
    }
    
    // Try partial match (e.g., "kalguuran" might match "kalguuran" in ID)
    for (const type of groupTypes) {
      if (extractedType.includes(type.toLowerCase()) || type.toLowerCase().includes(extractedType)) {
        return type;
      }
    }
  }
  
  // Fallback: check name for type keywords
  const nameLower = (item.name || '').toLowerCase();
  const groupTypes = cellDefinitions
    .map(c => c.groupType)
    .filter(t => t);
  
  for (const type of groupTypes) {
    if (nameLower.includes(type.toLowerCase())) {
      return type;
    }
  }
  
  // If no match, return null (will be unmapped)
  return null;
}

/**
 * Preload item images
 * @param {Array} items - Array of items
 */
async function preloadItemImages(items) {
  const itemsToLoad = Array.from(cellToItemMap.values());
  const loadPromises = itemsToLoad.map(item => loadItemImage(item));
  await Promise.allSettled(loadPromises);
}

/**
 * Load item image
 * @param {Object} item - Item object
 * @returns {Promise<HTMLImageElement|null>} Loaded image or null
 */
async function loadItemImage(item) {
  if (!item || !item.id) return null;
  
  // Check cache
  if (itemImageCache.has(item.id)) {
    return itemImageCache.get(item.id);
  }
  
  try {
    // Try public path first, then src path
    let imagePath = `/assets/images/scarabs/${item.id}.png`;
    let image;
    try {
      image = await loadImage(imagePath);
    } catch (e) {
      // Fallback to src path
      imagePath = `/src/assets/images/scarabs/${item.id}.png`;
      image = await loadImage(imagePath);
    }
    itemImageCache.set(item.id, image);
    return image;
  } catch (error) {
    console.warn(`Failed to load image for item ${item.id}:`, error);
    itemImageCache.set(item.id, null);
    return null;
  }
}

/**
 * Render the grid
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array} items - Array of items
 */
function renderGrid(canvas, items) {
  const ctx = canvas.getContext('2d');
  const displayWidth = baseImage ? baseImage.width : IMAGE_DIMENSIONS.width;
  const displayHeight = baseImage ? baseImage.height : IMAGE_DIMENSIONS.height;
  
  // Clear canvas
  clearCanvas(ctx, displayWidth, displayHeight);
  
  // Draw base image
  if (baseImage) {
    ctx.drawImage(baseImage, 0, 0, displayWidth, displayHeight);
  } else {
    // Fallback background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, displayWidth, displayHeight);
  }
  
  // Draw item overlays
  cellDefinitions.forEach(cell => {
    const item = cellToItemMap.get(cell.id);
    if (item) {
      drawCellOverlay(ctx, cell, item);
      
      // Draw highlight if this item is highlighted
      if (highlightedItemId === item.id) {
        drawCellHighlight(ctx, cell.x, cell.y, cell.width, cell.height, '#ffd700', 0.6);
        drawCellBorder(ctx, cell.x, cell.y, cell.width, cell.height, '#ffd700', 3);
      }
    }
  });
}

/**
 * Draw cell overlay with item image
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} cell - Cell definition
 * @param {Object} item - Item object
 */
function drawCellOverlay(ctx, cell, item) {
  // Draw item image
  const itemImage = itemImageCache.get(item.id);
  if (itemImage) {
    const padding = 2;
    const imageX = cell.x + padding;
    const imageY = cell.y + padding;
    const imageWidth = cell.width - (padding * 2);
    const imageHeight = cell.height - (padding * 2);
    
    ctx.drawImage(itemImage, imageX, imageY, imageWidth, imageHeight);
  }
}

/**
 * Setup event handlers for canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array} items - Array of items
 */
function setupEventHandlers(canvas, items) {
  let currentItem = null;
  
  // Get canvas coordinates
  function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const displayWidth = baseImage ? baseImage.width : IMAGE_DIMENSIONS.width;
    const displayHeight = baseImage ? baseImage.height : IMAGE_DIMENSIONS.height;
    
    const x = ((e.clientX - rect.left) / rect.width) * displayWidth;
    const y = ((e.clientY - rect.top) / rect.height) * displayHeight;
    
    return { x, y };
  }
  
  // Mouse move handler
  canvas.addEventListener('mousemove', (e) => {
    const { x, y } = getCanvasCoordinates(e);
    const cell = getCellAtPosition(cellDefinitions, x, y);
    const item = cell ? cellToItemMap.get(cell.id) : null;
    
    // Update tooltip position
    if (currentItem) {
      updateTooltipPosition(e.clientX, e.clientY);
    }
    
    // Show tooltip for new item
    if (item && item !== currentItem) {
      currentItem = item;
      highlightedItemId = item.id;
      showTooltip(item, e.clientX, e.clientY);
      renderGrid(canvas, items);
    } else if (!item && currentItem) {
      currentItem = null;
      highlightedItemId = null;
      hideTooltip();
      renderGrid(canvas, items);
    }
  });
  
  // Mouse leave handler
  canvas.addEventListener('mouseleave', () => {
    currentItem = null;
    highlightedItemId = null;
    hideTooltip();
    renderGrid(canvas, items);
  });
  
  // Click handler
  canvas.addEventListener('click', (e) => {
    const { x, y } = getCanvasCoordinates(e);
    const cell = getCellAtPosition(cellDefinitions, x, y);
    const item = cell ? cellToItemMap.get(cell.id) : null;
    
    if (item) {
      // Hide tooltip before navigating
      hideTooltip();
      window.location.hash = `#/category/scarabs/item/${item.id}`;
    }
  });
  
  canvas.style.cursor = 'pointer';
}

/**
 * Render simple grid for non-scarab categories
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array} items - Array of items
 * @param {string} categoryId - Category identifier
 */
async function renderSimpleGrid(canvas, items, categoryId) {
  const ctx = canvas.getContext('2d');
  
  // Set canvas size
  const container = canvas.parentElement;
  const containerWidth = container.clientWidth || 1200;
  const containerHeight = Math.max(600, Math.ceil(items.length / 12) * 60);
  
  canvas.width = containerWidth;
  canvas.height = containerHeight;
  
  // Stash tab styling
  const backgroundColor = '#1a1a1a';
  const borderColor = '#3a3a3a';
  const itemSize = 50;
  const itemSpacing = 5;
  const padding = 20;
  const itemsPerRow = Math.floor((containerWidth - padding * 2) / (itemSize + itemSpacing));
  
  // Clear canvas
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
  
  // Draw items in grid
  if (items.length === 0) {
    ctx.fillStyle = '#888888';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No items in this category', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  items.forEach((item, index) => {
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    
    const x = padding + col * (itemSize + itemSpacing);
    const y = padding + row * (itemSize + itemSpacing);
    
    drawItemSlot(ctx, x, y, itemSize, item, categoryId);
  });
  
  // Add click handler
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const clickedItem = getItemAtPosition(x, y, items, itemsPerRow, itemSize, itemSpacing, padding);
    if (clickedItem) {
      window.location.hash = `#/category/${categoryId}/item/${clickedItem.id}`;
    }
  });
  
  canvas.style.cursor = 'pointer';
}

/**
 * Draw an item slot (for simple grid)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} size - Item slot size
 * @param {Object} item - Item object
 * @param {string} categoryId - Category identifier
 */
function drawItemSlot(ctx, x, y, size, item, _categoryId) {
  // Item slot background
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(x, y, size, size);
  
  // Item slot border
  ctx.strokeStyle = '#4a4a4a';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, size, size);
  
  // Item name (truncated)
  ctx.fillStyle = '#d4d4d4';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const maxWidth = size - 4;
  const itemName = truncateText(ctx, item.name, maxWidth);
  ctx.fillText(itemName, x + size / 2, y + size / 2);
  
  // Item level indicator
  if (item.dropLevel) {
    ctx.fillStyle = '#af6025';
    ctx.beginPath();
    ctx.arc(x + size - 8, y + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.dropLevel.toString(), x + size - 8, y + 10);
  }
}

/**
 * Truncate text to fit width
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} text - Text to truncate
 * @param {number} maxWidth - Maximum width
 * @returns {string} Truncated text
 */
function truncateText(ctx, text, maxWidth) {
  const metrics = ctx.measureText(text);
  if (metrics.width <= maxWidth) {
    return text;
  }
  
  let truncated = text;
  while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  
  return truncated + '...';
}

/**
 * Get item at canvas position (for simple grid)
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Array} items - Array of items
 * @param {number} itemsPerRow - Items per row
 * @param {number} itemSize - Item size
 * @param {number} itemSpacing - Item spacing
 * @param {number} padding - Padding
 * @returns {Object|null} Item at position or null
 */
function getItemAtPosition(x, y, items, itemsPerRow, itemSize, itemSpacing, padding) {
  const col = Math.floor((x - padding) / (itemSize + itemSpacing));
  const row = Math.floor((y - padding) / (itemSize + itemSpacing));
  
  if (col < 0 || row < 0) {
    return null;
  }
  
  const index = row * itemsPerRow + col;
  if (index >= 0 && index < items.length) {
    return items[index];
  }
  
  return null;
}
