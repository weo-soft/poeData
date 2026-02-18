/**
 * Unit tests for bayesianWeightCalculator.js
 * Tests for client-side Bayesian weight calculation service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { inferWeights } from '../../src/services/bayesianWeightCalculator.js';
import { runMcmcSampling } from '../../src/services/bayesianMcmc.js';
import { computeStatistics } from '../../src/utils/posteriorStats.js';

// Mock the MCMC sampler
vi.mock('../../src/services/bayesianMcmc.js', () => ({
  runMcmcSampling: vi.fn()
}));

// Mock posterior statistics
vi.mock('../../src/utils/posteriorStats.js', () => ({
  computeStatistics: vi.fn()
}));

describe('inferWeights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw error with empty datasets array', async () => {
    await expect(inferWeights([])).rejects.toThrow('Datasets array cannot be empty');
  });

  it('should run MCMC sampling and compute statistics', async () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [
          { id: 'tul', count: 2030 },
          { id: 'xoph', count: 2007 }
        ]
      }
    ];

    const mockMcmcResult = {
      posteriorSamples: {
        'tul': [0.342, 0.351, 0.338],
        'xoph': [0.281, 0.275, 0.289]
      },
      modelAssumptions: {
        singleKnownInput: 1,
        multipleKnownInputs: 0,
        unknownInputs: 0,
        assumptions: {}
      },
      metadata: {
        numItems: 2,
        numDatasets: 1,
        numSamples: 2000,
        numChains: 2,
        burnIn: 500
      }
    };

    const mockSummaryStats = {
      'tul': {
        median: 0.345,
        map: 0.342,
        credibleInterval: { lower: 0.312, upper: 0.378 }
      },
      'xoph': {
        median: 0.281,
        map: 0.278,
        credibleInterval: { lower: 0.250, upper: 0.310 }
      }
    };

    runMcmcSampling.mockResolvedValue(mockMcmcResult);
    computeStatistics.mockReturnValue(mockSummaryStats);

    const result = await inferWeights(datasets);

    expect(runMcmcSampling).toHaveBeenCalledWith(
      datasets,
      expect.objectContaining({
        numSamples: 2000,
        numChains: 2,
        burnIn: 500
      })
    );

    expect(computeStatistics).toHaveBeenCalledWith(mockMcmcResult.posteriorSamples);
    expect(result).toHaveProperty('posteriorSamples');
    expect(result).toHaveProperty('summaryStatistics');
    expect(result).toHaveProperty('convergenceDiagnostics');
    expect(result.summaryStatistics).toEqual(mockSummaryStats);
  });

  it('should use custom options when provided', async () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [{ id: 'tul', count: 2030 }]
      }
    ];

    const mockMcmcResult = {
      posteriorSamples: { 'tul': [0.3, 0.4, 0.5] },
      modelAssumptions: {},
      metadata: {}
    };

    runMcmcSampling.mockResolvedValue(mockMcmcResult);
    computeStatistics.mockReturnValue({});

    await inferWeights(datasets, {
      numSamples: 5000,
      numChains: 4,
      burnIn: 1000
    });

    expect(runMcmcSampling).toHaveBeenCalledWith(
      datasets,
      expect.objectContaining({
        numSamples: 5000,
        numChains: 4,
        burnIn: 1000
      })
    );
  });

  it('should pass progress callback to MCMC sampler', async () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [{ id: 'tul', count: 2030 }]
      }
    ];

    const mockMcmcResult = {
      posteriorSamples: { 'tul': [0.3] },
      modelAssumptions: {},
      metadata: {}
    };

    runMcmcSampling.mockResolvedValue(mockMcmcResult);
    computeStatistics.mockReturnValue({});

    const progressCallback = vi.fn();
    await inferWeights(datasets, { onProgress: progressCallback });

    expect(runMcmcSampling).toHaveBeenCalledWith(
      datasets,
      expect.objectContaining({
        onProgress: progressCallback
      })
    );
  });

  it('should compute convergence diagnostics', async () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [{ id: 'tul', count: 2030 }]
      }
    ];

    const mockMcmcResult = {
      posteriorSamples: {
        'tul': Array(4000).fill(0.3) // 4000 samples
      },
      modelAssumptions: {},
      metadata: {}
    };

    runMcmcSampling.mockResolvedValue(mockMcmcResult);
    computeStatistics.mockReturnValue({});

    const result = await inferWeights(datasets);

    expect(result.convergenceDiagnostics).toHaveProperty('tul');
    expect(result.convergenceDiagnostics.tul).toHaveProperty('rhat');
    expect(result.convergenceDiagnostics.tul).toHaveProperty('ess');
    expect(result.convergenceDiagnostics.tul).toHaveProperty('converged');
    expect(result.convergenceDiagnostics).toHaveProperty('overall');
  });

  it('should handle MCMC sampling errors', async () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [{ id: 'tul', count: 2030 }]
      }
    ];

    runMcmcSampling.mockRejectedValue(new Error('MCMC sampling failed'));

    await expect(inferWeights(datasets)).rejects.toThrow('Bayesian inference failed');
  });

  it('should handle datasets with single known input', async () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [
          { id: 'tul', count: 2030 },
          { id: 'xoph', count: 2007 }
        ]
      }
    ];

    const mockMcmcResult = {
      posteriorSamples: {
        'tul': [0.5, 0.51, 0.49],
        'xoph': [0.5, 0.49, 0.51]
      },
      modelAssumptions: {
        singleKnownInput: 1,
        multipleKnownInputs: 0,
        unknownInputs: 0,
        assumptions: {
          '0': {
            type: 'single',
            description: "Single known input: 'esh'",
            inputItems: ['esh']
          }
        }
      },
      metadata: {}
    };

    runMcmcSampling.mockResolvedValue(mockMcmcResult);
    computeStatistics.mockReturnValue({});

    const result = await inferWeights(datasets);

    expect(result.modelAssumptions.singleKnownInput).toBe(1);
    expect(result.modelAssumptions.assumptions['0'].type).toBe('single');
  });

  it('should handle datasets with multiple known inputs', async () => {
    const datasets = [
      {
        inputItems: [{ id: 'tul' }, { id: 'xoph' }],
        items: [
          { id: 'esh', count: 100 },
          { id: 'uul-netol', count: 80 }
        ]
      }
    ];

    const mockMcmcResult = {
      posteriorSamples: {},
      modelAssumptions: {
        singleKnownInput: 0,
        multipleKnownInputs: 1,
        unknownInputs: 0,
        assumptions: {
          '0': {
            type: 'multiple',
            description: 'Multiple known inputs: tul, xoph (using first)',
            inputItems: ['tul', 'xoph']
          }
        }
      },
      metadata: {}
    };

    runMcmcSampling.mockResolvedValue(mockMcmcResult);
    computeStatistics.mockReturnValue({});

    const result = await inferWeights(datasets);

    expect(result.modelAssumptions.multipleKnownInputs).toBe(1);
    expect(result.modelAssumptions.assumptions['0'].type).toBe('multiple');
    expect(result.modelAssumptions.assumptions['0'].inputItems).toContain('tul');
    expect(result.modelAssumptions.assumptions['0'].inputItems).toContain('xoph');
  });

  it('should handle datasets with unknown/random inputs', async () => {
    const datasets = [
      {
        inputItems: [],
        items: [
          { id: 'tul', count: 100 },
          { id: 'xoph', count: 80 }
        ]
      }
    ];

    const mockMcmcResult = {
      posteriorSamples: {},
      modelAssumptions: {
        singleKnownInput: 0,
        multipleKnownInputs: 0,
        unknownInputs: 1,
        assumptions: {
          '0': {
            type: 'unknown',
            description: 'Unknown input: uniform prior over all possible input items'
          }
        }
      },
      metadata: {}
    };

    runMcmcSampling.mockResolvedValue(mockMcmcResult);
    computeStatistics.mockReturnValue({});

    const result = await inferWeights(datasets);

    expect(result.modelAssumptions.unknownInputs).toBe(1);
    expect(result.modelAssumptions.assumptions['0'].type).toBe('unknown');
    expect(result.modelAssumptions.assumptions['0'].description).toContain('uniform prior');
  });
});
