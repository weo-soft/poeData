/**
 * Script to calculate weightings for all categories based on available datasets
 * Updates calculation files (mle.json and bayesian.json) in each category directory
 */

import { readFile, writeFile, access, readdir, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { constants } from 'fs';
import { filterDatasetsForWeightCalculation } from '../src/services/datasetWeightFilter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get project root (parent of scripts directory)
const projectRoot = join(__dirname, '..');
const publicDir = join(projectRoot, 'public', 'data');

/**
 * Get category ID from directory name
 * @param {string} categoryDir - Directory name (e.g., "scarabs", "breachSplinter")
 * @returns {string} Category ID in kebab-case
 */
function getCategoryIdFromDirectory(categoryDir) {
  const dirToCategoryMap = {
    'scarabs': 'scarabs',
    'divinationCards': 'divination-cards',
    'breachSplinter': 'breach-splinters',
    'breachstones': 'breachstones',
    'catalysts': 'catalysts',
    'deliriumOrbs': 'delirium-orbs',
    'essences': 'essences',
    'fossils': 'fossils',
    'legionEmblems': 'legion-emblems',
    'legionSplinters': 'legion-splinters',
    'oils': 'oils',
    'tattoos': 'tattoos',
    'runegrafts': 'runegrafts',
    'contracts': 'contracts'
  };
  
  return dirToCategoryMap[categoryDir] || categoryDir;
}

/**
 * Get category name from category ID
 * @param {string} categoryId - Category ID
 * @returns {string} Category display name
 */
function getCategoryName(categoryId) {
  return categoryId.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

/**
 * Discover datasets for a category
 * @param {string} categoryDir - Category directory name
 * @returns {Promise<Array>} Array of dataset file paths
 */
async function discoverDatasets(categoryDir) {
  const datasets = [];
  const basePaths = [
    join(publicDir, categoryDir, 'dataset'),
    join(publicDir, categoryDir, 'datasets')
  ];
  
  for (const basePath of basePaths) {
    try {
      // Try to read index.json first
      const indexPath = join(basePath, 'index.json');
      try {
        await access(indexPath, constants.F_OK);
        const indexContent = await readFile(indexPath, 'utf-8');
        const indexData = JSON.parse(indexContent);
        
        if (indexData.datasets && Array.isArray(indexData.datasets)) {
          for (const ds of indexData.datasets) {
            const datasetPath = join(basePath, ds.filename || `dataset${ds.number}.json`);
            try {
              await access(datasetPath, constants.F_OK);
              datasets.push(datasetPath);
            } catch {
              // File doesn't exist, skip
              console.warn(`  Warning: Dataset file not found: ${datasetPath}`);
            }
          }
        }
      } catch {
        // No index.json, try to discover datasets manually
        for (let i = 1; i <= 100; i++) {
          const datasetPath = join(basePath, `dataset${i}.json`);
          try {
            await access(datasetPath, constants.F_OK);
            datasets.push(datasetPath);
          } catch {
            // File doesn't exist, continue
            if (i === 1) {
              // If first dataset doesn't exist, this path probably doesn't have datasets
              break;
            }
          }
        }
      }
      
      // If we found datasets in this path, return them
      if (datasets.length > 0) {
        return datasets;
      }
    } catch {
      // Path doesn't exist, try next
      continue;
    }
  }
  
  return datasets;
}

/**
 * Load all datasets from file paths
 * @param {Array<string>} datasetPaths - Array of dataset file paths
 * @returns {Promise<Array>} Array of dataset objects
 */
async function loadDatasets(datasetPaths) {
  const datasets = [];
  for (const path of datasetPaths) {
    try {
      const content = await readFile(path, 'utf-8');
      const dataset = JSON.parse(content);
      datasets.push(dataset);
    } catch (error) {
      console.warn(`  Warning: Failed to load dataset ${path}:`, error.message);
    }
  }
  return datasets;
}

/**
 * Calculate MLE weights from datasets (single weight set for all items)
 * @param {Array<Object>} datasets - Array of dataset objects
 * @returns {Promise<Object>} Calculated weights { [itemId: string]: number }
 */
async function calculateMleWeights(datasets) {
  if (datasets.length === 0) {
    throw new Error('No valid datasets found');
  }
  const weightCalculatorPath = join(projectRoot, 'src', 'services', 'weightCalculator.js');
  const weightCalculator = await import(`file://${weightCalculatorPath}`);
  return weightCalculator.estimateItemWeights(datasets);
}

/**
 * Calculate MLE weights per input item (for contracts: one weight set per contract type)
 * @param {Array<Object>} datasets - Array of dataset objects
 * @returns {Promise<Object>} { [inputItemId: string]: { [outputItemId: string]: number } }
 */
async function calculateMleWeightsPerInput(datasets) {
  if (datasets.length === 0) {
    throw new Error('No valid datasets found');
  }
  const weightCalculatorPath = join(projectRoot, 'src', 'services', 'weightCalculator.js');
  const weightCalculator = await import(`file://${weightCalculatorPath}`);
  return weightCalculator.estimateItemWeightsPerInputItem(datasets);
}

/**
 * Calculate Bayesian weights from datasets (single weight set)
 * @param {Array<Object>} datasets - Array of dataset objects
 * @returns {Promise<Object>} Calculated weights (using median from summary statistics)
 */
async function calculateBayesianWeights(datasets) {
  if (datasets.length === 0) {
    throw new Error('No valid datasets found');
  }
  const bayesianCalculatorPath = join(projectRoot, 'src', 'services', 'bayesianWeightCalculator.js');
  const { inferWeights } = await import(`file://${bayesianCalculatorPath}`);
  const result = await inferWeights(datasets, {
    numSamples: 2000,
    numChains: 2,
    burnIn: 500
  });
  const weights = {};
  if (result.summaryStatistics) {
    for (const [itemId, stats] of Object.entries(result.summaryStatistics)) {
      weights[itemId] = stats.median || stats.map || 0;
    }
  } else {
    throw new Error('No summary statistics in Bayesian result');
  }
  return weights;
}

/**
 * Calculate Bayesian weights per input item (for contracts: one inference per contract type)
 * @param {Array<Object>} datasets - Array of dataset objects
 * @returns {Promise<Object>} { [inputItemId: string]: { [outputItemId: string]: number } } (median per output)
 */
async function calculateBayesianWeightsPerInput(datasets) {
  if (datasets.length === 0) {
    throw new Error('No valid datasets found');
  }
  const bayesianCalculatorPath = join(projectRoot, 'src', 'services', 'bayesianWeightCalculator.js');
  const { inferWeightsPerInputItem } = await import(`file://${bayesianCalculatorPath}`);
  const result = await inferWeightsPerInputItem(datasets, {
    numSamples: 2000,
    numChains: 2,
    burnIn: 500
  });
  const weightsByInput = {};
  for (const [inputId, singleResult] of Object.entries(result)) {
    weightsByInput[inputId] = singleResult.weights || {};
  }
  return weightsByInput;
}

/**
 * Generate calculation JSON structure
 * @param {Object} weights - Calculated weights
 * @param {string} categoryId - Category identifier
 * @param {string} categoryName - Category display name
 * @param {string} calculationType - 'mle' or 'bayesian'
 * @param {Array} datasets - Dataset objects
 * @returns {Object} Calculation JSON structure
 */
function generateCalculationJson(weights, categoryId, categoryName, calculationType, datasets) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  
  // Extract patch from datasets if available
  let patch = null;
  if (datasets && datasets.length > 0 && datasets[0].patch) {
    patch = datasets[0].patch;
  }
  
  // Build sources array
  const sources = [];
  if (datasets && datasets.length > 0) {
    datasets.forEach((ds, index) => {
      if (ds.sources && Array.isArray(ds.sources)) {
        sources.push(...ds.sources);
      } else if (ds.name) {
        sources.push({
          name: `Dataset ${ds.name || index + 1}`,
          url: '',
          author: ''
        });
      }
    });
  }
  
  if (sources.length === 0) {
    sources.push({
      name: 'Calculated Weights',
      url: '',
      author: ''
    });
  }
  
  // Build items array
  const itemsArray = Object.entries(weights)
    .map(([id, weight]) => ({ id, weight }))
    .sort((a, b) => b.weight - a.weight);
  
  const result = {
    name: `Calculated Weights for ${categoryName}`,
    description: `Calculated item weights for ${categoryName} using ${calculationType.toUpperCase()} method from ${datasets.length} dataset${datasets.length !== 1 ? 's' : ''}`,
    date: dateStr,
    patch: patch || 'N/A',
    sources: sources,
    items: itemsArray
  };
  
  // Add inputItems if available from datasets
  if (datasets && datasets.length > 0) {
    const inputItemsSet = new Set();
    datasets.forEach(ds => {
      if (ds.inputItems && Array.isArray(ds.inputItems)) {
        ds.inputItems.forEach(input => {
          if (input && input.id) {
            inputItemsSet.add(input.id);
          }
        });
      }
    });
    
    if (inputItemsSet.size > 0) {
      result.inputItems = Array.from(inputItemsSet).map(id => ({ id }));
    }
  }
  
  return result;
}

/**
 * Generate calculation JSON for per-input weights (e.g. contracts: one set per input item)
 * @param {Object} weightsByInput - { [inputItemId: string]: { [outputItemId: string]: number } }
 * @param {string} categoryId - Category identifier
 * @param {string} categoryName - Category display name
 * @param {string} calculationType - 'mle' or 'bayesian'
 * @param {Array} datasets - Dataset objects
 * @returns {Object} Calculation JSON with perInput and weightsByInput
 */
function generateCalculationJsonPerInput(weightsByInput, categoryId, categoryName, calculationType, datasets) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  let patch = null;
  if (datasets && datasets.length > 0 && datasets[0].patch) {
    patch = datasets[0].patch;
  }
  const sources = [];
  if (datasets && datasets.length > 0) {
    datasets.forEach((ds, index) => {
      if (ds.sources && Array.isArray(ds.sources)) {
        sources.push(...ds.sources);
      } else if (ds.name) {
        sources.push({ name: `Dataset ${ds.name || index + 1}`, url: '', author: '' });
      }
    });
  }
  if (sources.length === 0) {
    sources.push({ name: 'Calculated Weights', url: '', author: '' });
  }
  const weightsByInputItems = {};
  for (const [inputId, weights] of Object.entries(weightsByInput)) {
    weightsByInputItems[inputId] = Object.entries(weights)
      .map(([id, weight]) => ({ id, weight }))
      .sort((a, b) => b.weight - a.weight);
  }
  return {
    name: `Calculated Weights for ${categoryName}`,
    description: `Per-input item weights for ${categoryName} using ${calculationType.toUpperCase()} (one calculation per input item) from ${datasets.length} dataset${datasets.length !== 1 ? 's' : ''}`,
    date: dateStr,
    patch: patch || 'N/A',
    sources,
    perInput: true,
    weightsByInput: weightsByInputItems
  };
}

