/**
 * File and URL validation utilities for flexible dataset submission
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_URL_LENGTH = 2000;

const SUPPORTED_MIME_TYPES = [
  'application/json',
  'text/csv',
  'text/plain'
];

const SUPPORTED_EXTENSIONS = [
  '.json',
  '.csv',
  '.txt'
];

/**
 * Validate file for flexible dataset submission
 * @param {File} file - File object from file input
 * @returns {Object} Validation result with isValid boolean and error message
 */
export function validateFile(file) {
  if (!file) {
    return {
      isValid: false,
      error: 'Please select a file.'
    };
  }

  // Check file name
  if (!file.name || file.name.trim() === '') {
    return {
      isValid: false,
      error: 'File name is required.'
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: 'File size exceeds 10MB limit. Please choose a smaller file.'
    };
  }

  // Check file extension
  const extension = getFileExtension(file.name);
  if (!SUPPORTED_EXTENSIONS.includes(extension.toLowerCase())) {
    return {
      isValid: false,
      error: 'File format not supported. Please upload a JSON, CSV, or TXT file.'
    };
  }

  // Check MIME type (if available)
  if (file.type && !SUPPORTED_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'File type not supported. Please upload a JSON, CSV, or TXT file.'
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Extract metadata from File object
 * @param {File} file - File object
 * @returns {Object} File metadata
 */
export function getFileMetadata(file) {
  if (!file) {
    return {
      name: '',
      size: 0,
      type: '',
      extension: ''
    };
  }

  return {
    name: file.name || '',
    size: file.size || 0,
    type: file.type || '',
    extension: getFileExtension(file.name)
  };
}

/**
 * Get file extension from filename
 * @param {string} filename - File name
 * @returns {string} File extension (e.g., ".json") or empty string
 */
function getFileExtension(filename) {
  if (!filename) {
    return '';
  }
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) {
    return '';
  }
  return filename.substring(lastDot);
}

/**
 * Read file content as text
 * @param {File} file - File object to read
 * @returns {Promise<string>} File content as text string
 * @throws {Error} If file read fails
 */
export async function readFileAsText(file) {
  if (!file) {
    throw new Error('File is required');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target.result);
    };

    reader.onerror = (e) => {
      reject(new Error(`Failed to read file: ${e.target.error?.message || 'Unknown error'}`));
    };

    reader.readAsText(file);
  });
}

/**
 * Validate URL format for flexible dataset submission
 * @param {string} urlString - URL string to validate
 * @returns {Object} Validation result with isValid boolean and error message
 */
export function validateUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return {
      isValid: false,
      error: 'Please enter a URL.'
    };
  }

  const trimmed = urlString.trim();
  
  if (trimmed === '') {
    return {
      isValid: false,
      error: 'Please enter a URL.'
    };
  }

  // Check URL length
  if (trimmed.length > MAX_URL_LENGTH) {
    return {
      isValid: false,
      error: 'URL is too long. Please use a shorter URL.'
    };
  }

  // Validate URL format using URL constructor
  try {
    new URL(trimmed);
    return {
      isValid: true,
      error: null
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format. Please enter a valid URL.'
    };
  }
}

/**
 * Detect link type from URL
 * @param {string} urlString - URL string
 * @returns {string | null} Detected link type or null if unknown
 */
export function detectLinkType(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return null;
  }

  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();

    // Google Sheets
    if (hostname.includes('docs.google.com') && pathname.includes('/spreadsheets/')) {
      return 'google-sheets';
    }

    // Discord
    if (hostname.includes('discord.com') || hostname.includes('discord.gg')) {
      return 'discord';
    }

    // GitHub
    if (hostname.includes('github.com') && pathname.includes('/blob/')) {
      return 'github';
    }

    // Imgur
    if (hostname.includes('imgur.com') || hostname.includes('i.imgur.com')) {
      return 'imgur';
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Validate description length
 * @param {string} description - Description text
 * @returns {Object} Validation result with isValid boolean and error message
 */
export function validateDescription(description) {
  if (!description) {
    return {
      isValid: true,
      error: null
    };
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return {
      isValid: false,
      error: `Description exceeds ${MAX_DESCRIPTION_LENGTH} character limit.`
    };
  }

  return {
    isValid: true,
    error: null
  };
}
