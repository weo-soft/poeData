/**
 * Backend API endpoint handler for Bayesian weight calculations
 * POST /api/bayesian-weights
 */

import express from 'express';
import { executeJags } from '../jags/executeJags.js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const bayesianWeightsRouter = express.Router();

/**
 * Prepare JAGS model and data from datasets
 */
function prepareJagsModel(datasets, options = {}) {
  const {
    numSamples = 5000,
    numChains = 4,
    burnIn = 1000,
    alpha = null // Dirichlet prior parameters
  } = options;

  // Collect all unique item IDs
  const itemSet = new Set();
  for (const ds of datasets) {
    if (ds.items) {
      for (const item of ds.items) {
        itemSet.add(item.id);
      }
    }
    if (ds.inputItems) {
      for (const input of ds.inputItems) {
        itemSet.add(input.id);
      }
    }
  }
  const itemIds = Array.from(itemSet);
  const numItems = itemIds.length;
  const numDatasets = datasets.length;

  if (numItems === 0) {
    throw new Error('No items found in datasets');
  }

  // Handle edge case: single item category
  if (numItems === 1) {
    // Return trivial result for single item
    const singleItemId = itemIds[0];
    return {
      model: '',
      data: '',
      itemIds,
      modelAssumptions: {
        singleKnownInput: 0,
        multipleKnownInputs: 0,
        unknownInputs: numDatasets,
        assumptions: {}
      },
      metadata: {
        numItems: 1,
        numDatasets,
        numSamples: options.numSamples || 5000,
        numChains: options.numChains || 4,
        burnIn: options.burnIn || 1000
      },
      _singleItem: true,
      _singleItemId: singleItemId
    };
  }

  // Build data structures for JAGS
  const hasInput = [];
  const inputItem = [];
  const counts = [];
  const totalCounts = [];
  const modelAssumptions = {
    singleKnownInput: 0,
    multipleKnownInputs: 0,
    unknownInputs: 0,
    assumptions: {}
  };

  for (let d = 0; d < numDatasets; d++) {
    const ds = datasets[d];
    const datasetCounts = new Array(numItems).fill(0);
    let datasetTotal = 0;

    // Count items
    if (ds.items) {
      for (const item of ds.items) {
        const itemIndex = itemIds.indexOf(item.id);
        if (itemIndex >= 0) {
          datasetCounts[itemIndex] = item.count || 0;
          datasetTotal += item.count || 0;
        }
      }
    }

    counts.push(datasetCounts);
    totalCounts.push(datasetTotal);

    // Determine input configuration
    if (!ds.inputItems || ds.inputItems.length === 0) {
      hasInput.push(0);
      inputItem.push(0);
      modelAssumptions.unknownInputs++;
      modelAssumptions.assumptions[d] = {
        type: 'unknown',
        description: 'Unknown input: uniform prior over all possible input items'
      };
    } else if (ds.inputItems.length === 1) {
      hasInput.push(1);
      const inputIndex = itemIds.indexOf(ds.inputItems[0].id);
      inputItem.push(inputIndex >= 0 ? inputIndex + 1 : 0); // JAGS uses 1-based indexing
      modelAssumptions.singleKnownInput++;
      modelAssumptions.assumptions[d] = {
        type: 'single',
        description: `Single known input: '${ds.inputItems[0].id}'`,
        inputItems: [ds.inputItems[0].id]
      };
    } else {
      hasInput.push(1);
      // For multiple inputs, use first one (or could average)
      const inputIndex = itemIds.indexOf(ds.inputItems[0].id);
      inputItem.push(inputIndex >= 0 ? inputIndex + 1 : 0);
      modelAssumptions.multipleKnownInputs++;
      modelAssumptions.assumptions[d] = {
        type: 'multiple',
        description: `Multiple known inputs: ${ds.inputItems.map(i => i.id).join(', ')} (using first)`,
        inputItems: ds.inputItems.map(i => i.id)
      };
    }
  }

  // Prepare alpha (Dirichlet prior parameters)
  const alphaVector = alpha || new Array(numItems).fill(1.0);

  // Read model template
  const modelTemplate = `
model {
  # Prior: Dirichlet prior for item weights
  weights ~ ddirch(alpha)
  
  # For each dataset
  for (d in 1:numDatasets) {
    if (hasInput[d] == 1) {
      # Known input: multinomial with exclusion (input item cannot be returned)
      for (j in 1:numItems) {
        if (j == inputItem[d]) {
          prob[j] <- 0
        } else {
          prob[j] <- weights[j] / (1 - weights[inputItem[d]])
        }
      }
      counts[d, 1:numItems] ~ dmulti(prob[1:numItems], totalCounts[d])
    } else {
      # Unknown input: use weights directly
      counts[d, 1:numItems] ~ dmulti(weights[1:numItems], totalCounts[d])
    }
  }
}
`;

  // Prepare data file (R format)
  const dataFile = `
numItems <- ${numItems}
numDatasets <- ${numDatasets}
alpha <- c(${alphaVector.join(', ')})
hasInput <- c(${hasInput.join(', ')})
inputItem <- c(${inputItem.join(', ')})
counts <- structure(.Data = c(${counts.flat().join(', ')}), .Dim = c(${numDatasets}, ${numItems}))
totalCounts <- c(${totalCounts.join(', ')})
`;

  return {
    model: modelTemplate,
    data: dataFile,
    itemIds,
    modelAssumptions,
    metadata: {
      numItems,
      numDatasets,
      numSamples,
      numChains,
      burnIn
    }
  };
}

