import { STORAGE_KEYS } from './constants';

// Local Storage helpers
export const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },
  
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }
};

// Session Storage helpers
export const sessionStorage = {
  set: (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Session storage set error:', error);
      return false;
    }
  },
  
  get: (key, defaultValue = null) => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Session storage get error:', error);
      return defaultValue;
    }
  },
  
  remove: (key) => {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Session storage remove error:', error);
      return false;
    }
  },
  
  clear: () => {
    try {
      sessionStorage.clear();
      return true;
    } catch (error) {
      console.error('Session storage clear error:', error);
      return false;
    }
  }
};

// Cookie helpers
export const cookies = {
  set: (name, value, days = 7) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${JSON.stringify(value)};${expires};path=/`;
  },
  
  get: (name) => {
    const cookieName = `${name}=`;
    const cookies = document.cookie.split(';');
    
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(cookieName) === 0) {
        const value = cookie.substring(cookieName.length);
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
    }
    return null;
  },
  
  remove: (name) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
};

// URL helpers
export const url = {
  getParams: () => {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    
    for (const [key, value] of params) {
      result[key] = value;
    }
    
    return result;
  },
  
  setParams: (params, replace = false) => {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    
    if (replace) {
      // Clear existing params
      const keys = [...searchParams.keys()];
      keys.forEach(key => searchParams.delete(key));
    }
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        searchParams.delete(key);
      } else {
        searchParams.set(key, String(value));
      }
    });
    
    window.history.pushState({}, '', url.toString());
  },
  
  clearParams: () => {
    const url = new URL(window.location.href);
    url.search = '';
    window.history.pushState({}, '', url.toString());
  }
};

// Array helpers
export const array = {
  groupBy: (array, key) => {
    return array.reduce((result, item) => {
      const groupKey = typeof key === 'function' ? key(item) : item[key];
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {});
  },
  
  unique: (array, key = null) => {
    if (!key) {
      return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  },
  
  sortBy: (array, key, order = 'asc') => {
    return [...array].sort((a, b) => {
      const aVal = typeof key === 'function' ? key(a) : a[key];
      const bVal = typeof key === 'function' ? key(b) : b[key];
      
      if (order === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  },
  
  chunk: (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
  
  intersect: (array1, array2) => {
    return array1.filter(item => array2.includes(item));
  },
  
  difference: (array1, array2) => {
    return array1.filter(item => !array2.includes(item));
  },
  
  sum: (array, key = null) => {
    return array.reduce((total, item) => {
      const value = key ? item[key] : item;
      return total + (typeof value === 'number' ? value : 0);
    }, 0);
  },
  
  average: (array, key = null) => {
    if (array.length === 0) return 0;
    return array.sum(array, key) / array.length;
  },
  
  min: (array, key = null) => {
    if (array.length === 0) return null;
    const values = key ? array.map(item => item[key]) : array;
    return Math.min(...values.filter(v => typeof v === 'number'));
  },
  
  max: (array, key = null) => {
    if (array.length === 0) return null;
    const values = key ? array.map(item => item[key]) : array;
    return Math.max(...values.filter(v => typeof v === 'number'));
  }
};

// Object helpers
export const object = {
  pick: (obj, keys) => {
    return keys.reduce((result, key) => {
      if (key in obj) {
        result[key] = obj[key];
      }
      return result;
    }, {});
  },
  
  omit: (obj, keys) => {
    return Object.keys(obj).reduce((result, key) => {
      if (!keys.includes(key)) {
        result[key] = obj[key];
      }
      return result;
    }, {});
  },
  
  isEmpty: (obj) => {
    return Object.keys(obj).length === 0;
  },
  
  deepClone: (obj) => {
    return JSON.parse(JSON.stringify(obj));
  },
  
  merge: (target, source) => {
    return { ...target, ...source };
  },
  
  deepMerge: (target, source) => {
    const output = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          source[key] &&
          typeof source[key] === 'object' &&
          !Array.isArray(source[key])
        ) {
          if (!output[key]) output[key] = {};
          output[key] = object.deepMerge(output[key], source[key]);
        } else {
          output[key] = source[key];
        }
      }
    }
    
    return output;
  },
  
  getValue: (obj, path, defaultValue = null) => {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result && result.hasOwnProperty(key)) {
        result = result[key];
      } else {
        return defaultValue;
      }
    }
    
    return result;
  },
  
  setValue: (obj, path, value) => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((acc, key) => {
      if (!acc[key] || typeof acc[key] !== 'object') {
        acc[key] = {};
      }
      return acc[key];
    }, obj);
    
    target[lastKey] = value;
    return obj;
  }
};

// String helpers
export const string = {
  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },
  
  capitalizeWords: (str) => {
    if (!str) return '';
    return str.split(' ').map(word => string.capitalize(word)).join(' ');
  },
  
  truncate: (str, length = 100, suffix = '...') => {
    if (!str || str.length <= length) return str;
    return str.substring(0, length) + suffix;
  },
  
  slugify: (str) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },
  
  random: (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  extractMentions: (text) => {
    const mentions = text.match(/@(\w+)/g) || [];
    return mentions.map(m => m.substring(1));
  },
  
  extractHashtags: (text) => {
    const hashtags = text.match(/#(\w+)/g) || [];
    return hashtags.map(h => h.substring(1));
  },
  
  toCamelCase: (str) => {
    return str.replace(/([-_][a-z])/g, group =>
      group.toUpperCase().replace('-', '').replace('_', '')
    );
  },
  
  toSnakeCase: (str) => {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
};

// Debounce and Throttle
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Copy to clipboard error:', error);
    
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (err) {
      document.body.removeChild(textarea);
      return false;
    }
  }
};

// Download file
export const downloadFile = (content, filename, type = 'text/plain') => {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Generate random color
export const randomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Sleep
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Retry
export const retry = async (fn, maxAttempts = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await sleep(delay * attempt);
    }
  }
};

// Scroll to top
export const scrollToTop = (behavior = 'smooth') => {
  window.scrollTo({ top: 0, behavior });
};

// Scroll to element
export const scrollToElement = (elementId, behavior = 'smooth') => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior });
  }
};

// Detect mobile
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Detect touch device
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Generate UUID
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};