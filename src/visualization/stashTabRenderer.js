/**
 * HTML5 Canvas stash tab visualization renderer
 * Renders items in a grid layout similar to Path of Exile stash tabs
 * For scarabs, uses base image with cell overlay system
 */

import { loadImage, clearCanvas, drawCellHighlight, drawCellBorder } from '../utils/canvasUtils.js';
import { 
  createCellsFromGroups, 
  createCellsFromGroupsForCategory,
  getCellAtPosition, 
  IMAGE_DIMENSIONS, 
  SCARAB_ORDER_CONFIG,
  getGridConfig,
  getCategoryTabImage,
  getCategoryImageDirectory
} from '../config/gridConfig.js';

/**
 * Get list of image directories to try for a category
 * For merged categories, returns multiple directories
 * @param {string} categoryId - Category identifier
 * @returns {Array<string>} Array of directory paths to try
 */
function getImageDirectoriesForCategory(categoryId) {
  const baseDir = getCategoryImageDirectory(categoryId);
  if (!baseDir) {
    return [];
  }
  
  // For merged categories, try multiple subdirectories
  if (categoryId === 'breach') {
    return [
      '/assets/images/breachstones/',
      '/assets/images/breachSplinters/'
    ];
  }
  
  if (categoryId === 'legion') {
    return [
      '/assets/images/legionSplinters/',
      '/assets/images/legionEmblems/'
    ];
  }
  
  // For other categories, just return the base directory
  return [baseDir];
}
import { showTooltip, hideTooltip, updateTooltipPosition } from '../utils/tooltip.js';

let baseImage = null;
const tabImageCache = new Map(); // Cache for tab background images by category ID
const itemImageCache = new Map();
let cellDefinitions = [];
const cellToItemMap = new Map();
const itemToCellMap = new Map();
let highlightedItemId = null;
let highlightedItemIds = new Set(); // Set of item IDs to highlight (for filtered items)

/**
 * Render stash tab with items
 * @param {HTMLCanvasElement} canvas - Canvas element to render into
 * @param {Array} items - Array of item objects
 * @param {string} categoryId - Category identifier
 * @param {Set<string>} filteredItemIds - Optional set of item IDs to highlight (for filtered items)
 */
export async function renderStashTab(canvas, items, categoryId, filteredItemIds = null) {
  // Store filtered item IDs for highlighting
  if (filteredItemIds) {
    highlightedItemIds = filteredItemIds;
  } else {
    highlightedItemIds.clear();
  }
  
  // For scarabs, use the grid-based approach with base image (backward compatibility)
  if (categoryId === 'scarabs') {
    await renderScarabGrid(canvas, items);
  } else {
    // Check if category has grid configuration
    const gridConfig = getGridConfig(categoryId);
    if (gridConfig) {
      // Use category-specific grid rendering
      await renderCategoryGrid(canvas, items, categoryId, gridConfig);
    } else {
      // For categories without grid config, use simple grid layout
      await renderSimpleGrid(canvas, items, categoryId);
    }
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
    
    // Map items to cells (using SCARAB_ORDER_CONFIG)
    const scarabGridConfig = {
      itemOrderConfig: SCARAB_ORDER_CONFIG
    };
    mapItemsToCells(items, scarabGridConfig, 'scarabs');
    
    // Preload item images
    await preloadItemImages(items, 'scarabs');
    
    // Render grid
    renderGrid(canvas, items, 'scarabs');
    
    // Setup event handlers
    setupEventHandlers(canvas, items, 'scarabs');
    
  } catch (error) {
    console.error('Error rendering scarab grid:', error);
    // Fallback to simple grid if base image fails
    await renderSimpleGrid(canvas, items, 'scarabs');
  }
}

/**
 * Render category grid with base image and cell overlay (generic version)
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array} items - Array of items
 * @param {string} categoryId - Category identifier
 * @param {Object} gridConfig - Grid configuration object
 */