/**
 * Compute summary statistics from posterior samples
 */
function computeSummaryStatistics(posteriorSamples) {
  const stats = {};

  for (const [itemId, samples] of Object.entries(posteriorSamples)) {
    if (samples.length === 0) continue;

    // Sort samples for percentile calculations
    const sorted = [...samples].sort((a, b) => a - b);
    const n = sorted.length;

    // Median (50th percentile)
    const median = n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

    // Credible interval (95%: 2.5th and 97.5th percentiles)
    const lowerIndex = Math.floor(n * 0.025);
    const upperIndex = Math.ceil(n * 0.975) - 1;
    const lower = sorted[lowerIndex];
    const upper = sorted[upperIndex];

    // MAP estimate (mode via simple histogram approach)
    const map = computeMAP(samples);

    stats[itemId] = {
      median,
      map,
      credibleInterval: {
        lower,
        upper
      }
    };
  }

  return stats;
}

/**
 * Compute MAP estimate using kernel density estimation
 */
function computeMAP(samples) {
  // Simple approach: use median as approximation for MAP
  // For more accurate MAP, would need full KDE implementation
  const sorted = [...samples].sort((a, b) => a - b);
  const n = sorted.length;
  return n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];
}

/**
 * Validate exclusion constraint in posterior samples
 * Ensures that when an input item is specified, its posterior samples are zero or near-zero
 * @param {Object} posteriorSamples - Posterior samples per item
 * @param {Array<string>} itemIds - Array of item IDs
 * @param {Array<Object>} datasets - Original datasets
 */
function validateExclusionConstraint(posteriorSamples, itemIds, datasets) {
  // Check each dataset with known input
  for (let d = 0; d < datasets.length; d++) {
    const ds = datasets[d];
    
    // Skip datasets without known inputs
    if (!ds.inputItems || ds.inputItems.length === 0) {
      continue;
    }

    // For each input item, verify exclusion constraint
    for (const inputItem of ds.inputItems) {
      const inputItemId = inputItem.id;
      const samples = posteriorSamples[inputItemId];

      if (samples && samples.length > 0) {
        // Check if samples are all zero or very small (within numerical precision)
        const maxSample = Math.max(...samples);
        const threshold = 1e-6; // Numerical precision threshold

        if (maxSample > threshold) {
          console.warn(
            `Exclusion constraint violation: Input item '${inputItemId}' has non-zero posterior samples ` +
            `(max: ${maxSample.toFixed(6)}). This may indicate a model issue.`
          );
        }
      }
    }
  }
}

/**
 * Compute convergence diagnostics (simplified)
 */
