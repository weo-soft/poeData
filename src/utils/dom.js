/**
 * DOM manipulation helper functions
 */

/**
 * Create an element with optional attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attributes - Attributes to set on the element
 * @param {(string|HTMLElement)[]} children - Child elements or text nodes
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key.startsWith('data-')) {
      element.setAttribute(key, value);
    } else {
      element[key] = value;
    }
  });
  
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof HTMLElement) {
      element.appendChild(child);
    }
  });
  
  return element;
}

/**
 * Clear all children from an element
 * @param {HTMLElement} element - Element to clear
 */
export function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Show an element by removing hidden class
 * @param {HTMLElement} element - Element to show
 */
export function showElement(element) {
  element.classList.remove('hidden');
}

/**
 * Hide an element by adding hidden class
 * @param {HTMLElement} element - Element to hide
 */
export function hideElement(element) {
  element.classList.add('hidden');
}

/**
 * Set loading state on an element
 * @param {HTMLElement} element - Element to set loading state on
 * @param {boolean} isLoading - Whether element is loading
 */
export function setLoadingState(element, isLoading) {
  if (isLoading) {
    element.classList.add('loading');
    element.setAttribute('aria-busy', 'true');
  } else {
    element.classList.remove('loading');
    element.removeAttribute('aria-busy');
  }
}

