/**
 * Unit tests for posteriorStats.js
 * Tests for posterior statistics computation utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  computeMedian,
  computeMAP,
  computeCredibleInterval,
  computeStatistics
} from '../../src/utils/posteriorStats.js';

describe('computeMedian', () => {
  it('should throw error with empty samples array', () => {
    expect(() => computeMedian([])).toThrow('Samples array cannot be empty');
  });

  it('should throw error with null samples', () => {
    expect(() => computeMedian(null)).toThrow('Samples array cannot be empty');
  });

  it('should compute median for odd number of samples', () => {
    const samples = [0.1, 0.2, 0.3, 0.4, 0.5];
    expect(computeMedian(samples)).toBe(0.3);
  });

  it('should compute median for even number of samples', () => {
    const samples = [0.1, 0.2, 0.3, 0.4];
    expect(computeMedian(samples)).toBe(0.25);
  });

  it('should handle unsorted samples', () => {
    const samples = [0.5, 0.1, 0.3, 0.2, 0.4];
    expect(computeMedian(samples)).toBe(0.3);
  });

  it('should compute median for large sample size', () => {
    const samples = Array.from({ length: 1000 }, (_, i) => (i + 1) / 1000);
    const median = computeMedian(samples);
    expect(median).toBeCloseTo(0.5, 2);
  });

  it('should handle single sample', () => {
    const samples = [0.345];
    expect(computeMedian(samples)).toBe(0.345);
  });

  it('should handle identical samples', () => {
    const samples = Array(100).fill(0.3);
    expect(computeMedian(samples)).toBe(0.3);
  });
});

describe('computeMAP', () => {
  it('should throw error with empty samples array', () => {
    expect(() => computeMAP([])).toThrow('Samples array cannot be empty');
  });

  it('should throw error with null samples', () => {
    expect(() => computeMAP(null)).toThrow('Samples array cannot be empty');
  });

  it('should compute MAP estimate (using median approximation)', () => {
    const samples = [0.1, 0.2, 0.3, 0.4, 0.5];
    const map = computeMAP(samples);
    expect(map).toBeCloseTo(0.3, 5);
  });

  it('should handle unsorted samples', () => {
    const samples = [0.5, 0.1, 0.3, 0.2, 0.4];
    const map = computeMAP(samples);
    expect(map).toBeCloseTo(0.3, 5);
  });

  it('should compute MAP for large sample size', () => {
    const samples = Array.from({ length: 1000 }, () => 0.3 + Math.random() * 0.1);
    const map = computeMAP(samples);
    expect(map).toBeGreaterThan(0);
    expect(map).toBeLessThan(1);
  });

  it('should handle single sample', () => {
    const samples = [0.345];
    expect(computeMAP(samples)).toBe(0.345);
  });

  it('should return reasonable MAP for multimodal distribution', () => {
    // Create bimodal distribution
    const samples = [
      ...Array(50).fill(0.2),
      ...Array(50).fill(0.8)
    ];
    const map = computeMAP(samples);
    expect(map).toBeGreaterThan(0);
    expect(map).toBeLessThan(1);
  });
});

describe('computeCredibleInterval', () => {
  it('should throw error with empty samples array', () => {
    expect(() => computeCredibleInterval([])).toThrow('Samples array cannot be empty');
  });

  it('should throw error with null samples', () => {
    expect(() => computeCredibleInterval(null)).toThrow('Samples array cannot be empty');
  });

  it('should throw error with invalid level', () => {
    const samples = [0.1, 0.2, 0.3, 0.4, 0.5];
    expect(() => computeCredibleInterval(samples, 0)).toThrow('Level must be between 0 and 1');
    expect(() => computeCredibleInterval(samples, 1)).toThrow('Level must be between 0 and 1');
    expect(() => computeCredibleInterval(samples, -0.1)).toThrow('Level must be between 0 and 1');
    expect(() => computeCredibleInterval(samples, 1.1)).toThrow('Level must be between 0 and 1');
  });

  it('should compute 95% credible interval (default)', () => {
    const samples = Array.from({ length: 1000 }, (_, i) => i / 1000);
    const interval = computeCredibleInterval(samples);
    
    expect(interval).toHaveProperty('lower');
    expect(interval).toHaveProperty('upper');
    expect(interval.lower).toBeLessThan(interval.upper);
    expect(interval.lower).toBeCloseTo(0.025, 2);
    expect(interval.upper).toBeCloseTo(0.975, 2);
  });

  it('should compute 95% credible interval (explicit)', () => {
    const samples = Array.from({ length: 1000 }, (_, i) => i / 1000);
    const interval = computeCredibleInterval(samples, 0.95);
    
    expect(interval).toHaveProperty('lower');
    expect(interval).toHaveProperty('upper');
    expect(interval.lower).toBeLessThan(interval.upper);
    expect(interval.lower).toBeCloseTo(0.025, 2);
    expect(interval.upper).toBeCloseTo(0.975, 2);
  });

  it('should compute 90% credible interval', () => {
    const samples = Array.from({ length: 1000 }, (_, i) => i / 1000);
    const interval = computeCredibleInterval(samples, 0.90);
    
    expect(interval.lower).toBeLessThan(interval.upper);
    expect(interval.lower).toBeCloseTo(0.05, 2);
    expect(interval.upper).toBeCloseTo(0.95, 2);
  });

  it('should ensure lower <= median <= upper for symmetric distribution', () => {
    const samples = Array.from({ length: 1000 }, (_, i) => (i + 1) / 1000);
    const interval = computeCredibleInterval(samples, 0.95);
    const median = computeMedian(samples);
    
    expect(interval.lower).toBeLessThanOrEqual(median);
    expect(interval.upper).toBeGreaterThanOrEqual(median);
  });

  it('should handle small sample sizes', () => {
    const samples = [0.1, 0.2, 0.3, 0.4, 0.5];
    const interval = computeCredibleInterval(samples, 0.95);
    
    expect(interval).toHaveProperty('lower');
    expect(interval).toHaveProperty('upper');
    expect(interval.lower).toBeLessThan(interval.upper);
  });

  it('should handle skewed distributions', () => {
    // Create skewed distribution (most values near 0.1, few near 0.9)
    const samples = [
      ...Array(900).fill(0.1).map(() => 0.1 + Math.random() * 0.05),
      ...Array(100).fill(0.9).map(() => 0.9 + Math.random() * 0.05)
    ];
    const interval = computeCredibleInterval(samples, 0.95);
    
    expect(interval.lower).toBeLessThan(interval.upper);
    expect(interval.lower).toBeGreaterThanOrEqual(0);
    expect(interval.upper).toBeLessThanOrEqual(1);
  });
});

describe('computeStatistics', () => {
  it('should throw error with empty posterior samples', () => {
    expect(() => computeStatistics({})).toThrow('Posterior samples cannot be empty');
  });

  it('should compute statistics for single item', () => {
    const posteriorSamples = {
      'tul': [0.342, 0.351, 0.338, 0.345, 0.340]
    };

    const stats = computeStatistics(posteriorSamples);

    expect(stats).toHaveProperty('tul');
    expect(stats.tul).toHaveProperty('median');
    expect(stats.tul).toHaveProperty('map');
    expect(stats.tul).toHaveProperty('credibleInterval');
    expect(stats.tul.credibleInterval).toHaveProperty('lower');
    expect(stats.tul.credibleInterval).toHaveProperty('upper');
  });

  it('should compute statistics for multiple items', () => {
    const posteriorSamples = {
      'tul': [0.342, 0.351, 0.338, 0.345, 0.340],
      'xoph': [0.281, 0.275, 0.289, 0.282, 0.278]
    };

    const stats = computeStatistics(posteriorSamples);

    expect(stats).toHaveProperty('tul');
    expect(stats).toHaveProperty('xoph');
    expect(stats.tul.median).toBeCloseTo(0.342, 2);
    expect(stats.xoph.median).toBeCloseTo(0.281, 2);
  });

  it('should skip items with empty samples', () => {
    const posteriorSamples = {
      'tul': [0.342, 0.351, 0.338],
      'xoph': []
    };

    const stats = computeStatistics(posteriorSamples);

    expect(stats).toHaveProperty('tul');
    expect(stats).not.toHaveProperty('xoph');
  });

  it('should warn about insufficient samples', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const posteriorSamples = {
      'tul': Array.from({ length: 50 }, () => 0.3)
    };

    computeStatistics(posteriorSamples);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Insufficient samples')
    );

    consoleSpy.mockRestore();
  });
});
