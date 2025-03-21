/**
 * Utility functions for formatting values
 */

/**
 * Formats a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - The currency code (default: EUR)
 * @param {string} locale - The locale to use for formatting (default: fr-FR)
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = 'EUR', locale = 'fr-FR') => {
  if (amount === null || amount === undefined) {
    return '-';
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formats a number with thousands separators
 * @param {number} value - The number to format
 * @param {string} locale - The locale to use for formatting (default: fr-FR)
 * @returns {string} - Formatted number string
 */
export const formatNumber = (value, locale = 'fr-FR') => {
  if (value === null || value === undefined) {
    return '-';
  }
  
  return new Intl.NumberFormat(locale).format(value);
};