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
import { createNavigation, updateActiveLink } from './components/navigation.js';
import { createCategorySidebar, updateActiveCategoryLink } from './components/categorySidebar.js';

// Get app container
const app = document.getElementById('app');

if (!app) {
  console.error('App container not found');
} else {
  // Initialize app asynchronously
  (async () => {
    // Create navigation
    const navigation = createNavigation();
    
    // Create layout container for sidebar and main content
    const layoutContainer = document.createElement('div');
    layoutContainer.className = 'app-layout';
    
    // Create sidebar and main content container
    const sidebar = await createCategorySidebar();
    const mainContent = document.createElement('main');
    mainContent.id = 'main-content';
    
    layoutContainer.appendChild(sidebar);
    layoutContainer.appendChild(mainContent);
    
    // Clear app and add navigation and layout container
    app.innerHTML = '';
    app.appendChild(navigation);
    app.appendChild(layoutContainer);
    
    // Set up route handlers (render to mainContent instead of app)
    router.on('/', () => {
      renderHome(mainContent);
      updateActiveLink(navigation);
      updateActiveCategoryLink(sidebar);
    });
    
    router.on('/categories', () => {
      renderCategoryList(mainContent);
      updateActiveLink(navigation);
      updateActiveCategoryLink(sidebar);
    });
    
    router.on('/category/:categoryId', (params, query) => {
      renderCategoryView(mainContent, { ...params, query });
      updateActiveLink(navigation);
      updateActiveCategoryLink(sidebar);
    });
    
    router.on('/category/:categoryId/item/:itemId', (params) => {
      renderItemDetail(mainContent, params);
      updateActiveLink(navigation);
      updateActiveCategoryLink(sidebar);
    });
    
    router.on('/category/:categoryId/dataset/:datasetNumber', (params) => {
      renderDatasetView(mainContent, params);
      updateActiveLink(navigation);
      updateActiveCategoryLink(sidebar);
    });
    
    router.on('/submit', () => {
      renderSubmission(mainContent);
      updateActiveLink(navigation);
      updateActiveCategoryLink(sidebar);
    });
    
    router.on('/submit/:categoryId', (params) => {
      renderSubmission(mainContent, params);
      updateActiveLink(navigation);
      updateActiveCategoryLink(sidebar);
    });
    
    // Contribution guide routes (category-specific must be registered before overview)
    router.on('/contributions/:categoryId', (params) => {
      renderContributions(mainContent, params.categoryId);
      updateActiveLink(navigation);
      updateActiveCategoryLink(sidebar);
    });
    
    router.on('/contributions', () => {
      renderContributions(mainContent, null);
      updateActiveLink(navigation);
      updateActiveCategoryLink(sidebar);
    });
    
    // Listen to route changes to update navigation
    router.addListener(() => {
      updateActiveLink(navigation);
      updateActiveCategoryLink(sidebar);
    });
    
    // Initialize router
    router.init();
    
    // Setup global error handling
    import('./utils/errors.js').then(({ setupGlobalErrorHandler }) => {
      setupGlobalErrorHandler();
    });
  })();
}

