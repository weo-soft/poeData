/**
 * Application entry point
 * Initializes router and sets up route handlers
 */

import { router } from './services/router.js';
import { renderHome } from './pages/home.js';
import { renderCategoryList } from './pages/categoryList.js';
import { renderCategoryView } from './pages/categoryView.js';
import { renderItemDetail } from './pages/itemDetail.js';
import { renderSubmission } from './pages/submission.js';
import { renderDatasetView } from './pages/datasetView.js';
import { renderContributions } from './pages/contributions.js';
import { renderContact } from './pages/contact.js';
import { createNavigation, updateActiveLink, updateActiveCategoryLink, clearCategoryTitle } from './components/navigation.js';

// Get app container
const app = document.getElementById('app');

if (!app) {
  console.error('App container not found');
} else {
  // Initialize app asynchronously
  (async () => {
    // Create navigation (static category list – no data fetch)
    const navigation = createNavigation();
    
    // Create main content container
    const mainContent = document.createElement('main');
    mainContent.id = 'main-content';
    
    // Clear app and add navigation and main content
    app.innerHTML = '';
    app.appendChild(navigation);
    app.appendChild(mainContent);
    
    // Set up route handlers (render to mainContent)
    router.on('/', () => {
      clearCategoryTitle(navigation);
      renderHome(mainContent);
      updateActiveLink(navigation);
    });
    
    router.on('/categories', () => {
      clearCategoryTitle(navigation);
      renderCategoryList(mainContent);
      updateActiveLink(navigation);
    });
    
    router.on('/category/:categoryId', (params, query) => {
      renderCategoryView(mainContent, { ...params, query });
      updateActiveLink(navigation);
    });
    
    router.on('/category/:categoryId/item/:itemId', (params) => {
      // Keep category title when viewing item detail
      renderItemDetail(mainContent, params);
      updateActiveLink(navigation);
    });
    
    router.on('/category/:categoryId/dataset/:datasetNumber', (params) => {
      // Keep category title when viewing dataset detail
      renderDatasetView(mainContent, params);
      updateActiveLink(navigation);
    });
    
    router.on('/submit', () => {
      clearCategoryTitle(navigation);
      renderSubmission(mainContent);
      updateActiveLink(navigation);
    });
    
    router.on('/submit/:categoryId', (params) => {
      clearCategoryTitle(navigation);
      renderSubmission(mainContent, params);
      updateActiveLink(navigation);
    });
    
    // Contribution guide routes (category-specific must be registered before overview)
    router.on('/contributions/:categoryId', (params) => {
      clearCategoryTitle(navigation);
      renderContributions(mainContent, params.categoryId);
      updateActiveLink(navigation);
    });
    
    router.on('/contributions', () => {
      clearCategoryTitle(navigation);
      renderContributions(mainContent, null);
      updateActiveLink(navigation);
    });
    
    router.on('/contact', () => {
      clearCategoryTitle(navigation);
      renderContact(mainContent);
      updateActiveLink(navigation);
    });
    
    // Listen to route changes to update navigation
    router.addListener(() => {
      updateActiveLink(navigation);
    });
    
    // Initialize router
    router.init();
    
    // Setup global error handling
    import('./utils/errors.js').then(({ setupGlobalErrorHandler }) => {
      setupGlobalErrorHandler();
    });
  })();
}

