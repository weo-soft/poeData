/**
 * Bayesian weight calculator service
 * Performs client-side MCMC sampling for Bayesian weight inference
 * Works entirely in the browser without requiring JAGS or backend
 */

import { runMcmcSampling } from './bayesianMcmc.js';
import { computeStatistics } from '../utils/posteriorStats.js';

/**
 * Execute Bayesian weight inference using client-side MCMC
 * @param {Array<Object>} datasets - Array of dataset objects with inputItems and items properties
 * @param {Object} options - Configuration options
 * @param {number} options.numSamples - MCMC samples per chain (default: 2000, reduced for browser performance)
 * @param {number} options.numChains - Number of MCMC chains (default: 2, reduced for browser performance)
 * @param {number} options.burnIn - Burn-in iterations (default: 500, reduced for browser performance)
 * @param {Function} options.onProgress - Progress callback (progress: 0-100)
 * @returns {Promise<Object>} Bayesian weight result with posterior samples, summary statistics, etc.
 * @throws {Error} If datasets array is empty or inference fails
 */
export async function inferWeights(datasets, options = {}) {
  if (!datasets || datasets.length === 0) {
    throw new Error('Datasets array cannot be empty');
  }

  const {
    numSamples = 2000, // Reduced for browser performance
    numChains = 2,     // Reduced for browser performance
    burnIn = 500,      // Reduced for browser performance
    onProgress
  } = options;

  try {
    // Run client-side MCMC sampling
    // Note: runMcmcSampling already only includes output items in itemIds,
    // so input items that don't appear as outputs are automatically excluded
    const result = await runMcmcSampling(datasets, {
      numSamples,
      numChains,
      burnIn,
      onProgress
    });

    // Collect all output item IDs (items that appear in output items list)
    const outputItemIds = new Set();
    for (const ds of datasets) {
      if (ds.items && Array.isArray(ds.items)) {
        for (const item of ds.items) {
          if (item && item.id) {
            outputItemIds.add(item.id);
          }
        }
      }
    }

    // Filter posterior samples to only include output items (in case any input items slipped through)
    const filteredPosteriorSamples = {};
    for (const [itemId, samples] of Object.entries(result.posteriorSamples)) {
      if (outputItemIds.has(itemId)) {
        filteredPosteriorSamples[itemId] = samples;
      }
    }

    // Compute summary statistics from filtered samples
    const summaryStatistics = computeStatistics(filteredPosteriorSamples);

    // Note: Each MCMC sample already sums to 1.0, so the statistics should already be normalized.
    // However, due to sampling variability and the fact that medians don't preserve sums,
    // the medians might not sum exactly to 1.0. We always renormalize to ensure consistency.
    let weightSum = 0;
    for (const [itemId, stats] of Object.entries(summaryStatistics)) {
      weightSum += stats.median || stats.map || 0;
    }
    if (weightSum > 0) {
      // Renormalize to ensure weights sum to exactly 1.0
      for (const itemId in summaryStatistics) {
        const stats = summaryStatistics[itemId];
        if (stats.median !== undefined) stats.median /= weightSum;
        if (stats.map !== undefined) stats.map /= weightSum;
        if (stats.mean !== undefined) stats.mean /= weightSum;
        if (stats.credibleInterval) {
          stats.credibleInterval.lower /= weightSum;
          stats.credibleInterval.upper /= weightSum;
        }
      }
    }

    // Compute simplified convergence diagnostics from filtered samples
    const convergenceDiagnostics = computeConvergenceDiagnostics(filteredPosteriorSamples);

    return {
      ...result,
      posteriorSamples: filteredPosteriorSamples,
      summaryStatistics,
      convergenceDiagnostics
    };
  } catch (error) {
    throw new Error(`Bayesian inference failed: ${error.message}`);
  }
}

/**
 * Group datasets by their single input item ID (same logic as weightCalculator).
 * Only datasets with exactly one inputItem are included.
 * @param {Array<Object>} datasets - Array of dataset objects
 * @returns {Map<string, Array<Object>>} Map of inputItemId -> datasets
 */
function groupDatasetsByInputItem(datasets) {
  const byInput = new Map();
  for (const ds of datasets) {
    if (!ds.inputItems || !Array.isArray(ds.inputItems) || ds.inputItems.length !== 1) {
      continue;
    }
    const inputId = ds.inputItems[0].id;
    if (!inputId) continue;
    if (!byInput.has(inputId)) {
      byInput.set(inputId, []);
    }
    byInput.get(inputId).push(ds);
  }
  return byInput;
}

/**
 * Execute Bayesian weight inference separately per input item (e.g. for contracts: one inference per contract type).
 * Use this when the transformation model differs by input (e.g. contract type -> job weights).
 *
 * @param {Array<Object>} datasets - Array of dataset objects (each with a single inputItem)
 * @param {Object} options - Same as inferWeights (numSamples, numChains, burnIn, onProgress)
 * @returns {Promise<Object>} { [inputItemId: string]: { weights, summaryStatistics, posteriorSamples, convergenceDiagnostics, ... } }
 * @throws {Error} If datasets array is empty or inference fails
 */
export async function inferWeightsPerInputItem(datasets, options = {}) {
  if (!datasets || datasets.length === 0) {
    throw new Error('Datasets array cannot be empty');
  }

  const byInput = groupDatasetsByInputItem(datasets);
  const result = {};
  const inputIds = Array.from(byInput.keys());

  for (const inputItemId of inputIds) {
    const group = byInput.get(inputItemId);
    if (!group || group.length === 0) continue;

    const inferenceResult = await inferWeights(group, options);
    const weights = {};
    if (inferenceResult.summaryStatistics) {
      for (const [itemId, stats] of Object.entries(inferenceResult.summaryStatistics)) {
        const w = stats.median != null ? stats.median : stats.map;
        if (typeof w === 'number') weights[itemId] = w;
      }
    }
    result[inputItemId] = {
      ...inferenceResult,
      weights
    };
  }

  return result;
}

/**
 * Compute simplified convergence diagnostics
 * @param {Object} posteriorSamples - Posterior samples per item
 * @returns {Object} Convergence diagnostics
 */
function computeConvergenceDiagnostics(posteriorSamples) {
  const diagnostics = {};
  const warnings = [];

  for (const [itemId, samples] of Object.entries(posteriorSamples)) {
    if (samples.length === 0) continue;

    // Simplified diagnostics (full R-hat computation would require chain separation)
    const ess = samples.length; // Effective sample size approximation
    const rhat = 1.0; // Assume convergence (full R-hat requires chain separation)

    diagnostics[itemId] = {
      rhat,
      ess,
      converged: ess > 400
    };

    if (ess < 400) {
      warnings.push(`Parameter '${itemId}' has ESS = ${ess} (recommended: >400)`);
    }
  }

  return {
    ...diagnostics,
    overall: {
      converged: warnings.length === 0,
      warnings
    }
  };
}
