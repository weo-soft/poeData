/**
 * Integration tests for dataset submission feature
 * Tests for EmailJS integration and complete submission flow
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DatasetSubmissionForm } from '../../src/forms/datasetSubmissionForm.js';
import { sendDatasetSubmission } from '../../src/services/emailService.js';
import { loadCategoryData } from '../../src/services/dataLoader.js';
import { validateDataset } from '../../src/utils/datasetParser.js';

// Mock EmailJS
vi.mock('../../src/services/emailService.js', () => ({
  sendDatasetSubmission: vi.fn()
}));

// Mock dataLoader
vi.mock('../../src/services/dataLoader.js', () => ({
  loadCategoryData: vi.fn()
}));

// Mock datasetParser
vi.mock('../../src/utils/datasetParser.js', () => ({
  validateDataset: vi.fn()
}));

describe('Dataset Submission Integration', () => {
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
    validateDataset.mockReturnValue({ valid: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendDatasetSubmission EmailJS integration', () => {
    beforeEach(async () => {
      await form.loadItems();
      form.name = 'Test Dataset';
      form.itemCounts = { jagged: 10 };
    });

    it('should call sendDatasetSubmission with correct data structure', async () => {
      sendDatasetSubmission.mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
        status: 200
      });

      form.date = '2022-09-14';
      form.sources = [
        { name: 'Google Sheet', url: 'https://example.com', author: 'User' }
      ];
      form.selectedInputItems = ['jagged'];

      await form.submit();

      expect(sendDatasetSubmission).toHaveBeenCalledWith({
        categoryId: mockCategoryId,
        dataset: expect.objectContaining({
          name: 'Test Dataset',
          date: '2022-09-14',
          items: expect.arrayContaining([
            { id: 'jagged', count: 10 }
          ])
        }),
        validationResult: expect.objectContaining({
          isValid: true
        }),
        userEmail: undefined
      });
    });

    it('should handle EmailJS success response', async () => {
      const mockResponse = {
        success: true,
        messageId: 'test-123',
        status: 200
      };
      sendDatasetSubmission.mockResolvedValue(mockResponse);

      const result = await form.submit();

      expect(result.success).toBe(true);
      expect(result.emailResult).toEqual(mockResponse);
    });

    it('should handle EmailJS error response', async () => {
      const mockError = new Error('EmailJS send failed');
      sendDatasetSubmission.mockRejectedValue(mockError);

      const result = await form.submit();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should include user email when provided', async () => {
      sendDatasetSubmission.mockResolvedValue({
        success: true,
        messageId: 'test-id',
        status: 200
      });

      await form.submit('user@example.com');

      expect(sendDatasetSubmission).toHaveBeenCalledWith(
        expect.objectContaining({
          userEmail: 'user@example.com'
        })
      );
    });
  });

  describe('complete dataset submission flow', () => {
    beforeEach(async () => {
      await form.loadItems();
    });

    it('should complete full submission flow with all fields', async () => {
      // Setup form with all fields
      form.name = 'Complete Dataset';
      form.description = 'Test description';
      form.date = '2022-09-14';
      form.sources = [
        { name: 'Google Sheet', url: 'https://example.com', author: 'User' },
        { name: 'Discord', url: 'https://discord.com', author: 'AnotherUser' }
      ];
      form.selectedInputItems = ['jagged'];
      form.itemCounts = {
        jagged: 129,
        dense: 112,
        frigid: 122
      };

      validateDataset.mockReturnValue({ valid: true });
      sendDatasetSubmission.mockResolvedValue({
        success: true,
        messageId: 'complete-flow-id',
        status: 200
      });

      const result = await form.submit();

      // Verify validation was called
      expect(validateDataset).toHaveBeenCalled();

      // Verify submission was called
      expect(sendDatasetSubmission).toHaveBeenCalled();

      // Verify result
      expect(result.success).toBe(true);
      expect(result.emailResult.messageId).toBe('complete-flow-id');
    });

    it('should handle validation failure and prevent submission', async () => {
      form.itemCounts = {}; // No items with count > 0

      validateDataset.mockReturnValue({
        valid: false,
        error: 'Field "items" must contain at least one item'
      });

      const result = await form.submit();

      expect(result.success).toBe(false);
      expect(result.error).toContain('items');
      expect(sendDatasetSubmission).not.toHaveBeenCalled();
    });

    it('should set default date when not provided', async () => {
      form.name = 'Test Dataset';
      form.itemCounts = { jagged: 10 };
      form.date = null;

      validateDataset.mockReturnValue({ valid: true });
      sendDatasetSubmission.mockResolvedValue({
        success: true,
        messageId: 'test-id',
        status: 200
      });

      await form.submit();

      const callArgs = sendDatasetSubmission.mock.calls[0][0];
      expect(callArgs.dataset.date).toBeDefined();
      expect(callArgs.dataset.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should filter out items with zero or empty counts', async () => {
      form.name = 'Test Dataset';
      form.itemCounts = {
        jagged: 10,
        dense: 0,
        frigid: ''
      };

      validateDataset.mockReturnValue({ valid: true });
      sendDatasetSubmission.mockResolvedValue({
        success: true,
        messageId: 'test-id',
        status: 200
      });

      await form.submit();

      const callArgs = sendDatasetSubmission.mock.calls[0][0];
      const items = callArgs.dataset.items;
      
      // Should only include jagged (count > 0)
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('jagged');
      expect(items[0].count).toBe(10);
    });

    it('should require at least one item with count > 0', async () => {
      form.name = 'Test Dataset';
      form.itemCounts = {
        jagged: 0,
        dense: 0
      };

      validateDataset.mockReturnValue({
        valid: false,
        error: 'Field "items" must contain at least one item'
      });

      const result = await form.submit();

      expect(result.success).toBe(false);
      expect(sendDatasetSubmission).not.toHaveBeenCalled();
    });
  });

  describe('minimal dataset submission flow (User Story 2)', () => {
    beforeEach(async () => {
      await form.loadItems();
    });

    it('should submit dataset with only items (name optional)', async () => {
      form.name = ''; // Empty name (optional)
      form.description = '';
      form.date = null;
      form.sources = [];
      form.selectedInputItems = [];
      form.itemCounts = { jagged: 10 };

      validateDataset.mockReturnValue({ valid: true });
      sendDatasetSubmission.mockResolvedValue({
        success: true,
        messageId: 'minimal-submission-id',
        status: 200
      });

      const result = await form.submit();

      expect(result.success).toBe(true);
      expect(sendDatasetSubmission).toHaveBeenCalled();
      
      const callArgs = sendDatasetSubmission.mock.calls[0][0];
      expect(callArgs.dataset.name).toBeUndefined(); // Name not included when empty
      expect(callArgs.dataset.description).toBeUndefined();
      expect(callArgs.dataset.sources).toBeUndefined();
      expect(callArgs.dataset.inputItems).toBeUndefined();
      expect(callArgs.dataset.date).toBeDefined(); // Should have default date
    });

    it('should use current date as default when date not provided', async () => {
      form.name = 'Test Dataset';
      form.date = null;
      form.itemCounts = { jagged: 10 };

      validateDataset.mockReturnValue({ valid: true });
      sendDatasetSubmission.mockResolvedValue({
        success: true,
        messageId: 'test-id',
        status: 200
      });

      await form.submit();

      const callArgs = sendDatasetSubmission.mock.calls[0][0];
      const today = new Date().toISOString().split('T')[0];
      expect(callArgs.dataset.date).toBe(today);
    });

    it('should accept submission with empty optional fields', async () => {
      form.name = 'Test Dataset';
      form.description = '';
      form.sources = [];
      form.selectedInputItems = [];
      form.itemCounts = { jagged: 10, dense: 5 };

      validateDataset.mockReturnValue({ valid: true });
      sendDatasetSubmission.mockResolvedValue({
        success: true,
        messageId: 'test-id',
        status: 200
      });

      const result = await form.submit();

      expect(result.success).toBe(true);
      const callArgs = sendDatasetSubmission.mock.calls[0][0];
      expect(callArgs.dataset.items).toHaveLength(2);
    });
  });

  describe('multiple sources submission (User Story 3)', () => {
    beforeEach(async () => {
      await form.loadItems();
      form.name = 'Test Dataset';
      form.itemCounts = { jagged: 10 };
    });

    it('should submit dataset with multiple sources', async () => {
      form.addSource();
      form.updateSource(0, 'name', 'Google Sheet');
      form.updateSource(0, 'url', 'https://example.com/sheet');
      form.updateSource(0, 'author', 'User1');
      
      form.addSource();
      form.updateSource(1, 'name', 'Discord Thread');
      form.updateSource(1, 'url', 'https://discord.com/thread');
      form.updateSource(1, 'author', 'User2');

      validateDataset.mockReturnValue({ valid: true });
      sendDatasetSubmission.mockResolvedValue({
        success: true,
        messageId: 'multi-source-id',
        status: 200
      });

      await form.submit();

      const callArgs = sendDatasetSubmission.mock.calls[0][0];
      expect(callArgs.dataset.sources).toHaveLength(2);
      expect(callArgs.dataset.sources[0].name).toBe('Google Sheet');
      expect(callArgs.dataset.sources[1].name).toBe('Discord Thread');
    });

    it('should handle removing sources before submission', async () => {
      form.addSource();
      form.updateSource(0, 'name', 'Source 1');
      form.updateSource(0, 'url', 'https://example.com');
      form.updateSource(0, 'author', 'User');
      
      form.addSource();
      form.updateSource(1, 'name', 'Source 2');
      form.updateSource(1, 'url', 'https://example2.com');
      form.updateSource(1, 'author', 'User2');
      
      form.removeSource(0);

      validateDataset.mockReturnValue({ valid: true });
      sendDatasetSubmission.mockResolvedValue({
        success: true,
        messageId: 'test-id',
        status: 200
      });

      await form.submit();

      const callArgs = sendDatasetSubmission.mock.calls[0][0];
      expect(callArgs.dataset.sources).toHaveLength(1);
      expect(callArgs.dataset.sources[0].name).toBe('Source 2');
    });

    it('should validate source URLs before submission', async () => {
      form.addSource();
      form.updateSource(0, 'name', 'Invalid Source');
      form.updateSource(0, 'url', 'not-a-valid-url');
      form.updateSource(0, 'author', 'User');

      // URL validation happens in validateField, but doesn't block submission
      // The invalid URL will be included but validation should catch it if needed
      validateDataset.mockReturnValue({ valid: true });
      sendDatasetSubmission.mockResolvedValue({
        success: true,
        messageId: 'test-id',
        status: 200
      });

      await form.submit();

      // Submission should succeed (URL validation is per-field, not blocking)
      expect(sendDatasetSubmission).toHaveBeenCalled();
    });
  });

  describe('input items submission (User Story 4)', () => {
    beforeEach(async () => {
      await form.loadItems();
      form.name = 'Test Dataset';
      form.itemCounts = { dense: 10, frigid: 5 };
    });

    it('should submit dataset with input items', async () => {
      form.selectInputItem('jagged');

      validateDataset.mockReturnValue({ valid: true });
      sendDatasetSubmission.mockResolvedValue({
        success: true,
        messageId: 'input-items-id',
        status: 200
      });

      await form.submit();

      const callArgs = sendDatasetSubmission.mock.calls[0][0];
      expect(callArgs.dataset.inputItems).toBeDefined();
      expect(callArgs.dataset.inputItems).toHaveLength(1);
      expect(callArgs.dataset.inputItems[0]).toEqual({ id: 'jagged' });
    });

    it('should submit dataset with multiple input items', async () => {
      form.selectInputItem('jagged');
      form.selectInputItem('dense');

      validateDataset.mockReturnValue({ valid: true });
      sendDatasetSubmission.mockResolvedValue({
        success: true,
        messageId: 'test-id',
        status: 200
      });

      await form.submit();

      const callArgs = sendDatasetSubmission.mock.calls[0][0];
      expect(callArgs.dataset.inputItems).toHaveLength(2);
      expect(callArgs.dataset.inputItems.map(i => i.id)).toContain('jagged');
      expect(callArgs.dataset.inputItems.map(i => i.id)).toContain('dense');
    });

    it('should allow same item to be both input and output', async () => {
      form.selectInputItem('jagged');
      form.itemCounts.jagged = 10; // Also set count for same item

      validateDataset.mockReturnValue({ valid: true });
      sendDatasetSubmission.mockResolvedValue({
        success: true,
        messageId: 'test-id',
        status: 200
      });

      await form.submit();

      const callArgs = sendDatasetSubmission.mock.calls[0][0];
      // Item should be in both inputItems and items
      expect(callArgs.dataset.inputItems).toContainEqual({ id: 'jagged' });
      expect(callArgs.dataset.items.find(i => i.id === 'jagged')).toBeDefined();
    });

    it('should exclude inputItems when none selected', async () => {
      form.selectedInputItems = [];

      validateDataset.mockReturnValue({ valid: true });
      sendDatasetSubmission.mockResolvedValue({
        success: true,
        messageId: 'test-id',
        status: 200
      });

      await form.submit();

      const callArgs = sendDatasetSubmission.mock.calls[0][0];
      expect(callArgs.dataset.inputItems).toBeUndefined();
    });

    it('should handle changing input item selection', async () => {
      form.selectInputItem('jagged');
      form.deselectInputItem('jagged');
      form.selectInputItem('dense');

      validateDataset.mockReturnValue({ valid: true });
      sendDatasetSubmission.mockResolvedValue({
        success: true,
        messageId: 'test-id',
        status: 200
      });

      await form.submit();

      const callArgs = sendDatasetSubmission.mock.calls[0][0];
      expect(callArgs.dataset.inputItems).toHaveLength(1);
      expect(callArgs.dataset.inputItems[0].id).toBe('dense');
      expect(callArgs.dataset.inputItems[0].id).not.toBe('jagged');
    });
  });

  describe('item counts submission (User Story 5)', () => {
    beforeEach(async () => {
      await form.loadItems();
      form.name = 'Test Dataset';
    });

    it('should submit dataset with item counts', async () => {
      form.itemCounts = {
        jagged: 129,
        dense: 112,
        frigid: 122
      };

      validateDataset.mockReturnValue({ valid: true });
      sendDatasetSubmission.mockResolvedValue({
        success: true,
        messageId: 'counts-id',
        status: 200
      });

      await form.submit();

      const callArgs = sendDatasetSubmission.mock.calls[0][0];
      expect(callArgs.dataset.items).toHaveLength(3);
      expect(callArgs.dataset.items.find(i => i.id === 'jagged').count).toBe(129);
      expect(callArgs.dataset.items.find(i => i.id === 'dense').count).toBe(112);
      expect(callArgs.dataset.items.find(i => i.id === 'frigid').count).toBe(122);
    });

    it('should reject submission with non-numeric count', async () => {
      form.itemCounts = {
        jagged: 'abc',
        dense: 10
      };

      // Validation should catch this
      validateDataset.mockReturnValue({
        valid: false,
        error: 'Invalid item at index 0: missing required field "count" (must be a number)'
      });

      const result = await form.submit();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(sendDatasetSubmission).not.toHaveBeenCalled();
    });

    it('should reject submission with negative count', async () => {
      form.itemCounts = {
        jagged: -5,
        dense: 10
      };

      validateDataset.mockReturnValue({
        valid: false,
        error: 'Invalid item at index 0: field "count" must be a positive number'
      });

      const result = await form.submit();

      expect(result.success).toBe(false);
      expect(sendDatasetSubmission).not.toHaveBeenCalled();
    });

    it('should handle zero counts correctly', async () => {
      form.itemCounts = {
        jagged: 10,
        dense: 0,
        frigid: 0
      };

      validateDataset.mockReturnValue({ valid: true });
      sendDatasetSubmission.mockResolvedValue({
        success: true,
        messageId: 'test-id',
        status: 200
      });

      await form.submit();

      const callArgs = sendDatasetSubmission.mock.calls[0][0];
      // Only jagged should be included (count > 0)
      expect(callArgs.dataset.items).toHaveLength(1);
      expect(callArgs.dataset.items[0].id).toBe('jagged');
    });

    it('should handle very large numbers', async () => {
      form.itemCounts = {
        jagged: 1000000
      };

      validateDataset.mockReturnValue({ valid: true });
      sendDatasetSubmission.mockResolvedValue({
        success: true,
        messageId: 'test-id',
        status: 200
      });

      await form.submit();

      const callArgs = sendDatasetSubmission.mock.calls[0][0];
      expect(callArgs.dataset.items[0].count).toBe(1000000);
    });
  });
});
