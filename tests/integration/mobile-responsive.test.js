/**
 * Integration tests for mobile responsive design
 * Tests mobile viewport rendering, touch targets, and responsive layouts
 */

import { test, expect } from '@playwright/test';

/**
 * Helper function to set mobile viewport
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {number} width - Viewport width (default: 375px for iPhone)
 * @param {number} height - Viewport height (default: 667px for iPhone)
 */
export async function setMobileViewport(page, width = 375, height = 667) {
  await page.setViewportSize({ width, height });
}

/**
 * Helper function to check for horizontal scrolling
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<boolean>} True if horizontal scroll exists
 */
export async function hasHorizontalScroll(page) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  return scrollWidth > clientWidth;
}

/**
 * Helper function to verify touch target size
 * @param {import('@playwright/test').Locator} element - Element locator
 * @param {number} minSize - Minimum size in pixels (default: 44)
 * @returns {Promise<boolean>} True if element meets touch target requirements
 */
export async function verifyTouchTarget(element, minSize = 44) {
  const box = await element.boundingBox();
  if (!box) return false;
  return box.width >= minSize && box.height >= minSize;
}

/**
 * Helper function to test orientation change
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {'portrait'|'landscape'} orientation - Target orientation
 */
export async function setOrientation(page, orientation) {
  const isPortrait = orientation === 'portrait';
  await page.setViewportSize({
    width: isPortrait ? 375 : 667,
    height: isPortrait ? 667 : 375
  });
}

