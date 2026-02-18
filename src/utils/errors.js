/**
 * Error handling and formatting utilities
 */

/**
 * Create a user-friendly error message
 * @param {Error|string} error - Error object or message
 * @returns {string} User-friendly error message
 */
export function formatError(error) {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message || 'An unexpected error occurred';
  }
  
  return 'An unexpected error occurred';
}

/**
 * Create an error element for display
 * @param {string} message - Error message
 * @param {string} className - Additional CSS classes
 * @returns {HTMLElement} Error element
 */
export function createErrorElement(message, className = '') {
  const errorDiv = document.createElement('div');
  errorDiv.className = `error ${className}`.trim();
  errorDiv.setAttribute('role', 'alert');
  errorDiv.textContent = message;
  return errorDiv;
}

/**
 * Display error in the UI
 * @param {HTMLElement} container - Container to display error in
 * @param {Error|string} error - Error to display
 */
export function displayError(container, error) {
  const message = formatError(error);
  const errorElement = createErrorElement(message);
  container.appendChild(errorElement);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (errorElement.parentNode) {
      errorElement.parentNode.removeChild(errorElement);
    }
  }, 5000);
}

/**
 * Handle async errors with try-catch wrapper
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function that handles errors
 */
export function asyncErrorHandler(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Async error:', error);
      throw error;
    }
  };
}

/**
 * Global error handler for unhandled errors
 */
export function setupGlobalErrorHandler() {
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Could send to error tracking service in production
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Could send to error tracking service in production
  });
}

