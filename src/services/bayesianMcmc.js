/**
 * Client-side MCMC sampler for Bayesian weight inference
 * Implements Metropolis-Hastings algorithm for Dirichlet-multinomial model
 * Works entirely in the browser without requiring JAGS or backend
 */

/**
 * Sample from Dirichlet distribution
 * @param {number[]} alpha - Dirichlet parameters
 * @returns {number[]} Sampled vector (sums to 1)
 */
function sampleDirichlet(alpha) {
  const n = alpha.length;
  const samples = new Array(n);
  let sum = 0;

  // Sample from Gamma distributions
  for (let i = 0; i < n; i++) {
    samples[i] = sampleGamma(alpha[i], 1);
    sum += samples[i];
  }

  // Normalize to get Dirichlet sample
  for (let i = 0; i < n; i++) {
    samples[i] /= sum;
  }

  return samples;
}

/**
 * Sample from Gamma distribution using Marsaglia and Tsang's method
 * @param {number} shape - Shape parameter (k)
 * @param {number} scale - Scale parameter (theta)
 * @returns {number} Gamma random variate
 */
function sampleGamma(shape, scale) {
  if (shape < 1) {
    // Use transformation for shape < 1
    return sampleGamma(shape + 1, scale) * Math.pow(Math.random(), 1 / shape);
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    let x, v;
    do {
      x = sampleNormal(0, 1);
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v;
    const u = Math.random();

    if (u < 1 - 0.0331 * (x * x) * (x * x)) {
      return d * v * scale;
    }

    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v * scale;
    }
  }
}

/**
 * Sample from standard normal distribution (Box-Muller transform)
 * @param {number} mean - Mean
 * @param {number} stdDev - Standard deviation
 * @returns {number} Normal random variate
 */
