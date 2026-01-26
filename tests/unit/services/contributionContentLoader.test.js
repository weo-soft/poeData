/**
 * Unit tests for contributionContentLoader service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadMetadata,
  loadContent,
  hasCategoryGuidelines,
  clearCache,
  ContentLoadError
} from '../../../src/services/contributionContentLoader.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('contributionContentLoader', () => {
  beforeEach(() => {
    clearCache();
    vi.clearAllMocks();
  });

  describe('loadMetadata', () => {
    it('should load and cache metadata', async () => {
      const mockMetadata = {
        categories: {
          scarabs: { available: true, lastUpdated: '2026-01-24' },
          breach: { available: false }
        },
        genericAvailable: true,
        lastUpdated: '2026-01-24T00:00:00Z'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata
      });

      const result = await loadMetadata();

      expect(result).toEqual(mockMetadata);
      expect(global.fetch).toHaveBeenCalledWith('/contributions/index.json');
      
      // Second call should use cache
      const result2 = await loadMetadata();
      expect(result2).toEqual(mockMetadata);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw ContentLoadError on fetch failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(loadMetadata()).rejects.toThrow(ContentLoadError);
    });

    it('should throw error on invalid JSON', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      await expect(loadMetadata()).rejects.toThrow();
    });
  });

  describe('loadContent', () => {
    it('should load generic content when categoryId is null', async () => {
      const mockHtml = '<h1>Generic Guide</h1>\n<p>Content here.</p>';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml
      });

      const result = await loadContent(null);

      expect(result.categoryId).toBe('generic');
      expect(result.html).toBe(mockHtml);
      expect(result.isGeneric).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/contributions/generic.html');
    });

    it('should load category-specific content when available', async () => {
      const mockMetadata = {
        categories: {
          scarabs: { available: true }
        },
        genericAvailable: true
      };

      const mockHtml = '<h1>Scarabs Guide</h1>\n<p>Content here.</p>';

      // Mock metadata load
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata
      });

      // Mock category content load
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml
      });

      const result = await loadContent('scarabs');

      expect(result.categoryId).toBe('scarabs');
      expect(result.html).toBe(mockHtml);
      expect(result.isGeneric).toBe(false);
      expect(global.fetch).toHaveBeenCalledWith('/contributions/categories/scarabs.html');
    });

    it('should fallback to generic when category not available', async () => {
      const mockMetadata = {
        categories: {
          newcategory: { available: false }
        },
        genericAvailable: true
      };

      const mockHtml = '<h1>Generic Guide</h1>\n<p>Content here.</p>';

      // Mock metadata load
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata
      });

      // Mock generic content load
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml
      });

      const result = await loadContent('newcategory');

      expect(result.categoryId).toBe('generic');
      expect(result.html).toBe(mockHtml);
      expect(result.isGeneric).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/contributions/generic.html');
    });

    it('should cache loaded content', async () => {
      const mockHtml = '<h1>Generic Guide</h1>';

      global.fetch.mockResolvedValue({
        ok: true,
        text: async () => mockHtml
      });

      await loadContent(null);
      const result2 = await loadContent(null);

      expect(result2.html).toBe(mockHtml);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

  });

  describe('hasCategoryGuidelines', () => {
    it('should return true when category has specific guidelines', async () => {
      const mockMetadata = {
        categories: {
          scarabs: { available: true }
        },
        genericAvailable: true
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata
      });

      const result = await hasCategoryGuidelines('scarabs');
      expect(result).toBe(true);
    });

    it('should return false when category does not have specific guidelines', async () => {
      const mockMetadata = {
        categories: {
          scarabs: { available: false }
        },
        genericAvailable: true
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata
      });

      const result = await hasCategoryGuidelines('scarabs');
      expect(result).toBe(false);
    });

    it('should return false when category not in metadata', async () => {
      const mockMetadata = {
        categories: {},
        genericAvailable: true
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata
      });

      const result = await hasCategoryGuidelines('nonexistent');
      expect(result).toBe(false);
    });

    it('should return false on metadata load error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await hasCategoryGuidelines('anycategory');
      expect(result).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('should clear metadata and content caches', async () => {
      const mockMetadata = {
        categories: {},
        genericAvailable: true
      };
      const mockHtml = '<h1>Test</h1>';

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockMetadata,
        text: async () => mockHtml
      });

      await loadMetadata();
      await loadContent(null);

      clearCache();

      // Next calls should fetch again
      await loadMetadata();
      await loadContent(null);

      expect(global.fetch).toHaveBeenCalledTimes(4); // 2 for initial load, 2 after clear
    });
  });
});
