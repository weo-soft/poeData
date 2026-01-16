/**
 * Weight calculation service using Maximum Likelihood Estimation
 * Calculates item weights from transformation data across datasets
 */

/**
 * Build count matrix from datasets
 * Aggregates transformation counts into an N×N matrix where counts[k][j] = 
 * number of transformations from item k to item j
 * 
 * @param {Array<Object>} datasets - Array of dataset objects with inputItems and items properties
 * @returns {Object} { counts: number[][], itemIndex: Map<string, number> }
 * @throws {Error} If datasets array is empty or dataset structure is invalid
 */
export function buildCountMatrix(datasets) {
  if (!datasets || datasets.length === 0) {
    throw new Error('Datasets array cannot be empty');
  }

  const itemIndex = new Map();
  let index = 0;

  // Collect all unique item IDs from all datasets
  // Note: inputItems is optional - if missing, we'll treat input as random
  // Order: items first, then inputItems (matching user's original code structure)
  for (const ds of datasets) {
    if (!ds.items || !Array.isArray(ds.items)) {
      throw new Error('Invalid dataset structure: missing items');
    }

    // Add output items to index first (always present)
    for (const item of ds.items) {
      if (!item || !item.id || typeof item.count !== 'number') {
        throw new Error('Invalid item: missing id or count');
      }
      if (!itemIndex.has(item.id)) {
        itemIndex.set(item.id, index++);
      }
    }

    // Add input items to index (if present)
    if (ds.inputItems && Array.isArray(ds.inputItems)) {
      for (const input of ds.inputItems) {
        if (!input || !input.id) {
          throw new Error('Invalid item: missing id or count');
        }
        if (!itemIndex.has(input.id)) {
          itemIndex.set(input.id, index++);
        }
      }
    }
  }

  const N = itemIndex.size;
  const counts = Array.from({ length: N }, () => Array(N).fill(0));

  // Fill counts matrix
  for (const ds of datasets) {
    // Handle datasets with missing or empty inputItems: treat as random input selection
    if (!ds.inputItems || !Array.isArray(ds.inputItems) || ds.inputItems.length === 0) {
      // No inputItems: assume input was chosen randomly from all items
      // Distribute output counts uniformly across all possible input items
      if (N > 0) {
        // Distribute counts uniformly: each input item gets equal share
        // When input is random, each output count C is distributed as C/N across all N input rows
        for (let k = 0; k < N; k++) {
          for (const item of ds.items) {
            const j = itemIndex.get(item.id);
            if (j !== undefined && typeof item.count === 'number' && item.count >= 0) {
              // Distribute proportionally: if output count is C, add C/N to each input row
              counts[k][j] += (item.count / N);
            }
          }
        }
      }
      continue;
    }

    // Normal case: dataset has inputItems
    // Handle multiple inputItems by distributing counts across all input items
    // If there are multiple inputItems, treat it as if any of them could have been the input
    const numInputItems = ds.inputItems.length;
    
    for (const inputItem of ds.inputItems) {
      const k = itemIndex.get(inputItem.id);
      
      if (k === undefined) {
        continue; // Skip if input item not found (shouldn't happen, but be safe)
      }

      // Add counts for each output item
      // If multiple inputItems, distribute counts evenly across them
      for (const item of ds.items) {
        const j = itemIndex.get(item.id);
        if (j !== undefined && typeof item.count === 'number' && item.count >= 0) {
          // Distribute count across all input items: if there are N input items, each gets count/N
          counts[k][j] += item.count / numInputItems;
        }
      }
    }
  }

  return { counts, itemIndex };
}

/**
 * Estimate weights from count matrix using Maximum Likelihood Estimation with gradient descent
 * 
 * @param {Object} countMatrix - { counts: number[][], itemIndex: Map<string, number> }
 * @param {Object} options - Configuration object
 * @param {number} options.learningRate - Gradient descent learning rate, default 0.01
 * @param {number} options.iterations - Maximum iterations, default 6000
 * @param {number} options.convergenceThreshold - Optional early convergence threshold
 * @returns {number[]} Array of normalized weights (length N), where weights sum to 1.0
 * @throws {Error} If countMatrix is invalid or options contain invalid values
 */