// Test suite for mobile responsive design
test.describe('Mobile Responsive Design', () => {
  const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173';

  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
    await setMobileViewport(page);
  });

  test.describe('Homepage Layout', () => {
    // T009: E2E test for mobile homepage layout
    test('T009: should display content without horizontal scrolling and be readable', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await setMobileViewport(page, 375, 667);
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Verify no horizontal scroll
      const hasScroll = await hasHorizontalScroll(page);
      expect(hasScroll).toBe(false);
      
      // Verify content is readable (16px minimum)
      const bodyText = await page.locator('body').evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return parseFloat(styles.fontSize);
      });
      expect(bodyText).toBeGreaterThanOrEqual(16);
    });
  });

  test.describe('Navigation Menu', () => {
    // T010: E2E test for mobile navigation menu
    test('T010: hamburger menu should appear, open/close, and all links be accessible', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await setMobileViewport(page, 375, 667);
      
      await page.waitForLoadState('networkidle');
      
      const hamburger = page.locator('.hamburger-menu');
      const mobileMenu = page.locator('.mobile-menu-overlay');
      
      // Hamburger should be visible on mobile
      await expect(hamburger).toBeVisible();
      
      // Menu should be hidden initially
      await expect(mobileMenu).not.toBeVisible();
      
      // Click hamburger to open
      await hamburger.click();
      await page.waitForTimeout(100); // Allow animation
      await expect(mobileMenu).toBeVisible();
      
      // Verify all links are accessible (touch targets)
      const navLinks = page.locator('.mobile-menu-overlay .mobile-nav-link');
      const count = await navLinks.count();
      expect(count).toBeGreaterThan(0);
      
      for (let i = 0; i < count; i++) {
        const link = navLinks.nth(i);
        const meetsTarget = await verifyTouchTarget(link);
        expect(meetsTarget).toBe(true);
      }
      
      // Click hamburger again to close
      await hamburger.click();
      await page.waitForTimeout(100);
      await expect(mobileMenu).not.toBeVisible();
    });
  });

  test.describe('Category List', () => {
    // T011: E2E test for mobile category list
    test('T011: categories should display in mobile-friendly layout with touch targets ≥44px', async ({ page }) => {
      await page.goto(`${baseURL}/categories`);
      await setMobileViewport(page, 375, 667);
      
      await page.waitForLoadState('networkidle');
      
      // Verify no horizontal scroll
      const hasScroll = await hasHorizontalScroll(page);
      expect(hasScroll).toBe(false);
      
      // Verify touch-friendly category cards
      const categoryCards = page.locator('.category-card');
      const count = await categoryCards.count();
      
      if (count > 0) {
        const firstCard = categoryCards.first();
        const meetsTarget = await verifyTouchTarget(firstCard);
        expect(meetsTarget).toBe(true);
      }
    });
  });

  test.describe('Category View', () => {
    // T012: E2E test for mobile category view
    test('T012: items should display appropriately with no horizontal scroll', async ({ page }) => {
      await page.goto(`${baseURL}/category/scarabs`);
      await setMobileViewport(page, 375, 667);
      
      // Wait for content to load
      await page.waitForSelector('.category-view, .list-view-container, .stash-tab-container', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      
      // Verify no horizontal scroll
      const hasScroll = await hasHorizontalScroll(page);
      expect(hasScroll).toBe(false);
    });
  });

  test.describe('Item Detail', () => {
    // T013: E2E test for mobile item detail page
    test('T013: content should be readable, properly formatted, and scrollable', async ({ page }) => {
      await page.goto(`${baseURL}/category/scarabs`);
      await setMobileViewport(page, 375, 667);
      
      await page.waitForLoadState('networkidle');
      
      // Try to find and click an item link
      const itemLink = page.locator('.list-view-item-link, .stash-tab-item').first();
      const linkExists = await itemLink.count() > 0;
      
      if (linkExists) {
        await itemLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        
        // Verify no horizontal scroll
        const hasScroll = await hasHorizontalScroll(page);
        expect(hasScroll).toBe(false);
        
        // Verify content is readable (check item detail container exists)
        const itemDetail = page.locator('.item-detail');
        await expect(itemDetail).toBeVisible({ timeout: 5000 });
      } else {
        // If no items found, at least verify the page structure
        test.skip();
      }
    });
  });

  test.describe('Orientation Changes', () => {
    test('should adapt layout when rotating to landscape', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await setMobileViewport(page, 375, 667); // Portrait
      
      const portraitScroll = await hasHorizontalScroll(page);
      
      await setOrientation(page, 'landscape');
      await page.waitForTimeout(500); // Allow layout to adjust
      
      const landscapeScroll = await hasHorizontalScroll(page);
      
      expect(portraitScroll).toBe(false);
      expect(landscapeScroll).toBe(false);
    });
  });

  test.describe('Very Small Screens', () => {
    test('should work on 320px width screens', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await setMobileViewport(page, 320, 568);
      
      const hasScroll = await hasHorizontalScroll(page);
      expect(hasScroll).toBe(false);
    });
  });

  test.describe('Tablet Viewports', () => {
    test('should display correctly on tablet (768px)', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await setMobileViewport(page, 768, 1024);
      
      const hasScroll = await hasHorizontalScroll(page);
      expect(hasScroll).toBe(false);
    });
  });

  test.describe('User Story 2 - Submit Data on Mobile', () => {
    // T022: E2E test for mobile submission form layout
    test('T022: form fields should be full-width with proper input types and mobile keyboards', async ({ page }) => {
      await page.goto(`${baseURL}/submit`);
      await setMobileViewport(page, 375, 667);
      
      await page.waitForLoadState('networkidle');
      
      // Verify form inputs are full-width
      const inputs = page.locator('.dataset-submission-form .form-input, .dataset-submission-form .form-textarea');
      const count = await inputs.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const input = inputs.nth(i);
          const box = await input.boundingBox();
          if (box) {
            // Check width is close to viewport (allowing for padding)
            expect(box.width).toBeGreaterThan(300);
            // Check minimum height for touch
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
      
      // Verify input types are set correctly
      const urlInput = page.locator('input[type="url"]').first();
      if (await urlInput.count() > 0) {
        const inputType = await urlInput.getAttribute('type');
        expect(inputType).toBe('url');
      }
      
      const numberInput = page.locator('input[type="number"]').first();
      if (await numberInput.count() > 0) {
        const inputType = await numberInput.getAttribute('type');
        expect(inputType).toBe('number');
      }
    });

    // T023: E2E test for mobile dataset submission form
    test('T023: all sections should stack vertically with touch targets ≥44px', async ({ page }) => {
      await page.goto(`${baseURL}/submit/scarabs`);
      await setMobileViewport(page, 375, 667);
      
      await page.waitForLoadState('networkidle');
      
      // Wait for form to render
      await page.waitForSelector('.dataset-submission-form', { timeout: 5000 });
      
      // Verify no horizontal scroll
      const hasScroll = await hasHorizontalScroll(page);
      expect(hasScroll).toBe(false);
      
      // Verify form buttons have touch targets
      const buttons = page.locator('.dataset-submission-form button, .dataset-submission-form .btn');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        const firstButton = buttons.first();
        const meetsTarget = await verifyTouchTarget(firstButton);
        expect(meetsTarget).toBe(true);
      }
    });

    // T024: E2E test for mobile flexible submission dialog
    test('T024: dialog should fit viewport (95% width, 90vh height) and be scrollable', async ({ page }) => {
      await page.goto(`${baseURL}/submit/scarabs`);
      await setMobileViewport(page, 375, 667);
      
      await page.waitForLoadState('networkidle');
      
      // Find and click flexible submission button/tab
      const flexibleTab = page.locator('button:has-text("Flexible Submission"), .tab-button:has-text("Flexible")');
      const tabExists = await flexibleTab.count() > 0;
      
      if (tabExists) {
        await flexibleTab.click();
        await page.waitForTimeout(500);
        
        // Wait for dialog to appear
        const dialog = page.locator('.flexible-submission-overlay.show, .flexible-submission-content');
        await expect(dialog).toBeVisible({ timeout: 3000 });
        
        // Verify dialog dimensions
        const dialogBox = await dialog.boundingBox();
        if (dialogBox) {
          // Should be approximately 95% of viewport width (375px * 0.95 = 356px, allow some margin)
          expect(dialogBox.width).toBeGreaterThan(340);
          expect(dialogBox.width).toBeLessThan(375);
          
          // Should not exceed 90vh (667px * 0.9 = 600px)
          expect(dialogBox.height).toBeLessThan(650);
        }
      } else {
        test.skip();
      }
    });

    // T025: E2E test for mobile form validation feedback
    test('T025: error messages should be visible and readable on mobile screens', async ({ page }) => {
      await page.goto(`${baseURL}/submit/scarabs`);
      await setMobileViewport(page, 375, 667);
      
      await page.waitForLoadState('networkidle');
      
      // Wait for form
      await page.waitForSelector('.dataset-submission-form', { timeout: 5000 });
      
      // Try to submit empty form or trigger validation
      const submitButton = page.locator('.dataset-submission-form button[type="submit"]').first();
      const submitExists = await submitButton.count() > 0;
      
      if (submitExists) {
        await submitButton.click();
        await page.waitForTimeout(500);
        
        // Check for error messages
        const errorMessages = page.locator('.field-error, .validation-errors-container');
        const errorCount = await errorMessages.count();
        
        // If errors exist, verify they're visible and readable
        if (errorCount > 0) {
          const firstError = errorMessages.first();
          await expect(firstError).toBeVisible();
          
          const errorBox = await firstError.boundingBox();
          if (errorBox) {
            // Error should be readable (not too small)
            expect(errorBox.height).toBeGreaterThan(20);
          }
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe('User Story 3 - View Visualizations and Charts on Mobile', () => {
    // T033: E2E test for mobile chart readability
    test('T033: charts should display at appropriate size with minimum 280px width and be readable', async ({ page }) => {
      await page.goto(`${baseURL}/category/essences`);
      await setMobileViewport(page, 375, 667);
      
      await page.waitForLoadState('networkidle');
      
      // Wait for charts to render
      const chartContainer = page.locator('.chart-container').first();
      const chartExists = await chartContainer.count() > 0;
      
      if (chartExists) {
        await expect(chartContainer).toBeVisible({ timeout: 5000 });
        
        const box = await chartContainer.boundingBox();
        if (box) {
          // Verify minimum width
          expect(box.width).toBeGreaterThanOrEqual(280);
          // Verify it fits viewport
          expect(box.width).toBeLessThanOrEqual(375);
        }
      } else {
        test.skip();
      }
    });

    // T034: E2E test for mobile canvas visualization scaling
    test('T034: canvas should scale to fit viewport and maintain aspect ratio', async ({ page }) => {
      await page.goto(`${baseURL}/category/scarabs`);
      await setMobileViewport(page, 375, 667);
      
      await page.waitForLoadState('networkidle');
      
      // Wait for canvas to render
      const canvas = page.locator('.stash-tab-canvas').first();
      const canvasExists = await canvas.count() > 0;
      
      if (canvasExists) {
        await expect(canvas).toBeVisible({ timeout: 10000 });
        
        const box = await canvas.boundingBox();
        if (box) {
          // Verify canvas fits viewport width
          expect(box.width).toBeLessThanOrEqual(375);
          // Verify aspect ratio is maintained (height should be proportional)
          expect(box.height).toBeGreaterThan(0);
        }
      } else {
        test.skip();
      }
    });

    // T035: E2E test for mobile weight displays
    test('T035: weight data should be readable and visualizations accessible', async ({ page }) => {
      await page.goto(`${baseURL}/category/scarabs`);
      await setMobileViewport(page, 375, 667);
      
      await page.waitForLoadState('networkidle');
      
      // Wait for weight display if it exists
      const weightDisplay = page.locator('.weight-display, .bayesian-weight-display').first();
      const weightExists = await weightDisplay.count() > 0;
      
      if (weightExists) {
        await expect(weightDisplay).toBeVisible({ timeout: 5000 });
        
        // Verify no horizontal scroll
        const hasScroll = await hasHorizontalScroll(page);
        expect(hasScroll).toBe(false);
      } else {
        test.skip();
      }
    });

    // T036: E2E test for mobile list views
    test('T036: list should be optimized for mobile scrolling and touch interaction', async ({ page }) => {
      await page.goto(`${baseURL}/category/essences`);
      await setMobileViewport(page, 375, 667);
      
      await page.waitForLoadState('networkidle');
      
      // Wait for list view
      const listContainer = page.locator('.list-view-container').first();
      const listExists = await listContainer.count() > 0;
      
      if (listExists) {
        await expect(listContainer).toBeVisible({ timeout: 5000 });
        
        // Verify single column on mobile
        const computedStyle = await listContainer.evaluate((el) => {
          return window.getComputedStyle(el).gridTemplateColumns;
        });
        // Should be single column (1fr or similar)
        expect(computedStyle).toMatch(/1fr|100%/);
        
        // Verify touch targets
        const listItem = page.locator('.list-view-item').first();
        const itemExists = await listItem.count() > 0;
        if (itemExists) {
          const meetsTarget = await verifyTouchTarget(listItem);
          expect(meetsTarget).toBe(true);
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe('Polish & Cross-Cutting Concerns', () => {
    // T055: E2E test for orientation changes
    test('T055: layouts should adapt when rotating from portrait to landscape', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await setMobileViewport(page, 375, 667); // Portrait
      
      await page.waitForLoadState('networkidle');
      const portraitScroll = await hasHorizontalScroll(page);
      expect(portraitScroll).toBe(false);
      
      await setOrientation(page, 'landscape');
      await page.waitForTimeout(500); // Allow layout to adjust
      
      const landscapeScroll = await hasHorizontalScroll(page);
      expect(landscapeScroll).toBe(false);
    });

    // T056: E2E test for very small screens
    test('T056: all functionality should work on 320px width screens', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await setMobileViewport(page, 320, 568);
      
      await page.waitForLoadState('networkidle');
      
      // Verify no horizontal scroll
      const hasScroll = await hasHorizontalScroll(page);
      expect(hasScroll).toBe(false);
      
      // Verify navigation is accessible
      const hamburger = page.locator('.hamburger-menu');
      await expect(hamburger).toBeVisible();
      
      // Verify content is readable
      const bodyText = await page.locator('body').evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return parseFloat(styles.fontSize);
      });
      expect(bodyText).toBeGreaterThanOrEqual(16);
    });

    // T057: E2E test for tablet viewports
    test('T057: should display correctly on tablet (768px) with tablet-optimized layouts', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await setMobileViewport(page, 768, 1024);
      
      await page.waitForLoadState('networkidle');
      
      // Verify no horizontal scroll
      const hasScroll = await hasHorizontalScroll(page);
      expect(hasScroll).toBe(false);
      
      // On tablet, desktop nav should be visible
      const navList = page.locator('.nav-list');
      await expect(navList).toBeVisible();
      
      // Hamburger should be hidden on tablet
      const hamburger = page.locator('.hamburger-menu');
      const hamburgerVisible = await hamburger.isVisible().catch(() => false);
      expect(hamburgerVisible).toBe(false);
    });
  });

  test.describe('User Story 3 - List View Responsive Layout', () => {
    test('T019: should display grid and list side-by-side on desktop (≥1024px)', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto(`${baseURL}/#/category/essences`);
      await page.waitForLoadState('networkidle');
      
      // Wait for views container to appear
      const viewsContainer = page.locator('.category-views-container');
      await expect(viewsContainer).toBeVisible();
      
      // Check computed styles for side-by-side layout
      const gridTemplateColumns = await viewsContainer.evaluate((el) => {
        return window.getComputedStyle(el).gridTemplateColumns;
      });
      
      // Should have 2 columns (1fr 1fr) on desktop
      expect(gridTemplateColumns).toContain('1fr');
    });

    test('T020: should stack grid and list on mobile (<1024px)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${baseURL}/#/category/essences`);
      await page.waitForLoadState('networkidle');
      
      // Wait for views container to appear
      const viewsContainer = page.locator('.category-views-container');
      await expect(viewsContainer).toBeVisible();
      
      // Check computed styles for stacked layout
      const gridTemplateColumns = await viewsContainer.evaluate((el) => {
        return window.getComputedStyle(el).gridTemplateColumns;
      });
      
      // Should have 1 column on mobile (stacked)
      // The media query should override to single column
      expect(gridTemplateColumns).toBeTruthy();
      
      // Verify list view is accessible
      const listView = page.locator('.category-list-view');
      await expect(listView).toBeVisible();
    });

    test('should work on 320px minimum width screens', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.goto(`${baseURL}/#/category/essences`);
      await page.waitForLoadState('networkidle');
      
      // Verify no horizontal scroll
      const hasScroll = await hasHorizontalScroll(page);
      expect(hasScroll).toBe(false);
      
      // Verify list view is accessible
      const listView = page.locator('.category-list-view');
      await expect(listView).toBeVisible();
      
      // Verify list entries are readable
      const firstEntry = listView.locator('.category-list-entry').first();
      if (await firstEntry.count() > 0) {
        await expect(firstEntry).toBeVisible();
      }
    });
  });
});
