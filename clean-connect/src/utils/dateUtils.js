/**
 * Utility functions for date formatting and manipulation
 */

/**
 * Formats a date string or Date object to a localized date format
 * This function is designed to handle various date formats and be resilient to errors
 * 
 * @param {string|Date} date - The date to format
 * @param {string} locale - The locale to use for formatting (default: fr-FR)
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, locale = 'fr-FR') => {
  if (!date) return '-';
  
  try {
    // Create a date object from various possible input formats
    let dateObj;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      // Try parsing as ISO date (most common from backend)
      dateObj = new Date(date);
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        // Try parsing date strings in different formats (DD/MM/YYYY or DD-MM-YYYY)
        const parts = date.split(/[\/\-\.]/);
        if (parts.length === 3) {
          // Try European format (DD/MM/YYYY)
          dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          
          // If still invalid, try US format (MM/DD/YYYY)
          if (isNaN(dateObj.getTime())) {
            dateObj = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
          }
        }
      }
    } else if (typeof date === 'number') {
      // Handle timestamp
      dateObj = new Date(date);
    }
    
    // If we still don't have a valid date, return the original
    if (!dateObj || isNaN(dateObj.getTime())) {
      console.warn(`Unable to parse date: ${date}`);
      return String(date);
    }
    
    // Format the date using Intl API
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error, date);
    // Return a fallback representation that won't crash the app
    return String(date);
  }
};

/**
 * Formats a date string or Date object to a localized date and time format
 * @param {string|Date} date - The date to format
 * @param {string} locale - The locale to use for formatting (default: fr-FR)
 * @returns {string} - Formatted date and time string
 */
export const formatDateTime = (date, locale = 'fr-FR') => {
  if (!date) return '-';
  
  try {
    // Use the same parsing logic as formatDate
    let dateObj;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
      
      if (isNaN(dateObj.getTime())) {
        const parts = date.split(/[\/\-\.]/);
        if (parts.length === 3) {
          dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          
          if (isNaN(dateObj.getTime())) {
            dateObj = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
          }
        }
      }
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    }
    
    if (!dateObj || isNaN(dateObj.getTime())) {
      console.warn(`Unable to parse date: ${date}`);
      return String(date);
    }
    
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting datetime:', error, date);
    return String(date);
  }
};

/**
 * Converts a date to ISO format with optional time (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)
 * @param {string|Date} date - The date to convert
 * @param {boolean} includeTime - Whether to include time in the result
 * @returns {string} - ISO formatted date string
 */
export const toISOString = (date, includeTime = false) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    if (includeTime) {
      return dateObj.toISOString();
    } else {
      return dateObj.toISOString().split('T')[0];
    }
  } catch (error) {
    console.error('Error converting to ISO string:', error);
    return '';
  }
};

/**
 * Parses a date string in various formats and returns a valid Date object
 * @param {string} dateString - The date string to parse
 * @returns {Date|null} - Parsed Date object or null if invalid
 */
export const parseDate = (dateString) => {
  if (!dateString) return null;
  
  try {
    // Try standard ISO parsing first
    let date = new Date(dateString);
    
    // If valid, return it
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // Try French format (DD/MM/YYYY)
    const frParts = dateString.split(/[\/\-\.]/);
    if (frParts.length === 3) {
      date = new Date(parseInt(frParts[2]), parseInt(frParts[1]) - 1, parseInt(frParts[0]));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Try other common formats as needed
    
    // Nothing worked, return null
    return null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

/**
 * Converts a date string or Date object to a relative time (e.g., "2 days ago")
 * @param {string|Date} date - The date to convert
 * @param {string} locale - The locale to use for formatting (default: fr-FR)
 * @returns {string} - Relative time string
 */
export const getRelativeTime = (date, locale = 'fr-FR') => {
  if (!date) return '-';
  
  try {
    let dateObj;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    }
    
    if (!dateObj || isNaN(dateObj.getTime())) {
      return String(date);
    }
    
    const now = new Date();
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    const diffInSeconds = Math.floor((dateObj - now) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInDays < -365) {
      return rtf.format(Math.floor(diffInDays / 365), 'year');
    } else if (diffInDays < -30) {
      return rtf.format(Math.floor(diffInDays / 30), 'month');
    } else if (diffInDays < -1) {
      return rtf.format(diffInDays, 'day');
    } else if (diffInHours < -1) {
      return rtf.format(diffInHours, 'hour');
    } else if (diffInMinutes < -1) {
      return rtf.format(diffInMinutes, 'minute');
    } else {
      return rtf.format(diffInSeconds, 'second');
    }
  } catch (error) {
    console.error('Error calculating relative time:', error);
    return String(date);
  }
};