function sampleNormal(mean, stdDev) {
  // Avoid log(0) by ensuring u1 > 0
  let u1 = Math.random();
  while (u1 === 0 || u1 === 1) {
    u1 = Math.random();
  }
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Compute log-likelihood for multinomial with exclusion
 * @param {number[]} weights - Current weight vector
 * @param {Array<Object>} datasets - Dataset objects
 * @param {Array<string>} itemIds - Item ID array
 * @returns {number} Log-likelihood
 */
function computeLogLikelihood(weights, datasets, itemIds) {
  let logLik = 0;

  for (const ds of datasets) {
    const counts = new Array(itemIds.length).fill(0);
    let totalCount = 0;

    // Count items
    for (const item of ds.items || []) {
      const idx = itemIds.indexOf(item.id);
      if (idx >= 0) {
        counts[idx] = item.count || 0;
        totalCount += item.count || 0;
      }
    }

    if (totalCount === 0) continue;

    // Check if input is known
    if (ds.inputItems && ds.inputItems.length > 0) {
      // Known input: multinomial with exclusion
      const inputIdx = itemIds.indexOf(ds.inputItems[0].id);
      if (inputIdx >= 0) {
        // Input is in output list: create probability vector excluding input
        const prob = new Array(itemIds.length);
        let probSum = 0;

        for (let i = 0; i < itemIds.length; i++) {
          if (i === inputIdx) {
            prob[i] = 0; // Exclusion constraint
          } else {
            prob[i] = weights[i] / (1 - weights[inputIdx]);
            probSum += prob[i];
          }
        }

        // Normalize probabilities
        for (let i = 0; i < itemIds.length; i++) {
          if (i !== inputIdx) {
            prob[i] /= probSum;
          }
        }

        // Multinomial log-likelihood
        for (let i = 0; i < itemIds.length; i++) {
          if (counts[i] > 0 && prob[i] > 0) {
            logLik += counts[i] * Math.log(prob[i]);
          }
        }
      } else {
        // Input is known but not in output list: use weights directly
        // The weights already represent probabilities for output items only
        for (let i = 0; i < itemIds.length; i++) {
          if (counts[i] > 0 && weights[i] > 0) {
            logLik += counts[i] * Math.log(weights[i]);
          }
        }
      }
    } else {
      // Unknown input: use weights directly
      for (let i = 0; i < itemIds.length; i++) {
        if (counts[i] > 0 && weights[i] > 0) {
          logLik += counts[i] * Math.log(weights[i]);
        }
      }
    }
  }

  return logLik;
}

/**
 * Compute log-prior (Dirichlet prior)
 * @param {number[]} weights - Weight vector
 * @param {number[]} alpha - Dirichlet parameters
 * @returns {number} Log-prior
 */
function computeLogPrior(weights, alpha) {
  let logPrior = 0;
  for (let i = 0; i < weights.length; i++) {
    if (weights[i] > 0 && alpha[i] > 0) {
      logPrior += (alpha[i] - 1) * Math.log(weights[i]);
    }
  }
  return logPrior;
}

/**
 * Metropolis-Hastings MCMC sampler for Bayesian weight inference
 * Runs asynchronously to prevent UI blocking
 * @param {Array<Object>} datasets - Dataset objects
 * @param {Object} options - MCMC options
 * @param {number} options.numSamples - Number of samples (default: 2000, optimized for browser)
 * @param {number} options.numChains - Number of chains (default: 2, optimized for browser)
 * @param {number} options.burnIn - Burn-in iterations (default: 500, optimized for browser)
 * @param {number} options.proposalScale - Proposal distribution scale (default: 0.1)
 * @param {Function} options.onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} Posterior samples and diagnostics
 */
export async function runMcmcSampling(datasets, options = {}) {
  const {
    numSamples = 2000, // Optimized for browser performance
    numChains = 2,     // Optimized for browser performance
    burnIn = 500,      // Optimized for browser performance
    proposalScale = 0.1
  } = options;

  // Collect all unique item IDs
  const itemSet = new Set();
  for (const ds of datasets) {
    for (const item of ds.items || []) {
      itemSet.add(item.id);
    }
  }
  const itemIds = Array.from(itemSet);
  const numItems = itemIds.length;

  if (numItems === 0) {
    throw new Error('No items found in datasets');
  }

  // Handle single item case
  if (numItems === 1) {
    const itemId = itemIds[0];
    return {
      posteriorSamples: {
        [itemId]: Array(numSamples * numChains).fill(1.0)
      },
      summaryStatistics: {
        [itemId]: {
          median: 1.0,
          map: 1.0,
          credibleInterval: { lower: 1.0, upper: 1.0 }
        }
      },
      convergenceDiagnostics: {
        [itemId]: { rhat: 1.0, ess: numSamples * numChains, converged: true },
        overall: { converged: true, warnings: [] }
      },
      modelAssumptions: {
        singleKnownInput: 0,
        multipleKnownInputs: 0,
        unknownInputs: datasets.length,
        assumptions: {}
      },
      metadata: {
        numItems: 1,
        numDatasets: datasets.length,
        numSamples,
        numChains,
        burnIn
      }
    };
  }

  // Dirichlet prior parameters (uniform prior)
  const alpha = new Array(numItems).fill(1.0);

  // Run MCMC chains
  const allSamples = {};
  for (const itemId of itemIds) {
    allSamples[itemId] = [];
  }

  // Progress callback for UI updates
  const onProgress = options.onProgress || (() => {});

  // Helper to yield control to browser (prevent UI blocking)
  const yieldToBrowser = () => new Promise(resolve => setTimeout(resolve, 0));

  const totalIterations = numChains * (burnIn + numSamples);
  let completedIterations = 0;

  for (let chain = 0; chain < numChains; chain++) {
    // Initialize chain from Dirichlet prior
    let currentWeights = sampleDirichlet(alpha);
    let currentLogPost = computeLogLikelihood(currentWeights, datasets, itemIds) +
                         computeLogPrior(currentWeights, alpha);

    // Burn-in phase
    for (let iter = 0; iter < burnIn; iter++) {
      const proposal = proposeNewWeights(currentWeights, proposalScale);
      const proposalLogPost = computeLogLikelihood(proposal, datasets, itemIds) +
                              computeLogPrior(proposal, alpha);

      const logAcceptance = proposalLogPost - currentLogPost;
      if (Math.log(Math.random()) < logAcceptance) {
        currentWeights = proposal;
        currentLogPost = proposalLogPost;
      }

      completedIterations++;
      // Yield to browser every 50 iterations to prevent UI blocking
      if (iter % 50 === 0) {
        await yieldToBrowser();
        const progress = (completedIterations / totalIterations) * 90; // Reserve 10% for final processing
        onProgress(Math.min(progress, 90));
      }
    }

    // Sampling phase
    for (let iter = 0; iter < numSamples; iter++) {
      const proposal = proposeNewWeights(currentWeights, proposalScale);
      const proposalLogPost = computeLogLikelihood(proposal, datasets, itemIds) +
                              computeLogPrior(proposal, alpha);

      const logAcceptance = proposalLogPost - currentLogPost;
      if (Math.log(Math.random()) < logAcceptance) {
        currentWeights = proposal;
        currentLogPost = proposalLogPost;
      }

      // Store sample
      for (let i = 0; i < numItems; i++) {
        allSamples[itemIds[i]].push(currentWeights[i]);
      }

      completedIterations++;
      // Yield to browser every 50 iterations and update progress
      if (iter % 50 === 0) {
        await yieldToBrowser();
        const progress = (completedIterations / totalIterations) * 90; // Reserve 10% for final processing
        onProgress(Math.min(progress, 90));
      }
    }
  }

  // Final progress update
  onProgress(95);

  // Compute model assumptions
  const modelAssumptions = {
    singleKnownInput: 0,
    multipleKnownInputs: 0,
    unknownInputs: 0,
    assumptions: {}
  };

  for (let d = 0; d < datasets.length; d++) {
    const ds = datasets[d];
    if (!ds.inputItems || ds.inputItems.length === 0) {
      modelAssumptions.unknownInputs++;
      modelAssumptions.assumptions[d] = {
        type: 'unknown',
        description: 'Unknown input: uniform prior over all possible input items'
      };
    } else if (ds.inputItems.length === 1) {
      modelAssumptions.singleKnownInput++;
      modelAssumptions.assumptions[d] = {
        type: 'single',
        description: `Single known input: '${ds.inputItems[0].id}'`,
        inputItems: [ds.inputItems[0].id]
      };
    } else {
      modelAssumptions.multipleKnownInputs++;
      modelAssumptions.assumptions[d] = {
        type: 'multiple',
        description: `Multiple known inputs: ${ds.inputItems.map(i => i.id).join(', ')} (using first)`,
        inputItems: ds.inputItems.map(i => i.id)
      };
    }
  }

  // Final progress update
  onProgress(100);

  return {
    posteriorSamples: allSamples,
    modelAssumptions,
    metadata: {
      numItems,
      numDatasets: datasets.length,
      numSamples,
      numChains,
      burnIn
    }
  };
}

/**
 * Propose new weights using logit-normal proposal
 * @param {number[]} currentWeights - Current weight vector
 * @param {number} scale - Proposal scale
 * @returns {number[]} Proposed weight vector
 */
function proposeNewWeights(currentWeights, scale) {
  const n = currentWeights.length;
  const proposal = new Array(n);
  const epsilon = 1e-10;

  // Use logit transformation for bounded space [0,1]
  // Clamp weights to avoid numerical issues
  const clampedWeights = currentWeights.map(w => Math.max(epsilon, Math.min(1 - epsilon, w)));
  const logits = clampedWeights.map(w => Math.log(w / (1 - w)));
  
  // Add random walk in logit space
  for (let i = 0; i < n; i++) {
    logits[i] += sampleNormal(0, scale);
  }

  // Transform back to probability space
  let sum = 0;
  for (let i = 0; i < n; i++) {
    proposal[i] = 1 / (1 + Math.exp(-logits[i]));
    proposal[i] = Math.max(epsilon, Math.min(1 - epsilon, proposal[i])); // Clamp to avoid edge cases
    sum += proposal[i];
  }

  // Normalize to ensure sum = 1
  if (sum > 0) {
    for (let i = 0; i < n; i++) {
      proposal[i] /= sum;
    }
  } else {
    // Fallback: uniform distribution if sum is zero (shouldn't happen)
    const uniform = 1 / n;
    for (let i = 0; i < n; i++) {
      proposal[i] = uniform;
    }
  }

  return proposal;
}
