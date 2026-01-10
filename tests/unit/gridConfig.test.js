/**
 * Unit tests for gridConfig.js
 * Tests for category grid configuration functions
 */

import { describe, it, expect } from 'vitest';
import {
  getGridConfig,
  getCategoryTabImage,
  getCategoryImageDirectory,
  createCellsFromGroupsForCategory,
  BREACH_GRID_CONFIG,
  ESSENCE_GRID_CONFIG,
  CATEGORY_GRID_MAPPING
} from '../../src/config/gridConfig.js';

describe('getGridConfig', () => {
  it('should return grid config for valid category with grid view', () => {
    const config = getGridConfig('breach');
    expect(config).toBeDefined();
    expect(config).toHaveProperty('tabImagePath');
    expect(config).toHaveProperty('imageDimensions');
    expect(config).toHaveProperty('cellGroups');
  });

  it('should return grid config for breach category', () => {
    const config = getGridConfig('breach');
    expect(config).toBeDefined();
    expect(config.tabImagePath).toBe('/assets/images/stashTabs/breach-tab.png');
  });

  it('should return grid config for essences', () => {
    const config = getGridConfig('essences');
    expect(config).toBeDefined();
    expect(config.tabImagePath).toBe('/assets/images/stashTabs/essence-tab.png');
  });

  it('should return grid config for catalysts', () => {
    const config = getGridConfig('catalysts');
    expect(config).toBeDefined();
    expect(config.tabImagePath).toBe('/assets/images/stashTabs/catalysts-tab.png');
  });

  it('should return null for category without grid view', () => {
    const config = getGridConfig('unknown-category');
    expect(config).toBeNull();
  });

  it('should return null for undefined category', () => {
    const config = getGridConfig(undefined);
    expect(config).toBeNull();
  });

  it('should return null for null category', () => {
    const config = getGridConfig(null);
    expect(config).toBeNull();
  });
});

describe('getCategoryTabImage', () => {
  it('should return tab image path for valid category', () => {
    const path = getCategoryTabImage('breach');
    expect(path).toBe('/assets/images/stashTabs/breach-tab.png');
  });

  it('should return tab image path for essences', () => {
    const path = getCategoryTabImage('essences');
    expect(path).toBe('/assets/images/stashTabs/essence-tab.png');
  });

  it('should return tab image path for catalysts', () => {
    const path = getCategoryTabImage('catalysts');
    expect(path).toBe('/assets/images/stashTabs/catalysts-tab.png');
  });

  it('should return tab image path for legion category', () => {
    const path = getCategoryTabImage('legion');
    expect(path).toBe('/assets/images/stashTabs/fragments-tab.png');
  });

  it('should return null for category without grid view', () => {
    const path = getCategoryTabImage('unknown-category');
    expect(path).toBeNull();
  });

  it('should return null for undefined category', () => {
    const path = getCategoryTabImage(undefined);
    expect(path).toBeNull();
  });
});

describe('getCategoryImageDirectory', () => {
  it('should return image directory for valid category', () => {
    const dir = getCategoryImageDirectory('breach');
    expect(dir).toBe('/assets/images/breach/');
  });

  it('should return image directory for essences', () => {
    const dir = getCategoryImageDirectory('essences');
    expect(dir).toBe('/assets/images/essences/');
  });

  it('should return image directory for catalysts', () => {
    const dir = getCategoryImageDirectory('catalysts');
    expect(dir).toBe('/assets/images/catalysts/');
  });

  it('should return different directories for different categories', () => {
    const breachDir = getCategoryImageDirectory('breach');
    const essencesDir = getCategoryImageDirectory('essences');
    expect(breachDir).not.toBe(essencesDir);
  });

  it('should return null for category without grid view', () => {
    const dir = getCategoryImageDirectory('unknown-category');
    expect(dir).toBeNull();
  });

  it('should return null for undefined category', () => {
    const dir = getCategoryImageDirectory(undefined);
    expect(dir).toBeNull();
  });
});

