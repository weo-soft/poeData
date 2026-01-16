/**
 * Download utility - Trigger browser-native downloads for dataset files
 */

import { parseDataset, validateDataset } from './datasetParser.js';

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
 * Download a dataset file
 * @param {string} categoryId - Category identifier
 * @param {number} datasetNumber - Dataset number
 * @param {Object} [datasetData] - Optional pre-loaded dataset data (if not provided, will fetch)
 * @returns {Promise<void>}
 */
export async function downloadDataset(categoryId, datasetNumber, datasetData = null) {
  // Track active downloads to prevent interference
  const downloadKey = `${categoryId}-${datasetNumber}`;
  
  // Check if download is already in progress (simple lock mechanism)
  if (window._activeDownloads && window._activeDownloads.has(downloadKey)) {
    throw new Error('Download already in progress for this dataset');
  }
  
  if (!window._activeDownloads) {
    window._activeDownloads = new Set();
  }
  window._activeDownloads.add(downloadKey);
  
  try {
    let jsonString = null;
    let filename = null;
    
    // If dataset data is provided, use it directly (no validation - download raw)
    if (datasetData) {
      // Generate filename from provided data
      filename = generateFilename(categoryId, datasetNumber, datasetData);
      // Convert to JSON string (raw, as-is)
      jsonString = JSON.stringify(datasetData, null, 2);
    } else {
      // If not provided, fetch the raw file directly
      const dirName = getCategoryDirectory(categoryId);
      
      // Try both directory patterns
      const basePaths = [
        `/data/${dirName}/dataset/`,
        `/data/${dirName}/datasets/`
      ];
      
      let rawText = null;
      let lastError = null;
      
      // Try each path until we find a valid JSON file
      for (const basePath of basePaths) {
        const url = `${basePath}dataset${datasetNumber}.json`;
        try {
          console.log(`[Download] Fetching raw dataset from: ${url}`);
          const response = await fetch(url);
          
          if (!response.ok) {
            if (response.status === 404) {
              console.log(`[Download] Dataset not found at: ${url}`);
              continue; // Try next path
            }
            throw new Error(`Failed to fetch dataset: ${response.statusText}`);
          }
          
          // Check content type to ensure it's JSON
          const contentType = response.headers.get('content-type');
          if (contentType && !contentType.includes('application/json')) {
            console.warn(`[Download] Response from ${url} is not JSON (content-type: ${contentType})`);
            continue; // Try next path
          }
          
          // Get raw text (no parsing/validation - just download as-is)
          rawText = await response.text();
          
          // Basic check: try to parse to ensure it's valid JSON (but don't validate structure)
          try {
            JSON.parse(rawText);
            console.log(`[Download] Successfully fetched raw dataset ${datasetNumber} from: ${url}`);
            
            // Extract filename from URL or generate it
            // Try to parse just enough to get the date for filename
            try {
              const tempData = JSON.parse(rawText);
              filename = generateFilename(categoryId, datasetNumber, tempData);
            } catch {
              // If parsing fails for filename, use default
              filename = generateFilename(categoryId, datasetNumber, null);
            }
            
            break;
          } catch (parseError) {
            console.error(`[Download] Invalid JSON at ${url}:`, parseError);
            lastError = new Error(`Invalid JSON in dataset file: ${parseError.message}`);
            continue; // Try next path
          }
        } catch (fetchError) {
          console.warn(`[Download] Error fetching ${url}:`, fetchError);
          lastError = fetchError;
          continue; // Try next path
        }
      }
      
      if (!rawText) {
        if (lastError) {
          throw lastError;
        }
        throw new Error(`Dataset ${datasetNumber} not found for category ${categoryId}`);
      }
      
      jsonString = rawText;
    }
    
    // Create blob with raw JSON string
    const blob = new Blob([jsonString], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || `${categoryId}-dataset${datasetNumber}.json`;
    link.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Small delay before cleanup to ensure download starts
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      window._activeDownloads.delete(downloadKey);
    }, 100);
  } catch (error) {
    window._activeDownloads.delete(downloadKey);
    console.error('Error downloading dataset:', error);
    throw error;
  }
}

/**
 * Generate descriptive filename for dataset download
 * Format: {categoryId}-dataset{N}-{date}.json
 * @param {string} categoryId - Category identifier
 * @param {number} datasetNumber - Dataset number
 * @param {Object} dataset - Dataset object
 * @returns {string} Generated filename
 */
export function generateFilename(categoryId, datasetNumber, dataset) {
  // Sanitize category ID
  const sanitizedCategory = sanitizeFilename(categoryId);
  
  // Build filename parts
  const parts = [sanitizedCategory, `dataset${datasetNumber}`];
  
  // Add date if available
  if (dataset && dataset.date) {
    parts.push(dataset.date);
  }
  
  // Join parts and add extension
  return `${parts.join('-')}.json`;
}

/**
 * Sanitize filename to remove special characters
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
  // Replace special characters with hyphens
  return filename
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Download dataset from URL directly (without validation)
 * @param {string} url - Dataset file URL
 * @param {string} filename - Desired filename
 * @returns {Promise<void>}
 */
export async function downloadDatasetFromUrl(url, filename) {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading dataset from URL:', error);
    throw error;
  }
}
