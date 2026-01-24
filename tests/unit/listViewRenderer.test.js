/**
 * Unit tests for listViewRenderer.js
 * Tests for list view rendering functions with weights
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatWeightForDisplay, createListViewEntry, renderListViewWithWeights } from '../../src/visualization/listViewRenderer.js';

// Mock DOM utilities
vi.mock('../../src/utils/dom.js', () => ({
  createElement: vi.fn((tag, attributes = {}) => {
    const element = document.createElement(tag);
    if (attributes.className) {
      element.className = attributes.className;
    }
    if (attributes.textContent) {
      element.textContent = attributes.textContent;
    }
    if (attributes.href) {
      element.href = attributes.href;
    }
    Object.entries(attributes).forEach(([key, value]) => {
      if (key !== 'className' && key !== 'textContent' && key !== 'href') {
        element[key] = value;
      }
    });
    return element;
  }),
  clearElement: vi.fn((element) => {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  })
}));

// Mock tooltip utilities
vi.mock('../../src/utils/tooltip.js', () => ({
  showTooltip: vi.fn(),
  hideTooltip: vi.fn(),
  updateTooltipPosition: vi.fn()
}));

import { showTooltip, hideTooltip, updateTooltipPosition } from '../../src/utils/tooltip.js';

describe('formatWeightForDisplay', () => {
  it('should format Bayesian weight as percentage', () => {
    const item = { id: 'test', name: 'Test Item', dropWeight: 0.025 };
    expect(formatWeightForDisplay(item)).toBe('2.50%');
  });

  it('should format MLE weight as percentage when Bayesian not available', () => {
    const item = { id: 'test', name: 'Test Item', dropWeightMle: 0.01 };
    expect(formatWeightForDisplay(item)).toBe('1.00%');
  });

  it('should prefer Bayesian weight over MLE', () => {
    const item = { id: 'test', name: 'Test Item', dropWeight: 0.025, dropWeightMle: 0.01 };
    expect(formatWeightForDisplay(item)).toBe('2.50%');
  });

  it('should return "N/A" when no weight data available', () => {
    const item = { id: 'test', name: 'Test Item' };
    expect(formatWeightForDisplay(item)).toBe('N/A');
  });

  it('should handle zero weight', () => {
    const item = { id: 'test', name: 'Test Item', dropWeight: 0 };
    expect(formatWeightForDisplay(item)).toBe('0.00%');
  });

  it('should handle very small weights', () => {
    const item = { id: 'test', name: 'Test Item', dropWeight: 0.0001 };
    expect(formatWeightForDisplay(item)).toBe('0.01%');
  });
});

describe('createListViewEntry', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should create list entry with item name and weight', () => {
    const item = { id: 'test-item', name: 'Test Item', dropWeight: 0.025 };
    const categoryId = 'essences';
    
    const entry = createListViewEntry(item, categoryId);
    container.appendChild(entry);
    
    expect(entry.tagName).toBe('A');
    expect(entry.href).toContain('#/category/essences/item/test-item');
    expect(entry.querySelector('.category-list-entry-name').textContent).toBe('Test Item');
    expect(entry.querySelector('.category-list-entry-weight').textContent).toBe('2.50%');
  });

  it('should handle items without weight data', () => {
    const item = { id: 'test-item', name: 'Test Item' };
    const categoryId = 'essences';
    
    const entry = createListViewEntry(item, categoryId);
    container.appendChild(entry);
    
    expect(entry.querySelector('.category-list-entry-weight').textContent).toBe('N/A');
  });

  it('should fallback to item ID if name is missing', () => {
    const item = { id: 'test-item', dropWeight: 0.025 };
    const categoryId = 'essences';
    
    const entry = createListViewEntry(item, categoryId);
    container.appendChild(entry);
    
    expect(entry.querySelector('.category-list-entry-name').textContent).toBe('test-item');
  });

  it('should use MLE weight when Bayesian not available', () => {
    const item = { id: 'test-item', name: 'Test Item', dropWeightMle: 0.01 };
    const categoryId = 'essences';
    
    const entry = createListViewEntry(item, categoryId);
    container.appendChild(entry);
    
    expect(entry.querySelector('.category-list-entry-weight').textContent).toBe('1.00%');
  });

  it('should attach tooltip event handlers to list entries', () => {
    const item = { id: 'test-item', name: 'Test Item', dropWeight: 0.025 };
    const categoryId = 'essences';
    
    // Clear previous mock calls
    vi.mocked(showTooltip).mockClear();
    vi.mocked(hideTooltip).mockClear();
    vi.mocked(updateTooltipPosition).mockClear();
    
    const entry = createListViewEntry(item, categoryId);
    container.appendChild(entry);
    
    // Simulate mouseenter event
    const mouseEnterEvent = new MouseEvent('mouseenter', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 200
    });
    entry.dispatchEvent(mouseEnterEvent);
    
    // Verify showTooltip was called with correct arguments
    expect(showTooltip).toHaveBeenCalledWith(item, 100, 200, categoryId);
    expect(showTooltip).toHaveBeenCalledTimes(1);
    
    // Simulate mousemove event
    const mouseMoveEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      clientX: 150,
      clientY: 250
    });
    entry.dispatchEvent(mouseMoveEvent);
    
    // Verify updateTooltipPosition was called
    expect(updateTooltipPosition).toHaveBeenCalledWith(150, 250);
    expect(updateTooltipPosition).toHaveBeenCalledTimes(1);
    
    // Simulate mouseleave event
    const mouseLeaveEvent = new MouseEvent('mouseleave', {
      bubbles: true,
      cancelable: true
    });
    entry.dispatchEvent(mouseLeaveEvent);
    
    // Verify hideTooltip was called
    expect(hideTooltip).toHaveBeenCalledTimes(1);
  });
});

describe('renderListViewWithWeights', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should render list view with items and weights sorted by weight descending', async () => {
    const items = [
      { id: 'item2', name: 'Item 2', dropWeightMle: 0.01 }, // Lower weight
      { id: 'item1', name: 'Item 1', dropWeight: 0.025 }, // Higher weight
      { id: 'item3', name: 'Item 3' } // No weight
    ];
    const categoryId = 'essences';

    await renderListViewWithWeights(container, items, categoryId);

    const listView = container.querySelector('.category-list-view');
    expect(listView).toBeTruthy();
    
    const entries = container.querySelectorAll('.category-list-entry');
    expect(entries.length).toBe(3);
    
    // Should be sorted by weight descending: Item 1 (2.50%) > Item 2 (1.00%) > Item 3 (N/A)
    expect(entries[0].querySelector('.category-list-entry-name').textContent).toBe('Item 1');
    expect(entries[0].querySelector('.category-list-entry-weight').textContent).toBe('2.50%');
    
    expect(entries[1].querySelector('.category-list-entry-name').textContent).toBe('Item 2');
    expect(entries[1].querySelector('.category-list-entry-weight').textContent).toBe('1.00%');
    
    expect(entries[2].querySelector('.category-list-entry-name').textContent).toBe('Item 3');
    expect(entries[2].querySelector('.category-list-entry-weight').textContent).toBe('N/A');
  });

  it('should sort items by weight in descending order', async () => {
    const items = [
      { id: 'item-low', name: 'Low Weight', dropWeight: 0.005 },
      { id: 'item-high', name: 'High Weight', dropWeight: 0.05 },
      { id: 'item-medium', name: 'Medium Weight', dropWeight: 0.02 },
      { id: 'item-none', name: 'No Weight' }
    ];
    const categoryId = 'essences';

    await renderListViewWithWeights(container, items, categoryId);

    const entries = container.querySelectorAll('.category-list-entry');
    expect(entries.length).toBe(4);
    
    // Should be sorted: High (5.00%) > Medium (2.00%) > Low (0.50%) > No Weight (N/A)
    expect(entries[0].querySelector('.category-list-entry-name').textContent).toBe('High Weight');
    expect(entries[0].querySelector('.category-list-entry-weight').textContent).toBe('5.00%');
    
    expect(entries[1].querySelector('.category-list-entry-name').textContent).toBe('Medium Weight');
    expect(entries[1].querySelector('.category-list-entry-weight').textContent).toBe('2.00%');
    
    expect(entries[2].querySelector('.category-list-entry-name').textContent).toBe('Low Weight');
    expect(entries[2].querySelector('.category-list-entry-weight').textContent).toBe('0.50%');
    
    expect(entries[3].querySelector('.category-list-entry-name').textContent).toBe('No Weight');
    expect(entries[3].querySelector('.category-list-entry-weight').textContent).toBe('N/A');
  });

  it('should handle empty items array', async () => {
    const items = [];
    const categoryId = 'essences';

    await renderListViewWithWeights(container, items, categoryId);

    const emptyState = container.querySelector('.list-view-empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should handle null items', async () => {
    const categoryId = 'essences';

    await renderListViewWithWeights(container, null, categoryId);

    const emptyState = container.querySelector('.list-view-empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should clear container before rendering', async () => {
    const existingElement = document.createElement('div');
    existingElement.textContent = 'Existing content';
    container.appendChild(existingElement);

    const items = [{ id: 'item1', name: 'Item 1', dropWeight: 0.025 }];
    const categoryId = 'essences';

    await renderListViewWithWeights(container, items, categoryId);

    expect(container.querySelector('.list-view-empty-state')).toBeFalsy();
    expect(container.querySelector('.category-list-view')).toBeTruthy();
  });

  it('should handle empty filter results by showing empty state', async () => {
    const items = []; // Empty array from filter
    const categoryId = 'essences';

    await renderListViewWithWeights(container, items, categoryId);

    const emptyState = container.querySelector('.list-view-empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.querySelector('h2').textContent).toBe('No Items Found');
  });

  it('should sort by name ascending when sort option is name-asc', async () => {
    const items = [
      { id: 'item-c', name: 'Charlie' },
      { id: 'item-a', name: 'Alpha' },
      { id: 'item-b', name: 'Beta' }
    ];
    const categoryId = 'essences';

    await renderListViewWithWeights(container, items, categoryId, 'name-asc');

    const entries = container.querySelectorAll('.category-list-entry');
    expect(entries[0].querySelector('.category-list-entry-name').textContent).toBe('Alpha');
    expect(entries[1].querySelector('.category-list-entry-name').textContent).toBe('Beta');
    expect(entries[2].querySelector('.category-list-entry-name').textContent).toBe('Charlie');
  });

  it('should sort by name descending when sort option is name-desc', async () => {
    const items = [
      { id: 'item-a', name: 'Alpha' },
      { id: 'item-c', name: 'Charlie' },
      { id: 'item-b', name: 'Beta' }
    ];
    const categoryId = 'essences';

    await renderListViewWithWeights(container, items, categoryId, 'name-desc');

    const entries = container.querySelectorAll('.category-list-entry');
    expect(entries[0].querySelector('.category-list-entry-name').textContent).toBe('Charlie');
    expect(entries[1].querySelector('.category-list-entry-name').textContent).toBe('Beta');
    expect(entries[2].querySelector('.category-list-entry-name').textContent).toBe('Alpha');
  });

  it('should sort by weight ascending when sort option is weight-asc', async () => {
    const items = [
      { id: 'item-high', name: 'High Weight', dropWeight: 0.05 },
      { id: 'item-low', name: 'Low Weight', dropWeight: 0.01 },
      { id: 'item-medium', name: 'Medium Weight', dropWeight: 0.02 }
    ];
    const categoryId = 'essences';

    await renderListViewWithWeights(container, items, categoryId, 'weight-asc');

    const entries = container.querySelectorAll('.category-list-entry');
    expect(entries[0].querySelector('.category-list-entry-name').textContent).toBe('Low Weight');
    expect(entries[1].querySelector('.category-list-entry-name').textContent).toBe('Medium Weight');
    expect(entries[2].querySelector('.category-list-entry-name').textContent).toBe('High Weight');
  });

  it('should show sort control when onSortChange callback is provided', async () => {
    const items = [
      { id: 'item1', name: 'Item 1', dropWeight: 0.025 }
    ];
    const categoryId = 'essences';
    const onSortChange = vi.fn();

    await renderListViewWithWeights(container, items, categoryId, 'weight-desc', onSortChange);

    const sortControl = container.querySelector('.category-list-sort-wrapper');
    expect(sortControl).toBeTruthy();
    
    const sortSelect = container.querySelector('.category-list-sort-select');
    expect(sortSelect).toBeTruthy();
    expect(sortSelect.value).toBe('weight-desc');
  });

  it('should call onSortChange when sort option changes', async () => {
    const items = [
      { id: 'item1', name: 'Item 1', dropWeight: 0.025 }
    ];
    const categoryId = 'essences';
    const onSortChange = vi.fn();

    await renderListViewWithWeights(container, items, categoryId, 'weight-desc', onSortChange);

    const sortSelect = container.querySelector('.category-list-sort-select');
    sortSelect.value = 'name-asc';
    sortSelect.dispatchEvent(new Event('change'));

    expect(onSortChange).toHaveBeenCalledWith('name-asc');
    expect(onSortChange).toHaveBeenCalledTimes(1);
  });
});
