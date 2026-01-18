/**
 * Dataset parser and validator utility
 * Validates dataset JSON structure and extracts metadata
 */

/**
 * Parse and validate dataset JSON
 * @param {string} jsonString - JSON string to parse
 * @returns {Object} Validation result with { valid: boolean, data?: Object, error?: string }
 */
export function parseDataset(jsonString) {
  try {
    // Parse JSON
    const data = JSON.parse(jsonString);
    
    // Validate JSON structure
    const validation = validateDataset(data);
    
    if (!validation.valid) {
      return {
        valid: false,
        error: validation.error
      };
    }
    
    return {
      valid: true,
      data: data
    };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid JSON: ${error.message}`
    };
  }
}

/**
 * Validate dataset structure
 * @param {Object} dataset - Dataset object to validate
 * @returns {Object} Validation result with { valid: boolean, error?: string }
 */
export function validateDataset(dataset) {
  // Check if dataset is an object
  if (!dataset || typeof dataset !== 'object' || Array.isArray(dataset)) {
    return {
      valid: false,
      error: 'Dataset must be an object'
    };
  }
  
  // Check name field (optional, but if provided must be valid)
  if (dataset.name !== undefined) {
    if (typeof dataset.name !== 'string') {
      return {
        valid: false,
        error: 'Field "name" must be a string'
      };
    }
    
    if (dataset.name.trim().length === 0) {
      return {
        valid: false,
        error: 'Field "name" cannot be empty (omit the field if no name is provided)'
      };
    }
    
    if (dataset.name.length > 200) {
      return {
        valid: false,
        error: 'Field "name" exceeds maximum length of 200 characters'
      };
    }
  }
  
  if (!Array.isArray(dataset.items)) {
    return {
      valid: false,
      error: 'Missing required field: items (must be an array)'
    };
  }
  
  if (dataset.items.length === 0) {
    return {
      valid: false,
      error: 'Field "items" must contain at least one item'
    };
  }
  
  // Validate items array
  for (let i = 0; i < dataset.items.length; i++) {
    const item = dataset.items[i];
    
    if (!item || typeof item !== 'object') {
      return {
        valid: false,
        error: `Invalid item at index ${i}: must be an object`
      };
    }
    
    if (!item.id || typeof item.id !== 'string' || item.id.trim().length === 0) {
      return {
        valid: false,
        error: `Invalid item at index ${i}: missing required field "id" (must be non-empty string)`
      };
    }
    
    if (item.count === undefined || typeof item.count !== 'number') {
      return {
        valid: false,
        error: `Invalid item at index ${i}: missing required field "count" (must be a number)`
      };
    }
    
    if (item.count <= 0) {
      return {
        valid: false,
        error: `Invalid item at index ${i}: field "count" must be a positive number`
      };
    }
  }
  
  // Validate optional fields if present
  if (dataset.date !== undefined) {
    if (typeof dataset.date !== 'string') {
      return {
        valid: false,
        error: 'Field "date" must be a string'
      };
    }
    
    // Validate ISO date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dataset.date)) {
      return {
        valid: false,
        error: 'Field "date" must be in ISO format (YYYY-MM-DD)'
      };
    }
  }
  
  if (dataset.patch !== undefined) {
    if (typeof dataset.patch !== 'string') {
      return {
        valid: false,
        error: 'Field "patch" must be a string'
      };
    }
    
    // Validate patch version pattern (e.g., "3.26.0" or "3.26.0.1")
    const patchRegex = /^\d+\.\d+\.\d+(\.\d+)?$/;
    if (!patchRegex.test(dataset.patch)) {
      return {
        valid: false,
        error: 'Field "patch" must match version pattern (e.g., "3.26.0" or "3.26.0.1")'
      };
    }
  }
  
  if (dataset.sources !== undefined) {
    if (!Array.isArray(dataset.sources)) {
      return {
        valid: false,
        error: 'Field "sources" must be an array'
      };
    }
    
    for (let i = 0; i < dataset.sources.length; i++) {
      const source = dataset.sources[i];
      
      if (!source || typeof source !== 'object') {
        return {
          valid: false,
          error: `Invalid source at index ${i}: must be an object`
        };
      }
      
      if (!source.name || typeof source.name !== 'string' || source.name.trim().length === 0) {
        return {
          valid: false,
          error: `Invalid source at index ${i}: missing required field "name" (must be non-empty string)`
        };
      }
    }
  }
  
  if (dataset.inputItems !== undefined) {
    if (!Array.isArray(dataset.inputItems)) {
      return {
        valid: false,
        error: 'Field "inputItems" must be an array'
      };
    }
    
    for (let i = 0; i < dataset.inputItems.length; i++) {
      const inputItem = dataset.inputItems[i];
      
      if (!inputItem || typeof inputItem !== 'object') {
        return {
          valid: false,
          error: `Invalid inputItem at index ${i}: must be an object`
        };
      }
      
      if (!inputItem.id || typeof inputItem.id !== 'string' || inputItem.id.trim().length === 0) {
        return {
          valid: false,
          error: `Invalid inputItem at index ${i}: missing required field "id" (must be non-empty string)`
        };
      }
    }
  }
  
  return {
    valid: true
  };
}

/**
 * Extract metadata from dataset object
 * @param {Object} dataset - Dataset object
 * @returns {Object} Metadata object
 */
export function extractMetadata(dataset) {
  if (!dataset) {
    return null;
  }
  
  return {
    name: dataset.name || null,
    description: dataset.description || null,
    date: dataset.date || null,
    patch: dataset.patch || null,
    itemCount: Array.isArray(dataset.items) ? dataset.items.length : 0,
    hasSources: Array.isArray(dataset.sources) && dataset.sources.length > 0,
    hasInputItems: Array.isArray(dataset.inputItems) && dataset.inputItems.length > 0
  };
}
