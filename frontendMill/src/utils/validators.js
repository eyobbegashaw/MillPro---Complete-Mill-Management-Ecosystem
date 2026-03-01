import { VALIDATION } from './constants';

// Email validation
export const isValidEmail = (email) => {
  if (!email) return false;
  return VALIDATION.EMAIL_REGEX.test(email);
};

// Phone validation (Ethiopia)
export const isValidEthiopianPhone = (phone) => {
  if (!phone) return false;
  return VALIDATION.PHONE_REGEX.test(phone);
};

// Password validation
export const isValidPassword = (password, options = {}) => {
  const {
    minLength = VALIDATION.PASSWORD_MIN_LENGTH,
    maxLength = VALIDATION.PASSWORD_MAX_LENGTH,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecial = false
  } = options;

  const errors = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

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
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Name validation
export const isValidName = (name) => {
  if (!name) return false;
  return name.length >= VALIDATION.NAME_MIN_LENGTH && 
         name.length <= VALIDATION.NAME_MAX_LENGTH;
};

// Required field validation
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

// Number validations
export const isNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

export const isPositiveNumber = (value) => {
  return isNumber(value) && parseFloat(value) > 0;
};

export const isInteger = (value) => {
  return Number.isInteger(Number(value));
};

export const isInRange = (value, min, max) => {
  const num = parseFloat(value);
  return isNumber(num) && num >= min && num <= max;
};

// Date validations
export const isValidDate = (date) => {
  if (!date) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

export const isFutureDate = (date) => {
  if (!isValidDate(date)) return false;
  return new Date(date) > new Date();
};

export const isPastDate = (date) => {
  if (!isValidDate(date)) return false;
  return new Date(date) < new Date();
};

// Array validations
export const isArray = (value) => {
  return Array.isArray(value);
};

export const arrayHasLength = (array, min, max = null) => {
  if (!Array.isArray(array)) return false;
  if (array.length < min) return false;
  if (max !== null && array.length > max) return false;
  return true;
};

// Object validations
export const isObject = (value) => {
  return value && typeof value === 'object' && !Array.isArray(value);
};

export const objectHasKeys = (obj, keys) => {
  if (!isObject(obj)) return false;
  return keys.every(key => key in obj);
};

// URL validation
export const isValidUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ObjectId validation (MongoDB)
export const isValidObjectId = (id) => {
  if (!id) return false;
  return VALIDATION.OBJECT_ID_REGEX.test(id);
};

// Coordinate validation
export const isValidLatitude = (lat) => {
  return isNumber(lat) && lat >= -90 && lat <= 90;
};

export const isValidLongitude = (lng) => {
  return isNumber(lng) && lng >= -180 && lng <= 180;
};

export const isValidCoordinates = (lat, lng) => {
  return isValidLatitude(lat) && isValidLongitude(lng);
};

// File validations
export const isValidFileType = (file, allowedTypes) => {
  if (!file || !allowedTypes) return false;
  return allowedTypes.includes(file.type);
};

export const isValidFileSize = (file, maxSize) => {
  if (!file || !maxSize) return false;
  return file.size <= maxSize;
};

export const isValidImage = (file) => {
  return file && file.type.startsWith('image/');
};

// Credit card validation (Luhn algorithm)
export const isValidCreditCard = (cardNumber) => {
  if (!cardNumber) return false;
  
  const cleaned = cardNumber.replace(/\D/g, '');
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
  
  return sum % 10 === 0;
};

// Ethiopian Tax Identification Number (TIN) validation
export const isValidTIN = (tin) => {
  if (!tin) return false;
  // Simplified TIN validation (10-12 digits)
  const cleaned = tin.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 12;
};

// Boolean validation
export const isValidBoolean = (value) => {
  return typeof value === 'boolean' || value === 'true' || value === 'false';
};

// JSON validation
export const isValidJSON = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

// Password match validation
export const passwordsMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

// Age validation
export const isValidAge = (birthDate, minAge = 18) => {
  if (!isValidDate(birthDate)) return false;
  
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age >= minAge;
};

// Percentage validation
export const isValidPercentage = (value) => {
  return isNumber(value) && value >= 0 && value <= 100;
};

// Time format validation (HH:mm)
export const isValidTimeFormat = (time) => {
  if (!time) return false;
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(time);
};

// Date range validation
export const isValidDateRange = (startDate, endDate, options = {}) => {
  const { allowEqual = false, maxDays } = options;
  
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return false;
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (!allowEqual && start >= end) return false;
  if (allowEqual && start > end) return false;
  
  if (maxDays) {
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxDays) return false;
  }
  
  return true;
};

// Form validation helper
export const validateForm = (values, rules) => {
  const errors = {};
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = values[field];
    
    // Required validation
    if (fieldRules.required && !isRequired(value)) {
      errors[field] = fieldRules.message?.required || `${field} is required`;
      continue;
    }
    
    // Skip other validations if value is empty and not required
    if (!value && !fieldRules.required) continue;
    
    // Email validation
    if (fieldRules.email && !isValidEmail(value)) {
      errors[field] = fieldRules.message?.email || 'Invalid email address';
    }
    
    // Phone validation
    if (fieldRules.phone && !isValidEthiopianPhone(value)) {
      errors[field] = fieldRules.message?.phone || 'Invalid phone number';
    }
    
    // Min length validation
    if (fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = fieldRules.message?.minLength || 
        `Minimum length is ${fieldRules.minLength}`;
    }
    
    // Max length validation
    if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = fieldRules.message?.maxLength || 
        `Maximum length is ${fieldRules.maxLength}`;
    }
    
    // Pattern validation
    if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
      errors[field] = fieldRules.message?.pattern || 'Invalid format';
    }
    
    // Match validation
    if (fieldRules.match && value !== values[fieldRules.match]) {
      errors[field] = fieldRules.message?.match || 'Values do not match';
    }
    
    // Custom validation
    if (fieldRules.validate && typeof fieldRules.validate === 'function') {
      const customError = fieldRules.validate(value, values);
      if (customError) {
        errors[field] = customError;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Business validations
export const isValidQuantity = (quantity, min = 0.1, max = null) => {
  if (!isPositiveNumber(quantity)) return false;
  if (max && quantity > max) return false;
  return quantity >= min;
};

export const isValidPrice = (price) => {
  return isPositiveNumber(price);
};

export const isValidDiscount = (discount, maxDiscount = 100) => {
  return isNumber(discount) && discount >= 0 && discount <= maxDiscount;
};

export const isValidRating = (rating) => {
  return isNumber(rating) && rating >= 1 && rating <= 5;
};

export const isValidOrderStatus = (status, allowedStatuses) => {
  return allowedStatuses.includes(status);
};

export const isValidPaymentMethod = (method, allowedMethods) => {
  return allowedMethods.includes(method);
};

export const isValidDeliveryAddress = (address) => {
  if (!address) return false;
  if (typeof address === 'string') return address.length > 10;
  
  return (
    address.street &&
    address.city &&
    address.street.length > 5 &&
    address.city.length > 2
  );
};