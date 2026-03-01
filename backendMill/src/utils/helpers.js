const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class Helper {
  // Generate random string
  static generateRandomString(length = 32, options = {}) {
    const { numbers = true, letters = true, special = false } = options;
    
    let chars = '';
    if (letters) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    if (numbers) chars += '0123456789';
    if (special) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (!chars) chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  // Generate UUID
  static generateUUID() {
    return uuidv4();
  }

  // Generate order number
  static generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `ORD-${year}${month}${day}-${random}`;
  }

  // Generate tracking code
  static generateTrackingCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'TRK-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Generate OTP
  static generateOTP(length = 6) {
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10);
    }
    return otp;
  }

  // Hash password
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  // Compare password
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  static generateToken(payload, expiresIn = '7d') {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  // Generate refresh token
  static generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
  }

  // Format currency
  static formatCurrency(amount, currency = 'ETB') {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Format date
  static formatDate(date, format = 'MMM DD, YYYY') {
    return moment(date).format(format);
  }

  // Format time
  static formatTime(date, format = 'HH:mm') {
    return moment(date).format(format);
  }

  // Format datetime
  static formatDateTime(date, format = 'MMM DD, YYYY HH:mm') {
    return moment(date).format(format);
  }

  // Calculate distance between two coordinates (Haversine formula)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Convert degrees to radians
  static toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Calculate delivery fee based on distance
  static calculateDeliveryFee(distance, baseRate = 30, perKmRate = 5) {
    return baseRate + (distance * perKmRate);
  }

  // Calculate estimated delivery time
  static calculateEstimatedDeliveryTime(distance, averageSpeed = 30) {
    const hours = distance / averageSpeed;
    return Math.ceil(hours * 60); // Return minutes
  }

  // Group array by key
  static groupBy(array, key) {
    return array.reduce((result, item) => {
      const groupKey = typeof key === 'function' ? key(item) : item[key];
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {});
  }

  // Chunk array
  static chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Remove duplicates from array
  static uniqueArray(array, key = null) {
    if (!key) return [...new Set(array)];
    
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  // Deep clone object
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Merge objects deeply
  static deepMerge(target, source) {
    const output = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          source[key] &&
          typeof source[key] === 'object' &&
          !Array.isArray(source[key])
        ) {
          if (!output[key]) output[key] = {};
          output[key] = this.deepMerge(output[key], source[key]);
        } else {
          output[key] = source[key];
        }
      }
    }
    
    return output;
  }

  // Mask sensitive data
  static maskSensitiveData(data, fields) {
    const masked = { ...data };
    
    for (const field of fields) {
      if (masked[field]) {
        const value = masked[field].toString();
        masked[field] = value.slice(0, -4).replace(/./g, '*') + value.slice(-4);
      }
    }
    
    return masked;
  }

  // Generate pagination links
  static generatePaginationLinks(baseUrl, page, totalPages) {
    const links = {};
    
    if (page > 1) {
      links.first = `${baseUrl}?page=1`;
      links.prev = `${baseUrl}?page=${page - 1}`;
    }
    
    if (page < totalPages) {
      links.next = `${baseUrl}?page=${page + 1}`;
      links.last = `${baseUrl}?page=${totalPages}`;
    }
    
    return links;
  }

  // Parse CSV string to array
  static parseCSV(csvString, delimiter = ',') {
    const lines = csvString.split('\n');
    const headers = lines[0].split(delimiter);
    
    return lines.slice(1).map(line => {
      const values = line.split(delimiter);
      return headers.reduce((obj, header, index) => {
        obj[header.trim()] = values[index]?.trim() || '';
        return obj;
      }, {});
    }).filter(row => Object.values(row).some(val => val));
  }

  // Convert array to CSV
  static toCSV(data, headers = null) {
    if (!data.length) return '';
    
    const cols = headers || Object.keys(data[0]);
    const rows = [cols.join(',')];
    
    for (const item of data) {
      const row = cols.map(col => {
        const value = item[col] || '';
        return value.includes(',') ? `"${value}"` : value;
      }).join(',');
      rows.push(row);
    }
    
    return rows.join('\n');
  }

  // Sleep function
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Retry function
  static async retry(fn, maxAttempts = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        await this.sleep(delay * attempt);
      }
    }
  }

  // Debounce function
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Throttle function
  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Memory cache
  static cache = new Map();

  static setCache(key, value, ttl = 3600) {
    const expiresAt = Date.now() + (ttl * 1000);
    this.cache.set(key, { value, expiresAt });
  }

  static getCache(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (item.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  static clearCache(pattern = null) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // File size formatter
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Time ago formatter
  static timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return interval + ' ' + unit + (interval === 1 ? '' : 's') + ' ago';
      }
    }
    
    return 'just now';
  }

  // Truncate text
  static truncateText(text, length = 100, suffix = '...') {
    if (text.length <= length) return text;
    return text.substring(0, length) + suffix;
  }

  // Slugify string
  static slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  // Email validator
  static isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Phone number validator (Ethiopia)
  static isValidEthiopianPhone(phone) {
    const re = /^\+251[97]\d{8}$/;
    return re.test(phone);
  }

  // Extract mentions from text
  static extractMentions(text) {
    const mentions = text.match(/@(\w+)/g) || [];
    return mentions.map(m => m.substring(1));
  }

  // Extract hashtags from text
  static extractHashtags(text) {
    const hashtags = text.match(/#(\w+)/g) || [];
    return hashtags.map(h => h.substring(1));
  }

  // Parse user agent
  static parseUserAgent(userAgent) {
    // Simple parsing - in production use a library like 'ua-parser-js'
    const browser = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)/)?.[0] || 'Unknown';
    const os = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/)?.[0] || 'Unknown';
    
    return { browser, os };
  }

  // Get client IP
  static getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           req.ip;
  }

  // Generate random color
  static generateRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  // Get initials from name
  static getInitials(name) {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}

module.exports = Helper;