export function estimateWeightsFromCounts(countMatrix, options = {}) {
  const { counts, itemIndex } = countMatrix;

  // Validate count matrix
  if (!counts || !Array.isArray(counts)) {
    throw new Error('Invalid count matrix: counts must be an array');
  }

  const N = counts.length;
  if (N === 0) {
    throw new Error('Invalid count matrix: counts array is empty');
  }

  // Check if matrix is square
  for (let i = 0; i < N; i++) {
    if (!Array.isArray(counts[i]) || counts[i].length !== N) {
      throw new Error('Count matrix must be square');
    }
  }

  // Validate itemIndex size matches matrix dimensions
  if (!itemIndex || itemIndex.size !== N) {
    throw new Error('Count matrix itemIndex size must match matrix dimensions');
  }

  // Validate options
  // Use smaller default learning rate for better convergence stability
  const learningRate = options.learningRate !== undefined ? options.learningRate : 0.001;
  const iterations = options.iterations !== undefined ? options.iterations : 6000;
  const convergenceThreshold = options.convergenceThreshold;

  if (typeof learningRate !== 'number' || learningRate <= 0) {
    throw new Error('Invalid learning rate: must be positive');
  }

  if (typeof iterations !== 'number' || iterations <= 0 || !Number.isInteger(iterations)) {
    throw new Error('Invalid iterations: must be positive');
  }

  // Handle trivial case: single item
  if (N === 1) {
    return [1.0];
  }

  // Initialize theta (log-weights) to small random values for better convergence
  // Using small values ensures exp(theta) starts close to 1, giving uniform initial distribution
  const theta = Array(N).fill(0);
  // Start with uniform distribution (all weights equal = 1/N)
  // Since weights = exp(theta) / sum(exp(theta)), we want exp(theta[i]) = 1 for all i initially
  // So theta[i] = 0 is correct for uniform initialization

  // Gradient descent iteration
  for (let iter = 0; iter < iterations; iter++) {
    const grad = Array(N).fill(0);

    // Calculate sum of exp(theta[i]) for all items (global normalization constant)
    // This is computed once per iteration since it's the same for all inputs
    let sumExpAll = 0;
    for (let i = 0; i < N; i++) {
      sumExpAll += Math.exp(theta[i]);
    }

    // Avoid division by zero
    if (sumExpAll === 0 || sumExpAll === Infinity || isNaN(sumExpAll)) {
      // Reset to uniform distribution if numerical issues
      for (let i = 0; i < N; i++) {
        theta[i] = 0;
      }
      sumExpAll = N;
    }

    // Calculate gradient for each input item k
    for (let k = 0; k < N; k++) {
      // Calculate total count of transformations from input k (excluding self)
      let n_k = 0;
      for (let i = 0; i < N; i++) {
        if (i !== k) {
          n_k += counts[k][i];
        }
      }

      // Skip if no transformations from this input
      if (n_k === 0) continue;

      // Calculate sum of exp(theta[i]) for all items except k
      // This is used for the conditional probability when input is k
      let sumExp = 0;
      for (let i = 0; i < N; i++) {
        if (i !== k) {
          sumExp += Math.exp(theta[i]);
        }
      }

      // Avoid division by zero
      if (sumExp === 0 || sumExp === Infinity || isNaN(sumExp)) continue;

      // Calculate gradient for each output item m (m cannot equal k)
      for (let m = 0; m < N; m++) {
        if (m === k) continue;

        // Gradient component: observed count - expected count
        // Expected count = n_k * p_m where p_m = exp(theta[m]) / sumExp
        // This is the gradient of log-likelihood with respect to theta[m]
        const observed = counts[k][m];
        const expected = n_k * Math.exp(theta[m]) / sumExp;
        grad[m] += observed - expected;
      }
    }

    // Update theta with numerical stability
    for (let i = 0; i < N; i++) {
      // Clamp gradient to prevent extreme updates
      const clampedGrad = Math.max(-100, Math.min(100, grad[i]));
      theta[i] += learningRate * clampedGrad;
      
      // Clamp theta to prevent numerical overflow/underflow
      theta[i] = Math.max(-50, Math.min(50, theta[i]));
    }

    // Early convergence check (if threshold provided)
    if (convergenceThreshold !== undefined) {
      const gradientMagnitude = Math.sqrt(grad.reduce((sum, g) => sum + g * g, 0));
      if (gradientMagnitude < convergenceThreshold) {
        break; // Converged early
      }
    }
  }

  // Convert theta to weights and normalize
  const rawWeights = theta.map(Math.exp);
  const total = rawWeights.reduce((a, b) => a + b, 0);

  // Normalize to sum to 1.0
  return rawWeights.map(w => w / total);
}

/**
 * Calculate item weights from datasets (high-level function)
 * Combines buildCountMatrix and estimateWeightsFromCounts
 * 
 * @param {Array<Object>} datasets - Array of full dataset objects
 * @param {Object} options - MLE optimization options (same as estimateWeightsFromCounts)
 * @returns {Object} { [itemId: string]: number } - Map of item IDs to normalized weights
 * @throws {Error} If datasets array is empty, dataset structure is invalid, or calculation fails
 */
export function estimateItemWeights(datasets, options = {}) {
  if (!datasets || datasets.length === 0) {
    throw new Error('Datasets array cannot be empty');
  }

  // Build count matrix
  const { counts, itemIndex } = buildCountMatrix(datasets);

  // Estimate weights
  const weights = estimateWeightsFromCounts({ counts, itemIndex }, options);

  // Convert to item ID -> weight mapping
  const result = {};
  for (const [id, idx] of itemIndex.entries()) {
    result[id] = weights[idx];
  }

  return result;
}
