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
import { createNavigation, updateActiveLink } from './components/navigation.js';

// Get app container
const app = document.getElementById('app');

if (!app) {
  console.error('App container not found');
} else {
  // Create navigation and main content container
  const navigation = createNavigation();
  const mainContent = document.createElement('main');
  mainContent.id = 'main-content';
  
  // Clear app and add navigation and main content
  app.innerHTML = '';
  app.appendChild(navigation);
  app.appendChild(mainContent);
  
  // Set up route handlers (render to mainContent instead of app)
  router.on('/', () => {
    renderHome(mainContent);
    updateActiveLink(navigation);
  });
  
  router.on('/categories', () => {
    renderCategoryList(mainContent);
    updateActiveLink(navigation);
  });
  
  router.on('/category/:categoryId', (params) => {
    renderCategoryView(mainContent, params);
    updateActiveLink(navigation);
  });
  
  router.on('/category/:categoryId/item/:itemId', (params) => {
    renderItemDetail(mainContent, params);
    updateActiveLink(navigation);
  });
  
  router.on('/submit', () => {
    renderSubmission(mainContent);
    updateActiveLink(navigation);
  });
  
  router.on('/submit/:categoryId', (params) => {
    renderSubmission(mainContent, params);
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
}

