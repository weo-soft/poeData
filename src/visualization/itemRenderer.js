/**
 * Item detail rendering utilities
 */

import { createElement } from '../utils/dom.js';
import { renderDivinationCard } from './divinationCardRenderer.js';

/**
 * Render item details
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} item - Item object
 * @param {string} categoryId - Category identifier
 */
export async function renderItemDetails(container, item, categoryId) {
  // For divination cards, render card and base attributes side-by-side
  if (categoryId === 'divination-cards') {
    // Create wrapper container for side-by-side layout
    const sideBySideContainer = createElement('div', {
      className: 'divination-card-side-by-side'
    });
    sideBySideContainer.style.cssText = 'display: flex; gap: 2rem; align-items: flex-start; margin: 2rem 0; flex-wrap: wrap;';
    
    // Card container
    const cardContainer = createElement('div', {
      className: 'divination-card-container'
    });
    cardContainer.style.cssText = 'display: flex; justify-content: flex-start; align-items: flex-start; padding: 0; margin: 0; flex-shrink: 0;';
    await renderDivinationCard(cardContainer, item, {
      width: 300,
      responsive: false
    });
    sideBySideContainer.appendChild(cardContainer);
    
    // Base attributes section
    const baseSection = createElement('div', { 
      className: 'item-section base-attributes'
    });
    baseSection.style.cssText = 'flex: 1; min-width: 300px; margin: 0; padding: 1.5rem; padding-top: 0; align-self: flex-start;';
    const baseTitle = createElement('h2', { 
      textContent: 'Base Attributes'
    });
    baseTitle.style.cssText = 'margin-top: 0;';
    baseSection.appendChild(baseTitle);
    
    const baseList = createElement('dl', { className: 'attribute-list' });
    
    // Add base attributes only if they exist
    if (item.id) {
      addAttribute(baseList, 'ID', item.id);
    }
    if (item.name) {
      addAttribute(baseList, 'Name', item.name);
    }
    if (item.dropLevel !== undefined && item.dropLevel !== null) {
      addAttribute(baseList, 'Drop Level', item.dropLevel);
    }
    if (item.dropWeight !== undefined && item.dropWeight !== null) {
      addAttribute(baseList, 'Drop Weight', item.dropWeight);
    }
    
    baseSection.appendChild(baseList);
    sideBySideContainer.appendChild(baseSection);
    
    container.appendChild(sideBySideContainer);
  } else {
    // For other categories, render base attributes normally
    const baseSection = createElement('div', { className: 'item-section base-attributes' });
    const baseTitle = createElement('h2', { textContent: 'Base Attributes' });
    baseSection.appendChild(baseTitle);
    
    const baseList = createElement('dl', { className: 'attribute-list' });
    
    // Add base attributes only if they exist
    if (item.id) {
      addAttribute(baseList, 'ID', item.id);
    }
    if (item.name) {
      addAttribute(baseList, 'Name', item.name);
    }
    if (item.dropLevel !== undefined && item.dropLevel !== null) {
      addAttribute(baseList, 'Drop Level', item.dropLevel);
    }
    if (item.dropWeight !== undefined && item.dropWeight !== null) {
      addAttribute(baseList, 'Drop Weight', item.dropWeight);
    }
    
    baseSection.appendChild(baseList);
    container.appendChild(baseSection);
  }
  
  // Category-specific attributes
  if (categoryId === 'scarabs') {
    renderScarabAttributes(container, item);
  } else if (categoryId === 'divination-cards') {
    renderDivinationCardAttributes(container, item);
  } else {
    // Generic rendering for new categories and unknown attributes
    renderGenericAttributes(container, item, categoryId);
  }
}

/**
 * Add attribute to definition list
 * @param {HTMLElement} dl - Definition list element
 * @param {string} term - Term (dt)
 * @param {*} value - Value (dd)
 */
function addAttribute(dl, term, value) {
  const dt = createElement('dt', { textContent: term });
  const dd = createElement('dd', { textContent: String(value) });
  dl.appendChild(dt);
  dl.appendChild(dd);
}

/**
 * Render scarab-specific attributes
 * @param {HTMLElement} container - Container element
 * @param {Object} item - Item object
 */
function renderScarabAttributes(container, item) {
  const section = createElement('div', { className: 'item-section scarab-attributes' });
  const title = createElement('h2', { textContent: 'Scarab Attributes' });
  section.appendChild(title);
  
  const list = createElement('dl', { className: 'attribute-list' });
  
  if (item.dropEnabledd !== undefined) {
    addAttribute(list, 'Drop Enabled', item.dropEnabledd ? 'Yes' : 'No');
  }
  if (item.limit !== undefined) {
    addAttribute(list, 'Limit', item.limit);
  }
  if (item.description) {
    const dt = createElement('dt', { textContent: 'Description' });
    const dd = createElement('dd', { 
      textContent: item.description,
      className: 'description-text'
    });
    list.appendChild(dt);
    list.appendChild(dd);
  }
  
  section.appendChild(list);
  container.appendChild(section);
}

