/**
 * Contribution guide content loading service
 * Loads and caches contribution guide metadata and content
 * 
 * This service provides functions to load contribution guide metadata and content
 * from static HTML files. It implements caching to avoid repeated network requests
 * and provides fallback to generic guidelines when category-specific content is unavailable.
 * 
 * @module services/contributionContentLoader
 */

// Cache for loaded data
const metadataCache = new Map();
const contentCache = new Map();

/**
 * Custom error for content loading failures
 * @class ContentLoadError
 * @extends Error
 * @property {string} categoryId - Category ID that failed to load
 * @property {number|null} statusCode - HTTP status code (if fetch error)
 */
export class ContentLoadError extends Error {
  constructor(message, categoryId, statusCode) {
    super(message);
    this.name = 'ContentLoadError';
    this.categoryId = categoryId;
    this.statusCode = statusCode;
  }
}


/**
 * Load contribution guide metadata (which categories have specific guidelines)
 * 
 * Fetches the metadata file from `/contributions/index.json` which contains
 * information about which categories have specific contribution guidelines available.
 * Results are cached in memory for subsequent calls.
 * 
 * @returns {Promise<Object>} Metadata object with the following structure:
 *   - categories: Object mapping category IDs to { available: boolean, lastUpdated?: string }
 *   - genericAvailable: boolean indicating if generic guidelines are available
 *   - lastUpdated: ISO 8601 timestamp of last metadata update
 * @throws {ContentLoadError} If the metadata file cannot be loaded or is invalid
 * @example
 * const metadata = await loadMetadata();
 * // {
 * //   categories: {
 * //     "scarabs": { available: true, lastUpdated: "2026-01-24" },
 * //     "breach": { available: false }
 * //   },
 * //   genericAvailable: true,
 * //   lastUpdated: "2026-01-24T00:00:00Z"
 * // }
 */
export async function loadMetadata() {
  // Check cache first
  if (metadataCache.has('metadata')) {
    return metadataCache.get('metadata');
  }

  try {
    const response = await fetch('/contributions/index.json');
    
    if (!response.ok) {
      throw new ContentLoadError(
        `Failed to load metadata: ${response.statusText}`,
        'metadata',
        response.status
      );
    }
    
    const metadata = await response.json();
    
    // Validate metadata structure
    if (!metadata || typeof metadata !== 'object') {
      throw new Error('Invalid metadata format: expected object');
    }
    
    if (typeof metadata.genericAvailable !== 'boolean') {
      throw new Error('Invalid metadata format: genericAvailable must be boolean');
    }
    
    // Cache the metadata
    metadataCache.set('metadata', metadata);
    
    return metadata;
  } catch (error) {
    if (error instanceof ContentLoadError) {
      throw error;
    }
    throw new ContentLoadError(
      `Failed to load metadata: ${error.message}`,
      'metadata',
      null
    );
  }
}

/**
 * Load contribution guide content for a specific category
 * 
 * Loads HTML content for the specified category and returns a content object.
 * If category-specific content is not available, falls back to generic guidelines.
 * Results are cached in memory.
 * 
 * @param {string|null} categoryId - Category identifier, or null for generic content
 * @returns {Promise<Object>} Content object with the following structure:
 *   - categoryId: string - Category ID or "generic"
 *   - html: string - HTML content
 *   - isGeneric: boolean - Whether this is generic (fallback) content
 * @throws {ContentLoadError} If content file cannot be loaded
 * @example
 * // Load category-specific content
 * const content = await loadContent('scarabs');
 * // { categoryId: 'scarabs', html: '<h1>Guide...</h1>', isGeneric: false }
 * 
 * // Load generic content
 * const generic = await loadContent(null);
 * // { categoryId: 'generic', html: '<h1>Generic...</h1>', isGeneric: true }
 */
export async function loadContent(categoryId) {
  const cacheKey = categoryId || 'generic';
  
  // Check cache first
  if (contentCache.has(cacheKey)) {
    return contentCache.get(cacheKey);
  }

  try {
    let html;
    let isGeneric = false;
    let actualCategoryId = categoryId || 'generic';
    
    // If categoryId is null, load generic content
    if (categoryId === null) {
      const response = await fetch('/contributions/generic.html');
      if (!response.ok) {
        throw new ContentLoadError(
          `Failed to load generic content: ${response.statusText}`,
          'generic',
          response.status
        );
      }
      html = await response.text();
      isGeneric = true;
    } else {
      // Check metadata to see if category-specific content is available
      const metadata = await loadMetadata();
      const categoryInfo = metadata.categories?.[categoryId];
      
      if (categoryInfo?.available) {
        // Try to load category-specific content
        try {
          const response = await fetch(`/contributions/categories/${categoryId}.html`);
          if (response.ok) {
            html = await response.text();
            isGeneric = false;
          } else {
            // Category file not found, fallback to generic
            const genericResponse = await fetch('/contributions/generic.html');
            if (!genericResponse.ok) {
              throw new ContentLoadError(
                `Failed to load generic fallback: ${genericResponse.statusText}`,
                categoryId,
                genericResponse.status
              );
            }
            html = await genericResponse.text();
            isGeneric = true;
            actualCategoryId = 'generic';
          }
        } catch (error) {
          // Network error loading category file, try generic fallback
          const genericResponse = await fetch('/contributions/generic.html');
          if (!genericResponse.ok) {
            throw new ContentLoadError(
              `Failed to load generic fallback: ${genericResponse.statusText}`,
              categoryId,
              genericResponse.status
            );
          }
          html = await genericResponse.text();
          isGeneric = true;
          actualCategoryId = 'generic';
        }
      } else {
        // Category not available, load generic
        const response = await fetch('/contributions/generic.html');
        if (!response.ok) {
          throw new ContentLoadError(
            `Failed to load generic content: ${response.statusText}`,
            categoryId,
            response.status
          );
        }
        html = await response.text();
        isGeneric = true;
        actualCategoryId = 'generic';
      }
    }
    
    // Create content object
    const content = {
      categoryId: actualCategoryId,
      html: html,
      isGeneric: isGeneric
    };
    
    // Cache the content
    contentCache.set(cacheKey, content);
    
    return content;
  } catch (error) {
    if (error instanceof ContentLoadError) {
      throw error;
    }
    throw new ContentLoadError(
      `Failed to load content: ${error.message}`,
      categoryId || 'generic',
      null
    );
  }
}

/**
 * Check if a category has specific guidelines available
 * 
 * Checks the metadata to determine if a category has category-specific contribution
 * guidelines. Returns false if metadata cannot be loaded or category is not in metadata.
 * 
 * @param {string} categoryId - Category identifier
 * @returns {Promise<boolean>} True if category has specific guidelines, false otherwise
 * @example
 * const hasSpecific = await hasCategoryGuidelines('scarabs'); // true
 * const hasGeneric = await hasCategoryGuidelines('new-category'); // false
 */
export async function hasCategoryGuidelines(categoryId) {
  try {
    const metadata = await loadMetadata();
    const categoryInfo = metadata.categories?.[categoryId];
    return categoryInfo?.available === true;
  } catch (error) {
    // If metadata can't be loaded, assume no specific guidelines
    return false;
  }
}

/**
 * Clear the content cache (for testing or forced refresh)
 * 
 * Clears both metadata and content caches. Next calls to loadMetadata() or loadContent()
 * will fetch fresh data from the server.
 * 
 * @returns {void}
 * @example
 * clearCache();
 * // Next loadMetadata() or loadContent() calls will fetch fresh data
 */
export function clearCache() {
  metadataCache.clear();
  contentCache.clear();
}