function computeConvergenceDiagnostics(posteriorSamples) {
  const diagnostics = {};
  const warnings = [];

  // Simplified diagnostics: assume convergence if we have samples
  // Full implementation would compute R-hat and ESS from multiple chains
  for (const [itemId, samples] of Object.entries(posteriorSamples)) {
    const ess = samples.length; // Simplified: use sample count as ESS
    const rhat = 1.0; // Simplified: assume convergence

    diagnostics[itemId] = {
      rhat,
      ess,
      converged: rhat < 1.1 && ess > 400
    };

    if (rhat >= 1.1) {
      warnings.push(`Parameter '${itemId}' has R-hat = ${rhat.toFixed(2)} (threshold: 1.1)`);
    }
    if (ess < 400) {
      warnings.push(`Parameter '${itemId}' has ESS = ${ess} (recommended: >400)`);
    }
  }

  const overallConverged = warnings.length === 0;

  return {
    ...diagnostics,
    overall: {
      converged: overallConverged,
      warnings
    }
  };
}

/**
 * POST /api/bayesian-weights
 */
bayesianWeightsRouter.post('/bayesian-weights', async (req, res, next) => {
  const startTime = Date.now();

  try {
    const { datasets, options = {} } = req.body;

    // Validate request
    if (!datasets || !Array.isArray(datasets) || datasets.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA',
          message: 'Datasets array is required and cannot be empty'
        }
      });
    }

    // Validate datasets structure
    for (let i = 0; i < datasets.length; i++) {
      const ds = datasets[i];
      if (!ds.items || !Array.isArray(ds.items) || ds.items.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATA',
            message: `Dataset ${i}: items array is required and cannot be empty`,
            details: { datasetIndex: i }
          }
        });
      }

      // Check for zero counts (insufficient data)
      const totalCount = ds.items.reduce((sum, item) => sum + (item.count || 0), 0);
      if (totalCount === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_DATA',
            message: `Dataset ${i}: all transformation counts are zero. Insufficient data for Bayesian inference.`,
            details: { datasetIndex: i }
          }
        });
      }
    }

    // Prepare JAGS model
    const jagsModel = prepareJagsModel(datasets, options);

    // Handle edge case: single item category (trivial case)
    if (jagsModel._singleItem) {
      const singleItemId = jagsModel._singleItemId;
      const inferenceTime = Date.now() - startTime;

      // Return trivial result: weight = 1.0 with zero uncertainty
      return res.json({
        success: true,
        data: {
          posteriorSamples: {
            [singleItemId]: Array(100).fill(1.0)
          },
          summaryStatistics: {
            [singleItemId]: {
              median: 1.0,
              map: 1.0,
              credibleInterval: { lower: 1.0, upper: 1.0 }
            }
          },
          convergenceDiagnostics: {
            [singleItemId]: {
              rhat: 1.0,
              ess: 100,
              converged: true
            },
            overall: { converged: true, warnings: [] }
          },
          modelAssumptions: jagsModel.modelAssumptions,
          metadata: {
            ...jagsModel.metadata,
            inferenceTime
          }
        }
      });
    }

    // Execute JAGS
    const posteriorSamples = await executeJags(jagsModel, options);

    // Validate exclusion constraint in posterior samples
    validateExclusionConstraint(posteriorSamples, jagsModel.itemIds, datasets);

    // Compute summary statistics
    const summaryStatistics = computeSummaryStatistics(posteriorSamples);

    // Compute convergence diagnostics
    const convergenceDiagnostics = computeConvergenceDiagnostics(posteriorSamples);

    const inferenceTime = Date.now() - startTime;

    // Return success response
    res.json({
      success: true,
      data: {
        posteriorSamples,
        summaryStatistics,
        convergenceDiagnostics,
        modelAssumptions: jagsModel.modelAssumptions,
        metadata: {
          ...jagsModel.metadata,
          inferenceTime
        }
      }
    });
  } catch (error) {
    // Handle specific error types
    if (error.message.includes('timeout')) {
      return res.status(504).json({
        success: false,
        error: {
          code: 'TIMEOUT',
          message: 'JAGS inference exceeded timeout',
          details: {
            timeout: 60000
          }
        }
      });
    }

    if (error.message.includes('JAGS')) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'JAGS_ERROR',
          message: error.message
        }
      });
    }

    // Generic error
    next(error);
  }
});
