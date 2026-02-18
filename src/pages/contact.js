/**
 * Contact page component - Display contact form
 */

import { createElement, clearElement } from '../utils/dom.js';
import { sendContactForm } from '../services/emailService.js';
import { displayError } from '../utils/errors.js';

/**
 * Render contact page
 * @param {HTMLElement} container - Container element to render into
 */
export function renderContact(container) {
  clearElement(container);
  
  // Create main structure
  const contactSection = createElement('section', { className: 'contact' });
  
  const title = createElement('h1', { textContent: 'Contact Us' });
  const description = createElement('p', {
    className: 'contact-description',
    textContent: 'Have a question, suggestion, or feedback? We\'d love to hear from you! Fill out the form below and we\'ll get back to you as soon as possible.'
  });
  
  // Create contact form
  const form = createElement('form', {
    className: 'contact-form',
    id: 'contact-form'
  });
  
  // Name field
  const nameField = createElement('div', { className: 'form-field' });
  const nameLabel = createElement('label', {
    htmlFor: 'contact-name',
    textContent: 'Name'
  });
  const nameInput = createElement('input', {
    type: 'text',
    id: 'contact-name',
    name: 'name',
    placeholder: 'Your name'
  });
  nameField.appendChild(nameLabel);
  nameField.appendChild(nameInput);
  
  // Email field
  const emailField = createElement('div', { className: 'form-field' });
  const emailLabel = createElement('label', {
    htmlFor: 'contact-email',
    textContent: 'Email'
  });
  const emailInput = createElement('input', {
    type: 'email',
    id: 'contact-email',
    name: 'email',
    placeholder: 'your.email@example.com'
  });
  emailField.appendChild(emailLabel);
  emailField.appendChild(emailInput);
  
  // Subject field
  const subjectField = createElement('div', { className: 'form-field' });
  const subjectLabel = createElement('label', {
    htmlFor: 'contact-subject',
    textContent: 'Subject *'
  });
  const subjectInput = createElement('input', {
    type: 'text',
    id: 'contact-subject',
    name: 'subject',
    required: true,
    placeholder: 'What is this regarding?'
  });
  subjectField.appendChild(subjectLabel);
  subjectField.appendChild(subjectInput);
  
  // Message field
  const messageField = createElement('div', { className: 'form-field' });
  const messageLabel = createElement('label', {
    htmlFor: 'contact-message',
    textContent: 'Message *'
  });
  const messageTextarea = createElement('textarea', {
    id: 'contact-message',
    name: 'message',
    required: true,
    rows: 8,
    placeholder: 'Your message...'
  });
  messageField.appendChild(messageLabel);
  messageField.appendChild(messageTextarea);
  
  // Submit button
  const submitButton = createElement('button', {
    type: 'submit',
    className: 'btn-primary',
    textContent: 'Send Message'
  });
  
  // Messages container
  const messagesContainer = createElement('div', {
    className: 'contact-messages',
    id: 'contact-messages'
  });
  
  // Assemble form
  form.appendChild(nameField);
  form.appendChild(emailField);
  form.appendChild(subjectField);
  form.appendChild(messageField);
  form.appendChild(submitButton);
  
  // Assemble section
  contactSection.appendChild(title);
  contactSection.appendChild(description);
  contactSection.appendChild(form);
  contactSection.appendChild(messagesContainer);
  
  container.appendChild(contactSection);
  
  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    clearElement(messagesContainer);
    
    // Get form data
    const formData = new FormData(form);
    const contactData = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message')
    };
    
    // Disable submit button
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    
    try {
      const response = await sendContactForm(contactData);
      
      // Show success message
      const successMessage = createElement('div', {
        className: 'success-message',
        textContent: 'Thank you! Your message has been sent successfully. We\'ll get back to you soon.'
      });
      messagesContainer.appendChild(successMessage);
      
      // Reset form
      form.reset();
    } catch (error) {
      // Show error message
      displayError(messagesContainer, `Failed to send message: ${error.message}`);
    } finally {
      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.textContent = 'Send Message';
    }
  });
}
