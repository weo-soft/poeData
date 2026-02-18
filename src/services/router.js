/**
 * Client-side hash-based routing implementation
 */

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.currentParams = {};
    this.currentQuery = {};
    this.listeners = [];
  }

  /**
   * Initialize router and set up hash change listener
   */
  init() {
    window.addEventListener('hashchange', () => this.handleRouteChange());
    this.handleRouteChange();
  }

  /**
   * Register a route handler
   * @param {string} pattern - Route pattern (e.g., "/category/:categoryId")
   * @param {Function} handler - Route handler function
   */
  on(pattern, handler) {
    this.routes.set(pattern, handler);
  }

  /**
   * Navigate to a route
   * @param {string} route - Route path
   */
  navigate(route) {
    const hash = route.startsWith('#') ? route : `#${route}`;
    window.location.hash = hash;
  }

  /**
   * Get current route information
   * @returns {Object} Current route, params, and query
   */
  getCurrentRoute() {
    return {
      route: this.currentRoute,
      params: this.currentParams,
      query: this.currentQuery
    };
  }

  /**
   * Parse hash and extract route, params, and query
   * @param {string} hash - Hash string (e.g., "#/category/scarabs?highlight=item1")
   * @returns {Object} Parsed route information
   */
  parseHash(hash) {
    // Remove # if present
    const path = hash.replace(/^#/, '') || '/';
    
    // Split path and query
    const [pathPart, queryPart] = path.split('?');
    const segments = pathPart.split('/').filter(s => s);
    
    // Parse query string
    const query = {};
    if (queryPart) {
      queryPart.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key) {
          query[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
      });
    }
    
    return { segments, query };
  }

  /**
   * Match route pattern against segments
   * @param {string} pattern - Route pattern (e.g., "/category/:categoryId")
   * @param {Array} segments - Path segments
   * @returns {Object|null} Matched params or null
   */
  matchRoute(pattern, segments) {
    const patternSegments = pattern.split('/').filter(s => s);
    
    if (patternSegments.length !== segments.length) {
      return null;
    }
    
    const params = {};
    
    for (let i = 0; i < patternSegments.length; i++) {
      const patternSeg = patternSegments[i];
      const actualSeg = segments[i];
      
      if (patternSeg.startsWith(':')) {
        // Parameter segment
        const paramName = patternSeg.slice(1);
        params[paramName] = actualSeg;
      } else if (patternSeg !== actualSeg) {
        // Static segment doesn't match
        return null;
      }
    }
    
    return params;
  }

  /**
   * Handle route change
   */
  handleRouteChange() {
    const hash = window.location.hash;
    const { segments, query } = this.parseHash(hash);
    
    this.currentQuery = query;
    
    // Try to match routes
    let matched = false;
    for (const [pattern, handler] of this.routes.entries()) {
      const params = this.matchRoute(pattern, segments);
      if (params !== null) {
        this.currentRoute = pattern;
        this.currentParams = params;
        matched = true;
        
        // Call handler
        if (typeof handler === 'function') {
          handler(params, query);
        }
        break;
      }
    }
    
    // If no route matched, try default route
    if (!matched) {
      const defaultRoute = segments.length === 0 ? '/' : `/${segments.join('/')}`;
      const defaultHandler = this.routes.get(defaultRoute);
      if (defaultHandler) {
        this.currentRoute = defaultRoute;
        this.currentParams = {};
        defaultHandler({}, query);
      } else {
        // 404 - no route found
        this.currentRoute = null;
        this.currentParams = {};
        this.handle404();
      }
    }
    
    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Handle 404 - route not found
   */
  handle404() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="error">
          <h1>404 - Page Not Found</h1>
          <p>The requested page could not be found.</p>
          <a href="#/">Return to Homepage</a>
        </div>
      `;
    }
  }

  /**
   * Notify route change listeners
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      listener({
        route: this.currentRoute,
        params: this.currentParams,
        query: this.currentQuery
      });
    });
  }

  /**
   * Add route change listener
   * @param {Function} listener - Listener function
   */
  addListener(listener) {
    this.listeners.push(listener);
  }

  /**
   * Remove route change listener
   * @param {Function} listener - Listener function to remove
   */
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
}

// Export singleton instance
export const router = new Router();

