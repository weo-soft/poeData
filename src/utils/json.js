/**
 * JSON parsing and validation utilities
 */

/**
 * Safely parse JSON string
 * @param {string} jsonString - JSON string to parse
 * @returns {Object|null} Parsed object or null if invalid
 */
export function safeParseJSON(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return null;
  }
}

/**
 * Check if a value is valid JSON
 * @param {string} str - String to check
 * @returns {boolean} True if valid JSON
 */
export function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format JSON with indentation
 * @param {Object} obj - Object to format
 * @param {number} indent - Indentation spaces
 * @returns {string} Formatted JSON string
 */
export function formatJSON(obj, indent = 2) {
  return JSON.stringify(obj, null, indent);
}

/**
 * Deep clone an object using JSON
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

