/**
 * EmailJS integration service for form submissions
 */

import emailjs from '@emailjs/browser';

// Initialize EmailJS with public key from environment
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Template IDs - use specific ones if provided, otherwise fall back to a single template ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_TEMPLATE_ID_FORM = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_FORM || EMAILJS_TEMPLATE_ID;
const EMAILJS_TEMPLATE_ID_IMPORT = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_IMPORT || EMAILJS_TEMPLATE_ID;
const EMAILJS_TEMPLATE_ID_DATASET = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_DATASET || EMAILJS_TEMPLATE_ID;
const EMAILJS_TEMPLATE_ID_FLEXIBLE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_FLEXIBLE || EMAILJS_TEMPLATE_ID;

// Initialize EmailJS if public key is available
if (EMAILJS_PUBLIC_KEY) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

/**
 * Check if EmailJS is configured
 * @returns {boolean} True if EmailJS is configured
 */
export function isEmailJSConfigured() {
  return !!(EMAILJS_SERVICE_ID && EMAILJS_PUBLIC_KEY && EMAILJS_TEMPLATE_ID);
}

/**
 * Get detailed configuration status for debugging
 * @returns {Object} Configuration status with missing variables
 */
export function getEmailJSConfigStatus() {
  const missing = [];
  if (!EMAILJS_SERVICE_ID) missing.push('VITE_EMAILJS_SERVICE_ID');
  if (!EMAILJS_PUBLIC_KEY) missing.push('VITE_EMAILJS_PUBLIC_KEY');
  if (!EMAILJS_TEMPLATE_ID) missing.push('VITE_EMAILJS_TEMPLATE_ID');
  
  return {
    isConfigured: missing.length === 0,
    missing,
    present: {
      serviceId: !!EMAILJS_SERVICE_ID,
      publicKey: !!EMAILJS_PUBLIC_KEY,
      templateId: !!EMAILJS_TEMPLATE_ID,
      templateForm: !!EMAILJS_TEMPLATE_ID_FORM,
      templateImport: !!EMAILJS_TEMPLATE_ID_IMPORT,
      templateDataset: !!EMAILJS_TEMPLATE_ID_DATASET,
      templateFlexible: !!EMAILJS_TEMPLATE_ID_FLEXIBLE
    }
  };
}

/**
 * Send guided form submission via EmailJS
 * @param {Object} submissionData - Submission data
 * @param {string} submissionData.categoryId - Category identifier
 * @param {string} submissionData.itemId - Item identifier
 * @param {string} submissionData.itemName - Item name
 * @param {number} submissionData.currentDropWeight - Current drop weight value
 * @param {number} submissionData.newDropWeight - New drop weight value
 * @param {string} [submissionData.userEmail] - User email (optional)
 * @returns {Promise<Object>} EmailJS response
 */
export async function sendGuidedFormSubmission(submissionData) {
  if (!isEmailJSConfigured() || !EMAILJS_TEMPLATE_ID_FORM) {
    const missing = [];
    if (!EMAILJS_SERVICE_ID) missing.push('VITE_EMAILJS_SERVICE_ID');
    if (!EMAILJS_PUBLIC_KEY) missing.push('VITE_EMAILJS_PUBLIC_KEY');
    if (!EMAILJS_TEMPLATE_ID) missing.push('VITE_EMAILJS_TEMPLATE_ID');
    
    const errorMsg = missing.length > 0
      ? `EmailJS is not configured. Missing required variables in .env.local: ${missing.join(', ')}. Please ensure all variables are prefixed with VITE_ and restart the dev server.`
      : 'EmailJS is not configured. Please set up EmailJS credentials in .env.local';
    throw new Error(errorMsg);
  }

  try {
    const templateParams = {
      submission_type: 'drop-weight-submission',
      category_id: submissionData.categoryId,
      item_id: submissionData.itemId,
      item_name: submissionData.itemName,
      current_drop_weight: String(submissionData.currentDropWeight || 'N/A'),
      new_drop_weight: String(submissionData.newDropWeight),
      timestamp: new Date().toISOString(),
      user_email: submissionData.userEmail || 'Not provided'
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID_FORM,
      templateParams
    );

    return {
      success: true,
      messageId: response.text,
      status: response.status
    };
  } catch (error) {
    console.error('EmailJS send error:', error);
    throw new Error(`Failed to send email: ${error.text || error.message}`);
  }
}

/**
 * Send import submission via EmailJS
 * @param {Object} submissionData - Submission data
 * @param {string} submissionData.categoryId - Category identifier
 * @param {Array} submissionData.items - Array of items
 * @param {Object} submissionData.validationResult - Validation result
 * @param {Object} submissionData.fileInfo - File metadata
 * @param {string} [submissionData.userEmail] - User email (optional)
 * @returns {Promise<Object>} EmailJS response
 */