/**
 * Process a single category
 * @param {string} categoryDir - Category directory name
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function processCategory(categoryDir) {
  try {
    const categoryId = getCategoryIdFromDirectory(categoryDir);
    const categoryName = getCategoryName(categoryId);
    
    console.log(`\nProcessing category: ${categoryName} (${categoryDir})`);
    
    // Discover datasets
    const datasetPaths = await discoverDatasets(categoryDir);
    
    if (datasetPaths.length === 0) {
      console.log(`  No datasets found, skipping...`);
      return false;
    }
    
    console.log(`  Found ${datasetPaths.length} dataset(s)`);
    
    // Load datasets
    const loaded = await loadDatasets(datasetPaths);
    const datasets = filterDatasetsForWeightCalculation(loaded);
    const excluded = loaded.length - datasets.length;

    if (excluded > 0) {
      console.log(`  Excluding ${excluded} outdated dataset(s) from weight calculation`);
    }

    if (datasets.length === 0) {
      console.log(
        loaded.length === 0
          ? `  Failed to load any datasets, skipping...`
          : `  No non-outdated datasets after filtering, skipping...`
      );
      return false;
    }
    
    // Ensure calculations directory exists
    const calculationsDir = join(publicDir, categoryDir, 'calculations');
    try {
      await access(calculationsDir, constants.F_OK);
    } catch {
      // Directory doesn't exist, create it
      console.log(`  Creating calculations directory...`);
      await mkdir(calculationsDir, { recursive: true });
    }
    
    const isContracts = categoryId === 'contracts';

    // Calculate MLE weights
    console.log(`  Calculating MLE weights${isContracts ? ' (per input item)' : ''}...`);
    try {
      const mleWeights = isContracts
        ? await calculateMleWeightsPerInput(datasets)
        : await calculateMleWeights(datasets);
      const mleJson = isContracts
        ? generateCalculationJsonPerInput(mleWeights, categoryId, categoryName, 'mle', datasets)
        : generateCalculationJson(mleWeights, categoryId, categoryName, 'mle', datasets);
      const mlePath = join(calculationsDir, 'mle.json');
      await writeFile(mlePath, JSON.stringify(mleJson, null, 2), 'utf-8');
      console.log(`  ✓ MLE weights calculated and saved`);
    } catch (error) {
      console.error(`  ✗ Failed to calculate MLE weights:`, error.message);
      return false;
    }

    // Calculate Bayesian weights
    console.log(`  Calculating Bayesian weights${isContracts ? ' (per input item)' : ''}...`);
    try {
      const bayesianWeights = isContracts
        ? await calculateBayesianWeightsPerInput(datasets)
        : await calculateBayesianWeights(datasets);
      const bayesianJson = isContracts
        ? generateCalculationJsonPerInput(bayesianWeights, categoryId, categoryName, 'bayesian', datasets)
        : generateCalculationJson(bayesianWeights, categoryId, categoryName, 'bayesian', datasets);
      const bayesianPath = join(calculationsDir, 'bayesian.json');
      await writeFile(bayesianPath, JSON.stringify(bayesianJson, null, 2), 'utf-8');
      console.log(`  ✓ Bayesian weights calculated and saved`);
    } catch (error) {
      console.error(`  ✗ Failed to calculate Bayesian weights:`, error.message);
      console.warn(`  Warning: Bayesian calculation failed, but MLE weights were saved`);
    }
    
    return true;
  } catch (error) {
    console.error(`  ✗ Error processing category ${categoryDir}:`, error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const categoryFilter = process.argv[2]; // e.g. "runegrafts"
    console.log(categoryFilter
      ? `Starting weight calculation for category: ${categoryFilter}...`
      : 'Starting weight calculation for all categories...');
    console.log(`Public data directory: ${publicDir}`);
    
    // Get all category directories
    const entries = await readdir(publicDir, { withFileTypes: true });
    let categoryDirs = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    if (categoryFilter) {
      categoryDirs = categoryDirs.filter(dir => dir === categoryFilter);
      if (categoryDirs.length === 0) {
        console.error(`Category "${categoryFilter}" not found. Available: ${entries.filter(e => e.isDirectory()).map(e => e.name).join(', ')}`);
        process.exit(1);
      }
    }
    
    console.log(`Found ${categoryDirs.length} category directories`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Process each category
    for (const categoryDir of categoryDirs) {
      const success = await processCategory(categoryDir);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Total categories: ${categoryDirs.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed/Skipped: ${failCount}`);
    console.log('\nDone!');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();
