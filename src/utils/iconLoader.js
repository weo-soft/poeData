/**
 * Icon loading utility with caching
 * Loads item icons for list view and other visualizations
 */

// Icon cache to prevent redundant loads
const iconCache = new Map();

// Placeholder icon data URL (simple transparent 1x1 PNG)
const PLACEHOLDER_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * Get list of icon directories to try for a category
 * For merged categories, returns multiple directories
 * @param {string} categoryId - Category identifier
 * @param {string} baseDir - Base directory from getIconDirectory
 * @returns {Array<string>} Array of directory paths to try
 */
function getIconDirectoriesForCategory(categoryId, baseDir) {
  // For merged categories, try multiple subdirectories
  if (categoryId === 'breach') {
    return ['breachstones', 'breachSplinters'];
  }
  
  if (categoryId === 'legion') {
    return ['legionSplinters', 'legionEmblems'];
  }
  
  // For other categories, just return the base directory
  return [baseDir];
}

/**
 * Map category ID to icon directory name
 * Some categories use kebab-case IDs but camelCase directory names
 * @param {string} categoryId - Category identifier (kebab-case)
 * @returns {string} Icon directory name
 */
function getIconDirectory(categoryId) {
  // Special mappings for categories with different directory names
  const directoryMap = {
    'breach': 'breach', // Will try multiple subdirectories in loadItemIcon
    'delirium-orbs': 'deliriumOrbs',
    'legion': 'legion', // Will try multiple subdirectories in loadItemIcon
    'divination-cards': 'divinationcards'
  };
  
  // Return mapped directory if exists, otherwise use categoryId as-is
  return directoryMap[categoryId] || categoryId;
}

/**
 * Get icon URL for an item
 * @param {Object} item - Item object with id and optional icon field
 * @param {string} categoryId - Category identifier
 * @returns {string} Icon URL
 */
export function getIconUrl(item, categoryId) {
  if (!item || !item.id) {
    return PLACEHOLDER_ICON;
  }

  // Use custom icon filename if provided, otherwise use item ID
  const iconFilename = item.icon || `${item.id}.png`;
  
  // Get correct icon directory name
  const iconDir = getIconDirectory(categoryId);
  
  return `/assets/images/${iconDir}/${iconFilename}`;
}

/**
 * Load item icon with caching and fallback support
 * @param {Object} item - Item object with id and optional icon field
 * @param {string} categoryId - Category identifier
 * @returns {Promise<HTMLImageElement>} Loaded image or placeholder
 */
export async function loadItemIcon(item, categoryId) {
  if (!item || !item.id) {
    return createPlaceholderImage();
  }

  const cacheKey = `${categoryId}:${item.id}`;
  
  // Check cache first
  if (iconCache.has(cacheKey)) {
    const cached = iconCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    // Cached null means we tried and failed, return placeholder
    return createPlaceholderImage();
  }

  // Use custom icon filename if provided, otherwise use item ID
  const iconFilename = item.icon || `${item.id}.png`;
  
  // Get correct icon directory name
  const iconDir = getIconDirectory(categoryId);
  
  // For merged categories, try multiple directories
  const directoriesToTry = getIconDirectoriesForCategory(categoryId, iconDir);
  
  for (const dir of directoriesToTry) {
    // Try primary path
    const imagePath = `/assets/images/${dir}/${iconFilename}`;
    
    try {
      const image = await loadImage(imagePath);
      iconCache.set(cacheKey, image);
      return image;
    } catch (e) {
      // Continue to next directory
      continue;
    }
  }
  
  // All directories failed, cache null and return placeholder
  console.warn(`Failed to load icon for item ${item.id} in category ${categoryId} from any directory`);
  iconCache.set(cacheKey, null);
  return createPlaceholderImage();
}

/**
 * Load image from URL
 * @param {string} src - Image source URL
 * @returns {Promise<HTMLImageElement>} Loaded image
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Create placeholder image
 * @returns {HTMLImageElement} Placeholder image element
 */
function createPlaceholderImage() {
  const img = new Image();
  img.src = PLACEHOLDER_ICON;
  return img;
}

/**
 * Clear icon cache
 * @param {string} [categoryId] - Optional category ID to clear specific cache entries
 */
export function clearIconCache(categoryId) {
  if (categoryId) {
    // Clear all entries for this category
    const keysToDelete = [];
    for (const key of iconCache.keys()) {
      if (key.startsWith(`${categoryId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => iconCache.delete(key));
  } else {
    iconCache.clear();
  }
}

/**
 * Get cached icon synchronously (if already loaded)
 * @param {Object} item - Item object with id
 * @param {string} categoryId - Category identifier
 * @returns {HTMLImageElement|null} Cached image or null if not cached
 */
export function getCachedIcon(item, categoryId) {
  if (!item || !item.id) {
    return null;
  }

  const cacheKey = `${categoryId}:${item.id}`;
  return iconCache.get(cacheKey) || null;
}
