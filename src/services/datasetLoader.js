/**
 * Dataset loading service - Load and discover datasets from /public/data/{category}/dataset/ or /public/data/{category}/datasets/
 */

// Cache for discovered datasets metadata per category
const discoveryCache = new Map();

// Cache for loaded full dataset contents
const datasetCache = new Map();

/**
 * Get directory name from category ID
 * Maps category IDs (kebab-case) to actual directory names (camelCase)
 * @param {string} categoryId - Category identifier in kebab-case
 * @returns {string} Directory name
 */
function getCategoryDirectory(categoryId) {
  // Map category IDs to directory names (matching dataLoader.js pattern)
  const categoryDirMap = {
    'scarabs': 'scarabs',
    'divination-cards': 'divinationCards',
    'breach-splinters': 'breachSplinter', // Note: singular "Splinter"
    'breachstones': 'breachstones',
    'catalysts': 'catalysts',
    'delirium-orbs': 'deliriumOrbs',
    'essences': 'essences',
    'fossils': 'fossils',
    'legion-emblems': 'legionEmblems',
    'legion-splinters': 'legionSplinters',
    'oils': 'oils',
    'tattoos': 'tattoos'
  };
  
  if (categoryDirMap[categoryId]) {
    return categoryDirMap[categoryId];
  }
  
  // Fallback: Convert kebab-case to camelCase
  const parts = categoryId.split('-');
  return parts.map((part, index) => {
    if (index === 0) {
      return part;
    }
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join('');
}

/**
 * Discover all datasets for a category
 * @param {string} categoryId - Category identifier
 * @returns {Promise<Array>} Array of DatasetMetadata objects
 */
export async function discoverDatasets(categoryId) {
  // Check cache first
  if (discoveryCache.has(categoryId)) {
    return discoveryCache.get(categoryId);
  }

  try {
    const datasets = [];
    const maxDatasets = 100; // Maximum limit per category (SC-010)
    
    // Get actual directory name from category ID
    const dirName = getCategoryDirectory(categoryId);
    
    // Try dataset/ directory first (singular, preferred pattern)
    let basePath = `/data/${dirName}/dataset/`;
    let found = false;
    
    // Try to discover datasets starting from dataset1.json
    for (let i = 1; i <= maxDatasets; i++) {
      const filename = `dataset${i}.json`;
      const url = `${basePath}${filename}`;
      
      try {
        const response = await fetch(url);
        
        if (response.ok) {
          found = true;
          const dataset = await response.json();
          
          // Extract metadata
          const metadata = extractMetadata(categoryId, i, filename, dataset);
          if (metadata) {
            datasets.push(metadata);
          }
        } else if (response.status === 404 && i === 1 && !found) {
          // If first file not found, try datasets/ directory (plural, fallback)
          basePath = `/data/${dirName}/datasets/`;
          const fallbackUrl = `${basePath}${filename}`;
          const fallbackResponse = await fetch(fallbackUrl);
          
          if (fallbackResponse.ok) {
            found = true;
            basePath = `/data/${categoryId}/datasets/`; // Switch to plural directory
            const dataset = await fallbackResponse.json();
            const metadata = extractMetadata(categoryId, i, filename, dataset);
            if (metadata) {
              datasets.push(metadata);
            }
          } else {
            // No datasets found in either directory
            break;
          }
        } else if (response.status === 404) {
          // Reached end of datasets
          break;
        }
      } catch (error) {
        console.warn(`Error fetching ${url}:`, error);
        // Continue with next dataset
        continue;
      }
    }
    
    // Cache the results
    discoveryCache.set(categoryId, datasets);
    
    return datasets;
  } catch (error) {
    console.error(`Error discovering datasets for ${categoryId}:`, error);
    // Return empty array on error
    return [];
  }
}

/**
 * Discover datasets in parallel for better performance
 * @param {string} categoryId - Category identifier
 * @returns {Promise<Array>} Array of DatasetMetadata objects
 */
export async function discoverDatasetsParallel(categoryId) {
  // Check cache first
  if (discoveryCache.has(categoryId)) {
    return discoveryCache.get(categoryId);
  }

  try {
    const maxDatasets = 100;
    const maxConcurrent = 10; // Fetch up to 10 datasets in parallel
    
    // Get actual directory name from category ID
    const dirName = getCategoryDirectory(categoryId);
    
    // Try both directory patterns
    const basePaths = [
      `/data/${dirName}/dataset/`,
      `/data/${dirName}/datasets/`
    ];
    
    let foundPath = null;
    const datasets = [];
    
    // First, try to find which directory exists by checking dataset1.json
    for (const basePath of basePaths) {
      try {
        const response = await fetch(`${basePath}dataset1.json`);
        if (response.ok) {
          foundPath = basePath;
          break;
        }
      } catch (error) {
        // Continue to next path
        continue;
      }
    }
    
    if (!foundPath) {
      // No datasets found
      discoveryCache.set(categoryId, []);
      return [];
    }
    
    // Discover datasets in batches
    for (let start = 1; start <= maxDatasets; start += maxConcurrent) {
      const batch = [];
      const end = Math.min(start + maxConcurrent - 1, maxDatasets);
      
      // Create fetch promises for this batch
      const fetchPromises = [];
      for (let i = start; i <= end; i++) {
        const filename = `dataset${i}.json`;
        const url = `${foundPath}${filename}`;
        fetchPromises.push(
          fetch(url)
            .then(response => response.ok ? response.json().then(data => ({ i, data, success: true })) : { i, success: false, status: response.status })
            .catch(error => ({ i, success: false, error }))
        );
      }
      
      // Wait for batch to complete
      const results = await Promise.all(fetchPromises);
      
      // Process results
      let foundAny = false;
      for (const result of results) {
        if (result.success && result.data) {
          foundAny = true;
          const metadata = extractMetadata(categoryId, result.i, `dataset${result.i}.json`, result.data);
          if (metadata) {
            datasets.push(metadata);
          }
        } else if (result.status === 404 && !foundAny) {
          // Reached end of datasets
          break;
        }
      }
      
      // If no datasets found in this batch, stop
      if (!foundAny) {
        break;
      }
    }
    
    // Sort by dataset number
    datasets.sort((a, b) => a.datasetNumber - b.datasetNumber);
    
    // Cache the results
    discoveryCache.set(categoryId, datasets);
    
    return datasets;
  } catch (error) {
    console.error(`Error discovering datasets in parallel for ${categoryId}:`, error);
    return [];
  }
}

/**
 * Extract metadata from dataset JSON
 * @param {string} categoryId - Category identifier
 * @param {number} datasetNumber - Dataset number
 * @param {string} filename - Dataset filename
 * @param {Object} dataset - Dataset JSON object
 * @returns {Object|null} DatasetMetadata object or null if invalid
 */
function extractMetadata(categoryId, datasetNumber, filename, dataset) {
  try {
    // Handle missing or invalid dataset structure gracefully
    if (!dataset || typeof dataset !== 'object') {
      console.warn(`Invalid dataset structure for ${filename}: not an object`);
      return null;
    }
    
    // Handle missing required fields gracefully
    if (!dataset.name || typeof dataset.name !== 'string') {
      console.warn(`Invalid dataset structure for ${filename}: missing or invalid name`);
      return null;
    }
    
    if (!Array.isArray(dataset.items)) {
      console.warn(`Invalid dataset structure for ${filename}: items is not an array`);
      return null;
    }
    
    // Handle empty items array
    if (dataset.items.length === 0) {
      console.warn(`Dataset ${filename} has no items`);
    }
    
    // Sanitize name if it contains special characters
    const sanitizedName = String(dataset.name).trim() || `Dataset ${datasetNumber}`;
    
    return {
      categoryId,
      datasetNumber,
      filename,
      name: sanitizedName,
      date: dataset.date && typeof dataset.date === 'string' ? dataset.date.trim() : null,
      patch: dataset.patch && typeof dataset.patch === 'string' ? dataset.patch.trim() : null,
      description: dataset.description && typeof dataset.description === 'string' ? dataset.description.trim() : null,
      itemCount: dataset.items ? dataset.items.length : 0,
      hasSources: Array.isArray(dataset.sources) && dataset.sources.length > 0,
      hasInputItems: Array.isArray(dataset.inputItems) && dataset.inputItems.length > 0
    };
  } catch (error) {
    console.warn(`Error extracting metadata from ${filename}:`, error);
    return null;
  }
}

/**
 * Load full dataset contents
 * @param {string} categoryId - Category identifier
 * @param {number} datasetNumber - Dataset number
 * @returns {Promise<Object|null>} Full dataset object or null if not found
 */
export async function loadDataset(categoryId, datasetNumber) {
  const cacheKey = `${categoryId}-${datasetNumber}`;
  
  // Check cache first
  if (datasetCache.has(cacheKey)) {
    return datasetCache.get(cacheKey);
  }
  
  try {
    // Get actual directory name from category ID
    const dirName = getCategoryDirectory(categoryId);
    
    // Try dataset/ directory first (singular)
    let url = `/data/${dirName}/dataset/dataset${datasetNumber}.json`;
    let response = await fetch(url);
    
    // If not found, try datasets/ directory (plural)
    if (!response.ok && response.status === 404) {
      url = `/data/${dirName}/datasets/dataset${datasetNumber}.json`;
      response = await fetch(url);
    }
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Dataset ${datasetNumber} not found for category ${categoryId}`);
      }
      throw new Error(`Failed to load dataset: ${response.statusText}`);
    }
    
    const dataset = await response.json();
    
    // Validate basic structure
    if (!dataset || !dataset.name || !Array.isArray(dataset.items)) {
      throw new Error(`Invalid dataset structure for dataset${datasetNumber}.json`);
    }
    
    // Cache the dataset
    datasetCache.set(cacheKey, dataset);
    
    return dataset;
  } catch (error) {
    console.error(`Error loading dataset ${datasetNumber} for ${categoryId}:`, error);
    throw error;
  }
}

/**
 * Clear discovery cache
 * @param {string} [categoryId] - Optional category ID to clear specific cache
 */
export function clearDiscoveryCache(categoryId) {
  if (categoryId) {
    discoveryCache.delete(categoryId);
  } else {
    discoveryCache.clear();
  }
}

/**
 * Clear dataset cache
 * @param {string} [categoryId] - Optional category ID to clear specific dataset cache
 * @param {number} [datasetNumber] - Optional dataset number to clear specific dataset
 */
export function clearDatasetCache(categoryId, datasetNumber) {
  if (categoryId && datasetNumber) {
    const cacheKey = `${categoryId}-${datasetNumber}`;
    datasetCache.delete(cacheKey);
  } else if (categoryId) {
    // Clear all datasets for this category
    const keysToDelete = [];
    for (const key of datasetCache.keys()) {
      if (key.startsWith(`${categoryId}-`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => datasetCache.delete(key));
  } else {
    datasetCache.clear();
  }
}
