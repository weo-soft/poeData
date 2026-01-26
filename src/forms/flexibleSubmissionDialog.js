/**
 * Flexible dataset submission dialog component
 * Allows users to submit datasets via file upload or link submission
 */

import { createElement } from '../utils/dom.js';
import { sendFlexibleSubmission } from '../services/emailService.js';
import { 
  validateFile, 
  getFileMetadata, 
  readFileAsText,
  validateUrl,
  detectLinkType,
  validateDescription
} from '../utils/fileValidation.js';

/**
 * Flexible submission dialog component
 */
export class FlexibleSubmissionDialog {
  /**
   * Create a FlexibleSubmissionDialog instance
   */
  constructor() {
    // Component state
    this.method = null; // 'file' | 'link' | null
    this.description = '';
    this.file = null;
    this.fileContent = null;
    this.fileError = null;
    this.url = '';
    this.urlError = null;
    this.descriptionError = null;
    this.isSubmitting = false;
    this.submissionResult = null;
    this.isOpen = false;
    
    // DOM references
    this.overlay = null;
    this.backdrop = null;
    this.content = null;
  }

  /**
   * Open the dialog overlay
   */
  open() {
    if (this.isOpen) {
      return;
    }

    this.isOpen = true;
    this.render();
    document.body.appendChild(this.overlay);
    
    // Focus management
    const firstInput = this.content.querySelector('button, input, textarea');
    if (firstInput) {
      firstInput.focus();
    }
  }

  /**
   * Close the dialog overlay
   */
  close() {
    if (!this.isOpen) {
      return;
    }

    if (this.overlay && this.overlay.parentNode) {
      this.overlay.remove();
    }
    
    this.isOpen = false;
    this.reset();
  }

  /**
   * Reset dialog state
   */
  reset() {
    this.method = null;
    this.description = '';
    this.file = null;
    this.fileContent = null;
    this.fileError = null;
    this.url = '';
    this.urlError = null;
    this.descriptionError = null;
    this.isSubmitting = false;
    this.submissionResult = null;
    this.overlay = null;
    this.backdrop = null;
    this.content = null;
  }

