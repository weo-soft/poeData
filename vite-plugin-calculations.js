/**
 * Vite plugin to handle on-demand calculation file generation
 * When calculation files (mle.json, bayesian.json) are requested but don't exist,
 * this plugin calculates them on the fly using the datasets.
 */

import { readFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { constants } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get directory name from category ID (from URL path)
 * @param {string} categoryDir - Directory name from URL (e.g., "scarabs", "breachSplinter")
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
    'runegrafts': 'runegrafts'
  };
  
  return dirToCategoryMap[categoryDir] || categoryDir;
}

/**
 * Discover datasets for a category
 * @param {string} publicDir - Public directory path
 * @param {string} categoryDir - Category directory name
 * @returns {Promise<Array>} Array of dataset file paths
 */
async function discoverDatasets(publicDir, categoryDir) {
  const datasets = [];
  const basePaths = [
    join(publicDir, 'data', categoryDir, 'dataset'),
    join(publicDir, 'data', categoryDir, 'datasets')
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
            }
          }
        }
      } catch {
        // No index.json, try to discover datasets manually
        // This is a simplified discovery - in production you might want more robust logic
        for (let i = 1; i <= 20; i++) {
          const datasetPath = join(basePath, `dataset${i}.json`);
          try {
            await access(datasetPath, constants.F_OK);
            datasets.push(datasetPath);
          } catch {
            // File doesn't exist, continue
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
 * Calculate MLE weights from datasets using the actual weight calculator
 * @param {Array<string>} datasetPaths - Paths to dataset files
 * @returns {Promise<Object>} Calculated weights
 */
async function calculateMleWeights(datasetPaths) {
  // Load all datasets
  const datasets = [];
  for (const path of datasetPaths) {
    try {
      const content = await readFile(path, 'utf-8');
      const dataset = JSON.parse(content);
      datasets.push(dataset);
    } catch (error) {
      console.warn(`Failed to load dataset ${path}:`, error);
    }
  }
  
  if (datasets.length === 0) {
    throw new Error('No valid datasets found');
  }
  
  // Use the actual weight calculator
  // Import dynamically - use path relative to this file
  const weightCalculatorPath = join(__dirname, 'src', 'services', 'weightCalculator.js');
  try {
    const weightCalculator = await import(`file://${weightCalculatorPath}`);
    const weights = weightCalculator.estimateItemWeights(datasets);
    return weights;
  } catch (importError) {
    // Fallback to simplified calculation if import fails
    console.warn(`[Calculations Plugin] Failed to import weight calculator, using fallback:`, importError.message);
    
    // Simplified fallback calculation
    const itemCounts = new Map();
    let totalCount = 0;
    
    for (const dataset of datasets) {
      if (dataset.items && Array.isArray(dataset.items)) {
        for (const item of dataset.items) {
          if (item.id && typeof item.count === 'number') {
            const current = itemCounts.get(item.id) || 0;
            itemCounts.set(item.id, current + item.count);
            totalCount += item.count;
          }
        }
      }
    }
    
    const weights = {};
    if (totalCount > 0) {
      for (const [itemId, count] of itemCounts.entries()) {
        weights[itemId] = count / totalCount;
      }
    }
    
    return weights;
  }
}

/**
 * Calculate Bayesian weights from datasets
 * @param {Array<string>} datasetPaths - Paths to dataset files
 * @returns {Promise<Object>} Calculated weights (using median from summary statistics)
 */
async function calculateBayesianWeights(datasetPaths) {
  // Load all datasets
  const datasets = [];
  for (const path of datasetPaths) {
    try {
      const content = await readFile(path, 'utf-8');
      const dataset = JSON.parse(content);
      datasets.push(dataset);
    } catch (error) {
      console.warn(`Failed to load dataset ${path}:`, error);
    }
  }
  
  if (datasets.length === 0) {
    throw new Error('No valid datasets found');
  }
  
  // Try to use the actual Bayesian calculator
  try {
    const bayesianCalculatorPath = join(__dirname, 'src', 'services', 'bayesianWeightCalculator.js');
    const { inferWeights } = await import(`file://${bayesianCalculatorPath}`);
    
    // Run Bayesian inference (this may take a while)
    const result = await inferWeights(datasets, {
      numSamples: 2000,
      numChains: 2,
      burnIn: 500
    });
    
    // Extract weights from summary statistics (use median)
    const weights = {};
    if (result.summaryStatistics) {
      for (const [itemId, stats] of Object.entries(result.summaryStatistics)) {
        weights[itemId] = stats.median || stats.map || 0;
      }
    } else {
      throw new Error('No summary statistics in Bayesian result');
    }
    
    return weights;
  } catch (importError) {
    // If import fails, throw error
    throw new Error(`Failed to import Bayesian calculator: ${importError.message}`);
  }
}

/**
 * Generate calculation JSON structure
 * @param {Object} weights - Calculated weights
 * @param {string} categoryId - Category identifier
 * @param {string} calculationType - 'mle' or 'bayesian'
 * @param {Array} datasets - Dataset objects
 * @returns {Object} Calculation JSON structure
 */
function generateCalculationJson(weights, categoryId, calculationType, datasets) {
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
  
  const categoryName = categoryId.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
  
  return {
    name: `Calculated Weights for ${categoryName}`,
    description: `Calculated item weights for ${categoryName} using ${calculationType.toUpperCase()} method${datasets ? ` from ${datasets.length} dataset${datasets.length !== 1 ? 's' : ''}` : ''}`,
    date: dateStr,
    patch: patch || 'N/A',
    sources: sources,
    items: itemsArray
  };
}

export function calculationsPlugin() {
  return {
    name: 'calculations-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Check if this is a calculation file request
        const calculationMatch = req.url.match(/^\/data\/([^\/]+)\/calculations\/(mle|bayesian)\.json$/);
        
        if (!calculationMatch) {
          return next();
        }
        
        const [, categoryDir, calculationType] = calculationMatch;
        const publicDir = join(process.cwd(), 'public');
        const calculationPath = join(publicDir, 'data', categoryDir, 'calculations', `${calculationType}.json`);
        
        // Check if file exists
        try {
          await access(calculationPath, constants.F_OK);
          // File exists, let Vite serve it normally
          return next();
        } catch {
          // File doesn't exist, calculate on demand
          try {
            console.log(`[Calculations Plugin] Calculating ${calculationType}.json for ${categoryDir} on demand`);
            
            // Discover datasets
            const datasetPaths = await discoverDatasets(publicDir, categoryDir);
            
            if (datasetPaths.length === 0) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'No datasets found for calculation' }));
              return;
            }
            
            // Load datasets
            const datasets = [];
            for (const path of datasetPaths) {
              try {
                const content = await readFile(path, 'utf-8');
                datasets.push(JSON.parse(content));
              } catch (error) {
                console.warn(`Failed to load dataset ${path}:`, error);
              }
            }
            
            if (datasets.length === 0) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to load datasets' }));
              return;
            }
            
            // Calculate weights
            let weights;
            if (calculationType === 'mle') {
              weights = await calculateMleWeights(datasetPaths);
            } else {
              // Try to calculate Bayesian weights
              try {
                weights = await calculateBayesianWeights(datasetPaths);
              } catch (bayesianError) {
                console.warn(`[Calculations Plugin] Bayesian calculation failed:`, bayesianError);
                res.statusCode = 503;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  error: 'Bayesian calculation on demand is not available. Please visit the page to calculate Bayesian weights, or ensure the file exists in the public directory.',
                  details: bayesianError.message
                }));
                return;
              }
            }
            
            // Generate calculation JSON
            const categoryId = getCategoryIdFromDirectory(categoryDir);
            const calculationJson = generateCalculationJson(weights, categoryId, calculationType, datasets);
            
            // Return JSON
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(calculationJson, null, 2));
          } catch (error) {
            console.error(`[Calculations Plugin] Error calculating ${calculationType}.json:`, error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error.message }));
          }
        }
      });
    }
  };
}
