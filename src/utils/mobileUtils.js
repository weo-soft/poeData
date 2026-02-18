/**
 * Mobile utility functions for responsive design
 * Provides helpers for touch detection, viewport management, and mobile-specific interactions
 */

/**
 * Detect if device supports touch input
 * @returns {boolean} True if touch is supported
 */
export function isTouchDevice() {
  return 'ontouchstart' in window || 
         navigator.maxTouchPoints > 0 || 
         (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0);
}

/**
 * Get current viewport dimensions
 * @returns {{width: number, height: number}} Viewport dimensions
 */
export function getViewportDimensions() {
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight
  };
}

/**
 * Check if current viewport is mobile size (< 768px)
 * @returns {boolean} True if viewport width is less than 768px
 */
export function isMobileViewport() {
  return getViewportDimensions().width < 768;
}

/**
 * Check if current viewport is tablet size (768px - 1023px)
 * @returns {boolean} True if viewport width is between 768px and 1023px
 */
export function isTabletViewport() {
  const width = getViewportDimensions().width;
  return width >= 768 && width < 1024;
}

/**
 * Check if current viewport is desktop size (>= 1024px)
 * @returns {boolean} True if viewport width is 1024px or greater
 */
export function isDesktopViewport() {
  return getViewportDimensions().width >= 1024;
}

/**
 * Handle orientation change events
 * @param {Function} callback - Callback function when orientation changes
 * @returns {Function} Cleanup function to remove event listeners
 */
export function onOrientationChange(callback) {
  const handleChange = () => {
    // Small delay to ensure viewport has updated
    setTimeout(callback, 100);
  };
  
  window.addEventListener('orientationchange', handleChange);
  window.addEventListener('resize', handleChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('orientationchange', handleChange);
    window.removeEventListener('resize', handleChange);
  };
}

/**
 * Get device pixel ratio for high-DPI displays
 * @returns {number} Device pixel ratio
 */
export function getDevicePixelRatio() {
  return window.devicePixelRatio || 1;
}

/**
 * Check if device has high-DPI display
 * @returns {boolean} True if device pixel ratio is greater than 1
 */
export function isHighDPIDisplay() {
  return getDevicePixelRatio() > 1;
}