  /**
   * Render the dialog
   */
  render() {
    // Create overlay structure (reusing datasets-overlay pattern)
    this.overlay = createElement('div', { 
      className: 'datasets-overlay flexible-submission-overlay',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'flexible-submission-dialog-title'
    });
    this.backdrop = createElement('div', { 
      className: 'datasets-overlay-backdrop',
      'aria-hidden': 'true'
    });
    this.content = createElement('div', { 
      className: 'datasets-overlay-content flexible-submission-content',
      role: 'document'
    });

    // Header
    const header = this.renderHeader();
    this.content.appendChild(header);

    // Body
    const body = this.renderBody();
    this.content.appendChild(body);

    // Footer
    const footer = this.renderFooter();
    this.content.appendChild(footer);

    // Assemble overlay
    this.overlay.appendChild(this.backdrop);
    this.overlay.appendChild(this.content);

    // Event listeners
    this.backdrop.addEventListener('click', () => {
      if (!this.isSubmitting) {
        // Check if there's data entered
        const hasData = (this.method === 'file' && this.file) || 
                       (this.method === 'link' && this.url.trim()) || 
                       this.description.trim();
        
        if (hasData) {
          // Could add confirmation dialog here, but for now just close
          // User can reopen and data will be lost (acceptable for MVP)
        }
        this.close();
      }
    });

    // Keyboard handlers
    const escHandler = (e) => {
      if (e.key === 'Escape' && this.isOpen && !this.isSubmitting) {
        this.close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // Enter key to submit (when form is valid)
    const enterHandler = (e) => {
      if (e.key === 'Enter' && e.ctrlKey && this.isOpen && this.canSubmit() && !this.isSubmitting) {
        e.preventDefault();
        this.handleSubmit();
      }
    };
    document.addEventListener('keydown', enterHandler);
  }

  /**
   * Render dialog header
   * @returns {HTMLElement} Header element
   */
  renderHeader() {
    const header = createElement('div', { className: 'datasets-overlay-header' });
    const title = createElement('h2', {
      textContent: 'File/Link Submission',
      className: 'datasets-overlay-title',
      id: 'flexible-submission-dialog-title'
    });
    const closeButton = createElement('button', {
      className: 'datasets-overlay-close',
      textContent: '×',
      title: 'Close',
      'aria-label': 'Close dialog',
      type: 'button'
    });

    closeButton.addEventListener('click', () => {
      if (!this.isSubmitting) {
        this.close();
      }
    });

    header.appendChild(title);
    header.appendChild(closeButton);
    return header;
  }

  /**
   * Render dialog body
   * @returns {HTMLElement} Body element
   */
  renderBody() {
    const body = createElement('div', { className: 'datasets-overlay-body flexible-submission-body' });

    // Method selection (if no method selected)
    if (!this.method) {
      const methodSelection = this.renderMethodSelection();
      body.appendChild(methodSelection);
    } else {
      // Method-specific content
      if (this.method === 'file') {
        const fileSection = this.renderFileSection();
        body.appendChild(fileSection);
      } else if (this.method === 'link') {
        const linkSection = this.renderLinkSection();
        body.appendChild(linkSection);
      }

      // Description section (always visible after method selection)
      const descriptionSection = this.renderDescriptionSection();
      body.appendChild(descriptionSection);
    }

    // Loading indicator
    if (this.isSubmitting) {
      const loadingContainer = createElement('div', {
        className: 'flexible-submission-loading',
        'aria-live': 'polite',
        'aria-busy': 'true',
        textContent: 'Processing submission...'
      });
      body.appendChild(loadingContainer);
    }

    // Error display
    if (this.fileError || this.urlError || this.descriptionError) {
      const errorContainer = this.renderErrors();
      body.appendChild(errorContainer);
    }

    // Success/Submission result
    if (this.submissionResult) {
      const resultContainer = this.renderSubmissionResult();
      body.appendChild(resultContainer);
    }

    return body;
  }

  /**
   * Render method selection UI
   * @returns {HTMLElement} Method selection element
   */
  renderMethodSelection() {
    const container = createElement('div', { className: 'flexible-submission-method-selection' });
    
    const title = createElement('h3', {
      textContent: 'Choose Submission Method',
      className: 'flexible-submission-section-title'
    });
    container.appendChild(title);

    const methodsContainer = createElement('div', { className: 'flexible-submission-methods' });

    // File upload option
    const fileOption = createElement('button', {
      className: 'flexible-submission-method-button',
      'data-method': 'file',
      type: 'button'
    });
    const fileIcon = createElement('div', { className: 'flexible-submission-method-icon', textContent: '📁' });
    const fileLabel = createElement('div', { className: 'flexible-submission-method-label', textContent: 'Upload File' });
    const fileDesc = createElement('div', { 
      className: 'flexible-submission-method-description', 
      textContent: 'Upload a JSON, CSV, or TXT file containing your dataset data' 
    });
    fileOption.appendChild(fileIcon);
    fileOption.appendChild(fileLabel);
    fileOption.appendChild(fileDesc);
    fileOption.addEventListener('click', () => this.selectMethod('file'));

    // Link submission option
    const linkOption = createElement('button', {
      className: 'flexible-submission-method-button',
      'data-method': 'link',
      type: 'button'
    });
    const linkIcon = createElement('div', { className: 'flexible-submission-method-icon', textContent: '🔗' });
    const linkLabel = createElement('div', { className: 'flexible-submission-method-label', textContent: 'Submit Link' });
    const linkDesc = createElement('div', { 
      className: 'flexible-submission-method-description', 
      textContent: 'Provide a link to your dataset (Google Sheets, Discord, etc.)' 
    });
    linkOption.appendChild(linkIcon);
    linkOption.appendChild(linkLabel);
    linkOption.appendChild(linkDesc);
    linkOption.addEventListener('click', () => this.selectMethod('link'));

    methodsContainer.appendChild(fileOption);
    methodsContainer.appendChild(linkOption);
    container.appendChild(methodsContainer);

    return container;
  }

  /**
   * Select submission method
   * @param {string} method - 'file' or 'link'
   */
  selectMethod(method) {
    if (method !== 'file' && method !== 'link') {
      return;
    }

    this.method = method;
    
    // Clear method-specific errors when switching
    if (method === 'file') {
      this.url = '';
      this.urlError = null;
    } else {
      this.file = null;
      this.fileContent = null;
      this.fileError = null;
    }

    // Re-render to show method-specific UI
    this.updateBody();
  }

  /**
   * Update dialog body (re-render body content)
   */
  updateBody() {
    if (!this.content) {
      return;
    }

    const oldBody = this.content.querySelector('.flexible-submission-body');
    const footer = this.content.querySelector('.flexible-submission-footer');
    
    if (oldBody) {
      const newBody = this.renderBody();
      oldBody.parentNode.replaceChild(newBody, oldBody);
    }
    
    // Update footer to reflect current state
    if (footer) {
      const newFooter = this.renderFooter();
      footer.parentNode.replaceChild(newFooter, footer);
    }
  }

  /**
   * Render file upload section
   * @returns {HTMLElement} File section element
   */
  renderFileSection() {
    const container = createElement('div', { className: 'flexible-submission-file-section' });
    
    const title = createElement('h3', {
      textContent: 'File Upload',
      className: 'flexible-submission-section-title'
    });
    container.appendChild(title);

    // Method switcher
    const switchContainer = createElement('div', { className: 'flexible-submission-method-switcher' });
    const switchButton = createElement('button', {
      className: 'flexible-submission-switch-method',
      textContent: 'Switch to Link Submission',
      type: 'button'
    });
    switchButton.addEventListener('click', () => this.selectMethod('link'));
    switchContainer.appendChild(switchButton);
    container.appendChild(switchContainer);

    // File input
    const fileInputContainer = createElement('div', { className: 'flexible-submission-file-input-container' });
    const fileInput = createElement('input', {
      type: 'file',
      id: 'flexible-file-input',
      accept: '.json,.csv,.txt',
      className: 'flexible-submission-file-input',
      'aria-label': 'Select dataset file'
    });
    fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    
    const fileLabel = createElement('label', {
      htmlFor: 'flexible-file-input',
      className: 'flexible-submission-file-label',
      textContent: 'Choose File',
      'aria-label': 'Select dataset file (JSON, CSV, or TXT)'
    });

    fileInputContainer.appendChild(fileInput);
    fileInputContainer.appendChild(fileLabel);
    container.appendChild(fileInputContainer);

    // File info display
    if (this.file && !this.fileError) {
      const fileInfo = this.renderFileInfo();
      container.appendChild(fileInfo);
    }

    // Guidance text
    const guidance = createElement('div', { className: 'flexible-submission-guidance' });
    guidance.innerHTML = '<p>Supported formats: JSON, CSV, TXT</p><p>Maximum file size: 10MB</p>';
    container.appendChild(guidance);

    return container;
  }

  /**
   * Render link submission section
   * @returns {HTMLElement} Link section element
   */
  renderLinkSection() {
    const container = createElement('div', { className: 'flexible-submission-link-section' });
    
    const title = createElement('h3', {
      textContent: 'Link Submission',
      className: 'flexible-submission-section-title'
    });
    container.appendChild(title);

    // Method switcher
    const switchContainer = createElement('div', { className: 'flexible-submission-method-switcher' });
    const switchButton = createElement('button', {
      className: 'flexible-submission-switch-method',
      textContent: 'Switch to File Upload',
      type: 'button'
    });
    switchButton.addEventListener('click', () => this.selectMethod('file'));
    switchContainer.appendChild(switchButton);
    container.appendChild(switchContainer);

    // URL input
    const urlInputContainer = createElement('div', { className: 'flexible-submission-url-input-container' });
    const urlLabel = createElement('label', {
      htmlFor: 'flexible-url-input',
      textContent: 'Dataset URL'
    });
    const urlInput = createElement('input', {
      type: 'url',
      id: 'flexible-url-input',
      className: 'flexible-submission-url-input',
      placeholder: 'https://docs.google.com/spreadsheets/...',
      value: this.url,
      'aria-label': 'Dataset URL',
      'aria-describedby': this.urlError ? 'flexible-url-error' : undefined,
      'aria-invalid': this.urlError ? 'true' : 'false',
      inputmode: 'url'
    });
    urlInput.addEventListener('input', (e) => {
      this.url = e.target.value;
      this.urlError = null;
    });
    urlInput.addEventListener('blur', () => {
      if (this.url.trim()) {
        const validation = validateUrl(this.url);
        if (!validation.isValid) {
          this.urlError = validation.error;
          this.updateBody();
        }
      }
    });

    urlInputContainer.appendChild(urlLabel);
    urlInputContainer.appendChild(urlInput);
    container.appendChild(urlInputContainer);

    // Link type detection display
    if (this.url && !this.urlError) {
      const linkType = detectLinkType(this.url);
      if (linkType) {
        const linkTypeDisplay = createElement('div', {
          className: 'flexible-submission-link-type',
          textContent: `Detected: ${linkType}`
        });
        container.appendChild(linkTypeDisplay);
      }
    }

    // Guidance text
    const guidance = createElement('div', { className: 'flexible-submission-guidance' });
    guidance.innerHTML = '<p>Provide a link to your dataset (Google Sheets, Discord, screenshots, etc.)</p>';
    container.appendChild(guidance);

    return container;
  }

  /**
   * Render description section
   * @returns {HTMLElement} Description section element
   */
  renderDescriptionSection() {
    const container = createElement('div', { className: 'flexible-submission-description-section' });
    
    const title = createElement('h3', {
      textContent: 'Description (Optional)',
      className: 'flexible-submission-section-title'
    });
    container.appendChild(title);

    const textareaContainer = createElement('div', { className: 'flexible-submission-description-container' });
    const textarea = createElement('textarea', {
      id: 'flexible-description-input',
      className: 'flexible-submission-description-input',
      placeholder: 'Describe your dataset, how it was collected, or any special notes...',
      rows: 4,
      maxLength: 5000,
      value: this.description,
      'aria-label': 'Dataset description (optional)',
      'aria-describedby': 'flexible-description-char-count' + (this.descriptionError ? ' flexible-description-error' : '')
    });
    textarea.addEventListener('input', (e) => {
      this.description = e.target.value;
      this.descriptionError = null;
      
      // Update character count
      const charCount = this.content.querySelector('.flexible-submission-char-count');
      if (charCount) {
        const remaining = 5000 - this.description.length;
        charCount.textContent = `${this.description.length}/5000 characters`;
        if (remaining < 100) {
          charCount.classList.add('warning');
        } else {
          charCount.classList.remove('warning');
        }
      }
    });

    const charCount = createElement('div', {
      className: 'flexible-submission-char-count',
      id: 'flexible-description-char-count',
      textContent: `${this.description.length}/5000 characters`,
      'aria-live': 'polite'
    });

    textareaContainer.appendChild(textarea);
    textareaContainer.appendChild(charCount);
    container.appendChild(textareaContainer);

    return container;
  }

  /**
   * Handle file selection
   * @param {Event} e - File input change event
   */
  async handleFileSelect(e) {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      return;
    }

    this.file = selectedFile;
    this.fileError = null;

    // Validate file
    const validation = validateFile(selectedFile);
    if (!validation.isValid) {
      this.fileError = validation.error;
      this.updateBody();
      return;
    }

    // Read file content
    try {
      this.fileContent = await readFileAsText(selectedFile);
      this.updateBody();
    } catch (error) {
      this.fileError = `Failed to read file: ${error.message}`;
      this.updateBody();
    }
  }

  /**
   * Render file information display
   * @returns {HTMLElement} File info element
   */
  renderFileInfo() {
    if (!this.file) {
      return createElement('div');
    }

    const metadata = getFileMetadata(this.file);
    const container = createElement('div', { className: 'flexible-submission-file-info' });
    
    const fileName = createElement('div', { 
      className: 'flexible-submission-file-name',
      textContent: `File: ${metadata.name}`
    });
    const fileSize = createElement('div', {
      className: 'flexible-submission-file-size',
      textContent: `Size: ${formatFileSize(metadata.size)}`
    });
    const fileType = createElement('div', {
      className: 'flexible-submission-file-type',
      textContent: `Type: ${metadata.type || 'Unknown'}`
    });

    container.appendChild(fileName);
    container.appendChild(fileSize);
    container.appendChild(fileType);

    return container;
  }

  /**
   * Render error messages
   * @returns {HTMLElement} Error container element
   */
  renderErrors() {
    const container = createElement('div', { className: 'flexible-submission-errors' });
    
    if (this.fileError) {
      const error = createErrorElement(this.fileError, 'flexible-file-error');
      container.appendChild(error);
    }
    
    if (this.urlError) {
      const error = createErrorElement(this.urlError, 'flexible-url-error');
      container.appendChild(error);
    }
    
    if (this.descriptionError) {
      const error = createErrorElement(this.descriptionError, 'flexible-description-error');
      container.appendChild(error);
    }

    return container;
  }

  /**
   * Render submission result
   * @returns {HTMLElement} Result container element
   */
  renderSubmissionResult() {
    const container = createElement('div', { className: 'flexible-submission-result' });
    
    if (this.submissionResult.success) {
      const success = createElement('div', {
        className: 'flexible-submission-success',
        textContent: 'Submission sent successfully! Thank you for your contribution.'
      });
      container.appendChild(success);
      
      // Add close button after successful submission
      const closeButton = createElement('button', {
        className: 'btn btn-primary flexible-submission-close-success',
        textContent: 'Close',
        type: 'button'
      });
      closeButton.addEventListener('click', () => {
        this.close();
      });
      container.appendChild(closeButton);
    } else {
      const error = createErrorElement(this.submissionResult.error || 'Submission failed');
      container.appendChild(error);
      
      // Add retry button if submission failed
      const retryButton = createElement('button', {
        className: 'btn btn-primary flexible-submission-retry',
        textContent: 'Retry Submission',
        type: 'button'
      });
      retryButton.addEventListener('click', () => {
        this.submissionResult = null;
        this.isSubmitting = false;
        this.updateBody();
      });
      container.appendChild(retryButton);
    }

    return container;
  }

  /**
   * Render dialog footer
   * @returns {HTMLElement} Footer element
   */
  renderFooter() {
    const footer = createElement('div', { className: 'datasets-overlay-footer flexible-submission-footer' });
    
    const buttonContainer = createElement('div', { className: 'flexible-submission-buttons' });

    const cancelButton = createElement('button', {
      className: 'btn btn-secondary flexible-submission-cancel',
      textContent: 'Cancel',
      type: 'button',
      disabled: this.isSubmitting
    });
    cancelButton.addEventListener('click', () => {
      if (!this.isSubmitting) {
        this.close();
      }
    });

    const submitButton = createElement('button', {
      className: 'btn btn-primary flexible-submission-submit',
      textContent: this.isSubmitting ? 'Submitting...' : 'Submit',
      type: 'button',
      disabled: this.isSubmitting || !this.canSubmit(),
      'aria-label': 'Submit file/link submission'
    });
    submitButton.addEventListener('click', () => this.handleSubmit());

    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(submitButton);
    footer.appendChild(buttonContainer);

    return footer;
  }

  /**
   * Check if form can be submitted
   * @returns {boolean} True if submission is allowed
   */
  canSubmit() {
    if (!this.method) {
      return false;
    }

    if (this.method === 'file') {
      return !!(this.file && this.fileContent && !this.fileError);
    } else {
      return !!(this.url.trim() && !this.urlError);
    }
  }

  /**
   * Handle form submission
   */
  async handleSubmit() {
    if (!this.canSubmit() || this.isSubmitting) {
      return;
    }

    // Validate description
    const descValidation = validateDescription(this.description);
    if (!descValidation.isValid) {
      this.descriptionError = descValidation.error;
      this.updateBody();
      return;
    }

    this.isSubmitting = true;
    this.updateBody();

    try {
      let submissionData;

      if (this.method === 'file') {
        const metadata = getFileMetadata(this.file);
        submissionData = {
          method: 'file',
          dataSource: this.fileContent,
          description: this.description.trim() || undefined,
          fileMetadata: metadata
        };
      } else {
        const linkType = detectLinkType(this.url);
        submissionData = {
          method: 'link',
          dataSource: this.url.trim(),
          description: this.description.trim() || undefined,
          linkMetadata: {
            url: this.url.trim(),
            detectedType: linkType || undefined
          }
        };
      }

      const result = await sendFlexibleSubmission(submissionData);
      this.submissionResult = {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      this.submissionResult = {
        success: false,
        error: error.message || 'Failed to send submission'
      };
    } finally {
      this.isSubmitting = false;
      this.updateBody();
    }
  }
}

/**
 * Create error element
 * @param {string} message - Error message
 * @param {string} [id] - Optional ID for the error element
 * @returns {HTMLElement} Error element
 */
function createErrorElement(message, id) {
  const element = createElement('div', {
    className: 'error flexible-submission-error',
    textContent: message,
    role: 'alert',
    'aria-live': 'assertive'
  });
  if (id) {
    element.id = id;
  }
  return element;
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