export async function sendImportSubmission(submissionData) {
  if (!isEmailJSConfigured() || !EMAILJS_TEMPLATE_ID_IMPORT) {
    const missing = [];
    if (!EMAILJS_SERVICE_ID) missing.push('VITE_EMAILJS_SERVICE_ID');
    if (!EMAILJS_PUBLIC_KEY) missing.push('VITE_EMAILJS_PUBLIC_KEY');
    if (!EMAILJS_TEMPLATE_ID) missing.push('VITE_EMAILJS_TEMPLATE_ID');
    
    const errorMsg = missing.length > 0
      ? `EmailJS is not configured. Missing required variables in .env.local: ${missing.join(', ')}. Please ensure all variables are prefixed with VITE_ and restart the dev server.`
      : 'EmailJS is not configured. Please set up EmailJS credentials in .env.local';
    throw new Error(errorMsg);
  }

  try {
    const templateParams = {
      submission_type: 'import',
      category_id: submissionData.categoryId,
      timestamp: new Date().toISOString(),
      items: JSON.stringify(submissionData.items, null, 2),
      validation_result: JSON.stringify(submissionData.validationResult, null, 2),
      file_info: JSON.stringify(submissionData.fileInfo, null, 2),
      user_email: submissionData.userEmail || 'Not provided'
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID_IMPORT,
      templateParams
    );

    return {
      success: true,
      messageId: response.text,
      status: response.status
    };
  } catch (error) {
    console.error('EmailJS send error:', error);
    throw new Error(`Failed to send email: ${error.text || error.message}`);
  }
}

/**
 * Send dataset submission via EmailJS
 * @param {Object} submissionData - Submission data
 * @param {string} submissionData.categoryId - Category identifier
 * @param {Object} submissionData.dataset - Dataset object with name, description, date, sources, inputItems, items
 * @param {Object} submissionData.validationResult - Validation result object
 * @param {string} [submissionData.userEmail] - User email (optional)
 * @returns {Promise<Object>} EmailJS response
 */
export async function sendDatasetSubmission(submissionData) {
  if (!isEmailJSConfigured() || !EMAILJS_TEMPLATE_ID_DATASET) {
    const missing = [];
    if (!EMAILJS_SERVICE_ID) missing.push('VITE_EMAILJS_SERVICE_ID');
    if (!EMAILJS_PUBLIC_KEY) missing.push('VITE_EMAILJS_PUBLIC_KEY');
    if (!EMAILJS_TEMPLATE_ID) missing.push('VITE_EMAILJS_TEMPLATE_ID');
    
    const errorMsg = missing.length > 0
      ? `EmailJS is not configured. Missing required variables in .env.local: ${missing.join(', ')}. Please ensure all variables are prefixed with VITE_ and restart the dev server.`
      : 'EmailJS is not configured. Please set up EmailJS credentials in .env.local';
    throw new Error(errorMsg);
  }

  try {
    // Format the dataset JSON as the message
    const datasetJson = JSON.stringify(submissionData.dataset, null, 2);
    
    const templateParams = {
      subject: `Dataset Submission - ${submissionData.categoryId || 'Unknown Category'}`,
      message: datasetJson,
      service_page: submissionData.categoryId 
        ? `https://poedata.dev/#/submit/${submissionData.categoryId}`
        : 'https://poedata.dev/#/submit',
      timestamp: new Date().toISOString(),
      from_name: submissionData.userEmail ? submissionData.userEmail.split('@')[0] : 'Anonymous',
      from_email: submissionData.userEmail || 'noreply@poedata.dev'
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID_DATASET,
      templateParams
    );

    return {
      success: true,
      messageId: response.text,
      status: response.status
    };
  } catch (error) {
    console.error('EmailJS send error:', error);
    throw new Error(`Failed to send email: ${error.text || error.message}`);
  }
}

/**
 * Send flexible dataset submission via EmailJS
 * @param {Object} submissionData - Submission data
 * @param {string} submissionData.method - Submission method: "file" or "link"
 * @param {string} submissionData.dataSource - File content (if method is "file") or URL (if method is "link")
 * @param {string} [submissionData.description] - Optional description
 * @param {string} [submissionData.categoryId] - Optional category identifier
 * @param {Object} [submissionData.fileMetadata] - File metadata (required if method is "file")
 * @param {Object} [submissionData.linkMetadata] - Link metadata (required if method is "link")
 * @returns {Promise<Object>} EmailJS response with success status and messageId
 * @throws {Error} If EmailJS is not configured or submission fails
 */
