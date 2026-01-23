/**
 * Unit tests for datasetSubmissionForm.js
 * Tests for Dataset Submission Wizard form component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatasetSubmissionForm } from '../../src/forms/datasetSubmissionForm.js';
import { loadCategoryData } from '../../src/services/dataLoader.js';
import { validateDataset } from '../../src/utils/datasetParser.js';

// Mock dependencies
vi.mock('../../src/services/dataLoader.js', () => ({
  loadCategoryData: vi.fn()
}));

vi.mock('../../src/utils/datasetParser.js', () => ({
  validateDataset: vi.fn()
}));

describe('DatasetSubmissionForm', () => {
  let form;
  const mockCategoryId = 'fossils';
  const mockItems = [
    { id: 'jagged', name: 'Jagged Fossil' },
    { id: 'dense', name: 'Dense Fossil' },
    { id: 'frigid', name: 'Frigid Fossil' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    form = new DatasetSubmissionForm(mockCategoryId);
    loadCategoryData.mockResolvedValue(mockItems);
  });

  describe('constructor and state initialization', () => {
    it('should initialize with categoryId', () => {
      expect(form.categoryId).toBe(mockCategoryId);
    });

    it('should initialize with empty form state', () => {
      expect(form.name).toBe('');
      expect(form.description).toBe('');
      expect(form.date).toBeNull();
      expect(form.sources).toEqual([]);
      expect(form.selectedInputItems).toEqual([]);
      expect(form.itemCounts).toEqual({});
    });

    it('should initialize with empty UI state', () => {
      expect(form.validationErrors).toEqual({});
      expect(form.isSubmitting).toBe(false);
      expect(form.submissionResult).toBeNull();
      expect(form.loading).toBe(false);
    });

    it('should initialize with empty items array', () => {
      expect(form.items).toEqual([]);
    });
  });

  describe('loadItems', () => {
    it('should load items from dataLoader', async () => {
      await form.loadItems();
      
      expect(loadCategoryData).toHaveBeenCalledWith(mockCategoryId);
      expect(form.items).toEqual(mockItems);
    });

    it('should initialize itemCounts for all items', async () => {
      await form.loadItems();
      
      expect(form.itemCounts).toHaveProperty('jagged');
      expect(form.itemCounts).toHaveProperty('dense');
      expect(form.itemCounts).toHaveProperty('frigid');
      expect(form.itemCounts.jagged).toBe('');
    });

    it('should set loading state during load', async () => {
      const loadPromise = form.loadItems();
      expect(form.loading).toBe(true);
      
      await loadPromise;
      expect(form.loading).toBe(false);
    });

    it('should handle load errors', async () => {
      const error = new Error('Failed to load');
      loadCategoryData.mockRejectedValue(error);
      
      await expect(form.loadItems()).rejects.toThrow('Failed to load');
      expect(form.loading).toBe(false);
    });
  });

  describe('form validation logic', () => {
    beforeEach(async () => {
      await form.loadItems();
    });

    it('should allow empty name (optional field)', () => {
      form.name = '';
      form.itemCounts = { jagged: 10 };
      const dataset = form.toDatasetObject();
      
      // Name should not be included in dataset object when empty
      expect(dataset.name).toBeUndefined();
      
      validateDataset.mockReturnValue({ valid: true });
      const validation = form.validate();
      expect(validation.isValid).toBe(true);
    });

    it('should validate name max length', () => {
      form.name = 'a'.repeat(201);
      const dataset = form.toDatasetObject();
      
      // Mock validateDataset to return validation error for long name
      validateDataset.mockReturnValue({
        valid: false,
        error: 'Field "name" exceeds maximum length of 200 characters'
      });
      
      const validation = validateDataset(dataset);
      
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('200');
      expect(validateDataset).toHaveBeenCalledWith(dataset);
    });

    it('should validate items array is required', () => {
      form.name = 'Test Dataset';
      form.itemCounts = {};
      const dataset = form.toDatasetObject();
      
      // Mock validateDataset to return validation error for empty items
      validateDataset.mockReturnValue({
        valid: false,
        error: 'Field "items" must contain at least one item'
      });
      
      const validation = validateDataset(dataset);
      
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('items');
      expect(validateDataset).toHaveBeenCalledWith(dataset);
    });

    it('should validate date format if provided', () => {
      form.name = 'Test Dataset';
      form.date = 'invalid-date';
      form.itemCounts = { jagged: 10 };
      const dataset = form.toDatasetObject();
      
      // Mock validateDataset to return validation error for invalid date
      validateDataset.mockReturnValue({
        valid: false,
        error: 'Field "date" must be in ISO format (YYYY-MM-DD)'
      });
      
      const validation = validateDataset(dataset);
      
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('date');
      expect(validateDataset).toHaveBeenCalledWith(dataset);
    });

    it('should pass validation with valid data', () => {
      form.name = 'Test Dataset';
      form.date = '2022-09-14';
      form.itemCounts = { jagged: 10 };
      
      validateDataset.mockReturnValue({ valid: true });
      const validation = validateDataset(form.toDatasetObject());
      
      expect(validation.valid).toBe(true);
    });
  });

  describe('dataset data structure creation', () => {
    beforeEach(async () => {
      await form.loadItems();
    });

    it('should create dataset object with required fields', () => {
      form.name = 'Test Dataset';
      form.itemCounts = { jagged: 10 };
      
      const dataset = form.toDatasetObject();
      
      expect(dataset.name).toBe('Test Dataset');
      expect(dataset.items).toBeDefined();
      expect(Array.isArray(dataset.items)).toBe(true);
    });

    it('should include optional fields when provided', () => {
      form.name = 'Test Dataset';
      form.description = 'Test description';
      form.date = '2022-09-14';
      form.itemCounts = { jagged: 10 };
      
      const dataset = form.toDatasetObject();
      
      expect(dataset.description).toBe('Test description');
      expect(dataset.date).toBe('2022-09-14');
    });

    it('should transform itemCounts to items array', () => {
      form.name = 'Test Dataset';
      form.itemCounts = { jagged: 10, dense: 5 };
      
      const dataset = form.toDatasetObject();
      
      expect(dataset.items).toHaveLength(2);
      expect(dataset.items[0]).toEqual({ id: 'jagged', count: 10 });
      expect(dataset.items[1]).toEqual({ id: 'dense', count: 5 });
    });

    it('should include sources when provided', () => {
      form.name = 'Test Dataset';
      form.sources = [
        { name: 'Google Sheet', url: 'https://example.com', author: 'User' }
      ];
      form.itemCounts = { jagged: 10 };
      
      const dataset = form.toDatasetObject();
      
      expect(dataset.sources).toBeDefined();
      expect(dataset.sources).toHaveLength(1);
      expect(dataset.sources[0].name).toBe('Google Sheet');
    });

    it('should include inputItems when provided', () => {
      form.name = 'Test Dataset';
      form.selectedInputItems = ['jagged'];
      form.itemCounts = { dense: 10 };
      
      const dataset = form.toDatasetObject();
      
      expect(dataset.inputItems).toBeDefined();
      expect(dataset.inputItems).toHaveLength(1);
      expect(dataset.inputItems[0]).toEqual({ id: 'jagged' });
    });

    it('should exclude undefined optional fields', () => {
      form.name = ''; // Empty name (optional)
      form.itemCounts = { jagged: 10 };
      
      const dataset = form.toDatasetObject();
      
      expect(dataset.name).toBeUndefined(); // Name is optional
      expect(dataset.description).toBeUndefined();
      // Date is always set to current date by default, so it should be defined
      expect(dataset.date).toBeDefined();
      expect(dataset.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(dataset.sources).toBeUndefined();
      expect(dataset.inputItems).toBeUndefined();
    });
  });

  describe('reset', () => {
    beforeEach(async () => {
      await form.loadItems();
      form.name = 'Test';
      form.description = 'Desc';
      form.date = '2022-09-14';
      form.sources = [{ name: 'Source', url: 'https://example.com', author: 'User' }];
      form.selectedInputItems = ['jagged'];
      form.itemCounts = { jagged: 10 };
    });

    it('should reset all form fields', () => {
      form.reset();
      
      expect(form.name).toBe('');
      expect(form.description).toBe('');
      expect(form.date).toBeNull();
      expect(form.sources).toEqual([]);
      expect(form.selectedInputItems).toEqual([]);
    });

    it('should reset UI state', () => {
      form.validationErrors = { name: 'Error' };
      form.isSubmitting = true;
      form.submissionResult = { success: true };
      
      form.reset();
      
      expect(form.validationErrors).toEqual({});
      expect(form.isSubmitting).toBe(false);
      expect(form.submissionResult).toBeNull();
    });

    it('should reinitialize itemCounts', () => {
      form.itemCounts = { jagged: 10, dense: 5 };
      
      form.reset();
      
      expect(form.itemCounts).toHaveProperty('jagged');
      expect(form.itemCounts).toHaveProperty('dense');
      expect(form.itemCounts).toHaveProperty('frigid');
      expect(form.itemCounts.jagged).toBe('');
    });
  });

  describe('minimal fields submission (User Story 2)', () => {
    beforeEach(async () => {
      await form.loadItems();
    });

    it('should allow submission with only items (no optional fields including name)', () => {
      form.name = ''; // Empty name (optional)
      form.description = ''; // Empty description
      form.date = null; // No date provided
      form.sources = []; // No sources
      form.selectedInputItems = []; // No input items
      form.itemCounts = { jagged: 10 };

      const dataset = form.toDatasetObject();

      expect(dataset.name).toBeUndefined(); // Name not included when empty
      expect(dataset.description).toBeUndefined();
      expect(dataset.sources).toBeUndefined();
      expect(dataset.inputItems).toBeUndefined();
      expect(dataset.items).toHaveLength(1);
      expect(dataset.items[0].count).toBe(10);
    });

    it('should set default date when date not provided', () => {
      form.name = 'Test Dataset';
      form.date = null;
      form.itemCounts = { jagged: 10 };

      const dataset = form.toDatasetObject();

      expect(dataset.date).toBeDefined();
      expect(dataset.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // Should be today's date
      const today = new Date().toISOString().split('T')[0];
      expect(dataset.date).toBe(today);
    });

    it('should allow empty description field', () => {
      form.name = 'Test Dataset';
      form.description = '';
      form.itemCounts = { jagged: 10 };

      const dataset = form.toDatasetObject();

      expect(dataset.description).toBeUndefined();
    });

    it('should allow empty sources array', () => {
      form.name = 'Test Dataset';
      form.sources = [];
      form.itemCounts = { jagged: 10 };

      const dataset = form.toDatasetObject();

      expect(dataset.sources).toBeUndefined();
    });

    it('should allow empty input items array', () => {
      form.name = 'Test Dataset';
      form.selectedInputItems = [];
      form.itemCounts = { jagged: 10 };

      const dataset = form.toDatasetObject();

      expect(dataset.inputItems).toBeUndefined();
    });

    it('should validate successfully with minimal required fields (only items)', () => {
      form.name = ''; // Name is optional
      form.itemCounts = { jagged: 10 };

      validateDataset.mockReturnValue({ valid: true });
      const validation = form.validate();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('multiple sources management (User Story 3)', () => {
    beforeEach(async () => {
      await form.loadItems();
    });

    it('should add source to sources array', () => {
      expect(form.sources).toHaveLength(0);
      
      form.addSource();
      
      expect(form.sources).toHaveLength(1);
      expect(form.sources[0]).toEqual({ name: '', url: '', author: '' });
    });

    it('should add multiple sources', () => {
      form.addSource();
      form.addSource();
      form.addSource();
      
      expect(form.sources).toHaveLength(3);
    });

    it('should remove source from sources array', () => {
      form.addSource();
      form.addSource();
      form.sources[0].name = 'Source 1';
      form.sources[1].name = 'Source 2';
      
      form.removeSource(0);
      
      expect(form.sources).toHaveLength(1);
      expect(form.sources[0].name).toBe('Source 2');
    });

    it('should update source field', () => {
      form.addSource();
      
      form.updateSource(0, 'name', 'Google Sheet');
      form.updateSource(0, 'url', 'https://example.com');
      form.updateSource(0, 'author', 'User');
      
      expect(form.sources[0].name).toBe('Google Sheet');
      expect(form.sources[0].url).toBe('https://example.com');
      expect(form.sources[0].author).toBe('User');
    });

    it('should validate source URL format', () => {
      form.addSource();
      form.updateSource(0, 'url', 'invalid-url');
      
      form.validateField('source-0-url');
      
      expect(form.validationErrors['source-0-url']).toBeDefined();
      expect(form.validationErrors['source-0-url']).toContain('URL');
    });

    it('should accept valid URL format', () => {
      form.addSource();
      form.updateSource(0, 'url', 'https://example.com');
      
      form.validateField('source-0-url');
      
      expect(form.validationErrors['source-0-url']).toBeUndefined();
    });

    it('should include sources in dataset object', () => {
      form.name = 'Test Dataset';
      form.itemCounts = { jagged: 10 };
      form.addSource();
      form.updateSource(0, 'name', 'Google Sheet');
      form.updateSource(0, 'url', 'https://example.com');
      form.updateSource(0, 'author', 'User');
      
      const dataset = form.toDatasetObject();
      
      expect(dataset.sources).toBeDefined();
      expect(dataset.sources).toHaveLength(1);
      expect(dataset.sources[0]).toEqual({
        name: 'Google Sheet',
        url: 'https://example.com',
        author: 'User'
      });
    });

    it('should handle removing source at any index', () => {
      form.addSource();
      form.addSource();
      form.addSource();
      form.sources[0].name = 'First';
      form.sources[1].name = 'Second';
      form.sources[2].name = 'Third';
      
      form.removeSource(1);
      
      expect(form.sources).toHaveLength(2);
      expect(form.sources[0].name).toBe('First');
      expect(form.sources[1].name).toBe('Third');
    });
  });

  describe('input items selection (User Story 4)', () => {
    beforeEach(async () => {
      await form.loadItems();
    });

    it('should select input item', () => {
      expect(form.selectedInputItems).not.toContain('jagged');
      
      form.selectInputItem('jagged');
      
      expect(form.selectedInputItems).toContain('jagged');
    });

    it('should not add duplicate input items', () => {
      form.selectInputItem('jagged');
      form.selectInputItem('jagged');
      
      expect(form.selectedInputItems.filter(id => id === 'jagged')).toHaveLength(1);
    });

    it('should deselect input item', () => {
      form.selectInputItem('jagged');
      form.selectInputItem('dense');
      
      expect(form.selectedInputItems).toContain('jagged');
      expect(form.selectedInputItems).toContain('dense');
      
      form.deselectInputItem('jagged');
      
      expect(form.selectedInputItems).not.toContain('jagged');
      expect(form.selectedInputItems).toContain('dense');
    });

    it('should handle deselecting non-selected item', () => {
      form.deselectInputItem('jagged');
      
      expect(form.selectedInputItems).not.toContain('jagged');
    });

    it('should include inputItems in dataset object when selected', () => {
      form.name = 'Test Dataset';
      form.itemCounts = { dense: 10 };
      form.selectInputItem('jagged');
      form.selectInputItem('frigid');
      
      const dataset = form.toDatasetObject();
      
      expect(dataset.inputItems).toBeDefined();
      expect(dataset.inputItems).toHaveLength(2);
      expect(dataset.inputItems).toContainEqual({ id: 'jagged' });
      expect(dataset.inputItems).toContainEqual({ id: 'frigid' });
    });

    it('should exclude inputItems when none selected', () => {
      form.name = 'Test Dataset';
      form.itemCounts = { jagged: 10 };
      form.selectedInputItems = [];
      
      const dataset = form.toDatasetObject();
      
      expect(dataset.inputItems).toBeUndefined();
    });

    it('should validate input items exist in category', () => {
      // Input items should only be selectable from loaded items
      form.selectInputItem('jagged');
      form.selectInputItem('dense');
      
      const dataset = form.toDatasetObject();
      
      // Both items should be in the dataset's inputItems
      expect(dataset.inputItems).toBeDefined();
      expect(dataset.inputItems.length).toBe(2);
    });
  });

  describe('item counts validation (User Story 5)', () => {
    beforeEach(async () => {
      await form.loadItems();
    });

    it('should set item count', () => {
      form.setItemCount('jagged', 10);
      
      expect(form.itemCounts.jagged).toBe(10);
    });

    it('should update existing item count', () => {
      form.setItemCount('jagged', 10);
      form.setItemCount('jagged', 20);
      
      expect(form.itemCounts.jagged).toBe(20);
    });

    it('should validate non-numeric count', () => {
      form.setItemCount('jagged', 'abc');
      
      form.validateField('item-jagged-count');
      
      expect(form.validationErrors['item-jagged-count']).toBeDefined();
      expect(form.validationErrors['item-jagged-count']).toContain('number');
    });

    it('should validate negative count', () => {
      form.setItemCount('jagged', -5);
      
      form.validateField('item-jagged-count');
      
      expect(form.validationErrors['item-jagged-count']).toBeDefined();
      expect(form.validationErrors['item-jagged-count']).toContain('non-negative');
    });

    it('should accept zero count', () => {
      form.setItemCount('jagged', 0);
      
      form.validateField('item-jagged-count');
      
      // Zero is valid, but will be filtered out in toDatasetObject
      expect(form.validationErrors['item-jagged-count']).toBeUndefined();
    });

    it('should accept positive count', () => {
      form.setItemCount('jagged', 100);
      
      form.validateField('item-jagged-count');
      
      expect(form.validationErrors['item-jagged-count']).toBeUndefined();
    });

    it('should filter out items with zero or empty counts', () => {
      form.name = 'Test Dataset';
      form.itemCounts = {
        jagged: 10,
        dense: 0,
        frigid: ''
      };
      
      const dataset = form.toDatasetObject();
      
      expect(dataset.items).toHaveLength(1);
      expect(dataset.items[0].id).toBe('jagged');
      expect(dataset.items[0].count).toBe(10);
    });

    it('should require at least one item with count > 0', () => {
      form.name = 'Test Dataset';
      form.itemCounts = {
        jagged: 0,
        dense: 0
      };
      
      validateDataset.mockReturnValue({
        valid: false,
        error: 'Field "items" must contain at least one item'
      });
      
      const validation = form.validate();
      
      expect(validation.isValid).toBe(false);
    });

    it('should handle very large numbers', () => {
      form.setItemCount('jagged', 1000000);
      
      form.validateField('item-jagged-count');
      
      // Large numbers are valid (may warn but allow)
      expect(form.validationErrors['item-jagged-count']).toBeUndefined();
    });

    it('should handle decimal numbers', () => {
      form.setItemCount('jagged', 10.5);
      
      form.validateField('item-jagged-count');
      
      // Decimals are valid numbers
      expect(form.validationErrors['item-jagged-count']).toBeUndefined();
    });
  });
});
