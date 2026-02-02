/**
 * Homepage component - Display welcome message and category overview
 */

import { createElement, clearElement } from '../utils/dom.js';
import { renderCategoryCards } from '../components/categoryCards.js';

/**
 * Render homepage
 * @param {HTMLElement} container - Container element to render into
 */
export async function renderHome(container) {
  clearElement(container);

  const homeSection = createElement('section', { className: 'home' });

  await renderCategoryCards(homeSection);

  const welcomeTitle = createElement('h1', { textContent: 'Welcome to PoeData.dev' });
  const welcomeText = createElement('div', { className: 'welcome-text' });
  
  const paragraph1 = createElement('p', {
    textContent: 'PoeData.dev is a community-driven project dedicated to collecting and sharing data on item drop weightings and probabilities in Path of Exile.'
  });
  
  const paragraph2 = createElement('p', {
    textContent: 'The goal is to provide a consistent, transparent, and easy-to-use source of information for players, theorycrafters, and tool developers. By combining community contributions with structured data analysis.'
  });
  
  const paragraph3 = createElement('p', {
    textContent: 'Whether you\'re here to explore the data or help expand it, your participation helps make the project more accurate and valuable for everyone.'
  });
  
  welcomeText.appendChild(paragraph1);
  welcomeText.appendChild(paragraph2);
  welcomeText.appendChild(paragraph3);
  
  homeSection.appendChild(welcomeTitle);
  homeSection.appendChild(welcomeText);
  
  container.appendChild(homeSection);
}