export async function sendFlexibleSubmission(submissionData) {
  if (!isEmailJSConfigured() || !EMAILJS_TEMPLATE_ID_FLEXIBLE) {
    const missing = [];
    if (!EMAILJS_SERVICE_ID) missing.push('VITE_EMAILJS_SERVICE_ID');
    if (!EMAILJS_PUBLIC_KEY) missing.push('VITE_EMAILJS_PUBLIC_KEY');
    if (!EMAILJS_TEMPLATE_ID) missing.push('VITE_EMAILJS_TEMPLATE_ID');
    
    const errorMsg = missing.length > 0
      ? `EmailJS is not configured. Missing required variables in .env.local: ${missing.join(', ')}. Please ensure all variables are prefixed with VITE_ and restart the dev server.`
      : 'EmailJS is not configured. Please set up EmailJS credentials in .env.local';
    throw new Error(errorMsg);
  }

  // Validate method
  if (submissionData.method !== 'file' && submissionData.method !== 'link') {
    throw new Error(`Invalid submission method: ${submissionData.method}`);
  }

  // Validate metadata based on method
  if (submissionData.method === 'file' && !submissionData.fileMetadata) {
    throw new Error('File metadata required for file submissions');
  }

  if (submissionData.method === 'link' && !submissionData.linkMetadata) {
    throw new Error('Link metadata required for link submissions');
  }

  try {
    let messageContent = '';
    let subject = '';

    // Prepare message content based on method
    if (submissionData.method === 'file') {
      const fileContent = submissionData.dataSource || '';
      const fileName = submissionData.fileMetadata?.name || 'unknown';
      const fileSize = submissionData.fileMetadata?.size || 0;
      const fileType = submissionData.fileMetadata?.type || 'unknown';
      const fileExtension = submissionData.fileMetadata?.extension || '';
      
      // Build message with file metadata and content
      messageContent = `File Submission\n`;
      messageContent += `================\n\n`;
      messageContent += `File Name: ${fileName}\n`;
      messageContent += `File Size: ${fileSize} bytes\n`;
      messageContent += `File Type: ${fileType}\n`;
      if (fileExtension) {
        messageContent += `File Extension: ${fileExtension}\n`;
      }
      if (submissionData.description) {
        messageContent += `Description: ${submissionData.description}\n`;
      }
      messageContent += `\n--- File Content ---\n\n`;
      messageContent += fileContent;
      
      subject = `File Submission - ${fileName}`;
      if (submissionData.categoryId) {
        subject += ` (${submissionData.categoryId})`;
      }
    } else {
      // Link submission
      const linkUrl = submissionData.dataSource || '';
      const linkType = submissionData.linkMetadata?.detectedType || 'unknown';
      
      messageContent = `Link Submission\n`;
      messageContent += `================\n\n`;
      messageContent += `URL: ${linkUrl}\n`;
      messageContent += `Detected Type: ${linkType}\n`;
      if (submissionData.description) {
        messageContent += `Description: ${submissionData.description}\n`;
      }
      
      subject = `Link Submission - ${linkType}`;
      if (submissionData.categoryId) {
        subject += ` (${submissionData.categoryId})`;
      }
    }

    // Use the same template parameters as dataset submission
    const templateParams = {
      subject: subject,
      message: messageContent,
      service_page: submissionData.categoryId 
        ? `https://poedata.dev/#/submit/${submissionData.categoryId}`
        : 'https://poedata.dev/#/submit',
      timestamp: new Date().toISOString(),
      from_name: submissionData.userEmail ? submissionData.userEmail.split('@')[0] : 'Anonymous',
      from_email: submissionData.userEmail || 'noreply@poedata.dev'
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID_FLEXIBLE,
      templateParams
    );

    return {
      success: true,
      messageId: response.text,
      status: response.status
    };
  } catch (error) {
    console.error('EmailJS send error:', error);
    throw new Error(`Failed to send email: ${error.text || error.message}`);
  }
}

/**
 * Send contact form submission via EmailJS
 * @param {Object} contactData - Contact form data
 * @param {string} contactData.name - Sender's name
 * @param {string} contactData.email - Sender's email
 * @param {string} contactData.subject - Message subject
 * @param {string} contactData.message - Message content
 * @returns {Promise<Object>} EmailJS response with success status and messageId
 * @throws {Error} If EmailJS is not configured or submission fails
 */
export async function sendContactForm(contactData) {
  if (!isEmailJSConfigured()) {
    const missing = [];
    if (!EMAILJS_SERVICE_ID) missing.push('VITE_EMAILJS_SERVICE_ID');
    if (!EMAILJS_PUBLIC_KEY) missing.push('VITE_EMAILJS_PUBLIC_KEY');
    if (!EMAILJS_TEMPLATE_ID) missing.push('VITE_EMAILJS_TEMPLATE_ID');
    
    const errorMsg = missing.length > 0
      ? `EmailJS is not configured. Missing required variables in .env.local: ${missing.join(', ')}. Please ensure all variables are prefixed with VITE_ and restart the dev server.`
      : 'EmailJS is not configured. Please set up EmailJS credentials in .env.local';
    throw new Error(errorMsg);
  }

  try {
    const templateParams = {
      from_name: contactData.name || 'Anonymous',
      from_email: contactData.email || 'noreply@poedata.dev',
      subject: contactData.subject || 'Contact Form Submission',
      message: contactData.message || '',
      timestamp: new Date().toISOString()
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    return {
      success: true,
      messageId: response.text,
      status: response.status
    };
  } catch (error) {
    console.error('EmailJS send error:', error);
    throw new Error(`Failed to send email: ${error.text || error.message}`);
  }
}
