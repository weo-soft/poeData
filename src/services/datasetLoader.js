/**
 * Dataset loading service - Load and discover datasets from /public/data/{category}/dataset/ or /public/data/{category}/datasets/
 */

// Cache for discovered datasets metadata per category
const discoveryCache = new Map();

// Cache for discovered base paths per category (to avoid trying wrong paths)
const basePathCache = new Map();

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
            basePath = `/data/${dirName}/datasets/`; // Switch to plural directory
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
  // Check cache first (but log it)
  if (discoveryCache.has(categoryId)) {
    const cached = discoveryCache.get(categoryId);
    console.log(`[DatasetLoader] Using cached datasets for ${categoryId}: ${cached.length} datasets`);
    return cached;
  }

  try {
    // Get actual directory name from category ID
    const dirName = getCategoryDirectory(categoryId);
    console.log(`[DatasetLoader] Discovering datasets for category: ${categoryId} -> directory: ${dirName}`);
    
    // Try both directory patterns to find index.json
    const basePaths = [
      `/data/${dirName}/dataset/`,
      `/data/${dirName}/datasets/`
    ];
    
    let foundPath = null;
    let indexData = null;
    
    // First, try to load index.json from either directory
    for (const basePath of basePaths) {
      try {
        const indexUrl = `${basePath}index.json`;
        console.log(`[DatasetLoader] Trying to load index from: ${indexUrl}`);
        const response = await fetch(indexUrl);
        
        if (response.ok) {
          // Verify it's JSON
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              const text = await response.text();
              indexData = JSON.parse(text);
              foundPath = basePath;
              console.log(`[DatasetLoader] Found index.json at: ${foundPath} with ${indexData.datasets?.length || 0} datasets`);
              break;
            } catch (parseError) {
              console.warn(`[DatasetLoader] Failed to parse index.json from ${indexUrl}:`, parseError);
              continue;
            }
          }
        }
      } catch (error) {
        console.warn(`[DatasetLoader] Error loading index from ${basePath}:`, error);
        continue;
      }
    }
    
    // If no index found, fall back to old sequential discovery
    if (!indexData || !indexData.datasets || indexData.datasets.length === 0) {
      console.warn(`[DatasetLoader] No index.json found, falling back to sequential discovery`);
      return await discoverDatasetsSequential(categoryId, dirName, basePaths);
    }
    
    // Load datasets from index in parallel
    const datasets = [];
    const fetchPromises = indexData.datasets.map(async (datasetInfo) => {
      const url = `${foundPath}${datasetInfo.filename}`;
      try {
        console.log(`[DatasetLoader] Loading dataset ${datasetInfo.number} from: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
          console.warn(`[DatasetLoader] Failed to load ${url}: ${response.status}`);
          return null;
        }
        
        // Check content type
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('application/json')) {
          console.warn(`[DatasetLoader] Response from ${url} is not JSON (content-type: ${contentType})`);
          return null;
        }
        
        const text = await response.text();
        const data = JSON.parse(text);
        const metadata = extractMetadata(categoryId, datasetInfo.number, datasetInfo.filename, data);
        
        if (metadata) {
          console.log(`[DatasetLoader] Loaded dataset ${datasetInfo.number}: ${metadata.name}`);
          return metadata;
        } else {
          console.warn(`[DatasetLoader] Failed to extract metadata for dataset ${datasetInfo.number}`);
          return null;
        }
      } catch (error) {
        console.error(`[DatasetLoader] Error loading dataset ${datasetInfo.number} from ${url}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(fetchPromises);
    results.forEach(metadata => {
      if (metadata) {
        datasets.push(metadata);
      }
    });
    
    // Sort by dataset number
    datasets.sort((a, b) => a.datasetNumber - b.datasetNumber);
    
    console.log(`[DatasetLoader] Discovered ${datasets.length} datasets for category: ${categoryId}`);
    
    // Cache the results and the base path
    discoveryCache.set(categoryId, datasets);
    if (foundPath) {
      basePathCache.set(categoryId, foundPath);
    }
    
    return datasets;
  } catch (error) {
    console.error(`[DatasetLoader] Error discovering datasets for ${categoryId}:`, error);
    return [];
  }
}

/**
 * Fallback: Discover datasets sequentially (used when index.json is not available)
 * @param {string} categoryId - Category identifier
 * @param {string} dirName - Directory name
 * @param {Array<string>} basePaths - Array of base paths to try
 * @returns {Promise<Array>} Array of DatasetMetadata objects
 */
async function discoverDatasetsSequential(categoryId, dirName, basePaths) {
  let foundPath = null;
  const datasets = [];
  const maxDatasets = 100;
  const maxConsecutive404s = 3;
  
  // Find which directory exists
  for (const basePath of basePaths) {
    try {
      const testUrl = `${basePath}dataset1.json`;
      const response = await fetch(testUrl);
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          foundPath = basePath;
          break;
        }
      }
    } catch (error) {
      continue;
    }
  }
  
  if (!foundPath) {
    discoveryCache.set(categoryId, []);
    return [];
  }
  
  // Discover datasets sequentially
  let consecutive404s = 0;
  for (let i = 1; i <= maxDatasets; i++) {
    const filename = `dataset${i}.json`;
    const url = `${foundPath}${filename}`;
    
    try {
      const response = await fetch(url);
      
      if (response.status === 404) {
        consecutive404s++;
        if (consecutive404s >= maxConsecutive404s) {
          break;
        }
        continue;
      }
      
      consecutive404s = 0;
      
      if (!response.ok) {
        continue;
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        continue;
      }
      
      const text = await response.text();
      const data = JSON.parse(text);
      const metadata = extractMetadata(categoryId, i, filename, data);
      if (metadata) {
        datasets.push(metadata);
      }
    } catch (error) {
      consecutive404s++;
      if (consecutive404s >= maxConsecutive404s) {
        break;
      }
    }
  }
  
  datasets.sort((a, b) => a.datasetNumber - b.datasetNumber);
  discoveryCache.set(categoryId, datasets);
  if (foundPath) {
    basePathCache.set(categoryId, foundPath);
  }
  return datasets;
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
    
    // Build list of paths to try - use cached path first if available
    const allPossiblePaths = [
      `/data/${dirName}/dataset/`,
      `/data/${dirName}/datasets/`
    ];
    
    let basePaths = [];
    if (basePathCache.has(categoryId)) {
      // Use the cached path first (most likely to succeed), then fallback to others
      const cachedPath = basePathCache.get(categoryId);
      basePaths = [cachedPath, ...allPossiblePaths.filter(p => p !== cachedPath)];
    } else {
      // No cached path, try both in order
      basePaths = allPossiblePaths;
    }
    
    let dataset = null;
    let lastError = null;
    
    // Try each path until we find a valid JSON response
    for (const basePath of basePaths) {
      const url = `${basePath}dataset${datasetNumber}.json`;
      try {
        console.log(`[DatasetLoader] Loading dataset from: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
          if (response.status === 404) {
            // Don't log 404s - they're expected during fallback
            continue; // Try next path
          }
          throw new Error(`Failed to load dataset: ${response.statusText}`);
        }
        
        // Check content type to ensure it's JSON
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('application/json')) {
          // Don't warn about 404s (they return HTML)
          if (response.status !== 404) {
            console.warn(`[DatasetLoader] Response from ${url} is not JSON (content-type: ${contentType})`);
          }
          continue; // Try next path
        }
        
        // Parse JSON with error handling
        try {
          const text = await response.text();
          dataset = JSON.parse(text);
          
          // Validate basic structure
          if (!dataset || !dataset.name || !Array.isArray(dataset.items)) {
            console.warn(`[DatasetLoader] Invalid dataset structure at ${url}`);
            continue; // Try next path
          }
          
          // Successfully loaded valid dataset
          console.log(`[DatasetLoader] Successfully loaded dataset ${datasetNumber} from: ${url}`);
          break;
        } catch (parseError) {
          console.error(`[DatasetLoader] JSON parse error for ${url}:`, parseError);
          lastError = new Error(`Invalid JSON in dataset file: ${parseError.message}`);
          continue; // Try next path
        }
      } catch (fetchError) {
        // Continue trying other paths
        lastError = fetchError;
        continue;
      }
    }
    
    if (!dataset) {
      if (lastError) {
        throw lastError;
      }
      throw new Error(`Dataset ${datasetNumber} not found for category ${categoryId}`);
    }
    
    // Cache the dataset
    datasetCache.set(cacheKey, dataset);
    
    return dataset;
  } catch (error) {
    console.error(`[DatasetLoader] Error loading dataset ${datasetNumber} for ${categoryId}:`, error);
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
    basePathCache.delete(categoryId);
  } else {
    discoveryCache.clear();
    basePathCache.clear();
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
