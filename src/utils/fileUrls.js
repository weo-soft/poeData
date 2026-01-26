/**
 * File URL utility - Generate direct URLs to data files in the public directory
 * These URLs can be used by other applications to access the data directly
 */

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
    'tattoos': 'tattoos',
    'runegrafts': 'runegrafts',
    'contracts': 'contracts'
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
 * Get URL for a dataset file
 * Tries both singular (dataset/) and plural (datasets/) directory patterns
 * @param {string} categoryId - Category identifier
 * @param {number} datasetNumber - Dataset number
 * @returns {string} URL to the dataset file
 */
export function getDatasetUrl(categoryId, datasetNumber) {
  const dirName = getCategoryDirectory(categoryId);
  
  // Try plural first (most common pattern), then singular
  // Applications can try both URLs if needed
  return `/data/${dirName}/datasets/dataset${datasetNumber}.json`;
}

/**
 * Get alternative URL for a dataset file (singular directory pattern)
 * Some categories use singular "dataset/" instead of plural "datasets/"
 * @param {string} categoryId - Category identifier
 * @param {number} datasetNumber - Dataset number
 * @returns {string} Alternative URL to the dataset file
 */
export function getDatasetUrlAlternative(categoryId, datasetNumber) {
  const dirName = getCategoryDirectory(categoryId);
  return `/data/${dirName}/dataset/dataset${datasetNumber}.json`;
}

/**
 * Get URL for MLE calculation results
 * @param {string} categoryId - Category identifier
 * @returns {string} URL to the MLE calculation file
 */
export function getMleCalculationUrl(categoryId) {
  const dirName = getCategoryDirectory(categoryId);
  return `/data/${dirName}/calculations/mle.json`;
}

/**
 * Get URL for Bayesian calculation results
 * @param {string} categoryId - Category identifier
 * @returns {string} URL to the Bayesian calculation file
 */
export function getBayesianCalculationUrl(categoryId) {
  const dirName = getCategoryDirectory(categoryId);
  return `/data/${dirName}/calculations/bayesian.json`;
}
