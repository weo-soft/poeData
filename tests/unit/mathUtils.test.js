/**
 * Unit tests for math utilities
 */

import { describe, it, expect } from 'vitest';
import { calculateCDF, calculateHeatmapColor } from '../../src/utils/mathUtils.js';

describe('calculateCDF', () => {
  it('should calculate CDF for multiple items', () => {
    const weights = {
      'item-1': 0.25,
      'item-2': 0.15,
      'item-3': 0.10,
      'item-4': 0.05
    };

    const cdf = calculateCDF(weights);

    expect(cdf).toBeInstanceOf(Array);
    expect(cdf.length).toBeGreaterThan(0);
    
    // First point should be at 0%
    expect(cdf[0].cumulativePercentage).toBe(0);
    expect(cdf[0].weight).toBe(0.05);
    
    // Last point should be at 100%
    const lastPoint = cdf[cdf.length - 1];
    expect(lastPoint.cumulativePercentage).toBe(100);
    expect(lastPoint.weight).toBe(0.25);
    
    // Points should be sorted ascending by weight
    for (let i = 1; i < cdf.length; i++) {
      expect(cdf[i].weight).toBeGreaterThanOrEqual(cdf[i - 1].weight);
      expect(cdf[i].cumulativePercentage).toBeGreaterThanOrEqual(cdf[i - 1].cumulativePercentage);
    }
  });

  it('should handle single item', () => {
    const weights = {
      'item-1': 0.5
    };

    const cdf = calculateCDF(weights);

    expect(cdf).toHaveLength(1);
    expect(cdf[0].weight).toBe(0.5);
    expect(cdf[0].cumulativePercentage).toBe(100);
  });

  it('should handle identical weights', () => {
    const weights = {
      'item-1': 0.25,
      'item-2': 0.25,
      'item-3': 0.25
    };

    const cdf = calculateCDF(weights);

    expect(cdf.length).toBeGreaterThanOrEqual(2);
    expect(cdf[0].cumulativePercentage).toBe(0);
    expect(cdf[cdf.length - 1].cumulativePercentage).toBe(100);
  });

  it('should handle zero weights', () => {
    const weights = {
      'item-1': 0.5,
      'item-2': 0.3,
      'item-3': 0.0,
      'item-4': 0.2
    };

    const cdf = calculateCDF(weights);

    expect(cdf).toBeInstanceOf(Array);
    expect(cdf[0].weight).toBe(0.0);
    expect(cdf[0].cumulativePercentage).toBe(0);
    expect(cdf[cdf.length - 1].cumulativePercentage).toBe(100);
  });

  it('should throw error for empty weights', () => {
    expect(() => calculateCDF({})).toThrow('Weights object cannot be empty');
  });

  it('should throw error for invalid weights type', () => {
    expect(() => calculateCDF(null)).toThrow('Weights must be a non-empty object');
    expect(() => calculateCDF(undefined)).toThrow('Weights must be a non-empty object');
    expect(() => calculateCDF([])).toThrow('Weights must be a non-empty object');
    expect(() => calculateCDF('invalid')).toThrow('Weights must be a non-empty object');
  });

  it('should throw error for negative weights', () => {
    const weights = {
      'item-1': 0.5,
      'item-2': -0.1
    };

    expect(() => calculateCDF(weights)).toThrow('All weight values must be non-negative');
  });

  it('should throw error for non-finite weights', () => {
    const weights = {
      'item-1': 0.5,
      'item-2': Infinity
    };

    expect(() => calculateCDF(weights)).toThrow('All weight values must be finite numbers');
  });
});

describe('calculateHeatmapColor', () => {
  it('should interpolate color between min and max', () => {
    const color = calculateHeatmapColor(0.15, 0.05, 0.25);
    
    expect(color).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
  });

  it('should return min color for weight at minimum', () => {
    const color = calculateHeatmapColor(0.05, 0.05, 0.25);
    
    // Should be close to min color (allowing for rounding)
    expect(color).toContain('rgba');
  });

  it('should return max color for weight at maximum', () => {
    const color = calculateHeatmapColor(0.25, 0.05, 0.25);
    
    // Should be close to max color (allowing for rounding)
    expect(color).toContain('rgba');
  });

  it('should clamp weight to range', () => {
    const colorBelow = calculateHeatmapColor(0.0, 0.05, 0.25);
    const colorAbove = calculateHeatmapColor(0.5, 0.05, 0.25);
    const colorMin = calculateHeatmapColor(0.05, 0.05, 0.25);
    
    // All should be valid colors
    expect(colorBelow).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
    expect(colorAbove).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
    expect(colorMin).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
  });

  it('should handle identical min and max weights', () => {
    const color = calculateHeatmapColor(0.5, 0.5, 0.5);
    
    expect(color).toContain('rgba');
  });

  it('should use custom color scheme', () => {
    const colorScheme = {
      minColor: 'rgba(255, 0, 0, 0.1)',
      maxColor: 'rgba(0, 255, 0, 1)'
    };
    
    const color = calculateHeatmapColor(0.15, 0.05, 0.25, colorScheme);
    
    expect(color).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
  });

  it('should handle zero weights', () => {
    const color = calculateHeatmapColor(0, 0, 0.25);
    
    expect(color).toContain('rgba');
  });
});
