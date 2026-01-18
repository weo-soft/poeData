/**
 * EmailJS integration service for form submissions
 */

import emailjs from '@emailjs/browser';

// Initialize EmailJS with public key from environment
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID_FORM = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_FORM;
const EMAILJS_TEMPLATE_ID_IMPORT = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_IMPORT;
const EMAILJS_TEMPLATE_ID_DATASET = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_DATASET;
const EMAILJS_TEMPLATE_ID_FLEXIBLE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_FLEXIBLE;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Initialize EmailJS if public key is available
if (EMAILJS_PUBLIC_KEY) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

/**
 * Check if EmailJS is configured
 * @returns {boolean} True if EmailJS is configured
 */
export function isEmailJSConfigured() {
  return !!(EMAILJS_SERVICE_ID && EMAILJS_PUBLIC_KEY && 
           (EMAILJS_TEMPLATE_ID_FORM || EMAILJS_TEMPLATE_ID_IMPORT || EMAILJS_TEMPLATE_ID_DATASET || EMAILJS_TEMPLATE_ID_FLEXIBLE));
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
    throw new Error('EmailJS is not configured. Please set up EmailJS credentials in .env.local');
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
    throw new Error('EmailJS is not configured. Please set up EmailJS credentials in .env.local');
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
    throw new Error('EmailJS is not configured. Please set up EmailJS credentials in .env.local');
  }

  try {
    const templateParams = {
      submission_type: 'dataset',
      category_id: submissionData.categoryId,
      timestamp: new Date().toISOString(),
      dataset_data: JSON.stringify(submissionData.dataset, null, 2),
      validation_result: JSON.stringify(submissionData.validationResult, null, 2),
      user_email: submissionData.userEmail || 'Not provided'
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
    throw new Error('EmailJS is not configured. Please set up EmailJS credentials in .env.local');
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
    // Prepare template parameters
    const templateParams = {
      submission_type: 'flexible',
      method: submissionData.method,
      category_id: submissionData.categoryId || '',
      timestamp: new Date().toISOString(),
      description: submissionData.description || '',
      user_email: submissionData.userEmail || 'Not provided'
    };

    // Add file-specific parameters
    if (submissionData.method === 'file') {
      const fileContent = submissionData.dataSource || '';
      const MAX_CONTENT_LENGTH = 50 * 1024; // 50KB
      const isTruncated = fileContent.length > MAX_CONTENT_LENGTH;
      
      templateParams.file_name = submissionData.fileMetadata.name || '';
      templateParams.file_size = String(submissionData.fileMetadata.size || 0);
      templateParams.file_type = submissionData.fileMetadata.type || '';
      templateParams.file_extension = submissionData.fileMetadata.extension || '';
      templateParams.file_content = isTruncated 
        ? fileContent.substring(0, MAX_CONTENT_LENGTH) 
        : fileContent;
      templateParams.file_content_truncated = isTruncated ? 'true' : 'false';
      
      // Initialize link-specific params as empty
      templateParams.link_url = '';
      templateParams.link_detected_type = '';
    } else {
      // Add link-specific parameters
      templateParams.link_url = submissionData.dataSource || '';
      templateParams.link_detected_type = submissionData.linkMetadata?.detectedType || '';
      
      // Initialize file-specific params as empty
      templateParams.file_name = '';
      templateParams.file_size = '';
      templateParams.file_type = '';
      templateParams.file_extension = '';
      templateParams.file_content = '';
      templateParams.file_content_truncated = 'false';
    }

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

