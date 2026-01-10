/**
 * Data loading service - Load JSON data from /public/data/
 */

// Cache for loaded data
const dataCache = new Map();

/**
 * Load category data from JSON file
 * @param {string} categoryId - Category identifier
 * @returns {Promise<Array>} Array of item objects
 */
export async function loadCategoryData(categoryId) {
  // Check cache first
  if (dataCache.has(categoryId)) {
    return dataCache.get(categoryId);
  }

  try {
    // Construct file path
    const filename = getCategoryFilename(categoryId);
    const response = await fetch(`/data/${filename}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Category "${categoryId}" not found`);
      }
      throw new Error(`Failed to load category data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate it's an array
    if (!Array.isArray(data)) {
      throw new Error(`Invalid data format: expected array, got ${typeof data}`);
    }
    
    // Cache the data
    dataCache.set(categoryId, data);
    
    return data;
  } catch (error) {
    console.error(`Error loading category data for ${categoryId}:`, error);
    throw error;
  }
}

/**
 * Get category filename from category ID
 * @param {string} categoryId - Category identifier
 * @returns {string} Filename (e.g., "scarabDetails.json")
 */
function getCategoryFilename(categoryId) {
  // Convert category ID to filename
  // "scarabs" -> "scarabDetails.json" (remove trailing 's')
  // "divination-cards" -> "divinationCardDetails.json" (remove trailing 's' from "cards" too)
  
  const parts = categoryId.split('-');
  const baseName = parts.map((part, index) => {
    if (index === 0) {
      // Remove trailing 's' if present (scarabs -> scarab)
      return part.replace(/s$/, '');
    }
    // For subsequent parts, capitalize first letter and remove trailing 's' if present
    // "cards" -> "Card"
    const capitalized = part.charAt(0).toUpperCase() + part.slice(1);
    return capitalized.replace(/s$/, '');
  }).join('');
  
  // Keep first letter lowercase to match actual filenames
  // scarabDetails.json, divinationCardDetails.json
  
  return `${baseName}Details.json`;
}

/**
 * Get item from category by ID
 * @param {string} categoryId - Category identifier
 * @param {string} itemId - Item identifier
 * @returns {Promise<Object|null>} Item object or null if not found
 */
export async function getItemById(categoryId, itemId) {
  const items = await loadCategoryData(categoryId);
  return items.find(item => item.id === itemId) || null;
}

/**
 * Clear data cache
 * @param {string} [categoryId] - Optional category ID to clear specific cache
 */
export function clearCache(categoryId) {
  if (categoryId) {
    dataCache.delete(categoryId);
  } else {
    dataCache.clear();
  }
}

/**
 * Get all available categories from data directory
 * This is a simplified version - in production, you might want to
 * maintain a categories configuration file
 * @returns {Promise<Array>} Array of category objects
 */
export async function getAvailableCategories() {
  // For now, return hardcoded categories based on existing data files
  // In a real implementation, you might scan the data directory or
  // maintain a categories.json file
  const categories = [
    {
      id: 'scarabs',
      name: 'Scarabs',
      description: 'Scarabs modify map areas'
    },
    {
      id: 'divination-cards',
      name: 'Divination Cards',
      description: 'Collectible cards that can be turned in for rewards'
    }
  ];
  
  // Load item counts
  for (const category of categories) {
    try {
      const items = await loadCategoryData(category.id);
      category.itemCount = items.length;
    } catch (error) {
      console.warn(`Could not load item count for ${category.id}:`, error);
      category.itemCount = 0;
    }
  }
  
  return categories;
}

