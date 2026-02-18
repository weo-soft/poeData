/**
 * Unit tests for bayesianWeightDisplay.js
 * Tests for Bayesian weight display component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderBayesianWeightDisplay, getCurrentBayesianResult, isBayesianLoading } from '../../src/components/bayesianWeightDisplay.js';
import { inferWeights } from '../../src/services/bayesianWeightCalculator.js';

// Mock the Bayesian weight calculator
vi.mock('../../src/services/bayesianWeightCalculator.js', () => ({
  inferWeights: vi.fn()
}));

// Mock DOM utilities
vi.mock('../../src/utils/dom.js', () => ({
  createElement: vi.fn((tag, options = {}) => {
    const element = document.createElement(tag);
    if (options.className) element.className = options.className;
    if (options.textContent) element.textContent = options.textContent;
    if (options['data-method']) element.setAttribute('data-method', options['data-method']);
    return element;
  }),
  clearElement: vi.fn((element) => {
    if (element) element.innerHTML = '';
  })
}));

describe('renderBayesianWeightDisplay', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw error with invalid container', () => {
    expect(() => renderBayesianWeightDisplay(null, [], 'test')).rejects.toThrow('Container must be a valid HTMLElement');
  });

  it('should display empty state with no datasets', async () => {
    await renderBayesianWeightDisplay(container, [], 'test');

    expect(container.querySelector('.bayesian-weight-display-empty')).toBeTruthy();
    expect(container.textContent).toContain('No datasets available');
  });

  it('should show loading state during inference', async () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [{ id: 'tul', count: 2030 }]
      }
    ];

    // Mock a delayed response
    inferWeights.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        posteriorSamples: { 'tul': [0.3, 0.4, 0.5] },
        summaryStatistics: { 'tul': { median: 0.4, map: 0.4, credibleInterval: { lower: 0.3, upper: 0.5 } } },
        convergenceDiagnostics: {},
        modelAssumptions: {},
        metadata: {}
      }), 100))
    );

    const renderPromise = renderBayesianWeightDisplay(container, datasets, 'test');

    // Check loading state appears
    expect(container.querySelector('.bayesian-loading')).toBeTruthy();
    expect(container.textContent).toContain('JAGS inference');

    await renderPromise;
  });

  it('should display Bayesian results after successful inference', async () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [{ id: 'tul', count: 2030 }]
      }
    ];

    const mockResult = {
      posteriorSamples: { 'tul': [0.3, 0.4, 0.5] },
      summaryStatistics: {
        'tul': {
          median: 0.4,
          map: 0.4,
          credibleInterval: { lower: 0.3, upper: 0.5 }
        }
      },
      convergenceDiagnostics: { overall: { converged: true } },
      modelAssumptions: {},
      metadata: {}
    };

    inferWeights.mockResolvedValue(mockResult);

    await renderBayesianWeightDisplay(container, datasets, 'test');

    expect(container.querySelector('.bayesian-results-table')).toBeTruthy();
    expect(container.textContent).toContain('Bayesian');
    expect(container.textContent).toContain('MCMC') || expect(container.textContent).toContain('client-side');
  });

  it('should display error message on inference failure', async () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [{ id: 'tul', count: 2030 }]
      }
    ];

    inferWeights.mockRejectedValue(new Error('Backend connection failed'));

    await renderBayesianWeightDisplay(container, datasets, 'test', []);

    // Wait a bit for async error handling
    await new Promise(resolve => setTimeout(resolve, 100));

    const errorElement = container.querySelector('.bayesian-error');
    expect(errorElement).toBeTruthy();
    const errorText = container.textContent || '';
    expect(errorText.includes('Bayesian inference failed') || 
           errorText.includes('Cannot connect')).toBe(true);
  });
});

describe('getCurrentBayesianResult', () => {
  beforeEach(() => {
    // Reset module state by re-importing
    vi.resetModules();
  });

  it('should return null initially', async () => {
    // Re-import to get fresh module state
    const { getCurrentBayesianResult: freshGetResult } = await import('../../src/components/bayesianWeightDisplay.js');
    expect(freshGetResult()).toBeNull();
  });
});

describe('isBayesianLoading', () => {
  it('should return false initially', () => {
    expect(isBayesianLoading()).toBe(false);
  });
});
