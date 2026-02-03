/**
 * Unit tests for weightCalculator.js
 * Tests for Maximum Likelihood Estimation weight calculation service
 */

import { describe, it, expect } from 'vitest';
import {
  buildCountMatrix,
  estimateWeightsFromCounts,
  estimateItemWeights
} from '../../src/services/weightCalculator.js';

describe('buildCountMatrix', () => {
  it('should throw error with empty datasets array', () => {
    expect(() => buildCountMatrix([])).toThrow('Datasets array cannot be empty');
  });

  it('should build count matrix from single dataset', () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [
          { id: 'tul', count: 2030 },
          { id: 'xoph', count: 2007 }
        ]
      }
    ];

    const result = buildCountMatrix(datasets);
    
    expect(result).toHaveProperty('counts');
    expect(result).toHaveProperty('itemIndex');
    expect(result.itemIndex.size).toBe(3); // esh, tul, xoph
    expect(result.counts.length).toBe(3);
    expect(result.counts[0].length).toBe(3);
    
    const eshIndex = result.itemIndex.get('esh');
    const tulIndex = result.itemIndex.get('tul');
    const xophIndex = result.itemIndex.get('xoph');
    
    expect(result.counts[eshIndex][tulIndex]).toBe(2030);
    expect(result.counts[eshIndex][xophIndex]).toBe(2007);
  });

  it('should build count matrix from multiple datasets with overlapping items', () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [
          { id: 'tul', count: 2030 },
          { id: 'xoph', count: 2007 }
        ]
      },
      {
        inputItems: [{ id: 'tul' }],
        items: [
          { id: 'xoph', count: 1500 },
          { id: 'uul-netol', count: 800 }
        ]
      }
    ];

    const result = buildCountMatrix(datasets);
    
    expect(result.itemIndex.size).toBe(4); // esh, tul, xoph, uul-netol
    
    const eshIndex = result.itemIndex.get('esh');
    const tulIndex = result.itemIndex.get('tul');
    const xophIndex = result.itemIndex.get('xoph');
    const uulIndex = result.itemIndex.get('uul-netol');
    
    // First dataset
    expect(result.counts[eshIndex][tulIndex]).toBe(2030);
    expect(result.counts[eshIndex][xophIndex]).toBe(2007);
    
    // Second dataset
    expect(result.counts[tulIndex][xophIndex]).toBe(1500);
    expect(result.counts[tulIndex][uulIndex]).toBe(800);
  });

  it('should handle dataset with missing inputItems (treat as random input)', () => {
    const datasets = [
      {
        // Missing inputItems - should be treated as random input, not throw error
        items: [
          { id: 'tul', count: 2030 }
        ]
      }
    ];

    // Should not throw error, should handle gracefully
    const result = buildCountMatrix(datasets);
    expect(result).toHaveProperty('counts');
    expect(result).toHaveProperty('itemIndex');
    expect(result.itemIndex.size).toBe(1); // tul
  });

  it('should throw error with invalid dataset structure (missing items)', () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }]
      }
    ];

    expect(() => buildCountMatrix(datasets)).toThrow('Invalid dataset structure: missing items');
  });

  it('should throw error with invalid item (missing id)', () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [
          { count: 2030 } // missing id
        ]
      }
    ];

    expect(() => buildCountMatrix(datasets)).toThrow('Invalid item: missing id or count');
  });

  it('should throw error with invalid item (missing count)', () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [
          { id: 'tul' } // missing count
        ]
      }
    ];

    expect(() => buildCountMatrix(datasets)).toThrow('Invalid item: missing id or count');
  });

  it('should handle dataset with missing inputItems (treat as random input)', () => {
    const datasets = [
      {
        // No inputItems - should be treated as random input
        items: [
          { id: 'tul', count: 100 },
          { id: 'xoph', count: 50 }
        ]
      }
    ];

    const result = buildCountMatrix(datasets);
    
    expect(result.itemIndex.size).toBe(2); // tul, xoph
    expect(result.counts.length).toBe(2);
    
    // With random input, counts should be distributed uniformly across all input rows
    // Each output count should be divided by N (number of items) and added to each input row
    const tulIndex = result.itemIndex.get('tul');
    const xophIndex = result.itemIndex.get('xoph');
    
    // Each input row should have counts distributed: 100/2 = 50 for tul, 50/2 = 25 for xoph
    expect(result.counts[tulIndex][tulIndex]).toBeCloseTo(50, 1);
    expect(result.counts[tulIndex][xophIndex]).toBeCloseTo(25, 1);
    expect(result.counts[xophIndex][tulIndex]).toBeCloseTo(50, 1);
    expect(result.counts[xophIndex][xophIndex]).toBeCloseTo(25, 1);
  });

  it('should handle dataset with empty inputItems array (treat as random input)', () => {
    const datasets = [
      {
        inputItems: [], // Empty array
        items: [
          { id: 'tul', count: 100 }
        ]
      }
    ];

    const result = buildCountMatrix(datasets);
    
    expect(result.itemIndex.size).toBe(1); // tul
    expect(result.counts.length).toBe(1);
    
    // With random input and single item, all count goes to that item
    const tulIndex = result.itemIndex.get('tul');
    expect(result.counts[tulIndex][tulIndex]).toBeCloseTo(100, 1);
  });

  it('should handle mixed datasets (some with inputItems, some without)', () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [
          { id: 'tul', count: 100 }
        ]
      },
      {
        // No inputItems - random input
        items: [
          { id: 'xoph', count: 50 }
        ]
      }
    ];

    const result = buildCountMatrix(datasets);
    
    expect(result.itemIndex.size).toBe(3); // esh, tul, xoph
    
    const eshIndex = result.itemIndex.get('esh');
    const tulIndex = result.itemIndex.get('tul');
    const xophIndex = result.itemIndex.get('xoph');
    
    // First dataset: esh -> tul (100)
    expect(result.counts[eshIndex][tulIndex]).toBe(100);
    
    // Second dataset: random input, so xoph count (50) distributed across all 3 items
    // Each input row gets 50/3 ≈ 16.67
    expect(result.counts[eshIndex][xophIndex]).toBeCloseTo(50 / 3, 1);
    expect(result.counts[tulIndex][xophIndex]).toBeCloseTo(50 / 3, 1);
    expect(result.counts[xophIndex][xophIndex]).toBeCloseTo(50 / 3, 1);
  });

  it('should handle dataset with multiple inputItems (distribute counts)', () => {
    const datasets = [
      {
        inputItems: [
          { id: 'input1' },
          { id: 'input2' }
        ],
        items: [
          { id: 'output1', count: 100 },
          { id: 'output2', count: 50 }
        ]
      }
    ];

    const result = buildCountMatrix(datasets);
    
    expect(result.itemIndex.size).toBe(4); // input1, input2, output1, output2
    
    const input1Index = result.itemIndex.get('input1');
    const input2Index = result.itemIndex.get('input2');
    const output1Index = result.itemIndex.get('output1');
    const output2Index = result.itemIndex.get('output2');
    
    // With 2 inputItems, each gets half the counts
    // input1 -> output1: 100/2 = 50
    expect(result.counts[input1Index][output1Index]).toBeCloseTo(50, 1);
    // input1 -> output2: 50/2 = 25
    expect(result.counts[input1Index][output2Index]).toBeCloseTo(25, 1);
    // input2 -> output1: 100/2 = 50
    expect(result.counts[input2Index][output1Index]).toBeCloseTo(50, 1);
    // input2 -> output2: 50/2 = 25
    expect(result.counts[input2Index][output2Index]).toBeCloseTo(25, 1);
  });
});

