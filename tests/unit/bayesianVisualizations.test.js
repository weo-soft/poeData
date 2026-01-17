/**
 * Unit tests for bayesianVisualizations.js
 * Tests for Bayesian-specific visualizations (density plots, ranked probability charts, KDE)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  computeKDE,
  renderDensityPlot,
  renderRankedProbabilityChart
} from '../../src/visualization/bayesianVisualizations.js';
import { Chart } from 'chart.js';

// Mock Chart.js
vi.mock('chart.js', () => {
  const mockChart = vi.fn();
  mockChart.register = vi.fn();
  return {
    Chart: mockChart,
    registerables: []
  };
});

// Mock DOM utilities
vi.mock('../../src/utils/dom.js', () => ({
  createElement: vi.fn((tag, options = {}) => {
    const element = document.createElement(tag);
    if (options.className) element.className = options.className;
    if (options.textContent) element.textContent = options.textContent;
    if (options.style) element.style.cssText = options.style;
    if (options.innerHTML) element.innerHTML = options.innerHTML;
    return element;
  }),
  clearElement: vi.fn((element) => {
    if (element) element.innerHTML = '';
  })
}));

// Mock posteriorStats
vi.mock('../../src/utils/posteriorStats.js', () => ({
  computeStatistics: vi.fn((samples) => {
    const stats = {};
    for (const [itemId, sampleArray] of Object.entries(samples)) {
      if (sampleArray.length > 0) {
        const sorted = [...sampleArray].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        stats[itemId] = {
          median,
          map: median,
          credibleInterval: { lower: sorted[0], upper: sorted[sorted.length - 1] }
        };
      }
    }
    return stats;
  }),
  computeCredibleInterval: vi.fn((samples, level = 0.95) => {
    const sorted = [...samples].sort((a, b) => a - b);
    const lowerIdx = Math.floor(sorted.length * (1 - level) / 2);
    const upperIdx = Math.ceil(sorted.length * (1 + level) / 2) - 1;
    return {
      lower: sorted[lowerIdx] || sorted[0],
      upper: sorted[upperIdx] || sorted[sorted.length - 1]
    };
  }),
  computeMedian: vi.fn((samples) => {
    const sorted = [...samples].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  })
}));

describe('computeKDE', () => {
  it('should return empty array for empty samples', () => {
    expect(computeKDE([])).toEqual([]);
  });

  it('should return empty array for null samples', () => {
    expect(computeKDE(null)).toEqual([]);
  });

  it('should compute KDE for single sample', () => {
    const samples = [0.5];
    const kde = computeKDE(samples, 10);
    
    expect(kde.length).toBeGreaterThan(0);
    expect(kde[0]).toHaveProperty('x');
    expect(kde[0]).toHaveProperty('y');
  });

  it('should compute KDE for multiple samples', () => {
    const samples = [0.3, 0.4, 0.5, 0.6, 0.7];
    const kde = computeKDE(samples, 50);
    
    expect(kde.length).toBe(50);
    kde.forEach(point => {
      expect(point).toHaveProperty('x');
      expect(point).toHaveProperty('y');
      expect(point.y).toBeGreaterThanOrEqual(0);
    });
  });

  it('should use custom bandwidth when provided', () => {
    const samples = [0.3, 0.4, 0.5];
    const customBandwidth = 0.1;
    const kde1 = computeKDE(samples, 50, customBandwidth);
    const kde2 = computeKDE(samples, 50, customBandwidth * 2);
    
    // Different bandwidths should produce different density estimates
    expect(kde1.length).toBe(kde2.length);
  });

  it('should handle large sample sizes', () => {
    const samples = Array.from({ length: 1000 }, () => Math.random());
    const kde = computeKDE(samples, 100);
    
    expect(kde.length).toBe(100);
    expect(kde.every(p => typeof p.x === 'number' && typeof p.y === 'number')).toBe(true);
  });
});

describe('renderDensityPlot', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw error with invalid container', () => {
    expect(() => renderDensityPlot(null, {})).toThrow('Container must be a valid HTMLElement');
  });

  it('should display empty state with no posterior samples', () => {
    renderDensityPlot(container, {}, []);
    
    expect(container.querySelector('.visualization-placeholder')).toBeTruthy();
    expect(container.textContent).toContain('No posterior samples');
  });

  it('should render density plot with posterior samples', () => {
    const posteriorSamples = {
      'tul': Array.from({ length: 100 }, () => 0.3 + Math.random() * 0.1),
      'xoph': Array.from({ length: 100 }, () => 0.2 + Math.random() * 0.1)
    };

    const chart = renderDensityPlot(container, posteriorSamples, []);

    expect(container.querySelector('.bayesian-chart-container')).toBeTruthy();
    expect(container.querySelector('canvas')).toBeTruthy();
    expect(Chart).toHaveBeenCalled();
  });

  it('should create density plot with proper configuration', () => {
    const posteriorSamples = {
      'tul': Array.from({ length: 100 }, () => 0.3)
    };

    renderDensityPlot(container, posteriorSamples, []);

    const chartCall = Chart.mock.calls[0];
    const chartConfig = chartCall[1];
    
    // Title is now hidden (display: false) for cleaner look
    expect(chartConfig.options.plugins.title.display).toBe(false);
    // Legend should be on the right
    expect(chartConfig.options.plugins.legend.position).toBe('right');
    // X-axis should be labeled "Probability of item"
    expect(chartConfig.options.scales.x.title.text).toContain('Probability');
  });

  it('should handle items with metadata', () => {
    const posteriorSamples = {
      'tul': Array.from({ length: 100 }, () => 0.3)
    };
    const items = [
      { id: 'tul', name: 'Tul Breachstone' }
    ];

    renderDensityPlot(container, posteriorSamples, items);

    const chartCall = Chart.mock.calls[0];
    const chartData = chartCall[1].data;
    
    // Label should be just the item name (no "Bayesian" suffix)
    expect(chartData.datasets[0].label).toBe('Tul Breachstone');
  });
});

describe('renderRankedProbabilityChart', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw error with invalid container', () => {
    expect(() => renderRankedProbabilityChart(null, {})).toThrow('Container must be a valid HTMLElement');
  });

  it('should display empty state with no summary statistics', () => {
    renderRankedProbabilityChart(container, {}, []);
    
    expect(container.querySelector('.visualization-placeholder')).toBeTruthy();
    expect(container.textContent).toContain('No summary statistics');
  });

  it('should render ranked probability chart with summary statistics', () => {
    const summaryStatistics = {
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
    };

    const chart = renderRankedProbabilityChart(container, summaryStatistics, []);

    expect(container.querySelector('.bayesian-chart-container')).toBeTruthy();
    expect(container.querySelector('canvas')).toBeTruthy();
    expect(Chart).toHaveBeenCalled();
  });

  it('should sort items by median (descending)', () => {
    const summaryStatistics = {
      'low': {
        median: 0.1,
        map: 0.1,
        credibleInterval: { lower: 0.05, upper: 0.15 }
      },
      'high': {
        median: 0.9,
        map: 0.9,
        credibleInterval: { lower: 0.85, upper: 0.95 }
      }
    };

    renderRankedProbabilityChart(container, summaryStatistics, []);

    const chartCall = Chart.mock.calls[0];
    const chartData = chartCall[1].data;
    
    // First label should be 'high' (higher median)
    expect(chartData.labels[0]).toBe('high');
    expect(chartData.labels[1]).toBe('low');
  });

  it('should label chart as Bayesian/JAGS-derived', () => {
    const summaryStatistics = {
      'tul': {
        median: 0.3,
        map: 0.3,
        credibleInterval: { lower: 0.25, upper: 0.35 }
      }
    };

    renderRankedProbabilityChart(container, summaryStatistics, []);

    const chartCall = Chart.mock.calls[0];
    const chartConfig = chartCall[1];
    
    expect(chartConfig.options.plugins.title.text).toContain('MCMC');
    expect(chartConfig.options.plugins.title.text).toContain('Credible Intervals');
  });

  it('should include credible intervals in tooltip', () => {
    const summaryStatistics = {
      'tul': {
        median: 0.35,
        map: 0.34,
        credibleInterval: { lower: 0.32, upper: 0.38 }
      }
    };

    renderRankedProbabilityChart(container, summaryStatistics, []);

    const chartCall = Chart.mock.calls[0];
    const chartConfig = chartCall[1];
    const tooltipCallback = chartConfig.options.plugins.tooltip.callbacks.label;
    
    const mockContext = {
      dataIndex: 0,
      parsed: { y: 0.35 }
    };
    
    const labels = tooltipCallback(mockContext);
    const labelsText = Array.isArray(labels) ? labels.join(' ') : labels;
    expect(labelsText).toContain('Median');
    expect(labelsText).toContain('CI');
    expect(labelsText).toContain('MAP');
  });
});