async function renderCategoryGrid(canvas, items, categoryId, gridConfig) {
  try {
    // Load tab image with caching
    let tabImage = null;
    if (tabImageCache.has(categoryId)) {
      tabImage = tabImageCache.get(categoryId);
      baseImage = tabImage;
    } else {
      // Load base image - try public first, then src
      const tabImagePath = getCategoryTabImage(categoryId);
      if (!tabImagePath) {
        throw new Error(`No tab image path found for category: ${categoryId}`);
      }
      
      let baseImagePath = tabImagePath;
      try {
        tabImage = await loadImage(baseImagePath);
      } catch (e) {
        // Fallback to src path
        baseImagePath = tabImagePath.replace('/assets/', '/src/assets/');
        tabImage = await loadImage(baseImagePath);
      }
      
      // Cache the loaded image
      tabImageCache.set(categoryId, tabImage);
      baseImage = tabImage;
    }
    
    // Setup canvas to match image dimensions
    const imageDimensions = gridConfig.imageDimensions || { width: tabImage.width, height: tabImage.height };
    setupCanvas(canvas, imageDimensions.width, imageDimensions.height);
    
    // Create cell definitions from grid config
    cellDefinitions = createCellsFromGroupsForCategory(gridConfig);
    
    // Map items to cells
    mapItemsToCells(items, gridConfig, categoryId);
    
    // Preload item images
    await preloadItemImages(items, categoryId);
    
    // Render grid
    renderGrid(canvas, items, categoryId);
    
    // Setup event handlers
    setupEventHandlers(canvas, items, categoryId);
    
  } catch (error) {
    console.error(`Error rendering grid for category ${categoryId}:`, error);
    // Fallback to simple grid if tab image fails to load
    await renderSimpleGrid(canvas, items, categoryId);
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
  
  // Mobile scaling: scale canvas to fit viewport width while maintaining aspect ratio
  const isMobile = window.innerWidth < 768;
  let displayWidth = width;
  let displayHeight = height;
  let scale = 1;
  
  if (isMobile) {
    const maxWidth = window.innerWidth - 32; // Account for padding
    if (width > maxWidth) {
      scale = maxWidth / width;
      displayWidth = maxWidth;
      displayHeight = height * scale;
    }
  }
  
  // Set display size
  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;
  
  // Set actual canvas size (for high DPI displays)
  const dpr = window.devicePixelRatio || 1;
  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;
  ctx.scale(dpr, dpr);
  
  // Apply scaling transform if needed for mobile
  if (scale !== 1) {
    ctx.scale(scale, scale);
  }
  
  return { scale, displayWidth, displayHeight };
}

/**
 * Map items to cells based on type
 * @param {Array} items - Array of items
 * @param {Object} gridConfig - Grid configuration object
 * @param {string} categoryId - Category identifier
 */
function mapItemsToCells(items, gridConfig, categoryId) {
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
    const itemType = getItemType(item, gridConfig, categoryId);
    if (itemType) {
      if (!itemsByType.has(itemType)) {
        itemsByType.set(itemType, []);
      }
      itemsByType.get(itemType).push(item);
    }
  });
  
  // Get item order config from grid config or fallback to SCARAB_ORDER_CONFIG
  const orderConfig = gridConfig?.itemOrderConfig || SCARAB_ORDER_CONFIG;
  
  // Sort items within each type
  // Use explicit order if configured, otherwise sort by drop weight (low to high)
  itemsByType.forEach((typeItems, type) => {
    const explicitOrder = orderConfig[type];
    
    if (explicitOrder && Array.isArray(explicitOrder) && explicitOrder.length > 0) {
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
  
  // Special handling for essences
  if (categoryId === 'essences' && (cellsByType.has('essence') || cellsByType.has('essence-right') || cellsByType.has('essence-special'))) {
    // Combine all essence cells (left-expanding, right-expanding, and special)
    const essenceCells = [
      ...(cellsByType.get('essence') || []), 
      ...(cellsByType.get('essence-right') || []),
      ...(cellsByType.get('essence-special') || [])
    ];
    // Get all essence items (they may be under 'essence', 'essence-right', or 'essence-special' type)
    const essenceItems = [
      ...(itemsByType.get('essence') || []), 
      ...(itemsByType.get('essence-right') || []),
      ...(itemsByType.get('essence-special') || [])
    ];
    // Also check if items are grouped under other types but are actually essences
    itemsByType.forEach((items, type) => {
      if (type !== 'essence' && type !== 'essence-right' && type !== 'essence-special') {
        items.forEach(item => {
          if (item.id && item.id.toLowerCase().includes('essence')) {
            essenceItems.push(item);
          }
        });
      }
    });
    
    // Group essences by essence type (extract from ID: "of-{type}")
    const essencesByType = new Map();
    essenceItems.forEach(item => {
      // Extract essence type from ID (e.g., "muttering-essence-of-anger" -> "anger")
      // Handle special cases like "essence-of-delirium" (no prefix)
      let essenceType = null;
      const idLower = item.id.toLowerCase();
      const ofMatch = idLower.match(/-of-([^-]+)$/);
      if (ofMatch) {
        essenceType = ofMatch[1];
      } else if (idLower.startsWith('essence-of-')) {
        essenceType = idLower.replace('essence-of-', '');
      }
      
      if (essenceType) {
        if (!essencesByType.has(essenceType)) {
          essencesByType.set(essenceType, []);
        }
        essencesByType.get(essenceType).push(item);
      }
    });
    
    // Sort essences within each type by tier (ascending: tier1=lowest, tier7=highest)
    essencesByType.forEach((essences, essenceType) => {
      essences.sort((a, b) => {
        const tierA = a.tier || 0;
        const tierB = b.tier || 0;
        return tierA - tierB;
      });
      // Don't reverse here - we'll handle ordering based on cell type
    });
    
    // Group cells by row and by type (essence vs essence-right)
    const cellsByRow = new Map();
    const cellTypeByRow = new Map(); // Track whether row is left-expanding or right-expanding
    essenceCells.forEach(cell => {
      if (!cellsByRow.has(cell.row)) {
        cellsByRow.set(cell.row, []);
      }
      cellsByRow.get(cell.row).push(cell);
      // Determine cell type from the first cell in the row
      if (!cellTypeByRow.has(cell.row)) {
        cellTypeByRow.set(cell.row, cell.groupType);
      }
    });
    
    // Sort cells within each row by x position (left to right)
    cellsByRow.forEach((cells, row) => {
      cells.sort((a, b) => a.x - b.x);
    });
    
    // Map essence types to rows in the specified order
    // Left-expanding rows (0-11): Greed, Contempt, Hatred, Woe, Fear, Anger, Torment, Sorrow, Rage, Suffering, Wrath, Doubt
    // Right-expanding rows (12-19): Loathing, Zeal, Anguish, Spite, Scorn, Envy, Misery, Dread
    const leftExpandingOrder = ['greed', 'contempt', 'hatred', 'woe', 'fear', 'anger', 'torment', 'sorrow', 'rage', 'suffering', 'wrath', 'doubt'];
    const rightExpandingOrder = ['loathing', 'zeal', 'anguish', 'spite', 'scorn', 'envy', 'misery', 'dread'];
    const rows = Array.from(cellsByRow.keys()).sort((a, b) => a - b);
    
    // Separate rows into left-expanding, right-expanding, and special
    const leftExpandingRows = [];
    const rightExpandingRows = [];
    const specialEssenceRows = [];
    rows.forEach(row => {
      const cellType = cellTypeByRow.get(row);
      if (cellType === 'essence-right') {
        rightExpandingRows.push(row);
      } else if (cellType === 'essence-special') {
        specialEssenceRows.push(row);
      } else {
        leftExpandingRows.push(row);
      }
    });
    
    // Map left-expanding essence types
    const leftExpandingTypes = Array.from(essencesByType.keys()).filter(type => 
      leftExpandingOrder.includes(type.toLowerCase())
    ).sort((a, b) => {
      const indexA = leftExpandingOrder.indexOf(a.toLowerCase());
      const indexB = leftExpandingOrder.indexOf(b.toLowerCase());
      return indexA - indexB;
    });
    
    leftExpandingTypes.forEach((essenceType, index) => {
      if (index < leftExpandingRows.length) {
        const row = leftExpandingRows[index];
        const rowCells = cellsByRow.get(row);
        const allTypeEssences = essencesByType.get(essenceType);
        
        // For left-expanding: reverse so highest tier is at cell-0 (leftmost)
        const typeEssences = [...allTypeEssences].reverse();
        
        const maxAssignments = Math.min(rowCells.length, typeEssences.length);
        for (let i = 0; i < maxAssignments; i++) {
          const cell = rowCells[i];
          const item = typeEssences[i];
          
          if (cell && item) {
            cellToItemMap.set(cell.id, item);
            itemToCellMap.set(item.id, cell.id);
          }
        }
      }
    });
    
    // Map right-expanding essence types
    const rightExpandingTypes = Array.from(essencesByType.keys()).filter(type => 
      rightExpandingOrder.includes(type.toLowerCase())
    ).sort((a, b) => {
      const indexA = rightExpandingOrder.indexOf(a.toLowerCase());
      const indexB = rightExpandingOrder.indexOf(b.toLowerCase());
      return indexA - indexB;
    });
    
    rightExpandingTypes.forEach((essenceType, index) => {
      if (index < rightExpandingRows.length) {
        const row = rightExpandingRows[index];
        const rowCells = cellsByRow.get(row);
        const allTypeEssences = essencesByType.get(essenceType);
        
        // For right-expanding: keep sorted order (lowest tier first, highest tier last)
        // cell-0 (leftmost) = lowest tier, rightmost cell = highest tier
        const typeEssences = allTypeEssences;
        
        const maxAssignments = Math.min(rowCells.length, typeEssences.length);
        for (let i = 0; i < maxAssignments; i++) {
          const cell = rowCells[i];
          const item = typeEssences[i];
          
          if (cell && item) {
            cellToItemMap.set(cell.id, item);
            itemToCellMap.set(item.id, cell.id);
          }
        }
      }
    });
    
    // Map special essences (each in their own row, same column)
    // Order: Insanity, Horror, Delirium, Hysteria
    const specialEssenceOrder = ['insanity', 'horror', 'delirium', 'hysteria'];
    
    specialEssenceOrder.forEach((essenceType, index) => {
      if (index < specialEssenceRows.length) {
        const row = specialEssenceRows[index];
        const rowCells = cellsByRow.get(row);
        const allTypeEssences = essencesByType.get(essenceType);
        
        // Special essences are single-cell rows, just map the first (and only) essence
        if (rowCells.length > 0 && allTypeEssences && allTypeEssences.length > 0) {
          const cell = rowCells[0];
          const item = allTypeEssences[0]; // Special essences typically have only one tier (tier 8)
          
          if (cell && item) {
            cellToItemMap.set(cell.id, item);
            itemToCellMap.set(item.id, cell.id);
          }
        }
      }
    });
  } else {
    // Map items to cells (default behavior for other categories)
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
}

/**
 * Get item type from item ID or name
 * @param {Object} item - Item object
 * @param {Object} gridConfig - Grid configuration object
 * @param {string} categoryId - Category identifier
 * @returns {string|null} Item type or null
 */
function getItemType(item, gridConfig, categoryId) {
  if (!item || !item.id) return null;
  
  const idLower = item.id.toLowerCase();
  
  // Get order config from grid config or fallback to SCARAB_ORDER_CONFIG
  const orderConfig = gridConfig?.itemOrderConfig || SCARAB_ORDER_CONFIG;
  
  // Special handling for scarabs (backward compatibility)
  if (categoryId === 'scarabs') {
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
      
      // Try partial match
      for (const type of groupTypes) {
        if (extractedType.includes(type.toLowerCase()) || type.toLowerCase().includes(extractedType)) {
          return type;
        }
      }
    }
    } else {
      // For essences, check if it's a special, right-expanding, or left-expanding type
      if (categoryId === 'essences') {
        const rightExpandingTypes = ['loathing', 'zeal', 'anguish', 'spite', 'scorn', 'envy', 'misery', 'dread'];
        const specialEssenceTypes = ['insanity', 'horror', 'delirium', 'hysteria'];
        const idLower = item.id.toLowerCase();
        
        // Check for special essences first (they have format "essence-of-{type}")
        if (idLower.startsWith('essence-of-')) {
          const essenceType = idLower.replace('essence-of-', '');
          if (specialEssenceTypes.includes(essenceType)) {
            return 'essence-special';
          }
        }
        
        // Check for right-expanding types
        const ofMatch = idLower.match(/-of-([^-]+)$/);
        if (ofMatch) {
          const essenceType = ofMatch[1];
          if (rightExpandingTypes.includes(essenceType)) {
            return 'essence-right';
          }
        } else if (idLower.startsWith('essence-of-')) {
          const essenceType = idLower.replace('essence-of-', '');
          if (rightExpandingTypes.includes(essenceType)) {
            return 'essence-right';
          }
        }
        
        // Default to 'essence' for left-expanding types
        if (idLower.includes('essence')) {
          return 'essence';
        }
      }
      
      // For breach category, explicitly check for splinters and breachstones
      if (categoryId === 'breach') {
        if (idLower.includes('splinter')) {
          return 'splinter';
        }
        if (idLower.includes('breachstone')) {
          return 'breachstone';
        }
      }
      
      // For legion category, explicitly check for splinters and emblems
      if (categoryId === 'legion') {
        if (idLower.includes('splinter')) {
          return 'splinter';
        }
        if (idLower.includes('emblem')) {
          return 'emblem';
        }
      }
      
      // For other categories, try to match item ID/name to group types
      // Get all group types from cell definitions
      const groupTypes = cellDefinitions
        .map(c => c.groupType)
        .filter(t => t);
      
      // Check if item ID matches any group type
      for (const type of groupTypes) {
        if (idLower.includes(type.toLowerCase()) || type.toLowerCase().includes(idLower)) {
          return type;
        }
      }
      
      // Check if item name contains group type
      const nameLower = (item.name || '').toLowerCase();
      for (const type of groupTypes) {
        if (nameLower.includes(type.toLowerCase())) {
          return type;
        }
      }
      
      // If only one group type exists, use it as default
      if (groupTypes.length === 1) {
        return groupTypes[0];
      }
    }
  
  // If no match, return null (will be unmapped)
  return null;
}

/**
 * Preload item images
 * @param {Array} items - Array of items
 * @param {string} categoryId - Category identifier
 */
async function preloadItemImages(items, categoryId) {
  const itemsToLoad = Array.from(cellToItemMap.values());
  const loadPromises = itemsToLoad.map(item => loadItemImage(item, categoryId));
  await Promise.allSettled(loadPromises);
}

/**
 * Load item image
 * @param {Object} item - Item object
 * @param {string} categoryId - Category identifier
 * @returns {Promise<HTMLImageElement|null>} Loaded image or null
 */
async function loadItemImage(item, categoryId) {
  if (!item || !item.id) return null;
  
  // Check cache (key includes category to avoid conflicts)
  const cacheKey = `${categoryId}:${item.id}`;
  if (itemImageCache.has(cacheKey)) {
    return itemImageCache.get(cacheKey);
  }
  
  try {
    // Get category-specific image directory
    const imageDir = getCategoryImageDirectory(categoryId);
    if (!imageDir) {
      // Fallback to scarabs for backward compatibility
      const fallbackPath = `/assets/images/scarabs/${item.id}.png`;
      try {
        const image = await loadImage(fallbackPath);
        itemImageCache.set(cacheKey, image);
        return image;
      } catch (e) {
        // Try src path
        const srcPath = `/src/assets/images/scarabs/${item.id}.png`;
        const image = await loadImage(srcPath);
        itemImageCache.set(cacheKey, image);
        return image;
      }
    }
    
    // For merged categories, try multiple directories
    const directoriesToTry = getImageDirectoriesForCategory(categoryId);
    
    for (const dir of directoriesToTry) {
      // Try public path first, then src path
      let imagePath = `${dir}${item.id}.png`;
      let image;
      try {
        image = await loadImage(imagePath);
        itemImageCache.set(cacheKey, image);
        return image;
      } catch (e) {
        // Try src path
        const srcImageDir = dir.replace('/assets/', '/src/assets/');
        imagePath = `${srcImageDir}${item.id}.png`;
        try {
          image = await loadImage(imagePath);
          itemImageCache.set(cacheKey, image);
          return image;
        } catch (e2) {
          // Continue to next directory
          continue;
        }
      }
    }
    
    // If all directories failed, return null
    console.warn(`Failed to load image for item ${item.id} in category ${categoryId} from any directory`);
    itemImageCache.set(cacheKey, null);
    return null;
  } catch (error) {
    console.warn(`Failed to load image for item ${item.id} in category ${categoryId}:`, error);
    itemImageCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Render the grid
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array} items - Array of items
 * @param {string} categoryId - Category identifier
 */
function renderGrid(canvas, items, categoryId) {
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
  
  // Draw cell borders for all cells (hidden)
  // cellDefinitions.forEach(cell => {
  //   drawCellBorder(ctx, cell.x, cell.y, cell.width, cell.height, '#666666', 1);
  // });
  
  // Draw cell IDs for debugging (hidden)
  // cellDefinitions.forEach(cell => {
  //   drawCellId(ctx, cell);
  // });
  
  // Draw item overlays
  cellDefinitions.forEach(cell => {
    const item = cellToItemMap.get(cell.id);
    if (item) {
      drawCellOverlay(ctx, cell, item, categoryId);
      
      // Draw highlight if this item is highlighted (hover) or filtered
      const isHovered = highlightedItemId === item.id;
      const isFiltered = highlightedItemIds.has(item.id);
      
      if (isHovered) {
        // Hover highlight (gold, more prominent)
        drawCellHighlight(ctx, cell.x, cell.y, cell.width, cell.height, '#ffd700', 0.6);
        drawCellBorder(ctx, cell.x, cell.y, cell.width, cell.height, '#ffd700', 3);
      } else if (isFiltered) {
        // Filter highlight (lighter gold/yellow, less prominent)
        drawCellHighlight(ctx, cell.x, cell.y, cell.width, cell.height, '#ffd700', 0.3);
        drawCellBorder(ctx, cell.x, cell.y, cell.width, cell.height, '#ffd700', 2);
      }
    }
  });
}

/**
 * Draw cell ID for debugging
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} cell - Cell definition
 */
function drawCellId(ctx, cell) {
  ctx.save();
  ctx.font = '10px monospace';
  ctx.fillStyle = '#ffff00'; // Yellow text for visibility
  ctx.strokeStyle = '#000000'; // Black outline for contrast
  ctx.lineWidth = 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  // Draw cell ID in top-left corner with black outline for readability
  const text = cell.id;
  const x = cell.x + 2;
  const y = cell.y + 2;
  
  // Draw text with outline
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  
  // Also draw row and col info
  const infoText = `R${cell.row}C${cell.col}`;
  ctx.font = '8px monospace';
  ctx.strokeText(infoText, x, y + 12);
  ctx.fillText(infoText, x, y + 12);
  
  ctx.restore();
}

/**
 * Draw cell overlay with item image
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} cell - Cell definition
 * @param {Object} item - Item object
 * @param {string} categoryId - Category identifier
 */
function drawCellOverlay(ctx, cell, item, categoryId) {
  // Draw item image using category-aware cache key
  const cacheKey = `${categoryId}:${item.id}`;
  const itemImage = itemImageCache.get(cacheKey);
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
 * @param {string} categoryId - Category identifier
 */
function setupEventHandlers(canvas, items, categoryId) {
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
    
    // Update cursor based on whether hovering over an item
    canvas.style.cursor = item ? 'pointer' : 'default';
    
    // Update tooltip position
    if (currentItem) {
      updateTooltipPosition(e.clientX, e.clientY);
    }
    
    // Show tooltip for new item
    if (item && item !== currentItem) {
      currentItem = item;
      highlightedItemId = item.id;
      showTooltip(item, e.clientX, e.clientY, categoryId);
      renderGrid(canvas, items, categoryId);
    } else if (!item && currentItem) {
      currentItem = null;
      highlightedItemId = null;
      hideTooltip();
      renderGrid(canvas, items, categoryId);
    }
  });
  
  // Mouse leave handler
  canvas.addEventListener('mouseleave', () => {
    currentItem = null;
    highlightedItemId = null;
    hideTooltip();
    renderGrid(canvas, items, categoryId);
  });
  
  // Click handler
  canvas.addEventListener('click', (e) => {
    const { x, y } = getCanvasCoordinates(e);
    const cell = getCellAtPosition(cellDefinitions, x, y);
    const item = cell ? cellToItemMap.get(cell.id) : null;
    
    if (item) {
      // Hide tooltip before navigating
      hideTooltip();
      window.location.hash = `#/category/${categoryId}/item/${item.id}`;
    }
  });
  
  // Set cursor style - will be updated dynamically based on hover
  canvas.style.cursor = 'default';
}

/**
 * Render simple grid for non-scarab categories
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array} items - Array of items
 * @param {string} categoryId - Category identifier
 */
async function renderSimpleGrid(canvas, items, categoryId) {
  // Set canvas size - responsive to container
  const container = canvas.parentElement;
  const isMobile = window.innerWidth < 768;
  const baseWidth = isMobile ? Math.min(window.innerWidth - 32, 1200) : (container.clientWidth || 1200);
  const containerWidth = baseWidth;
  
  // Stash tab styling
  const backgroundColor = '#1a1a1a';
  const borderColor = '#3a3a3a';
  const itemSize = 50;
  const itemSpacing = 5;
  const padding = 20;
  const itemsPerRow = Math.floor((containerWidth - padding * 2) / (itemSize + itemSpacing));
  const containerHeight = Math.max(400, Math.ceil(items.length / itemsPerRow) * 60);
  
  // Use setupCanvas for consistent scaling
  setupCanvas(canvas, containerWidth, containerHeight);
  
  // Get context after setupCanvas (it may have scaled)
  const finalCtx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  finalCtx.scale(dpr, dpr);
  
  // Clear canvas
  finalCtx.fillStyle = backgroundColor;
  finalCtx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  
  // Draw border
  finalCtx.strokeStyle = borderColor;
  finalCtx.lineWidth = 2;
  finalCtx.strokeRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  
  // Draw items in grid
  const logicalWidth = canvas.width / dpr;
  const logicalHeight = canvas.height / dpr;
  
  if (items.length === 0) {
    finalCtx.fillStyle = '#888888';
    finalCtx.font = '16px sans-serif';
    finalCtx.textAlign = 'center';
    finalCtx.fillText('No items in this category', logicalWidth / 2, logicalHeight / 2);
    return;
  }
  
  items.forEach((item, index) => {
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    
    const x = padding + col * (itemSize + itemSpacing);
    const y = padding + row * (itemSize + itemSpacing);
    
    const isFiltered = highlightedItemIds.has(item.id);
    drawItemSlot(finalCtx, x, y, itemSize, item, categoryId, isFiltered);
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
 * @param {boolean} isFiltered - Whether this item matches the filter
 */
function drawItemSlot(ctx, x, y, size, item, _categoryId, isFiltered = false) {
  // Item slot background
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(x, y, size, size);
  
  // Item slot border - highlight if filtered
  if (isFiltered) {
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
  } else {
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 1;
  }
  ctx.strokeRect(x, y, size, size);
  
  // Add highlight overlay if filtered
  if (isFiltered) {
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.fillRect(x, y, size, size);
  }
  
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
