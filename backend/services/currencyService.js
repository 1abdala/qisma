/**
 * currencyService.js
 * 
 * Simple currency conversion utility using fixed exchange rates.
 * No external APIs — rates are hardcoded for hackathon demo purposes.
 */

// Fixed exchange rates (relative to SAR as base)
const RATES = {
    // Saudi Riyal (base currency)
    SAR: {
        SAR: 1,
        AED: 0.98,    // 1 SAR = 0.98 UAE Dirhams
        EGP: 13,      // 1 SAR = 13 Egyptian Pounds
        OMR: 0.10,    // 1 SAR = 0.10 Omani Rials
    },
    // UAE Dirham
    AED: {
        AED: 1,
        SAR: 1.02,    // 1 AED = 1.02 SAR
        EGP: 13.3,    // 1 AED = 13.3 EGP
        OMR: 0.10,    // 1 AED = 0.10 OMR
    },
    // Egyptian Pound
    EGP: {
        EGP: 1,
        SAR: 0.077,   // 1 EGP = 0.077 SAR
        AED: 0.075,   // 1 EGP = 0.075 AED
        OMR: 0.008,   // 1 EGP = 0.008 OMR
    },
    // Omani Rial
    OMR: {
        OMR: 1,
        SAR: 9.75,    // 1 OMR = 9.75 SAR
        AED: 9.55,    // 1 OMR = 9.55 AED
        EGP: 126.5,   // 1 OMR = 126.5 EGP
    },
};

/**
 * Convert amount from one currency to another
 * 
 * @param {number} amount - The amount to convert
 * @param {string} fromCurrency - Source currency code (e.g., 'SAR')
 * @param {string} toCurrency - Target currency code (e.g., 'EGP')
 * @returns {number} - Converted amount rounded to 2 decimal places
 * 
 * @example
 * convert(100, 'SAR', 'EGP')  // returns 1300.00
 * convert(100, 'SAR', 'SAR')  // returns 100.00 (same currency)
 * convert(500, 'EGP', 'SAR')  // returns 38.50
 */
function convert(amount, fromCurrency, toCurrency) {
    // Same currency — no conversion needed
    if (fromCurrency === toCurrency) {
        return parseFloat(amount.toFixed(2));
    }

    // Validate currencies exist in our rates table
    if (!RATES[fromCurrency]) {
        throw new Error(`Unsupported source currency: ${fromCurrency}`);
    }
    if (!RATES[fromCurrency][toCurrency]) {
        throw new Error(`No conversion rate from ${fromCurrency} to ${toCurrency}`);
    }

    // Get the conversion rate and apply it
    const rate = RATES[fromCurrency][toCurrency];
    const converted = amount * rate;

    // Round to 2 decimal places for clean currency values
    return parseFloat(converted.toFixed(2));
}

/**
 * Get the exchange rate between two currencies
 * 
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {number} - Exchange rate
 * 
 * @example
 * getRate('SAR', 'EGP')  // returns 13
 */
function getRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1;

    if (!RATES[fromCurrency] || !RATES[fromCurrency][toCurrency]) {
        throw new Error(`No rate available from ${fromCurrency} to ${toCurrency}`);
    }

    return RATES[fromCurrency][toCurrency];
}

/**
 * Get all supported currencies
 * 
 * @returns {string[]} - Array of currency codes
 */
function getSupportedCurrencies() {
    return Object.keys(RATES);
}

module.exports = {
    convert,
    getRate,
    getSupportedCurrencies,
};