describe('estimateWeightsFromCounts', () => {
  it('should throw error with invalid count matrix (non-square)', () => {
    const countMatrix = {
      counts: [[0, 1], [2, 3, 4]], // non-square
      itemIndex: new Map([['a', 0], ['b', 1]])
    };

    expect(() => estimateWeightsFromCounts(countMatrix)).toThrow('Count matrix must be square');
  });

  it('should throw error with invalid learning rate', () => {
    const countMatrix = {
      counts: [[0, 1], [2, 0]],
      itemIndex: new Map([['a', 0], ['b', 1]])
    };

    expect(() => estimateWeightsFromCounts(countMatrix, { learningRate: -0.01 })).toThrow('Invalid learning rate: must be positive');
  });

  it('should throw error with invalid iterations', () => {
    const countMatrix = {
      counts: [[0, 1], [2, 0]],
      itemIndex: new Map([['a', 0], ['b', 1]])
    };

    expect(() => estimateWeightsFromCounts(countMatrix, { iterations: -1 })).toThrow('Invalid iterations: must be positive');
  });

  it('should estimate normalized weights from valid count matrix', () => {
    const countMatrix = {
      counts: [
        [0, 100, 50],
        [80, 0, 20],
        [60, 40, 0]
      ],
      itemIndex: new Map([['a', 0], ['b', 1], ['c', 2]])
    };

    const weights = estimateWeightsFromCounts(countMatrix, {
      learningRate: 0.01,
      iterations: 100 // Reduced for test speed
    });

    expect(weights).toHaveLength(3);
    expect(weights.every(w => w >= 0)).toBe(true);
    
    // Check normalization (sum should be approximately 1.0)
    const sum = weights.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 3);
  });

  it('should normalize weights to sum to 1.0', () => {
    const countMatrix = {
      counts: [
        [0, 100],
        [50, 0]
      ],
      itemIndex: new Map([['a', 0], ['b', 1]])
    };

    const weights = estimateWeightsFromCounts(countMatrix, {
      learningRate: 0.01,
      iterations: 100
    });

    const sum = weights.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('should handle zero counts', () => {
    const countMatrix = {
      counts: [
        [0, 0],
        [0, 0]
      ],
      itemIndex: new Map([['a', 0], ['b', 1]])
    };

    const weights = estimateWeightsFromCounts(countMatrix, {
      learningRate: 0.01,
      iterations: 100
    });

    expect(weights).toHaveLength(2);
    // With zero counts, weights should be equal (0.5 each)
    expect(weights[0]).toBeCloseTo(0.5, 2);
    expect(weights[1]).toBeCloseTo(0.5, 2);
  });

  it('should handle single item category', () => {
    const countMatrix = {
      counts: [[0]],
      itemIndex: new Map([['a', 0]])
    };

    const weights = estimateWeightsFromCounts(countMatrix, {
      learningRate: 0.01,
      iterations: 100
    });

    expect(weights).toHaveLength(1);
    expect(weights[0]).toBeCloseTo(1.0, 5);
  });
});

describe('estimateItemWeights', () => {
  it('should throw error with empty datasets array', () => {
    expect(() => estimateItemWeights([])).toThrow('Datasets array cannot be empty');
  });

  it('should calculate item weights end-to-end', () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [
          { id: 'tul', count: 2030 },
          { id: 'xoph', count: 2007 }
        ]
      }
    ];

    const weights = estimateItemWeights(datasets, {
      learningRate: 0.01,
      iterations: 100 // Reduced for test speed
    });

    expect(typeof weights).toBe('object');
    // Input items that don't appear as outputs should be excluded from weights
    expect(weights).not.toHaveProperty('esh');
    expect(weights).toHaveProperty('tul');
    expect(weights).toHaveProperty('xoph');
    
    // All weights should be between 0 and 1
    Object.values(weights).forEach(w => {
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThanOrEqual(1);
    });
    
    // Sum should be approximately 1.0 (only for output items)
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 3);
  });

  it('should produce deterministic results (same input = same output)', () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [
          { id: 'tul', count: 2030 },
          { id: 'xoph', count: 2007 },
          { id: 'uul-netol', count: 846 },
          { id: 'chayula', count: 457 }
        ]
      }
    ];

    const weights1 = estimateItemWeights(datasets, {
      learningRate: 0.01,
      iterations: 100
    });

    const weights2 = estimateItemWeights(datasets, {
      learningRate: 0.01,
      iterations: 100
    });

    // Results should be identical
    Object.keys(weights1).forEach(key => {
      expect(weights1[key]).toBeCloseTo(weights2[key], 5);
    });
  });

  it('should throw error with invalid options (negative learningRate)', () => {
    const datasets = [
      {
        inputItems: [{ id: 'esh' }],
        items: [
          { id: 'tul', count: 2030 }
        ]
      }
    ];

    expect(() => estimateItemWeights(datasets, { learningRate: -0.01 })).toThrow('Invalid learning rate: must be positive');
  });
});
