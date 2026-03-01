import moment from 'moment';
import { CURRENCY, DATE_FORMATS } from './constants';

// Currency formatting
export const formatCurrency = (amount, currency = CURRENCY.CODE) => {
  if (amount === null || amount === undefined) return '-';
  
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency,
    minimumFractionDigits: CURRENCY.DECIMALS,
    maximumFractionDigits: CURRENCY.DECIMALS
  }).format(amount);
};

export const formatCurrencySimple = (amount) => {
  if (amount === null || amount === undefined) return '-';
  return `${CURRENCY.SYMBOL} ${amount.toFixed(CURRENCY.DECIMALS)}`;
};

// Date formatting
export const formatDate = (date, format = DATE_FORMATS.DISPLAY) => {
  if (!date) return '-';
  return moment(date).format(format);
};

export const formatDateTime = (date, format = DATE_FORMATS.DISPLAY_TIME) => {
  if (!date) return '-';
  return moment(date).format(format);
};

export const formatTime = (date, format = DATE_FORMATS.TIME) => {
  if (!date) return '-';
  return moment(date).format(format);
};

export const formatTimeAgo = (date) => {
  if (!date) return '-';
  return moment(date).fromNow();
};

export const formatRelativeTime = (date) => {
  if (!date) return '-';
  return moment(date).calendar(null, {
    sameDay: '[Today at] HH:mm',
    nextDay: '[Tomorrow at] HH:mm',
    nextWeek: 'dddd [at] HH:mm',
    lastDay: '[Yesterday at] HH:mm',
    lastWeek: '[Last] dddd [at] HH:mm',
    sameElse: DATE_FORMATS.DISPLAY_TIME
  });
};

// Number formatting
export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined) return '-';
  return new Intl.NumberFormat('en-ET').format(number);
};

export const formatDecimal = (number, decimals = 2) => {
  if (number === null || number === undefined) return '-';
  return number.toFixed(decimals);
};

export const formatPercentage = (number, decimals = 1) => {
  if (number === null || number === undefined) return '-';
  return `${number.toFixed(decimals)}%`;
};

// Weight formatting
export const formatWeight = (kg, unit = 'kg') => {
  if (kg === null || kg === undefined) return '-';
  
  if (unit === 'kg') {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(2)} ton`;
    }
    return `${kg.toFixed(2)} kg`;
  }
  
  return `${kg.toFixed(2)} ${unit}`;
};

// Distance formatting
export const formatDistance = (km, unit = 'km') => {
  if (km === null || km === undefined) return '-';
  
  if (unit === 'km') {
    if (km < 1) {
      return `${(km * 1000).toFixed(0)} m`;
    }
    return `${km.toFixed(1)} km`;
  }
  
  return `${km.toFixed(1)} ${unit}`;
};

// Phone number formatting
export const formatPhone = (phone) => {
  if (!phone) return '-';
  
  // Format Ethiopian phone numbers
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('251')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  return phone;
};

// Name formatting
export const formatInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Address formatting
export const formatAddress = (address) => {
  if (!address) return '-';
  if (typeof address === 'string') return address;
  
  const parts = [];
  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.country) parts.push(address.country);
  
  return parts.join(', ');
};

// File size formatting
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return '-';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Duration formatting
export const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return '-';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

// Order number formatting
export const formatOrderNumber = (orderNumber) => {
  if (!orderNumber) return '-';
  return `#${orderNumber}`;
};

// Tracking code formatting
export const formatTrackingCode = (code) => {
  if (!code) return '-';
  return code;
};

// Rating formatting
export const formatRating = (rating, maxRating = 5) => {
  if (!rating && rating !== 0) return '-';
  return `${rating.toFixed(1)}/${maxRating}`;
};

// List formatting
export const formatList = (items, maxItems = 3) => {
  if (!items || items.length === 0) return '-';
  
  if (items.length <= maxItems) {
    return items.join(', ');
  }
  
  const remaining = items.length - maxItems;
  return `${items.slice(0, maxItems).join(', ')} +${remaining}`;
};

// Boolean formatting
export const formatBoolean = (value, trueText = 'Yes', falseText = 'No') => {
  return value ? trueText : falseText;
};

// Card number formatting
export const formatCardNumber = (cardNumber) => {
  if (!cardNumber) return '-';
  const cleaned = cardNumber.replace(/\D/g, '');
  const match = cleaned.match(/\d{1,4}/g);
  return match ? match.join(' ') : cardNumber;
};

// Mask sensitive data
export const maskString = (str, visibleChars = 4) => {
  if (!str) return '-';
  if (str.length <= visibleChars) return str;
  
  const masked = '*'.repeat(str.length - visibleChars);
  return masked + str.slice(-visibleChars);
};

// Percentage calculation
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return (value / total) * 100;
};

// Progress calculation
export const calculateProgress = (current, target) => {
  if (!target || target === 0) return 0;
  return Math.min((current / target) * 100, 100);
};

// JSON formatting
export const formatJSON = (data, spaces = 2) => {
  try {
    return JSON.stringify(data, null, spaces);
  } catch {
    return String(data);
  }
};

// Temperature formatting
export const formatTemperature = (celsius, unit = 'C') => {
  if (!celsius && celsius !== 0) return '-';
  
  if (unit === 'F') {
    return `${((celsius * 9/5) + 32).toFixed(1)}°F`;
  }
  return `${celsius.toFixed(1)}°C`;
};

// Volume formatting
export const formatVolume = (liters, unit = 'L') => {
  if (!liters && liters !== 0) return '-';
  
  if (unit === 'mL' && liters < 1) {
    return `${(liters * 1000).toFixed(0)} mL`;
  }
  return `${liters.toFixed(2)} L`;
};