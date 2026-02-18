/**
 * Math utilities for weight visualizations
 * Provides CDF calculation and heatmap color interpolation functions
 */

/**
 * Calculate CDF data points from weight data
 * @param {Object<string, number>} weights - Weight data object
 * @returns {Array<{weight: number, cumulativePercentage: number}>} CDF data points
 * @throws {Error} If weights is invalid or empty
 */
export function calculateCDF(weights) {
  if (!weights || typeof weights !== 'object' || Array.isArray(weights)) {
    throw new Error('Weights must be a non-empty object');
  }

  const weightEntries = Object.entries(weights);
  if (weightEntries.length === 0) {
    throw new Error('Weights object cannot be empty');
  }

  // Extract and validate weight values
  const weightValues = weightEntries.map(([_, weight]) => {
    if (typeof weight !== 'number' || !isFinite(weight)) {
      throw new Error('All weight values must be finite numbers');
    }
    if (weight < 0) {
      throw new Error('All weight values must be non-negative');
    }
    return weight;
  });

  // Sort weights in ascending order
  const sortedWeights = [...weightValues].sort((a, b) => a - b);
  const totalItems = sortedWeights.length;

  // Handle edge case: single item
  if (totalItems === 1) {
    return [
      { weight: sortedWeights[0], cumulativePercentage: 100 }
    ];
  }

  // Handle edge case: all weights identical
  const minWeight = sortedWeights[0];
  const maxWeight = sortedWeights[totalItems - 1];
  if (minWeight === maxWeight) {
    return [
      { weight: minWeight, cumulativePercentage: 0 },
      { weight: maxWeight, cumulativePercentage: 100 }
    ];
  }

  // Calculate CDF for unique weight values
  const uniqueWeights = [...new Set(sortedWeights)].sort((a, b) => a - b);
  const cdfPoints = [];

  // Add starting point (min weight, 0%) - no items have weight < minWeight
  cdfPoints.push({
    weight: minWeight,
    cumulativePercentage: 0
  });

  // Calculate cumulative percentage for each unique weight
  // Skip the first unique weight since we already added it at 0%
  for (let i = 1; i < uniqueWeights.length; i++) {
    const weight = uniqueWeights[i];
    // Count items with weight <= current weight
    const count = sortedWeights.filter(w => w <= weight).length;
    const cumulativePercentage = (count / totalItems) * 100;
    
    cdfPoints.push({
      weight,
      cumulativePercentage
    });
  }

  // Ensure last point is at 100%
  const lastPoint = cdfPoints[cdfPoints.length - 1];
  if (lastPoint.cumulativePercentage !== 100 || lastPoint.weight !== maxWeight) {
    // Remove last point if it's not at maxWeight and 100%
    if (lastPoint.weight !== maxWeight) {
      cdfPoints.pop();
    }
    cdfPoints.push({
      weight: maxWeight,
      cumulativePercentage: 100
    });
  }

  return cdfPoints;
}

/**
 * Calculate heatmap color for weight value
 * @param {number} weight - Weight value
 * @param {number} minWeight - Minimum weight for normalization
 * @param {number} maxWeight - Maximum weight for normalization
 * @param {Object} colorScheme - Color scheme configuration
 * @param {string} colorScheme.minColor - CSS color for minimum weight (default: 'rgba(74, 144, 226, 0.1)')
 * @param {string} colorScheme.maxColor - CSS color for maximum weight (default: 'rgba(74, 144, 226, 1)')
 * @returns {string} CSS color value (rgba format)
 */
export function calculateHeatmapColor(weight, minWeight, maxWeight, colorScheme = {}) {
  // Default color scheme (matches existing application theme)
  const minColor = colorScheme.minColor || 'rgba(74, 144, 226, 0.1)';
  const maxColor = colorScheme.maxColor || 'rgba(74, 144, 226, 1)';

  // Handle edge case: maxWeight = minWeight = 0 or same value
  if (maxWeight === minWeight) {
    return minColor;
  }

  // Clamp weight to range
  const clampedWeight = Math.max(minWeight, Math.min(maxWeight, weight));

  // Normalize weight to 0-1 range
  const normalized = (clampedWeight - minWeight) / (maxWeight - minWeight);

  // Parse color strings (assumes rgba format)
  const parseRGBA = (colorStr) => {
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) {
      // Fallback: try to parse as hex or return default
      return { r: 74, g: 144, b: 226, a: 1 };
    }
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
      a: match[4] ? parseFloat(match[4]) : 1
    };
  };

  const minRGBA = parseRGBA(minColor);
  const maxRGBA = parseRGBA(maxColor);

  // Interpolate between min and max colors
  const r = Math.round(minRGBA.r + (maxRGBA.r - minRGBA.r) * normalized);
  const g = Math.round(minRGBA.g + (maxRGBA.g - minRGBA.g) * normalized);
  const b = Math.round(minRGBA.b + (maxRGBA.b - minRGBA.b) * normalized);
  const a = minRGBA.a + (maxRGBA.a - minRGBA.a) * normalized;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
