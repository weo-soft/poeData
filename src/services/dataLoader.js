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
    
    let data = await response.json();
    
    // Validate it's an array
    if (!Array.isArray(data)) {
      throw new Error(`Invalid data format: expected array, got ${typeof data}`);
    }
    
    // Special handling for scarabs - merge weight data from dataset
    if (categoryId === 'scarabs') {
      data = await mergeScarabWeights(data);
    }
    
    // Special handling for divination-cards - merge weight data from dataset
    if (categoryId === 'divination-cards') {
      data = await mergeDivinationCardWeights(data);
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
 * Merge weight data from dataset into scarab items
 * @param {Array} items - Array of scarab items
 * @returns {Promise<Array>} Items with dropWeight merged from dataset
 */
async function mergeScarabWeights(items) {
  try {
    // Load the dataset
    const datasetResponse = await fetch('/data/scarabs/datasets/dataset1.json');
    
    if (!datasetResponse.ok) {
      console.warn('Could not load scarab dataset, items will not have dropWeight');
      return items;
    }
    
    const dataset = await datasetResponse.json();
    
    // Create a map of item ID to weight
    const weightMap = new Map();
    if (dataset.items && Array.isArray(dataset.items)) {
      dataset.items.forEach(item => {
        if (item.id && item.weight !== undefined) {
          weightMap.set(item.id, item.weight);
        }
      });
    }
    
    // Merge weights into items
    return items.map(item => {
      const weight = weightMap.get(item.id);
      if (weight !== undefined) {
        return { ...item, dropWeight: weight };
      }
      return item;
    });
  } catch (error) {
    console.warn('Error merging scarab weights:', error);
    return items;
  }
}

/**
 * Merge weight data from dataset into divination card items
 * @param {Array} items - Array of divination card items
 * @returns {Promise<Array>} Items with dropWeight merged from dataset
 */
async function mergeDivinationCardWeights(items) {
  try {
    // Load the dataset
    const datasetResponse = await fetch('/data/divinationCards/datasets/dataset1.json');
    
    if (!datasetResponse.ok) {
      console.warn('Could not load divination card dataset, items will not have dropWeight');
      return items;
    }
    
    const dataset = await datasetResponse.json();
    
    // Create a map of item ID to weight
    const weightMap = new Map();
    if (dataset.items && Array.isArray(dataset.items)) {
      dataset.items.forEach(item => {
        if (item.id && item.weight !== undefined) {
          weightMap.set(item.id, item.weight);
        }
      });
    }
    
    // Merge weights into items
    return items.map(item => {
      const weight = weightMap.get(item.id);
      if (weight !== undefined) {
        return { ...item, dropWeight: weight };
      }
      return item;
    });
  } catch (error) {
    console.warn('Error merging divination card weights:', error);
    return items;
  }
}

/**
 * Get category filename from category ID
 * @param {string} categoryId - Category identifier
 * @returns {string} Filename or path (e.g., "scarabDetails.json" or "scarabs/scarabs.json")
 */
function getCategoryFilename(categoryId) {
  // Special handling for scarabs - use new directory structure
  if (categoryId === 'scarabs') {
    return 'scarabs/scarabs.json';
  }
  
  // Special handling for divination-cards - use new directory structure
  if (categoryId === 'divination-cards') {
    return 'divinationCards/divinationCards.json';
  }
  
  // Convert category ID to filename
  // Other categories -> "categoryDetails.json" (remove trailing 's')
  
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
  // categoryDetails.json
  
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

