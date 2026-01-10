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
    
    // Special handling for merged categories - merge data from multiple files
    if (categoryId === 'breach') {
      data = await mergeBreachData(data);
    }
    
    if (categoryId === 'legion') {
      data = await mergeLegionData(data);
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
 * Merge breach data from splinters and stones
 * @param {Array} initialData - Initial data (from breachstones)
 * @returns {Promise<Array>} Merged items from both files
 */
async function mergeBreachData(initialData) {
  try {
    // Load breach splinters data
    const splintersResponse = await fetch('/data/breachSplinter/breachSplinter.json');
    if (splintersResponse.ok) {
      const splintersData = await splintersResponse.json();
      if (Array.isArray(splintersData)) {
        // Combine both arrays
        return [...initialData, ...splintersData];
      }
    }
    return initialData;
  } catch (error) {
    console.warn('Could not load breach splinters data:', error);
    return initialData;
  }
}

/**
 * Merge legion data from splinters and emblems
 * @param {Array} initialData - Initial data (from legion-splinters)
 * @returns {Promise<Array>} Merged items from both files
 */
async function mergeLegionData(initialData) {
  try {
    // Load legion emblems data
    const emblemsResponse = await fetch('/data/legionEmblems/legionEmblems.json');
    if (emblemsResponse.ok) {
      const emblemsData = await emblemsResponse.json();
      if (Array.isArray(emblemsData)) {
        // Combine both arrays
        return [...initialData, ...emblemsData];
      }
    }
    return initialData;
  } catch (error) {
    console.warn('Could not load legion emblems data:', error);
    return initialData;
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
  
  // Special handling for merged categories
  if (categoryId === 'breach') {
    // Start with breachstones, then merge splinters in mergeBreachData
    return 'breachstones/breachStones.json';
  }
  
  if (categoryId === 'legion') {
    // Start with legion-splinters, then merge emblems in mergeLegionData
    return 'legionSplinters/legionSplinters.json';
  }
  
  // Special handling for new categories with subdirectory structure
  const categoryFileMap = {
    'catalysts': 'catalysts/catalysts.json',
    'delirium-orbs': 'deliriumOrbs/deliriumOrbs.json',
    'essences': 'essences/essences.json',
    'fossils': 'fossils/fossils.json',
    'oils': 'oils/oils.json',
    'tattoos': 'tattoos/tattos.json' // Note: filename is "tattos" not "tattoos"
  };
  
  if (categoryFileMap[categoryId]) {
    return categoryFileMap[categoryId];
  }
  
  // Fallback: Convert category ID to filename (kebab-case to camelCase)
  // Pattern: "category-id" -> "categoryIdDetails.json"
  const parts = categoryId.split('-');
  const baseName = parts.map((part, index) => {
    if (index === 0) {
      // First part: keep as-is (lowercase)
      return part;
    }
    // Subsequent parts: capitalize first letter
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join('');
  
  // Return filename with Details.json suffix
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
    },
    {
      id: 'breach',
      name: 'Breach',
      description: 'Breach splinters and breachstones'
    },
    {
      id: 'catalysts',
      name: 'Catalysts',
      description: 'Items used to enhance quality of jewelry'
    },
    {
      id: 'delirium-orbs',
      name: 'Delirium Orbs',
      description: 'Orbs that add delirium effects to maps'
    },
    {
      id: 'essences',
      name: 'Essences',
      description: 'Items used to craft item modifiers'
    },
    {
      id: 'fossils',
      name: 'Fossils',
      description: 'Items used to modify crafting outcomes'
    },
    {
      id: 'legion',
      name: 'Legion',
      description: 'Legion splinters and emblems'
    },
    {
      id: 'oils',
      name: 'Oils',
      description: 'Items used to anoint passive skills'
    },
    {
      id: 'tattoos',
      name: 'Tattoos',
      description: 'Items that modify passive skill trees'
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

