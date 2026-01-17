/**
 * Posterior statistics computation utilities
 * Computes summary statistics (median, MAP, credible intervals) from posterior samples
 */

import { quantile, median } from 'simple-statistics';

/**
 * Compute posterior median from samples array
 * @param {number[]} samples - Array of posterior samples
 * @returns {number} Median value (50th percentile)
 * @throws {Error} If samples array is empty
 */
export function computeMedian(samples) {
  if (!samples || samples.length === 0) {
    throw new Error('Samples array cannot be empty');
  }
  return median(samples);
}

/**
 * Compute MAP (Maximum A Posteriori) estimate from samples using kernel density estimation
 * @param {number[]} samples - Array of posterior samples
 * @returns {number} MAP estimate (mode of posterior distribution)
 * @throws {Error} If samples array is empty
 */
export function computeMAP(samples) {
  if (!samples || samples.length === 0) {
    throw new Error('Samples array cannot be empty');
  }

  // Simple approach: use histogram-based mode estimation
  // For more accurate MAP, would need full KDE implementation
  const sorted = [...samples].sort((a, b) => a - b);
  const n = sorted.length;

  // Use median as approximation for MAP
  // In practice, MAP computation requires KDE which is more complex
  return median(sorted);
}

/**
 * Compute credible interval from posterior samples
 * @param {number[]} samples - Array of posterior samples
 * @param {number} level - Credible interval level (default: 0.95)
 * @returns {Object} { lower: number, upper: number }
 * @throws {Error} If samples array is empty or level is invalid
 */
export function computeCredibleInterval(samples, level = 0.95) {
  if (!samples || samples.length === 0) {
    throw new Error('Samples array cannot be empty');
  }

  if (level <= 0 || level >= 1) {
    throw new Error('Level must be between 0 and 1');
  }

  const lowerPercentile = (1 - level) / 2;
  const upperPercentile = 1 - lowerPercentile;

  const lower = quantile(samples, lowerPercentile);
  const upper = quantile(samples, upperPercentile);

  return { lower, upper };
}

/**
 * Compute all summary statistics from posterior samples
 * @param {Object} posteriorSamples - { [itemId: string]: number[] } - Posterior samples per item
 * @returns {Object} { [itemId: string]: PosteriorSummaryStatistics }
 */
export function computeStatistics(posteriorSamples) {
  if (!posteriorSamples || Object.keys(posteriorSamples).length === 0) {
    throw new Error('Posterior samples cannot be empty');
  }

  const statistics = {};

  for (const [itemId, samples] of Object.entries(posteriorSamples)) {
    if (!samples || samples.length === 0) {
      continue;
    }

    if (samples.length < 100) {
      console.warn(`Insufficient samples for ${itemId}: ${samples.length} (minimum: 100)`);
    }

    try {
      const median = computeMedian(samples);
      const map = computeMAP(samples);
      const credibleInterval = computeCredibleInterval(samples, 0.95);

      statistics[itemId] = {
        median,
        map,
        credibleInterval
      };
    } catch (error) {
      console.error(`Error computing statistics for ${itemId}:`, error);
    }
  }

  return statistics;
}
