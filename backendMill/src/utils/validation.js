const { REGEX } = require('./constants');

class ValidationUtils {
  // Required field validation
  static required(value, fieldName) {
    if (value === undefined || value === null || value === '') {
      return `${fieldName} is required`;
    }
    return null;
  }

  // Email validation
  static email(email) {
    if (!email) return null;
    if (!REGEX.EMAIL.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  // Phone validation (Ethiopia)
  static phoneEthiopia(phone) {
    if (!phone) return null;
    if (!REGEX.PHONE_ETHIOPIA.test(phone)) {
      return 'Please enter a valid Ethiopian phone number (+2519XXXXXXXX or +2517XXXXXXXX)';
    }
    return null;
  }

  // Password validation
  static password(password, options = {}) {
    const {
      minLength = 6,
      maxLength = 50,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSpecial = false
    } = options;

    const errors = [];

    if (!password) return 'Password is required';

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters`);
    }

    if (password.length > maxLength) {
      errors.push(`Password cannot exceed ${maxLength} characters`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (requireSpecial && !/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }

    return errors.length ? errors.join('. ') : null;
  }

  // Password confirmation
  static passwordMatch(password, confirmPassword) {
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  }

  // String length validation
  static length(value, min, max, fieldName) {
    if (!value) return null;
    
    const strValue = String(value);
    
    if (min && strValue.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    
    if (max && strValue.length > max) {
      return `${fieldName} cannot exceed ${max} characters`;
    }
    
    return null;
  }

  // Number range validation
  static range(value, min, max, fieldName) {
    if (value === undefined || value === null) return null;
    
    const numValue = Number(value);
    
    if (isNaN(numValue)) {
      return `${fieldName} must be a number`;
    }
    
    if (min !== undefined && numValue < min) {
      return `${fieldName} must be at least ${min}`;
    }
    
    if (max !== undefined && numValue > max) {
      return `${fieldName} cannot exceed ${max}`;
    }
    
    return null;
  }

  // Array validation
  static array(value, fieldName, options = {}) {
    const { minLength, maxLength } = options;
    
    if (!Array.isArray(value)) {
      return `${fieldName} must be an array`;
    }
    
    if (minLength !== undefined && value.length < minLength) {
      return `${fieldName} must contain at least ${minLength} items`;
    }
    
    if (maxLength !== undefined && value.length > maxLength) {
      return `${fieldName} cannot contain more than ${maxLength} items`;
    }
    
    return null;
  }

  // Date validation
  static date(value, fieldName) {
    if (!value) return null;
    
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return `${fieldName} must be a valid date`;
    }
    
    return null;
  }

  // Future date validation
  static futureDate(value, fieldName, includeToday = false) {
    const dateError = this.date(value, fieldName);
    if (dateError) return dateError;
    
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (includeToday ? date < today : date <= today) {
      return `${fieldName} must be in the future`;
    }
    
    return null;
  }

  // Past date validation
  static pastDate(value, fieldName, includeToday = false) {
    const dateError = this.date(value, fieldName);
    if (dateError) return dateError;
    
    const date = new Date(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (includeToday ? date > today : date >= today) {
      return `${fieldName} must be in the past`;
    }
    
    return null;
  }

  // URL validation
  static url(value, fieldName) {
    if (!value) return null;
    
    try {
      new URL(value);
      return null;
    } catch {
      return `${fieldName} must be a valid URL`;
    }
  }

  // ObjectId validation
  static objectId(value, fieldName) {
    if (!value) return null;
    
    if (!REGEX.OBJECT_ID.test(value)) {
      return `${fieldName} must be a valid ObjectId`;
    }
    
    return null;
  }

  // Enum validation
  static enum(value, allowedValues, fieldName) {
    if (!value) return null;
    
    if (!allowedValues.includes(value)) {
      return `${fieldName} must be one of: ${allowedValues.join(', ')}`;
    }
    
    return null;
  }

  // Boolean validation
  static boolean(value, fieldName) {
    if (value === undefined || value === null) return null;
    
    if (typeof value !== 'boolean' && !['true', 'false', '0', '1'].includes(String(value))) {
      return `${fieldName} must be a boolean`;
    }
    
    return null;
  }

  // Integer validation
  static integer(value, fieldName) {
    if (value === undefined || value === null) return null;
    
    if (!Number.isInteger(Number(value))) {
      return `${fieldName} must be an integer`;
    }
    
    return null;
  }

  // Positive number validation
  static positive(value, fieldName) {
    if (value === undefined || value === null) return null;
    
    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      return `${fieldName} must be a positive number`;
    }
    
    return null;
  }

  // Negative number validation
  static negative(value, fieldName) {
    if (value === undefined || value === null) return null;
    
    const numValue = Number(value);
    if (isNaN(numValue) || numValue >= 0) {
      return `${fieldName} must be a negative number`;
    }
    
    return null;
  }

  // Alpha validation (letters only)
  static alpha(value, fieldName) {
    if (!value) return null;
    
    if (!/^[A-Za-z]+$/.test(value)) {
      return `${fieldName} must contain only letters`;
    }
    
    return null;
  }

  // Alphanumeric validation
  static alphanumeric(value, fieldName) {
    if (!value) return null;
    
    if (!/^[A-Za-z0-9]+$/.test(value)) {
      return `${fieldName} must contain only letters and numbers`;
    }
    
    return null;
  }

  // Validate object against schema
  static validateObject(obj, schema) {
    const errors = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = obj[field];
      
      // Check required
      if (rules.required) {
        const requiredError = this.required(value, rules.label || field);
        if (requiredError) {
          errors[field] = requiredError;
          continue;
        }
      }

      if (value !== undefined && value !== null) {
        // Type validation
        if (rules.type) {
          const typeError = this.type(value, rules.type, rules.label || field);
          if (typeError) {
            errors[field] = typeError;
            continue;
          }
        }

        // Custom validations
        for (const [rule, param] of Object.entries(rules)) {
          if (rule === 'required' || rule === 'type' || rule === 'label' || rule === 'custom') continue;

          const validator = this[rule];
          if (validator && typeof validator === 'function') {
            const error = validator.call(this, value, param, rules.label || field);
            if (error) {
              errors[field] = error;
              break;
            }
          }
        }

        // Custom validation function
        if (rules.custom && typeof rules.custom === 'function') {
          const customError = rules.custom(value, obj);
          if (customError) {
            errors[field] = customError;
          }
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Type validation
  static type(value, type, fieldName) {
    const types = {
      string: () => typeof value === 'string',
      number: () => typeof value === 'number' && !isNaN(value),
      boolean: () => typeof value === 'boolean',
      array: () => Array.isArray(value),
      object: () => typeof value === 'object' && !Array.isArray(value) && value !== null,
      date: () => value instanceof Date && !isNaN(value),
      function: () => typeof value === 'function'
    };

    if (!types[type] || !types[type]()) {
      return `${fieldName} must be a ${type}`;
    }

    return null;
  }

  // Validate phone number (international)
  static phoneInternational(value, fieldName) {
    if (!value) return null;
    
    const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
    if (!phoneRegex.test(value)) {
      return `${fieldName} must be a valid international phone number (E.164 format)`;
    }
    
    return null;
  }

  // Validate credit card
  static creditCard(value, fieldName) {
    if (!value) return null;
    
    const cleaned = value.replace(/\D/g, '');
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    if (sum % 10 !== 0) {
      return `${fieldName} is not a valid credit card number`;
    }
    
    return null;
  }

  // Validate coordinates
  static coordinates(lat, lng) {
    const errors = {};
    
    if (lat !== undefined) {
      if (typeof lat !== 'number' || lat < -90 || lat > 90) {
        errors.lat = 'Latitude must be a number between -90 and 90';
      }
    }
    
    if (lng !== undefined) {
      if (typeof lng !== 'number' || lng < -180 || lng > 180) {
        errors.lng = 'Longitude must be a number between -180 and 180';
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Validate file
  static validateFile(file, options = {}) {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = [],
      required = false
    } = options;

    const errors = [];

    if (!file) {
      if (required) {
        errors.push('File is required');
      }
      return { isValid: errors.length === 0, errors };
    }

    if (file.size > maxSize) {
      errors.push(`File size cannot exceed ${this.formatFileSize(maxSize)}`);
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate time format (HH:mm)
  static timeFormat(value, fieldName) {
    if (!value) return null;
    
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(value)) {
      return `${fieldName} must be in HH:mm format`;
    }
    
    return null;
  }

  // Validate date range
  static dateRange(startDate, endDate, options = {}) {
    const { allowEqual = false, maxDays } = options;
    const errors = {};

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      errors.startDate = 'Invalid start date';
    }

    if (isNaN(end.getTime())) {
      errors.endDate = 'Invalid end date';
    }

    if (errors.startDate || errors.endDate) {
      return { isValid: false, errors };
    }

    if (!allowEqual && start >= end) {
      errors.range = 'Start date must be before end date';
    }

    if (allowEqual && start > end) {
      errors.range = 'Start date cannot be after end date';
    }

    if (maxDays) {
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      if (daysDiff > maxDays) {
        errors.range = `Date range cannot exceed ${maxDays} days`;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Format file size helper
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = ValidationUtils;