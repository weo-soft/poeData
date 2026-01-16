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
    let dataset = datasetData;
    
    // If dataset not provided, fetch it
    if (!dataset) {
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
        throw new Error(`Failed to fetch dataset: ${response.statusText}`);
      }
      
      const jsonString = await response.text();
      
      // Validate JSON structure before download
      const validation = parseDataset(jsonString);
      if (!validation.valid) {
        throw new Error(`Dataset validation failed: ${validation.error}`);
      }
      
      dataset = validation.data;
    } else {
      // Validate provided dataset
      const validation = validateDataset(dataset);
      if (!validation.valid) {
        throw new Error(`Dataset validation failed: ${validation.error}`);
      }
    }
    
    // Generate filename
    const filename = generateFilename(categoryId, datasetNumber, dataset);
    
    // Convert dataset to JSON string
    const jsonString = JSON.stringify(dataset, null, 2);
    
    // Create blob
    const blob = new Blob([jsonString], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
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