/**
 * Render divination card-specific attributes
 * @param {HTMLElement} container - Container element
 * @param {Object} item - Item object
 */
function renderDivinationCardAttributes(container, item) {
  const section = createElement('div', { className: 'item-section divination-card-attributes' });
  const title = createElement('h2', { textContent: 'Divination Card Attributes' });
  section.appendChild(title);
  
  const list = createElement('dl', { className: 'attribute-list' });
  
  if (item.stackSize !== undefined) {
    addAttribute(list, 'Stack Size', item.stackSize);
  }
  if (item.dropAreas && item.dropAreas.length > 0) {
    const dt = createElement('dt', { textContent: 'Drop Areas' });
    const dd = createElement('dd');
    const areasList = createElement('ul');
    item.dropAreas.forEach(area => {
      const li = createElement('li', { textContent: area });
      areasList.appendChild(li);
    });
    dd.appendChild(areasList);
    list.appendChild(dt);
    list.appendChild(dd);
  }
  if (item.dropMonsters && item.dropMonsters.length > 0) {
    const dt = createElement('dt', { textContent: 'Drop Monsters' });
    const dd = createElement('dd');
    const monstersList = createElement('ul');
    item.dropMonsters.forEach(monster => {
      const li = createElement('li', { textContent: monster });
      monstersList.appendChild(li);
    });
    dd.appendChild(monstersList);
    list.appendChild(dt);
    list.appendChild(dd);
  }
  if (item.explicitModifiers && item.explicitModifiers.length > 0) {
    const dt = createElement('dt', { textContent: 'Explicit Modifiers' });
    const dd = createElement('dd');
    const modifiersList = createElement('ul', { className: 'modifiers-list' });
    item.explicitModifiers.forEach(modifier => {
      const li = createElement('li', { 
        textContent: modifier.text,
        className: modifier.optional ? 'optional-modifier' : ''
      });
      modifiersList.appendChild(li);
    });
    dd.appendChild(modifiersList);
    list.appendChild(dt);
    list.appendChild(dd);
  }
  if (item.flavourText) {
    const dt = createElement('dt', { textContent: 'Flavour Text' });
    const dd = createElement('dd', { 
      textContent: item.flavourText,
      className: 'flavour-text'
    });
    list.appendChild(dt);
    list.appendChild(dd);
  }
  
  section.appendChild(list);
  container.appendChild(section);
}

/**
 * Render generic attributes for new categories or unknown category-specific attributes
 * Displays all attributes that are not base attributes
 * @param {HTMLElement} container - Container element
 * @param {Object} item - Item object
 * @param {string} categoryId - Category identifier
 */
function renderGenericAttributes(container, item, categoryId) {
  // Base attributes that should not be shown again
  const baseAttributes = ['id', 'name', 'dropLevel', 'dropWeight', 'icon'];
  
  // Get all item keys and filter out base attributes
  const categorySpecificKeys = Object.keys(item).filter(key => !baseAttributes.includes(key));
  
  // If there are category-specific attributes, render them
  if (categorySpecificKeys.length > 0) {
    const section = createElement('div', { className: 'item-section category-attributes' });
    const categoryName = formatCategoryName(categoryId);
    const title = createElement('h2', { textContent: `${categoryName} Attributes` });
    section.appendChild(title);
    
    const list = createElement('dl', { className: 'attribute-list' });
    
    categorySpecificKeys.forEach(key => {
      const value = item[key];
      if (value !== undefined && value !== null) {
        // Format key name (camelCase to Title Case)
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();
        
        if (Array.isArray(value)) {
          // Handle array values
          const dt = createElement('dt', { textContent: formattedKey });
          const dd = createElement('dd');
          if (value.length > 0) {
            const valueList = createElement('ul');
            value.forEach(val => {
              const li = createElement('li', { textContent: String(val) });
              valueList.appendChild(li);
            });
            dd.appendChild(valueList);
          } else {
            dd.textContent = 'None';
          }
          list.appendChild(dt);
          list.appendChild(dd);
        } else if (typeof value === 'object') {
          // Handle object values (render as JSON-like string)
          const dt = createElement('dt', { textContent: formattedKey });
          const dd = createElement('dd', { 
            textContent: JSON.stringify(value, null, 2),
            className: 'json-value'
          });
          list.appendChild(dt);
          list.appendChild(dd);
        } else if (typeof value === 'boolean') {
          // Handle boolean values
          addAttribute(list, formattedKey, value ? 'Yes' : 'No');
        } else {
          // Handle primitive values
          addAttribute(list, formattedKey, String(value));
        }
      }
    });
    
    section.appendChild(list);
    container.appendChild(section);
  }
}

/**
 * Format category name for display
 * @param {string} categoryId - Category identifier
 * @returns {string} Formatted name
 */
function formatCategoryName(categoryId) {
  return categoryId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

