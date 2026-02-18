/**
 * Integration tests for weight display feature
 * Tests for full flow: dataset loading → weight calculation → display
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWeightDisplay } from '../../src/components/weightDisplay.js';
import { createElement } from '../../src/utils/dom.js';

describe('renderWeightDisplay', () => {
  let container;

  beforeEach(() => {
    container = createElement('div');
    document.body.appendChild(container);
  });

  it('should render weight display with valid weights', () => {
    const weights = {
      'tul': 0.35,
      'xoph': 0.28,
      'uul-netol': 0.22,
      'chayula': 0.15
    };
    const items = [
      { id: 'tul', name: 'Splinter of Tul' },
      { id: 'xoph', name: 'Splinter of Xoph' },
      { id: 'uul-netol', name: 'Splinter of Uul-Netol' },
      { id: 'chayula', name: 'Splinter of Chayula' }
    ];

    renderWeightDisplay(container, weights, 'breach-splinters', items);

    expect(container.querySelector('.weight-display')).toBeTruthy();
    expect(container.textContent).toContain('Splinter of Tul');
    expect(container.textContent).toContain('35');
  });

  it('should handle empty weights object', () => {
    const weights = {};

    renderWeightDisplay(container, weights, 'breach-splinters', []);

    expect(container.textContent).toContain('No weights calculated');
  });

  it('should handle missing items array', () => {
    const weights = {
      'tul': 0.35,
      'xoph': 0.28
    };

    renderWeightDisplay(container, weights, 'breach-splinters', []);

    // Should still render, using item IDs
    expect(container.querySelector('.weight-display')).toBeTruthy();
    expect(container.textContent).toContain('tul');
    expect(container.textContent).toContain('xoph');
  });

  it('should sort weights highest to lowest', () => {
    const weights = {
      'chayula': 0.15,
      'tul': 0.35,
      'uul-netol': 0.22,
      'xoph': 0.28
    };
    const items = [
      { id: 'tul', name: 'Splinter of Tul' },
      { id: 'xoph', name: 'Splinter of Xoph' },
      { id: 'uul-netol', name: 'Splinter of Uul-Netol' },
      { id: 'chayula', name: 'Splinter of Chayula' }
    ];

    renderWeightDisplay(container, weights, 'breach-splinters', items);

    const weightItems = container.querySelectorAll('.weight-item');
    expect(weightItems.length).toBeGreaterThan(0);
    
    // First item should be highest weight (tul: 0.35)
    const firstItem = weightItems[0];
    expect(firstItem.textContent).toContain('Splinter of Tul');
  });

  it('should display weights in readable format', () => {
    const weights = {
      'tul': 0.35,
      'xoph': 0.28
    };
    const items = [
      { id: 'tul', name: 'Splinter of Tul' },
      { id: 'xoph', name: 'Splinter of Xoph' }
    ];

    renderWeightDisplay(container, weights, 'breach-splinters', items);

    // Should display as percentage or decimal
    const display = container.textContent;
    expect(display).toMatch(/\d+\.?\d*%/); // Percentage format
  });

  it('should use consistent format for all weights', () => {
    const weights = {
      'tul': 0.35,
      'xoph': 0.28,
      'uul-netol': 0.22,
      'chayula': 0.15
    };
    const items = [
      { id: 'tul', name: 'Splinter of Tul' },
      { id: 'xoph', name: 'Splinter of Xoph' },
      { id: 'uul-netol', name: 'Splinter of Uul-Netol' },
      { id: 'chayula', name: 'Splinter of Chayula' }
    ];

    renderWeightDisplay(container, weights, 'breach-splinters', items);

    // All weight values should use the same format (percentage with 2 decimal places)
    const weightValues = container.querySelectorAll('.weight-value');
    expect(weightValues.length).toBeGreaterThan(0);
    
    weightValues.forEach(valueEl => {
      const text = valueEl.textContent;
      // Should match percentage format: XX.XX%
      expect(text).toMatch(/^\d+\.\d{2}%$/);
    });
  });

  it('should allow users to identify highest and lowest weighted items', () => {
    const weights = {
      'chayula': 0.05,
      'tul': 0.45,
      'uul-netol': 0.25,
      'xoph': 0.25
    };
    const items = [
      { id: 'tul', name: 'Splinter of Tul' },
      { id: 'xoph', name: 'Splinter of Xoph' },
      { id: 'uul-netol', name: 'Splinter of Uul-Netol' },
      { id: 'chayula', name: 'Splinter of Chayula' }
    ];

    renderWeightDisplay(container, weights, 'breach-splinters', items);

    const weightItems = container.querySelectorAll('.weight-item');
    expect(weightItems.length).toBe(4);
    
    // First item should be highest (tul: 0.45)
    const firstItem = weightItems[0];
    expect(firstItem.textContent).toContain('Splinter of Tul');
    expect(firstItem.textContent).toContain('45.00%');
    
    // Last item should be lowest (chayula: 0.05)
    const lastItem = weightItems[weightItems.length - 1];
    expect(lastItem.textContent).toContain('Splinter of Chayula');
    expect(lastItem.textContent).toContain('5.00%');
    
    // Rank numbers should be visible
    const firstRank = firstItem.querySelector('.weight-rank');
    expect(firstRank).toBeTruthy();
    expect(firstRank.textContent).toBe('1');
    
    const lastRank = lastItem.querySelector('.weight-rank');
    expect(lastRank).toBeTruthy();
    expect(lastRank.textContent).toBe('4');
  });

  it('should display weights with sufficient precision and clear labels', () => {
    const weights = {
      'tul': 0.123456,
      'xoph': 0.987654
    };
    const items = [
      { id: 'tul', name: 'Splinter of Tul' },
      { id: 'xoph', name: 'Splinter of Xoph' }
    ];

    renderWeightDisplay(container, weights, 'breach-splinters', items);

    // Should show at least 2 decimal places for precision
    const weightValues = container.querySelectorAll('.weight-value');
    expect(weightValues.length).toBe(2);
    
    // Check that values are formatted with 2 decimal places
    weightValues.forEach(valueEl => {
      const text = valueEl.textContent;
      // Should have format XX.XX% with exactly 2 decimal places
      const match = text.match(/(\d+)\.(\d{2})%/);
      expect(match).toBeTruthy();
      expect(match[2].length).toBe(2); // Exactly 2 decimal places
    });
    
    // Should have clear labels (item names)
    const itemNames = container.querySelectorAll('.weight-item-name');
    expect(itemNames.length).toBe(2);
    expect(itemNames[0].textContent).toBe('Splinter of Xoph'); // Highest first
    expect(itemNames[1].textContent).toBe('Splinter of Tul');
  });
});