describe('createCellsFromGroupsForCategory', () => {
  it('should create cells from grid config with single group', () => {
    const gridConfig = {
      cellGroups: [
        { x: 100, y: 50, count: 3, type: 'test' }
      ],
      defaultCellSize: { width: 49, height: 48 },
      defaultPadding: 2
    };

    const cells = createCellsFromGroupsForCategory(gridConfig);
    expect(cells).toHaveLength(3);
    expect(cells[0]).toMatchObject({
      x: 100,
      y: 50,
      width: 49,
      height: 48,
      row: 0,
      col: 0,
      groupType: 'test'
    });
    expect(cells[1].x).toBe(151); // 100 + 49 + 2
    expect(cells[2].x).toBe(202); // 100 + 2*(49 + 2)
  });

  it('should create cells from grid config with multiple groups', () => {
    const gridConfig = {
      cellGroups: [
        { x: 100, y: 50, count: 2, type: 'type1' },
        { x: 300, y: 50, count: 2, type: 'type2' },
        { x: 100, y: 100, count: 1, type: 'type1' }
      ],
      defaultCellSize: { width: 49, height: 48 },
      defaultPadding: 2
    };

    const cells = createCellsFromGroupsForCategory(gridConfig);
    expect(cells).toHaveLength(5);
    expect(cells[0].row).toBe(0);
    expect(cells[2].row).toBe(0); // Same row (y=50)
    expect(cells[4].row).toBe(1); // New row (y=100)
  });

  it('should use default cell size when not specified in group', () => {
    const gridConfig = {
      cellGroups: [
        { x: 100, y: 50, count: 1, type: 'test' }
      ],
      defaultCellSize: { width: 49, height: 48 },
      defaultPadding: 2
    };

    const cells = createCellsFromGroupsForCategory(gridConfig);
    expect(cells[0].width).toBe(49);
    expect(cells[0].height).toBe(48);
  });

  it('should allow group-specific cell size override', () => {
    const gridConfig = {
      cellGroups: [
        { x: 100, y: 50, count: 1, type: 'test', cellWidth: 60, cellHeight: 60 }
      ],
      defaultCellSize: { width: 49, height: 48 },
      defaultPadding: 2
    };

    const cells = createCellsFromGroupsForCategory(gridConfig);
    expect(cells[0].width).toBe(60);
    expect(cells[0].height).toBe(60);
  });

  it('should assign unique cell IDs', () => {
    const gridConfig = {
      cellGroups: [
        { x: 100, y: 50, count: 3, type: 'test' }
      ],
      defaultCellSize: { width: 49, height: 48 },
      defaultPadding: 2
    };

    const cells = createCellsFromGroupsForCategory(gridConfig);
    const ids = cells.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
    expect(ids[0]).toMatch(/^cell-\d+$/);
  });

  it('should return empty array for null grid config', () => {
    const cells = createCellsFromGroupsForCategory(null);
    expect(cells).toEqual([]);
  });

  it('should return empty array for grid config without cellGroups', () => {
    const cells = createCellsFromGroupsForCategory({});
    expect(cells).toEqual([]);
  });

  it('should work with actual BREACH_GRID_CONFIG', () => {
    const cells = createCellsFromGroupsForCategory(BREACH_GRID_CONFIG);
    expect(Array.isArray(cells)).toBe(true);
    expect(cells.length).toBeGreaterThan(0);
    expect(cells[0]).toHaveProperty('id');
    expect(cells[0]).toHaveProperty('x');
    expect(cells[0]).toHaveProperty('y');
  });

  it('should work with actual ESSENCE_GRID_CONFIG', () => {
    const cells = createCellsFromGroupsForCategory(ESSENCE_GRID_CONFIG);
    expect(Array.isArray(cells)).toBe(true);
    expect(cells.length).toBeGreaterThan(0);
  });
});
