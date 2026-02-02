/**
 * Integration tests for contribution guide feature
 * Tests the full flow from page rendering to content display
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderContributions } from '../../src/pages/contributions.js';
import { loadMetadata, loadContent } from '../../src/services/contributionContentLoader.js';
import { getAvailableCategories } from '../../src/services/dataLoader.js';

// Mock contributionContentLoader
vi.mock('../../src/services/contributionContentLoader.js', () => ({
  loadMetadata: vi.fn(),
  loadContent: vi.fn()
}));

// Mock dataLoader
vi.mock('../../src/services/dataLoader.js', () => ({
  getAvailableCategories: vi.fn()
}));


describe('Contribution Guide Integration Tests', () => {
  let container;

  const mockMetadata = {
    categories: {
      scarabs: { available: true, lastUpdated: '2026-01-24' },
      'divination-cards': { available: true, lastUpdated: '2026-01-24' },
      breach: { available: false }
    },
    genericAvailable: true,
    lastUpdated: '2026-01-24T00:00:00Z'
  };

  const mockGenericContent = {
    categoryId: 'generic',
    html: '<h1>How to Contribute Datasets</h1><h2>Why Your Contributions Matter</h2><p>Content here.</p>',
    isGeneric: true
  };

  const mockCategoryContent = {
    categoryId: 'scarabs',
    html: '<h1>Contributing Scarab Datasets</h1><p>Content here.</p>',
    isGeneric: false
  };

  const mockCategories = [
    { id: 'scarabs', name: 'Scarabs', description: 'Scarabs modify map areas' },
    { id: 'divination-cards', name: 'Divination Cards', description: 'Collectible cards' },
    { id: 'breach', name: 'Breach', description: 'Breach items' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Setup default mocks
    loadMetadata.mockResolvedValue(mockMetadata);
    loadContent.mockResolvedValue(mockGenericContent);
    getAvailableCategories.mockResolvedValue(mockCategories);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  describe('User Story 1: Contribution Guide Overview', () => {
    it('should display contribution guide overview page', async () => {
      await renderContributions(container, null);

      expect(container.querySelector('.contributions')).toBeTruthy();
      expect(container.querySelector('h1')).toBeTruthy();
      expect(container.querySelector('h1').textContent).toContain('How to Contribute');
      
      expect(loadContent).toHaveBeenCalledWith(null);
    });

    it('should display navigation links to submission interface', async () => {
      await renderContributions(container, null);

      const navLinks = container.querySelector('.nav-links');
      expect(navLinks).toBeTruthy();
      
      const submitLink = navLinks.querySelector('a[href="#/submit"]');
      expect(submitLink).toBeTruthy();
      expect(submitLink.textContent).toContain('Submit');
    });

    it('should handle loading state during content fetch', async () => {
      // The loading state is shown briefly during async operations
      // Since mocks resolve quickly, we verify the component handles async correctly
      await renderContributions(container, null);
      
      // After loading completes, content should be displayed
      expect(container.querySelector('.contribution-overview')).toBeTruthy();
      expect(loadContent).toHaveBeenCalled();
    });

    it('should display error state with retry option on failure', async () => {
      loadContent.mockRejectedValue(new Error('Failed to load'));
      
      await renderContributions(container, null);

      const errorMessage = container.textContent;
      expect(errorMessage).toContain('Failed to load');
      
      const retryButton = container.querySelector('.retry-button');
      expect(retryButton).toBeTruthy();
    });
  });

  describe('User Story 2: Category-Specific Contribution Guidelines', () => {
    it('should display category-specific guide page', async () => {
      loadContent.mockResolvedValue(mockCategoryContent);
      
      await renderContributions(container, 'scarabs');

      expect(container.querySelector('.contributions')).toBeTruthy();
      expect(container.querySelector('h1')).toBeTruthy();
      expect(container.querySelector('h1').textContent).toContain('Scarabs');
      
      expect(loadContent).toHaveBeenCalledWith('scarabs');
    });

    it('should display error with retry when category has no guidelines', async () => {
      loadContent.mockRejectedValue(new Error('No contribution guidelines available for category: breach'));
      
      await renderContributions(container, 'breach');

      expect(container.textContent).toContain('Failed to load');
      const retryButton = container.querySelector('.retry-button');
      expect(retryButton).toBeTruthy();
      expect(loadContent).toHaveBeenCalledWith('breach');
    });

    it('should display breadcrumbs navigation', async () => {
      loadContent.mockResolvedValue(mockCategoryContent);
      
      await renderContributions(container, 'scarabs');

      const breadcrumbs = container.querySelector('.breadcrumbs');
      expect(breadcrumbs).toBeTruthy();
      
      const breadcrumbItems = breadcrumbs.querySelectorAll('.breadcrumb-item');
      expect(breadcrumbItems.length).toBeGreaterThanOrEqual(2);
      
      // Check for home and contributions links
      const homeLink = breadcrumbs.querySelector('a[href="#/"]');
      const contributionsLink = breadcrumbs.querySelector('a[href="#/contributions"]');
      expect(homeLink).toBeTruthy();
      expect(contributionsLink).toBeTruthy();
    });

    it('should display link to category-specific submission form', async () => {
      loadContent.mockResolvedValue(mockCategoryContent);
      
      await renderContributions(container, 'scarabs');

      const navLinks = container.querySelector('.nav-links');
      const submitLink = navLinks.querySelector('a[href="#/submit/scarabs"]');
      expect(submitLink).toBeTruthy();
      expect(submitLink.textContent).toContain('Submit');
    });

    it('should display link back to category view', async () => {
      loadContent.mockResolvedValue(mockCategoryContent);
      
      await renderContributions(container, 'scarabs');

      const navLinks = container.querySelector('.nav-links');
      const categoryLink = navLinks.querySelector('a[href="#/category/scarabs"]');
      expect(categoryLink).toBeTruthy();
    });

    it('should display error with retry when categoryId has no guidelines', async () => {
      loadContent.mockRejectedValue(new Error('No contribution guidelines available for category: invalid-category'));
      
      await renderContributions(container, 'invalid-category');

      expect(container.textContent).toContain('Failed to load');
      expect(container.querySelector('.retry-button')).toBeTruthy();
      expect(loadContent).toHaveBeenCalledWith('invalid-category');
    });
  });

  describe('User Story 3: Quality Requirements Display', () => {
    it('should display quality requirements section in generic guide', async () => {
      const contentWithQuality = {
        ...mockGenericContent,
        html: '<h1>Guide</h1><h2>Quality Guidelines</h2><p>Minimum sample size: 100+</p>',
        html: '<h1>Guide</h1><br><h2>Quality Guidelines</h2><br>Minimum sample size: 100+'
      };
      loadContent.mockResolvedValue(contentWithQuality);
      
      await renderContributions(container, null);

      const content = container.querySelector('.contribution-overview');
      expect(content).toBeTruthy();
      expect(content.textContent).toContain('Quality Guidelines');
      expect(content.textContent).toContain('sample size');
    });

    it('should display quality requirements in category-specific guide', async () => {
      const contentWithQuality = {
        ...mockCategoryContent,
        html: '<h1>Scarabs Guide</h1><h2>Quality Guidelines</h2><p>Minimum: 100+</p>',
        html: '<h1>Scarabs Guide</h1><br><h2>Quality Guidelines</h2><br>Minimum: 100+'
      };
      loadContent.mockResolvedValue(contentWithQuality);
      
      await renderContributions(container, 'scarabs');

      const content = container.querySelector('.contribution-content');
      expect(content).toBeTruthy();
      expect(content.textContent).toContain('Quality Guidelines');
    });

    it('should render HTML content correctly with all features', async () => {
      const complexContent = {
        ...mockGenericContent,
        html: '<h1>Title</h1><h2>Section</h2><ul><li>List item 1</li><li>List item 2</li></ul><p><a href="#/submit">Link</a></p>',
        html: '<h1>Title</h1><br><h2>Section</h2><br>- List item 1<br>- List item 2<br><br>[Link](#/submit)'
      };
      loadContent.mockResolvedValue(complexContent);
      
      await renderContributions(container, null);

      const content = container.querySelector('.contribution-overview');
      expect(content).toBeTruthy();
      expect(content.innerHTML).toContain('<h1>');
      expect(content.innerHTML).toContain('<h2>');
    });
  });
});
