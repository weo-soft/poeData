/**
 * Chart.js wrapper for statistics charts
 */

/**
 * Generate category statistics charts
 * @param {HTMLElement} container - Container element to render charts into
 * @param {Array} items - Array of item objects
 * @param {string} _categoryId - Category identifier (reserved for future chart types)
 */
export function generateCategoryCharts(container, items, _categoryId) {
  // Clear container
  container.innerHTML = '';

  if (items.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'No items to display charts for.';
    emptyMessage.className = 'empty-message';
    container.appendChild(emptyMessage);
    return;
  }

  // Drop weight distribution chart removed from all category views
}
