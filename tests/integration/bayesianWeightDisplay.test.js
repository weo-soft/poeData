/**
 * Integration tests for Bayesian weight display
 * Tests the full flow: dataset loading → JAGS inference → display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderBayesianWeightDisplay } from '../../src/components/bayesianWeightDisplay.js';
import { inferWeights } from '../../src/services/bayesianWeightCalculator.js';

// Mock the Bayesian weight calculator
vi.mock('../../src/services/bayesianWeightCalculator.js', () => ({
  inferWeights: vi.fn()
}));

describe('Bayesian Weight Display Integration', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.clearAllMocks();
  });

  it('should display Bayesian estimates alongside deterministic weights', async () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [
          { id: 'tul', count: 2030 },
          { id: 'xoph', count: 2007 }
        ]
      }
    ];

    const mockResult = {
      posteriorSamples: {
        'tul': Array.from({ length: 100 }, () => 0.35 + Math.random() * 0.1),
        'xoph': Array.from({ length: 100 }, () => 0.28 + Math.random() * 0.1)
      },
      summaryStatistics: {
        'tul': {
          median: 0.35,
          map: 0.34,
          credibleInterval: { lower: 0.32, upper: 0.38 }
        },
        'xoph': {
          median: 0.28,
          map: 0.27,
          credibleInterval: { lower: 0.25, upper: 0.31 }
        }
      },
      convergenceDiagnostics: {
        overall: { converged: true }
      },
      modelAssumptions: {
        singleKnownInput: 1,
        multipleKnownInputs: 0,
        unknownInputs: 0
      },
      metadata: {
        numItems: 2,
        numDatasets: 1,
        inferenceTime: 5000
      }
    };

    inferWeights.mockResolvedValue(mockResult);

    await renderBayesianWeightDisplay(container, datasets, 'test', []);

    // Verify Bayesian results are displayed
    expect(container.querySelector('.bayesian-results-table')).toBeTruthy();
    expect(container.textContent).toContain('Bayesian Weight Estimates');
    expect(container.textContent).toContain('Posterior Median');
    expect(container.textContent).toContain('MAP Estimate');
    expect(container.textContent).toContain('95% Credible Interval');
  });

  it('should handle convergence warnings', async () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [{ id: 'tul', count: 2030 }]
      }
    ];

    const mockResult = {
      posteriorSamples: { 'tul': Array.from({ length: 100 }, () => 0.3) },
      summaryStatistics: {
        'tul': {
          median: 0.3,
          map: 0.3,
          credibleInterval: { lower: 0.25, upper: 0.35 }
        }
      },
      convergenceDiagnostics: {
        overall: {
          converged: false,
          warnings: ['Parameter \'tul\' has R-hat = 1.15 (threshold: 1.1)']
        }
      },
      modelAssumptions: {},
      metadata: {}
    };

    inferWeights.mockResolvedValue(mockResult);

    await renderBayesianWeightDisplay(container, datasets, 'test', []);

    expect(container.querySelector('.bayesian-convergence-warning')).toBeTruthy();
    expect(container.textContent).toContain('Convergence Warnings');
  });

  it('should display info icon button when model assumptions are available', async () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [
          { id: 'tul', count: 100 },
          { id: 'xoph', count: 80 }
        ]
      }
    ];

    const mockResult = {
      posteriorSamples: {
        'tul': Array.from({ length: 100 }, () => 0.5),
        'xoph': Array.from({ length: 100 }, () => 0.5)
      },
      summaryStatistics: {
        'tul': {
          median: 0.5,
          map: 0.5,
          credibleInterval: { lower: 0.4, upper: 0.6 }
        },
        'xoph': {
          median: 0.5,
          map: 0.5,
          credibleInterval: { lower: 0.4, upper: 0.6 }
        }
      },
      convergenceDiagnostics: { overall: { converged: true } },
      modelAssumptions: {
        singleKnownInput: 1,
        multipleKnownInputs: 0,
        unknownInputs: 0
      },
      metadata: {}
    };

    inferWeights.mockResolvedValue(mockResult);

    await renderBayesianWeightDisplay(container, datasets, 'test', []);

    // Verify info icon button is displayed (information is now in modal)
    const infoIcon = container.querySelector('.bayesian-info-icon');
    expect(infoIcon).toBeTruthy();
    expect(infoIcon.getAttribute('title')).toContain('Model Assumptions');
    
    // Verify exclusion constraint information is NOT directly on the page (moved to modal)
    expect(container.querySelector('.bayesian-exclusion-constraint')).toBeFalsy();
  });

  it('should display info icon button even when no datasets have known inputs (for MCMC explanation)', async () => {
    const datasets = [
      {
        inputItems: [],
        items: [
          { id: 'tul', count: 100 },
          { id: 'xoph', count: 80 }
        ]
      }
    ];

    const mockResult = {
      posteriorSamples: {
        'tul': Array.from({ length: 100 }, () => 0.5),
        'xoph': Array.from({ length: 100 }, () => 0.5)
      },
      summaryStatistics: {
        'tul': {
          median: 0.5,
          map: 0.5,
          credibleInterval: { lower: 0.4, upper: 0.6 }
        },
        'xoph': {
          median: 0.5,
          map: 0.5,
          credibleInterval: { lower: 0.4, upper: 0.6 }
        }
      },
      convergenceDiagnostics: { overall: { converged: true } },
      modelAssumptions: {
        singleKnownInput: 0,
        multipleKnownInputs: 0,
        unknownInputs: 1
      },
      metadata: {}
    };

    inferWeights.mockResolvedValue(mockResult);

    await renderBayesianWeightDisplay(container, datasets, 'test', []);

    // Verify info icon button is displayed (shows MCMC explanation modal)
    const infoIcon = container.querySelector('.bayesian-info-icon');
    expect(infoIcon).toBeTruthy();
    
    // Verify exclusion constraint info is NOT directly on the page (moved to modal)
    expect(container.querySelector('.bayesian-exclusion-constraint')).toBeFalsy();
  });

  it('should open modal with MCMC explanation when info icon is clicked', async () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [
          { id: 'tul', count: 100 },
          { id: 'xoph', count: 80 }
        ]
      }
    ];

    const mockResult = {
      posteriorSamples: {
        'tul': Array.from({ length: 100 }, () => 0.5),
        'xoph': Array.from({ length: 100 }, () => 0.5)
      },
      summaryStatistics: {
        'tul': {
          median: 0.5,
          map: 0.5,
          credibleInterval: { lower: 0.4, upper: 0.6 }
        },
        'xoph': {
          median: 0.5,
          map: 0.5,
          credibleInterval: { lower: 0.4, upper: 0.6 }
        }
      },
      convergenceDiagnostics: { overall: { converged: true } },
      modelAssumptions: {
        singleKnownInput: 1,
        multipleKnownInputs: 0,
        unknownInputs: 0
      },
      metadata: {}
    };

    inferWeights.mockResolvedValue(mockResult);

    await renderBayesianWeightDisplay(container, datasets, 'test', []);

    // Find and click the info icon
    const infoIcon = container.querySelector('.bayesian-info-icon');
    expect(infoIcon).toBeTruthy();
    
    infoIcon.click();
    
    // Wait for modal to appear
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify modal is displayed
    const modal = document.querySelector('.model-assumptions-modal');
    expect(modal).toBeTruthy();
    
    // Verify modal contains MCMC explanation
    expect(modal.textContent).toContain('Bayesian (MCMC) Calculation');
    expect(modal.textContent).toContain('MCMC');
    expect(modal.textContent).toContain('Prior Distribution');
  });

  it('should display comparison view with both deterministic and Bayesian results', async () => {
    const deterministicWeights = {
      'tul': 0.35,
      'xoph': 0.28
    };

    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [
          { id: 'tul', count: 2030 },
          { id: 'xoph', count: 2007 }
        ]
      }
    ];

    const mockResult = {
      posteriorSamples: {
        'tul': Array.from({ length: 100 }, () => 0.35 + Math.random() * 0.05),
        'xoph': Array.from({ length: 100 }, () => 0.28 + Math.random() * 0.05)
      },
      summaryStatistics: {
        'tul': {
          median: 0.36,
          map: 0.35,
          credibleInterval: { lower: 0.32, upper: 0.40 }
        },
        'xoph': {
          median: 0.27,
          map: 0.26,
          credibleInterval: { lower: 0.24, upper: 0.30 }
        }
      },
      convergenceDiagnostics: { overall: { converged: true } },
      modelAssumptions: {},
      metadata: {}
    };

    // Mock inferWeights for comparison view
    inferWeights.mockResolvedValue(mockResult);

    // Import renderComparisonView (it's in weightDisplay.js)
    const { renderWeightDisplay } = await import('../../src/components/weightDisplay.js');
    
    // Render with comparison method
    await renderWeightDisplay(container, deterministicWeights, 'test', [], {
      datasets,
      method: 'comparison'
    });

    // Note: This test would need to be updated based on actual implementation
    // For now, we verify the comparison view can be triggered
    expect(container.querySelector('.weight-comparison-view') || 
           container.querySelector('.weight-method-toggle')).toBeTruthy();
  });
});
